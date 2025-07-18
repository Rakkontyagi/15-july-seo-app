import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function BulkStatusPage({ params }: { params: { bulkId: string } }) {
  const { bulkId } = params;
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cms/bulk/${bulkId}/status`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch status');
        setStatus(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [bulkId]);

  if (loading) return <div className="py-10 text-center">Loading status...</div>;
  if (error) return <div className="py-10 text-center text-red-600">{error}</div>;
  if (!status) return <div className="py-10 text-center">No status found.</div>;

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Bulk Publishing Status</CardTitle>
        <div className="text-sm text-muted-foreground">Job ID: {status.bulkId}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Badge variant="outline">Status: {status.status}</Badge>
        </div>
        <Progress value={status.progress.percentage} className="mb-4" />
        <div className="mb-4">
          <div>Total Platforms: {status.progress.total}</div>
          <div>Completed: {status.progress.completed}</div>
          <div>Failed: {status.progress.failed}</div>
          <div>Pending: {status.progress.pending}</div>
        </div>
        <Separator />
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Platform Results</h3>
          <ul className="space-y-2">
            {status.platforms.results.map((result: any, idx: number) => (
              <li key={idx} className="border p-2 rounded-md flex flex-col gap-1">
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary">{result.platform}</Badge>
                  <Badge variant={result.status === 'completed' ? 'success' : result.status === 'failed' ? 'destructive' : 'outline'}>
                    {result.status}
                  </Badge>
                  {result.url && (
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">View</a>
                  )}
                </div>
                {result.error && <div className="text-red-600 text-xs">Error: {result.error}</div>}
              </li>
            ))}
          </ul>
        </div>
        {status.errors && status.errors.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2 text-red-600">Errors</h3>
            <ul className="space-y-1">
              {status.errors.map((err: any, idx: number) => (
                <li key={idx} className="text-xs text-red-600">
                  [{err.platform}] {err.message} ({err.timestamp})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 