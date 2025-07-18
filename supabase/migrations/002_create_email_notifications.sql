-- Create email_notifications table for tracking sent emails
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX idx_email_notifications_type ON email_notifications(type);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_sent_at ON email_notifications(sent_at);

-- Create RLS policies
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email notifications
CREATE POLICY "email_notifications_select" ON email_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create function to send email notifications
CREATE OR REPLACE FUNCTION send_email_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_data JSONB
) RETURNS VOID AS $$
BEGIN
  -- Call the Supabase Edge Function for email notifications
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/email-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
    ),
    body := jsonb_build_object(
      'type', p_type,
      'userId', p_user_id,
      'data', p_data
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for subscription lifecycle notifications
CREATE OR REPLACE FUNCTION handle_subscription_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle subscription renewal notification
  IF TG_OP = 'UPDATE' AND OLD.current_period_end != NEW.current_period_end AND NEW.status = 'active' THEN
    PERFORM send_email_notification(
      NEW.user_id,
      'subscription_renewal',
      jsonb_build_object(
        'planName', (SELECT display_name FROM subscription_tiers WHERE id = NEW.subscription_tier_id),
        'amount', (SELECT price_monthly FROM subscription_tiers WHERE id = NEW.subscription_tier_id) * 100,
        'nextBillingDate', NEW.current_period_end
      )
    );
  END IF;
  
  -- Handle subscription cancellation notification
  IF TG_OP = 'UPDATE' AND OLD.cancel_at_period_end != NEW.cancel_at_period_end AND NEW.cancel_at_period_end = true THEN
    PERFORM send_email_notification(
      NEW.user_id,
      'subscription_cancelled',
      jsonb_build_object(
        'planName', (SELECT display_name FROM subscription_tiers WHERE id = NEW.subscription_tier_id),
        'cancellationDate', NOW(),
        'accessUntil', NEW.current_period_end
      )
    );
  END IF;
  
  -- Handle payment failure notification
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'past_due' THEN
    PERFORM send_email_notification(
      NEW.user_id,
      'payment_failed',
      jsonb_build_object(
        'amount', (SELECT price_monthly FROM subscription_tiers WHERE id = NEW.subscription_tier_id) * 100,
        'attemptDate', NOW(),
        'reason', 'Payment method declined',
        'updatePaymentUrl', 'https://your-app.com/billing'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription notifications
CREATE TRIGGER subscription_notification_trigger
  AFTER UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_notifications();

-- Create function to check for trial endings (to be run by cron job)
CREATE OR REPLACE FUNCTION check_trial_endings()
RETURNS VOID AS $$
DECLARE
  trial_subscription RECORD;
BEGIN
  FOR trial_subscription IN
    SELECT us.user_id, us.current_period_end, st.display_name
    FROM user_subscriptions us
    JOIN subscription_tiers st ON us.subscription_tier_id = st.id
    WHERE us.status = 'trialing'
    AND us.current_period_end <= NOW() + INTERVAL '3 days'
    AND us.current_period_end > NOW()
  LOOP
    PERFORM send_email_notification(
      trial_subscription.user_id,
      'trial_ending',
      jsonb_build_object(
        'daysRemaining', EXTRACT(DAYS FROM trial_subscription.current_period_end - NOW()),
        'trialEndDate', trial_subscription.current_period_end,
        'planName', trial_subscription.display_name,
        'subscriptionUrl', 'https://your-app.com/billing'
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create cron job for trial ending notifications (requires pg_cron extension)
-- This would typically be set up in your Supabase project settings
-- SELECT cron.schedule('trial-ending-check', '0 9 * * *', 'SELECT check_trial_endings();');