import { createClient } from '@supabase/supabase-js';

export interface EmailNotificationData {
  type: 'subscription_renewal' | 'payment_failed' | 'trial_ending' | 'subscription_cancelled';
  userId: string;
  data: any;
}

export class NotificationService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async sendSubscriptionRenewalNotification(
    userId: string,
    data: {
      planName: string;
      amount: number;
      nextBillingDate: string;
    }
  ): Promise<void> {
    await this.sendEmailNotification({
      type: 'subscription_renewal',
      userId,
      data,
    });
  }

  async sendPaymentFailedNotification(
    userId: string,
    data: {
      amount: number;
      attemptDate: string;
      reason: string;
      updatePaymentUrl: string;
    }
  ): Promise<void> {
    await this.sendEmailNotification({
      type: 'payment_failed',
      userId,
      data,
    });
  }

  async sendTrialEndingNotification(
    userId: string,
    data: {
      daysRemaining: number;
      trialEndDate: string;
      planName: string;
      subscriptionUrl: string;
    }
  ): Promise<void> {
    await this.sendEmailNotification({
      type: 'trial_ending',
      userId,
      data,
    });
  }

  async sendSubscriptionCancelledNotification(
    userId: string,
    data: {
      planName: string;
      cancellationDate: string;
      accessUntil: string;
    }
  ): Promise<void> {
    await this.sendEmailNotification({
      type: 'subscription_cancelled',
      userId,
      data,
    });
  }

  private async sendEmailNotification(notification: EmailNotificationData): Promise<void> {
    try {
      const { data, error } = await this.supabase.functions.invoke('email-notifications', {
        body: notification,
      });

      if (error) {
        console.error('Failed to send email notification:', error);
        throw new Error(`Failed to send email notification: ${error.message}`);
      }

      console.log('Email notification sent successfully:', data);
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  async getEmailNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch email notification history:', error);
      throw new Error(`Failed to fetch email notification history: ${error.message}`);
    }

    return data || [];
  }

  async markEmailNotificationAsSent(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark email notification as sent:', error);
      throw new Error(`Failed to mark email notification as sent: ${error.message}`);
    }
  }

  async markEmailNotificationAsFailed(
    notificationId: string,
    errorMessage: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('email_notifications')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark email notification as failed:', error);
      throw new Error(`Failed to mark email notification as failed: ${error.message}`);
    }
  }

  // Method to check for trial endings (can be called by a cron job)
  async checkTrialEndings(): Promise<void> {
    try {
      const { data, error } = await this.supabase.rpc('check_trial_endings');

      if (error) {
        console.error('Failed to check trial endings:', error);
        throw new Error(`Failed to check trial endings: ${error.message}`);
      }

      console.log('Trial endings check completed successfully');
    } catch (error) {
      console.error('Error checking trial endings:', error);
      throw error;
    }
  }
}