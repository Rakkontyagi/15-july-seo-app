
import React from 'react';

interface QualityTrendAnalysisProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
}

export const QualityTrendAnalysis: React.FC<QualityTrendAnalysisProps> = ({ data }) => {
  // Calculate trend analysis
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previous = values.slice(-6, -3);
    const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    if (avg > prevAvg + 5) return 'improving';
    if (avg < prevAvg - 5) return 'declining';
    return 'stable';
  };

  const TrendIndicator = ({ trend }: { trend: string }) => {
    const color = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-gray-600';
    const icon = trend === 'improving' ? '↗' : trend === 'declining' ? '↘' : '→';
    return <span className={`${color} font-semibold`}>{icon} {trend}</span>;
  };

  return (
    <div className="quality-trend-analysis p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Quality Trend Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.datasets.map((dataset, index) => {
          const trend = calculateTrend(dataset.data);
          const latest = dataset.data[dataset.data.length - 1] || 0;
          const average = dataset.data.reduce((a, b) => a + b, 0) / dataset.data.length || 0;
          
          return (
            <div key={index} className="trend-card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{dataset.label}</h4>
                <TrendIndicator trend={trend} />
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Latest: {latest.toFixed(1)}%</span>
                  <span>Average: {average.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${latest}%`, 
                      backgroundColor: dataset.borderColor 
                    }}
                  />
                </div>
              </div>
              
              <div className="trend-history">
                <div className="text-xs text-gray-500 mb-1">Recent History</div>
                <div className="flex space-x-1">
                  {dataset.data.slice(-10).map((value, i) => (
                    <div 
                      key={i} 
                      className="w-2 bg-gray-300 rounded-sm"
                      style={{ 
                        height: `${Math.max(value / 2, 4)}px`,
                        backgroundColor: dataset.backgroundColor
                      }}
                      title={`${data.labels[i]}: ${value.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6">
        <h4 className="font-medium mb-3">Insights & Recommendations</h4>
        <div className="space-y-2 text-sm">
          {data.datasets.map((dataset, index) => {
            const trend = calculateTrend(dataset.data);
            const latest = dataset.data[dataset.data.length - 1] || 0;
            
            return (
              <div key={index} className="flex items-start space-x-2">
                <span className="font-medium text-gray-700">{dataset.label}:</span>
                <span className="text-gray-600">
                  {trend === 'improving' && latest > 80 ? 
                    'Excellent performance - maintain current strategy' :
                    trend === 'improving' ? 
                    'Good improvement trend - continue optimization' :
                    trend === 'declining' && latest < 60 ? 
                    'Critical - immediate attention required' :
                    trend === 'declining' ? 
                    'Declining trend - review and adjust strategy' :
                    'Stable performance - monitor for changes'
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
