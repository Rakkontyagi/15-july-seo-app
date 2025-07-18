-- Create subscription_tiers table
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'basic', 'pro', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  content_limit INTEGER NOT NULL,
  features JSONB NOT NULL,
  stripe_price_id_monthly VARCHAR(100),
  stripe_price_id_yearly VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  content_generated INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, billing_period_start)
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  stripe_subscription_id VARCHAR(100) UNIQUE,
  stripe_customer_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'unpaid'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One subscription per user
);

-- Create billing_events table for audit logging
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  stripe_event_id VARCHAR(100),
  event_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_billing_period ON usage_tracking(billing_period_start, billing_period_end);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_stripe_event_id ON billing_events(stripe_event_id);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, display_name, price_monthly, price_yearly, content_limit, features) VALUES
('basic', 'Basic', 9.99, 99.99, 10, '{"content_generation": true, "basic_seo": true, "export_formats": ["txt", "html"], "support": "email"}'),
('pro', 'Pro', 29.99, 299.99, 100, '{"content_generation": true, "advanced_seo": true, "competitor_analysis": true, "export_formats": ["txt", "html", "pdf", "docx"], "support": "priority_email", "api_access": true}'),
('enterprise', 'Enterprise', 99.99, 999.99, 1000, '{"content_generation": true, "advanced_seo": true, "competitor_analysis": true, "bulk_generation": true, "custom_templates": true, "export_formats": ["txt", "html", "pdf", "docx"], "support": "phone", "api_access": true, "white_label": true}');

-- Create RLS policies
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Subscription tiers are publicly readable
CREATE POLICY "subscription_tiers_select" ON subscription_tiers FOR SELECT TO authenticated USING (true);

-- Usage tracking policies
CREATE POLICY "usage_tracking_select" ON usage_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "usage_tracking_insert" ON usage_tracking FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usage_tracking_update" ON usage_tracking FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User subscriptions policies
CREATE POLICY "user_subscriptions_select" ON user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_subscriptions_insert" ON user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_subscriptions_update" ON user_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Billing events policies (users can only see their own events)
CREATE POLICY "billing_events_select" ON billing_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();