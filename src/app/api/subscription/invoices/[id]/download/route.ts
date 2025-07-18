import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import { APIError, AuthenticationError } from '@/lib/errors/billing.errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new AuthenticationError();
    }

    const invoiceId = params.id;

    // Get user's subscription to verify ownership
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No subscription found',
        },
        { status: 404 }
      );
    }

    // Fetch invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verify invoice belongs to the user
    if (invoice.customer !== subscription.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // Check if invoice has PDF
    if (!invoice.invoice_pdf) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice PDF not available',
        },
        { status: 404 }
      );
    }

    // Fetch PDF from Stripe
    const pdfResponse = await fetch(invoice.invoice_pdf);
    
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF from Stripe');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.number || invoiceId}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Failed to download invoice:', error);
    
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