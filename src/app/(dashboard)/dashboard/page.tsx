'use client';

import { AdvancedDashboardOverview } from '@/components/dashboard/AdvancedDashboardOverview';
import { Breadcrumb } from '@/components/layout/breadcrumb';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard' }
      ]} />
      
      <div>
        <h1 className="text-responsive-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-responsive-base">
          Welcome back! Here's an overview of your content performance and AI-powered insights.
        </p>
      </div>

      <AdvancedDashboardOverview />
    </div>
  );
}
