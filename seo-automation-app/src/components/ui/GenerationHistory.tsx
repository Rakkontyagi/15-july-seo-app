
import React from 'react';
import { Button } from './Button'; // Assuming a Button component exists

export interface GeneratedContentHistoryItem {
  id: string;
  keyword: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'failed';
  wordCount: number;
  seoScore?: number;
}

interface GenerationHistoryProps {
  history: GeneratedContentHistoryItem[];
  onEdit?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  className?: string;
}

const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  history,
  onEdit,
  onRegenerate,
  className,
}) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Generation History</h3>
      {
        history.length === 0 ? (
          <p className="text-gray-500">No content generated yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-800">Keyword: {item.keyword}</p>
                  <p className="text-xs text-gray-600">Generated on: {new Date(item.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Word Count: {item.wordCount}</p>
                  {item.seoScore !== undefined && (
                    <p className="text-xs text-gray-600">SEO Score: {item.seoScore.toFixed(1)}</p>
                  )}
                  <p className={`text-xs font-semibold ${item.status === 'completed' ? 'text-green-600' : item.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
                    Status: {item.status.toUpperCase()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {onEdit && (
                    <Button
                      onClick={() => onEdit(item.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                  )}
                  {onRegenerate && (
                    <Button
                      onClick={() => onRegenerate(item.id)}
                      variant="outline"
                      size="sm"
                    >
                      Regenerate
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      }
    </div>
  );
};

export default GenerationHistory;
