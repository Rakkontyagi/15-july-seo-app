import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import { APIError, AuthenticationError } from '@/lib/errors/billing.errors';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const startingAfter = searchParams.get('starting_after');

    // Get user's subscription to find customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({
        success: true,
        data: { invoices: [], has_more: false },
      });
    }

    // Fetch invoices from Stripe
    const invoiceParams: any = {
      customer: subscription.stripe_customer_id,
      limit: Math.min(limit, 100), // Stripe limit is 100
      expand: ['data.payment_intent'],
    };

    if (startingAfter) {
      invoiceParams.starting_after = startingAfter;
    }

    const invoices = await stripe.invoices.list(invoiceParams);

    // Transform invoice data
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      created: invoice.created,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.description,
      lines: invoice.lines.data.map((line) => ({
        description: line.description,
        amount: line.amount,
        quantity: line.quantity,
        period: line.period,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        invoices: formattedInvoices,
        has_more: invoices.has_more,
      },
    });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}