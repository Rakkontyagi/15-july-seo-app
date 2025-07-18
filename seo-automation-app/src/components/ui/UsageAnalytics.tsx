
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export interface GenerationPatternData {
  label: string; // e.g., 'Blog Posts', 'Service Pages'
  value: number; // Count or percentage
}

export interface OptimizationSuccessData {
  label: string; // e.g., 'High SEO Score', 'Medium SEO Score', 'Low SEO Score'
  value: number; // Count or percentage
}

interface UsageAnalyticsProps {
  generationPatterns: GenerationPatternData[];
  optimizationSuccessRates: OptimizationSuccessData[];
  className?: string;
}

const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({
  generationPatterns,
  optimizationSuccessRates,
  className,
}) => {
  const generationChartData = {
    labels: generationPatterns.map(p => p.label),
    datasets: [
      {
        label: 'Content Generation Patterns',
        data: generationPatterns.map(p => p.value),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const optimizationChartData = {
    labels: optimizationSuccessRates.map(p => p.label),
    datasets: [
      {
        label: 'Optimization Success Rates',
        data: optimizationSuccessRates.map(p => p.value),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Usage Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Content Generation Patterns</h4>
          {
            generationPatterns.length === 0 ? (
              <p className="text-gray-500 text-sm">No generation pattern data.</p>
            ) : (
              <Pie data={generationChartData} />
            )
          }
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Optimization Success Rates</h4>
          {
            optimizationSuccessRates.length === 0 ? (
              <p className="text-gray-500 text-sm">No optimization success data.</p>
            ) : (
              <Pie data={optimizationChartData} />
            )
          }
        </div>
      </div>
    </div>
  );
};

export default UsageAnalytics;
