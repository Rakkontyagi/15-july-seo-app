
import React from 'react';

interface RealtimeSeoScoreProps {
  keywordDensity: number;
  readabilityScore: number;
  overallSeoScore: number;
  className?: string;
}

const RealtimeSeoScore: React.FC<RealtimeSeoScoreProps> = ({
  keywordDensity,
  readabilityScore,
  overallSeoScore,
  className,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Real-time SEO Score</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Keyword Density:</span>
          <span className={`text-sm font-semibold ${getScoreColor(keywordDensity * 10)}`}>{keywordDensity.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Readability:</span>
          <span className={`text-sm font-semibold ${getScoreColor(readabilityScore)}`}>{readabilityScore.toFixed(0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Overall SEO Score:</span>
          <span className={`text-lg font-bold ${getScoreColor(overallSeoScore)}`}>{overallSeoScore.toFixed(0)}/100</span>
        </div>
      </div>
    </div>
  );
};

export default RealtimeSeoScore;
