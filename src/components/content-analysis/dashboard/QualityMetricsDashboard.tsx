
import React from 'react';
import { RealtimeProgressTracker } from './RealtimeProgressTracker';
import { QualityMetricsVisualization } from './QualityMetricsVisualization';
import { PerformanceMonitoring } from './PerformanceMonitoring';
import { AlertSystem } from './AlertSystem';
import { ContentStatusOverview } from './ContentStatusOverview';
import { QualityTrendAnalysis } from './QualityTrendAnalysis';
import { ExportReporting } from './ExportReporting';

interface QualityMetricsDashboardProps {
  contentId: string;
  qualityMetrics: Parameters<typeof QualityMetricsVisualization>[0]['metrics'];
  performanceMetrics: Parameters<typeof PerformanceMonitoring>[0]['metrics'];
  alerts: Parameters<typeof AlertSystem>[0]['alerts'];
  contentItems: Parameters<typeof ContentStatusOverview>[0]['contentItems'];
  qualityTrendData: Parameters<typeof QualityTrendAnalysis>[0]['data'];
  onExport: (format: string) => void;
  onGenerateReport: () => void;
}

export const QualityMetricsDashboard: React.FC<QualityMetricsDashboardProps> = ({
  contentId,
  qualityMetrics,
  performanceMetrics,
  alerts,
  contentItems,
  qualityTrendData,
  onExport,
  onGenerateReport,
}) => {
  return (
    <div className="quality-metrics-dashboard">
      <h1>Content Quality Dashboard</h1>
      <RealtimeProgressTracker contentId={contentId} />
      <QualityMetricsVisualization metrics={qualityMetrics} />
      <PerformanceMonitoring metrics={performanceMetrics} />
      <AlertSystem alerts={alerts} />
      <ContentStatusOverview contentItems={contentItems} />
      <QualityTrendAnalysis data={qualityTrendData} />
      <ExportReporting onExport={onExport} onGenerateReport={onGenerateReport} />
    </div>
  );
};
