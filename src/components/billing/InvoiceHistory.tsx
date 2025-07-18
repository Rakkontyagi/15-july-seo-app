'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, FileText } from 'lucide-react';

interface InvoiceLine {
  description: string;
  amount: number;
  quantity: number;
  period: {
    start: number;
    end: number;
  };
}

interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount_paid: number;
  amount_due: number;
  currency: string;
  created: number;
  period_start: number;
  period_end: number;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  description?: string;
  lines: InvoiceLine[];
}

interface InvoiceHistoryProps {
  className?: string;
}

export function InvoiceHistory({ className }: InvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (startingAfter?: string) => {
    try {
      const isLoadingMore = !!startingAfter;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        limit: '10',
        ...(startingAfter && { starting_after: startingAfter }),
      });

      const response = await fetch(`/api/subscription/invoices?${params}`);
      const data = await response.json();

      if (data.success) {
        if (isLoadingMore) {
          setInvoices(prev => [...prev, ...data.data.invoices]);
        } else {
          setInvoices(data.data.invoices);
        }
        setHasMore(data.data.has_more);
      } else {
        setError(data.error || 'Failed to load invoices');
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreInvoices = () => {
    if (invoices.length > 0) {
      const lastInvoice = invoices[invoices.length - 1];
      loadInvoices(lastInvoice.id);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/subscription/invoices/${invoiceId}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download invoice');
      }
    } catch (err) {
      console.error('Failed to download invoice:', err);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'open':
        return <Badge variant="secondary">Open</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'void':
        return <Badge variant="destructive">Void</Badge>;
      case 'uncollectible':
        return <Badge variant="destructive">Uncollectible</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Loading your billing history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Error loading invoice history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => loadInvoices()} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your billing history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your invoice history will appear here once you have active subscriptions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
        <CardDescription>
          View and download your billing history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                    </div>
                    {invoice.description && (
                      <div className="text-sm text-gray-500">
                        {invoice.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(invoice.created)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(invoice.status)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {formatAmount(invoice.amount_paid, invoice.currency)}
                    </div>
                    {invoice.amount_due > 0 && (
                      <div className="text-sm text-red-600">
                        Due: {formatAmount(invoice.amount_due, invoice.currency)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {invoice.hosted_invoice_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {invoice.invoice_pdf && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasMore && (
          <div className="mt-6 text-center">
            <Button
              onClick={loadMoreInvoices}
              disabled={loadingMore}
              variant="outline"
            >
              {loadingMore ? 'Loading...' : 'Load More Invoices'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}