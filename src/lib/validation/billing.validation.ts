import { z } from 'zod';

export const subscriptionSchema = z.object({
  tierId: z.string().uuid('Invalid tier ID'),
  billingCycle: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().min(1, 'Payment method required'),
});

export const subscriptionUpdateSchema = z.object({
  tierId: z.string().uuid('Invalid tier ID').optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  paymentMethodId: z.string().min(1, 'Payment method required').optional(),
});

export const usageTrackingSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  contentGenerated: z.number().min(0, 'Content generated must be non-negative'),
  apiCalls: z.number().min(0, 'API calls must be non-negative'),
});

export const billingWebhookSchema = z.object({
  type: z.string().min(1, 'Webhook type is required'),
  data: z.object({
    object: z.any(),
  }),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;
export type UsageTrackingInput = z.infer<typeof usageTrackingSchema>;
export type BillingWebhookInput = z.infer<typeof billingWebhookSchema>;