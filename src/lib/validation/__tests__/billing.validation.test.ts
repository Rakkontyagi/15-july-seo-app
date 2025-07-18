import { subscriptionSchema, subscriptionUpdateSchema } from '../billing.validation';

describe('Billing Validation', () => {
  describe('subscriptionSchema', () => {
    it('should validate correct subscription input', () => {
      const validInput = {
        tierId: '123e4567-e89b-12d3-a456-426614174000',
        billingCycle: 'monthly',
        paymentMethodId: 'pm_1234567890',
      };

      const result = subscriptionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should reject invalid UUID for tierId', () => {
      const invalidInput = {
        tierId: 'invalid-uuid',
        billingCycle: 'monthly',
        paymentMethodId: 'pm_1234567890',
      };

      const result = subscriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid tier ID');
      }
    });

    it('should reject invalid billing cycle', () => {
      const invalidInput = {
        tierId: '123e4567-e89b-12d3-a456-426614174000',
        billingCycle: 'invalid-cycle',
        paymentMethodId: 'pm_1234567890',
      };

      const result = subscriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid option: expected one of "monthly"|"yearly"');
      }
    });

    it('should reject empty payment method ID', () => {
      const invalidInput = {
        tierId: '123e4567-e89b-12d3-a456-426614174000',
        billingCycle: 'monthly',
        paymentMethodId: '',
      };

      const result = subscriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Payment method required');
      }
    });
  });

  describe('subscriptionUpdateSchema', () => {
    it('should validate partial update input', () => {
      const validInput = {
        tierId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = subscriptionUpdateSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should validate empty update input', () => {
      const validInput = {};

      const result = subscriptionUpdateSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should reject invalid UUID for tierId', () => {
      const invalidInput = {
        tierId: 'invalid-uuid',
      };

      const result = subscriptionUpdateSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid tier ID');
      }
    });
  });
});