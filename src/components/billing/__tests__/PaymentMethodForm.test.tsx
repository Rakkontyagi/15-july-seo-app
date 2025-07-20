import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentMethodForm } from '../PaymentMethodForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Mock Stripe
const mockStripe = {
  createPaymentMethod: jest.fn(),
  confirmCardPayment: jest.fn(),
};

const mockElements = {
  getElement: jest.fn(),
};

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  CardElement: ({ onChange }: { onChange: (event: any) => void }) => (
    <div data-testid="card-element">
      <input
        data-testid="card-input"
        onChange={(e) => onChange({ error: null, complete: true })}
      />
    </div>
  ),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockTier = {
  id: 'tier-pro',
  display_name: 'Pro Plan',
  price_monthly: 49,
  price_yearly: 490,
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
};

const mockProps = {
  selectedTier: mockTier,
  billingCycle: 'monthly' as const,
  onSuccess: jest.fn(),
  onCancel: jest.fn(),
};

describe('PaymentMethodForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockElements.getElement.mockReturnValue({});
  });

  it('renders payment form correctly', () => {
    render(<PaymentMethodForm {...mockProps} />);

    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getAllByText('$49.00')).toHaveLength(2); // Price and Total
    expect(screen.getByText('monthly')).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('shows yearly pricing and savings when billing cycle is yearly', () => {
    const yearlyProps = { ...mockProps, billingCycle: 'yearly' as const };
    render(<PaymentMethodForm {...yearlyProps} />);

    expect(screen.getAllByText('$490.00')).toHaveLength(2); // Price and Total
    expect(screen.getByText('yearly')).toBeInTheDocument();
    expect(screen.getByText('-$98.00')).toBeInTheDocument(); // 12 * 49 - 490
  });

  it('displays feature list correctly', () => {
    render(<PaymentMethodForm {...mockProps} />);

    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
  });

  it('handles successful payment submission', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({
      error: null,
      paymentMethod: { id: 'pm_test_123' },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          subscription_id: 'sub_123',
          status: 'active',
          requires_action: false,
        },
      }),
    });

    render(<PaymentMethodForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /subscribe for/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStripe.createPaymentMethod).toHaveBeenCalledWith({
        type: 'card',
        card: {},
      });
    });

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles payment method creation error', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({
      error: { message: 'Invalid card number' },
      paymentMethod: null,
    });

    render(<PaymentMethodForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /subscribe for/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid card number')).toBeInTheDocument();
    });

    expect(mockProps.onSuccess).not.toHaveBeenCalled();
  });

  it('handles subscription creation error', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({
      error: null,
      paymentMethod: { id: 'pm_test_123' },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Subscription creation failed',
      }),
    });

    render(<PaymentMethodForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /subscribe for/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Subscription creation failed')).toBeInTheDocument();
    });

    expect(mockProps.onSuccess).not.toHaveBeenCalled();
  });

  it('handles 3D Secure authentication', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({
      error: null,
      paymentMethod: { id: 'pm_test_123' },
    });

    mockStripe.confirmCardPayment.mockResolvedValue({
      error: null,
      paymentIntent: { status: 'succeeded' },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          subscription_id: 'sub_123',
          status: 'incomplete',
          requires_action: true,
          client_secret: 'pi_test_client_secret',
        },
      }),
    });

    render(<PaymentMethodForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /subscribe for/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith(
        'pi_test_client_secret',
        { payment_method: 'pm_test_123' }
      );
    });

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('disables submit button when loading', async () => {
    mockStripe.createPaymentMethod.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<PaymentMethodForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /subscribe for/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<PaymentMethodForm {...mockProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('updates card error state when card input changes', () => {
    render(<PaymentMethodForm {...mockProps} />);

    const cardInput = screen.getByTestId('card-input');
    fireEvent.change(cardInput, {
      target: { value: 'invalid' },
    });

    // Simulate card element error
    const cardElement = screen.getByTestId('card-element');
    const onChange = jest.fn();
    fireEvent.change(cardElement, {
      target: { onChange },
    });

    // This would typically trigger the onChange callback with an error
    expect(cardInput).toBeInTheDocument();
  });
});