import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UsageCardProps {
  usage: any;
}

export function UsageCard({ usage }: UsageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Statistics</CardTitle>
        <CardDescription>
          Your current usage for this billing period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Content Generated</p>
            <p className="text-lg font-semibold">
              {usage?.content_generated || 0} articles
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">API Calls</p>
            <p className="text-lg font-semibold">
              {usage?.api_calls || 0} calls
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Storage Used</p>
            <p className="text-lg font-semibold">
              {usage?.storage_used || 0} MB
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
