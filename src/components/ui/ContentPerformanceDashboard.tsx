
import React from 'react';

export interface ContentPerformanceMetric {
  contentId: string;
  title: string;
  keyword: string;
  currentRank: number;
  previousRank?: number;
  rankChange: number;
  traffic?: number; // Placeholder for traffic data
  conversionRate?: number; // Placeholder for conversion data
}

interface ContentPerformanceDashboardProps {
  performanceData: ContentPerformanceMetric[];
  className?: string;
}

const ContentPerformanceDashboard: React.FC<ContentPerformanceDashboardProps> = ({
  performanceData,
  className,
}) => {
  const getRankChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Content Performance Dashboard</h3>

      {
        performanceData.length === 0 ? (
          <p className="text-gray-500">No content performance data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traffic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performanceData.map((item) => (
                  <tr key={item.contentId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.keyword}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentRank}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getRankChangeColor(item.rankChange)}`}>
                      {item.rankChange > 0 ? `+${item.rankChange}` : item.rankChange}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.traffic?.toLocaleString() || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.conversionRate !== undefined ? `${item.conversionRate.toFixed(2)}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
};

export default ContentPerformanceDashboard;
