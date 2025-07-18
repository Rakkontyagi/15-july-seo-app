
import React, { useEffect, useState } from 'react';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';

interface RealtimeProgressTrackerProps {
  contentId: string;
}

interface ProgressUpdate {
  stage: string;
  progress: number;
  message: string;
}

export const RealtimeProgressTracker: React.FC<RealtimeProgressTrackerProps> = ({ contentId }) => {
  const [progressData, setProgressData] = useState<ProgressUpdate[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('Initializing');
  const [overallProgress, setOverallProgress] = useState<number>(0);

  useRealtimeProgress(contentId, (update) => {
    setProgressData((prev) => {
      const existingIndex = prev.findIndex(item => item.stage === update.stage);
      if (existingIndex > -1) {
        const newProgress = [...prev];
        newProgress[existingIndex] = update;
        return newProgress;
      } else {
        return [...prev, update];
      }
    });
    setCurrentStage(update.stage);
    setOverallProgress(update.progress);
  });

  return (
    <div className="realtime-progress-tracker">
      <h3>Content Analysis Progress: {overallProgress}%</h3>
      <p>Current Stage: {currentStage}</p>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${overallProgress}%` }}></div>
      </div>
      <div className="stage-updates">
        {progressData.map((data, index) => (
          <p key={index}><strong>{data.stage}:</strong> {data.message} ({data.progress}%)</p>
        ))}
      </div>
    </div>
  );
};
