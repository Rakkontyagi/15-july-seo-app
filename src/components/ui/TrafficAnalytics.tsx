
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface TrafficDataPoint {
  date: string; // YYYY-MM-DD
  organicTraffic: number;
}

interface TrafficAnalyticsProps {
  data: TrafficDataPoint[];
  className?: string;
}

const TrafficAnalytics: React.FC<TrafficAnalyticsProps> = ({
  data,
  className,
}) => {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Organic Traffic',
        data: data.map(d => d.organicTraffic),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
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
        text: 'Organic Traffic Growth',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Traffic',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Traffic Analytics</h3>
      {
        data.length === 0 ? (
          <p className="text-gray-500">No traffic data available yet.</p>
        ) : (
          <Line data={chartData} options={options} />
        )
      }
    </div>
  );
};

export default TrafficAnalytics;
