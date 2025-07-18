
import React from 'react';

export interface ProgressStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedTime?: number; // in seconds
  completedTime?: number; // in seconds
  message?: string;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  overallProgress?: number; // 0-100
  estimatedTotalTime?: number; // in seconds
  className?: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  overallProgress,
  estimatedTotalTime,
  className,
}) => {
  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Generation Progress</h3>

      {overallProgress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          {estimatedTotalTime !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Estimated total time: {formatTime(estimatedTotalTime)}
            </p>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(step.status).replace('text-', 'bg-')}`}></span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{step.name}</p>
              {step.message && (
                <p className="text-xs text-gray-600">{step.message}</p>
              )}
              {(step.estimatedTime !== undefined || step.completedTime !== undefined) && (
                <p className="text-xs text-gray-500">
                  {step.status === 'completed' ? 'Completed in' : 'Estimated':} {formatTime(step.completedTime || step.estimatedTime)}
                </p>
              )}
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(step.status)}`}>
              {step.status.replace('_', ' ').toUpperCase()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProgressTracker;
