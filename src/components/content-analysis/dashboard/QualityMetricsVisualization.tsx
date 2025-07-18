
import React from 'react';

interface QualityMetricsVisualizationProps {
  metrics: {
    aiPatternScore: number[];
    variationScore: number[];
    authenticityScore: number[];
    naturalFlowScore: number[];
    labels: string[];
  };
}

export const QualityMetricsVisualization: React.FC<QualityMetricsVisualizationProps> = ({ metrics }) => {
  const latestScores = {
    aiPatternScore: metrics.aiPatternScore[metrics.aiPatternScore.length - 1] || 0,
    variationScore: metrics.variationScore[metrics.variationScore.length - 1] || 0,
    authenticityScore: metrics.authenticityScore[metrics.authenticityScore.length - 1] || 0,
    naturalFlowScore: metrics.naturalFlowScore[metrics.naturalFlowScore.length - 1] || 0,
  };

  const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
    <div className="score-bar mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm">{score.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  return (
    <div className="quality-metrics-visualization p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Quality Metrics Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBar 
          label="AI Pattern Score" 
          score={latestScores.aiPatternScore} 
          color="#ff6384"
        />
        <ScoreBar 
          label="Variation Score" 
          score={latestScores.variationScore} 
          color="#36a2eb"
        />
        <ScoreBar 
          label="Authenticity Score" 
          score={latestScores.authenticityScore} 
          color="#4bc0c0"
        />
        <ScoreBar 
          label="Natural Flow Score" 
          score={latestScores.naturalFlowScore} 
          color="#9966ff"
        />
      </div>

      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Trend History</h4>
        <div className="text-sm text-gray-600">
          {metrics.labels.map((label, index) => (
            <div key={index} className="flex justify-between py-1">
              <span>{label}</span>
              <span>
                AI: {metrics.aiPatternScore[index]?.toFixed(1) || 'N/A'}% | 
                Var: {metrics.variationScore[index]?.toFixed(1) || 'N/A'}% | 
                Auth: {metrics.authenticityScore[index]?.toFixed(1) || 'N/A'}% | 
                Flow: {metrics.naturalFlowScore[index]?.toFixed(1) || 'N/A'}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
