import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationRequest {
  type: 'subscription_renewal' | 'payment_failed' | 'trial_ending' | 'subscription_cancelled';
  userId: string;
  data: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, userId, data }: EmailNotificationRequest = await req.json();

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!userProfile?.email) {
      console.error('User profile not found or no email:', userId);
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 404,
        headers: corsHeaders 
      });
    }

    let emailContent: { subject: string; html: string; text: string };

    switch (type) {
      case 'subscription_renewal':
        emailContent = generateRenewalEmail(userProfile, data);
        break;
      case 'payment_failed':
        emailContent = generatePaymentFailedEmail(userProfile, data);
        break;
      case 'trial_ending':
        emailContent = generateTrialEndingEmail(userProfile, data);
        break;
      case 'subscription_cancelled':
        emailContent = generateCancellationEmail(userProfile, data);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Send email using your email service (e.g., SendGrid, Resend, etc.)
    // For demo purposes, we'll use a simple HTTP request
    const emailResponse = await sendEmail({
      to: userProfile.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // Log the notification
    await supabase.from('email_notifications').insert({
      user_id: userId,
      type,
      email: userProfile.email,
      subject: emailContent.subject,
      status: emailResponse.success ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateRenewalEmail(user: any, data: any) {
  return {
    subject: 'Your subscription has been renewed',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Renewed Successfully</h2>
          <p>Hi ${user.full_name || 'there'},</p>
          <p>Your subscription has been renewed for another billing period.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Renewal Details</h3>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Amount:</strong> $${data.amount / 100}</p>
            <p><strong>Next billing date:</strong> ${new Date(data.nextBillingDate).toLocaleDateString()}</p>
          </div>
          <p>Thank you for continuing to use our service!</p>
          <p>Best regards,<br>The SEO Content Team</p>
        </body>
      </html>
    `,
    text: `
      Hi ${user.full_name || 'there'},
      
      Your subscription has been renewed for another billing period.
      
      Renewal Details:
      - Plan: ${data.planName}
      - Amount: $${data.amount / 100}
      - Next billing date: ${new Date(data.nextBillingDate).toLocaleDateString()}
      
      Thank you for continuing to use our service!
      
      Best regards,
      The SEO Content Team
    `,
  };
}

function generatePaymentFailedEmail(user: any, data: any) {
  return {
    subject: 'Payment Failed - Action Required',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Payment Failed</h2>
          <p>Hi ${user.full_name || 'there'},</p>
          <p>We were unable to process your payment for your subscription.</p>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
            <h3>Payment Details</h3>
            <p><strong>Amount:</strong> $${data.amount / 100}</p>
            <p><strong>Attempt Date:</strong> ${new Date(data.attemptDate).toLocaleDateString()}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
          </div>
          <p>Please update your payment method to continue using our service.</p>
          <p><a href="${data.updatePaymentUrl}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Payment Method</a></p>
          <p>Best regards,<br>The SEO Content Team</p>
        </body>
      </html>
    `,
    text: `
      Hi ${user.full_name || 'there'},
      
      We were unable to process your payment for your subscription.
      
      Payment Details:
      - Amount: $${data.amount / 100}
      - Attempt Date: ${new Date(data.attemptDate).toLocaleDateString()}
      - Reason: ${data.reason}
      
      Please update your payment method to continue using our service.
      Update Payment Method: ${data.updatePaymentUrl}
      
      Best regards,
      The SEO Content Team
    `,
  };
}

function generateTrialEndingEmail(user: any, data: any) {
  return {
    subject: 'Your trial is ending soon',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Trial is Ending Soon</h2>
          <p>Hi ${user.full_name || 'there'},</p>
          <p>Your trial period will end in ${data.daysRemaining} days.</p>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3>Trial Details</h3>
            <p><strong>Trial ends:</strong> ${new Date(data.trialEndDate).toLocaleDateString()}</p>
            <p><strong>Current plan:</strong> ${data.planName}</p>
          </div>
          <p>To continue using our service, please choose a subscription plan.</p>
          <p><a href="${data.subscriptionUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Choose Plan</a></p>
          <p>Best regards,<br>The SEO Content Team</p>
        </body>
      </html>
    `,
    text: `
      Hi ${user.full_name || 'there'},
      
      Your trial period will end in ${data.daysRemaining} days.
      
      Trial Details:
      - Trial ends: ${new Date(data.trialEndDate).toLocaleDateString()}
      - Current plan: ${data.planName}
      
      To continue using our service, please choose a subscription plan.
      Choose Plan: ${data.subscriptionUrl}
      
      Best regards,
      The SEO Content Team
    `,
  };
}

function generateCancellationEmail(user: any, data: any) {
  return {
    subject: 'Subscription Cancelled',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Cancelled</h2>
          <p>Hi ${user.full_name || 'there'},</p>
          <p>Your subscription has been cancelled as requested.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Cancellation Details</h3>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Cancellation Date:</strong> ${new Date(data.cancellationDate).toLocaleDateString()}</p>
            <p><strong>Access Until:</strong> ${new Date(data.accessUntil).toLocaleDateString()}</p>
          </div>
          <p>You will continue to have access to your account until ${new Date(data.accessUntil).toLocaleDateString()}.</p>
          <p>We're sorry to see you go! If you have any feedback, please let us know.</p>
          <p>Best regards,<br>The SEO Content Team</p>
        </body>
      </html>
    `,
    text: `
      Hi ${user.full_name || 'there'},
      
      Your subscription has been cancelled as requested.
      
      Cancellation Details:
      - Plan: ${data.planName}
      - Cancellation Date: ${new Date(data.cancellationDate).toLocaleDateString()}
      - Access Until: ${new Date(data.accessUntil).toLocaleDateString()}
      
      You will continue to have access to your account until ${new Date(data.accessUntil).toLocaleDateString()}.
      
      We're sorry to see you go! If you have any feedback, please let us know.
      
      Best regards,
      The SEO Content Team
    `,
  };
}

async function sendEmail({ to, subject, html, text }: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  // This is a placeholder - replace with your actual email service
  // Examples: SendGrid, Resend, Amazon SES, etc.
  
  const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';
  
  if (!SENDGRID_API_KEY) {
    console.log('Email would be sent:', { to, subject });
    return { success: true }; // Mock success for demo
  }
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });
    
    return { success: response.ok };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message };
  }
}