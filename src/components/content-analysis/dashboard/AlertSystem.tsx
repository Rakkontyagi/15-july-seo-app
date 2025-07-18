
import React from 'react';

interface AlertSystemProps {
  alerts: {
    id: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }[];
}

export const AlertSystem: React.FC<AlertSystemProps> = ({ alerts }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-500 text-red-700';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  return (
    <div className="alert-system p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p>No active alerts - All systems operational</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 border-l-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm uppercase tracking-wide">
                      {alert.severity} Priority
                    </span>
                    <span className="text-xs opacity-75">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
