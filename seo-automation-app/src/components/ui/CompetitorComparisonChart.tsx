
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface CompetitorComparisonData {
  metric: string; // e.g., 'SEO Score', 'Word Count', 'Keyword Density'
  yourContentValue: number;
  competitorAverageValue: number;
  competitorBestValue: number;
}

interface CompetitorComparisonChartProps {
  data: CompetitorComparisonData[];
  className?: string;
}

const CompetitorComparisonChart: React.FC<CompetitorComparisonChartProps> = ({
  data,
  className,
}) => {
  const chartData = {
    labels: data.map(d => d.metric),
    datasets: [
      {
        label: 'Your Content',
        data: data.map(d => d.yourContentValue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Competitor Average',
        data: data.map(d => d.competitorAverageValue),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
      {
        label: 'Competitor Best',
        data: data.map(d => d.competitorBestValue),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Content Performance vs. Competitors',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Metric',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Value',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Competitor Comparison</h3>
      {
        data.length === 0 ? (
          <p className="text-gray-500">No competitor comparison data available.</p>
        ) : (
          <Bar data={chartData} options={options} />
        )
      }
    </div>
  );
};

export default CompetitorComparisonChart;
