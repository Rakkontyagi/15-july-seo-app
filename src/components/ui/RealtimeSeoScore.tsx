
import React from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useDebouncedSeoAnalysis } from '@/hooks/useDebouncedSeoAnalysis';

interface RealtimeSeoScoreProps {
  content: string;
  targetKeywords?: string[];
  className?: string;
  debounceDelay?: number;
}

const RealtimeSeoScore: React.FC<RealtimeSeoScoreProps> = ({
  content,
  targetKeywords = [],
  className,
  debounceDelay = 500,
}) => {
  const { analysisResult, isAnalyzing, error, refresh } = useDebouncedSeoAnalysis(content, {
    debounceDelay,
    targetKeywords,
    minWordCount: 10,
    enabled: true
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  };

  if (error) {
    return (
      <div className={`p-4 border border-red-200 rounded-md shadow-sm bg-red-50 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700">SEO Analysis Error</h3>
        </div>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Real-time SEO Score</h3>
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </div>
        )}
      </div>

      {analysisResult ? (
        <div className="space-y-3">
          {/* Overall Score */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Overall SEO Score:</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">{getScoreIcon(analysisResult.overallSeoScore)}</span>
              <span className={`text-lg font-bold ${getScoreColor(analysisResult.overallSeoScore)}`}>
                {analysisResult.overallSeoScore}/100
              </span>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Keyword Density:</span>
              <span className={`text-sm font-semibold ${getScoreColor(analysisResult.keywordDensity * 10)}`}>
                {analysisResult.keywordDensity.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Readability:</span>
              <span className={`text-sm font-semibold ${getScoreColor(analysisResult.readabilityScore)}`}>
                {analysisResult.readabilityScore.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Word Count:</span>
              <span className="text-sm font-semibold text-gray-900">
                {analysisResult.wordCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Avg Words/Sentence:</span>
              <span className="text-sm font-semibold text-gray-900">
                {analysisResult.avgWordsPerSentence.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            ⚡ Analysis debounced by {debounceDelay}ms for optimal performance
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">Start writing to see SEO analysis</p>
        </div>
      )}
    </div>
  );
};

export default RealtimeSeoScore;
