'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Lock } from 'lucide-react';

interface PaymentMethodFormProps {
  selectedTier: {
    id: string;
    display_name: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
  };
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentMethodForm({
  selectedTier,
  billingCycle,
  onSuccess,
  onCancel,
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const price = billingCycle === 'monthly' ? selectedTier.price_monthly : selectedTier.price_yearly;
  const savings = billingCycle === 'yearly' ? (selectedTier.price_monthly * 12 - selectedTier.price_yearly) : 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        setCardError(paymentMethodError.message || 'Payment method creation failed');
        setLoading(false);
        return;
      }

      // Create subscription
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier_id: selectedTier.id,
          billing_cycle: billingCycle,
          payment_method_id: paymentMethod.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Handle subscription creation result
      if (data.data.requires_action) {
        // Handle 3D Secure authentication
        const { error: confirmError } = await stripe.confirmCardPayment(
          data.data.client_secret,
          {
            payment_method: paymentMethod.id,
          }
        );

        if (confirmError) {
          setCardError(confirmError.message || 'Payment confirmation failed');
          setLoading(false);
          return;
        }
      }

      toast({
        title: 'Success!',
        description: 'Your subscription has been created successfully.',
      });

      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      setCardError(error instanceof Error ? error.message : 'An error occurred during payment');
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An error occurred during payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <CardDescription>
          Complete your subscription to {selectedTier.display_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Plan</span>
              <span>{selectedTier.display_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Billing</span>
              <span className="capitalize">{billingCycle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Price</span>
              <span>${price.toFixed(2)}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="font-medium">Savings</span>
                <span>-${savings.toFixed(2)}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between items-center font-semibold">
              <span>Total</span>
              <span>${price.toFixed(2)}</span>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <div>
              <label htmlFor="card-element" className="block text-sm font-medium mb-2">
                Card Information
              </label>
              <div className="border rounded-md p-3 bg-background">
                <CardElement
                  id="card-element"
                  onChange={handleCardChange}
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#374151',
                        '::placeholder': {
                          color: '#9CA3AF',
                        },
                      },
                    },
                  }}
                />
              </div>
              {cardError && (
                <p className="text-red-600 text-sm mt-2">{cardError}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </div>

          {/* Feature List */}
          <div className="space-y-2">
            <h4 className="font-medium">Included features:</h4>
            <ul className="space-y-1">
              {selectedTier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Subscribe for $${price.toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}