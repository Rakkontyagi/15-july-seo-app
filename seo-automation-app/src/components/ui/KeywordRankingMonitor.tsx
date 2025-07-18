
import React from 'react';

export interface KeywordRankData {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  change: number;
  url: string;
}

interface KeywordRankingMonitorProps {
  rankingData: KeywordRankData[];
  className?: string;
}

const KeywordRankingMonitor: React.FC<KeywordRankingMonitorProps> = ({
  rankingData,
  className,
}) => {
  const getChangeColor = (change: number) => {
    if (change < 0) return 'text-green-600'; // Rank improved
    if (change > 0) return 'text-red-600';   // Rank dropped
    return 'text-gray-600';
  };

  const getChangeArrow = (change: number) => {
    if (change < 0) return '↑';
    if (change > 0) return '↓';
    return '-';
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Keyword Ranking Monitor</h3>

      {
        rankingData.length === 0 ? (
          <p className="text-gray-500">No keyword ranking data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Pos.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Pos.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankingData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.keyword}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentPosition}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.previousPosition}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getChangeColor(item.change)}`}>
                      {getChangeArrow(item.change)} {Math.abs(item.change)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                      <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                    </td>
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

export default KeywordRankingMonitor;
