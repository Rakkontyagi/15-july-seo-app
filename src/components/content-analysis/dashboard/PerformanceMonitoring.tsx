
import React from 'react';

interface PerformanceMonitoringProps {
  metrics: {
    processingTimes: number[];
    successRates: number[];
    labels: string[];
  };
}

export const PerformanceMonitoring: React.FC<PerformanceMonitoringProps> = ({ metrics }) => {
  const averageProcessingTime = metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length || 0;
  const averageSuccessRate = metrics.successRates.reduce((a, b) => a + b, 0) / metrics.successRates.length || 0;
  const latestProcessingTime = metrics.processingTimes[metrics.processingTimes.length - 1] || 0;
  const latestSuccessRate = metrics.successRates[metrics.successRates.length - 1] || 0;

  const MetricCard = ({ title, value, unit, trend }: { title: string; value: number; unit: string; trend: 'up' | 'down' | 'stable' }) => (
    <div className="metric-card bg-white p-4 rounded-lg shadow-md">
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{value.toFixed(1)}{unit}</span>
        <span className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="performance-monitoring p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Avg Processing Time" 
          value={averageProcessingTime} 
          unit="ms" 
          trend="stable"
        />
        <MetricCard 
          title="Avg Success Rate" 
          value={averageSuccessRate} 
          unit="%" 
          trend="up"
        />
        <MetricCard 
          title="Latest Processing Time" 
          value={latestProcessingTime} 
          unit="ms" 
          trend="down"
        />
        <MetricCard 
          title="Latest Success Rate" 
          value={latestSuccessRate} 
          unit="%" 
          trend="up"
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h4 className="text-md font-medium mb-3">Performance History</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Processing Time (ms)</th>
                <th className="text-left py-2">Success Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.labels.map((label, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{label}</td>
                  <td className="py-2">{metrics.processingTimes[index]?.toFixed(1) || 'N/A'}</td>
                  <td className="py-2">{metrics.successRates[index]?.toFixed(1) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
