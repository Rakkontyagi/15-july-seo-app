
import React from 'react';

export interface ContentVersion {
  versionId: string;
  timestamp: string;
  author: string;
  changes: string; // Description of changes from previous version
}

interface RevisionHistoryProps {
  versions: ContentVersion[];
  onRevert?: (versionId: string) => void;
  onCompare?: (versionId1: string, versionId2: string) => void;
  className?: string;
}

const RevisionHistory: React.FC<RevisionHistoryProps> = ({
  versions,
  onRevert,
  onCompare,
  className,
}) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Revision History</h3>
      {
        versions.length === 0 ? (
          <p className="text-gray-500">No revisions yet.</p>
        ) : (
          <ul className="space-y-3">
            {versions.map((version, index) => (
              <li key={version.versionId} className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-800">Version: {version.versionId}</p>
                  <p className="text-xs text-gray-600">{new Date(version.timestamp).toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-600">Author: {version.author}</p>
                <p className="text-xs text-gray-600">Changes: {version.changes}</p>
                <div className="flex space-x-2 mt-2">
                  {onRevert && (
                    <button
                      onClick={() => onRevert(version.versionId)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Revert
                    </button>
                  )}
                  {onCompare && index > 0 && (
                    <button
                      onClick={() => onCompare(versions[index - 1].versionId, version.versionId)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Compare with Previous
                    </button>
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

export default RevisionHistory;
