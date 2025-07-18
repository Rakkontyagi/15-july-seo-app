
import React from 'react';

interface ContentStatusOverviewProps {
  contentItems: {
    id: string;
    title: string;
    status: string;
    lastUpdated: string;
  }[];
}

export const ContentStatusOverview: React.FC<ContentStatusOverviewProps> = ({ contentItems }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'pending': return '⏸️';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  return (
    <div className="content-status-overview p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Content Status Overview</h3>
      {contentItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No content items to display</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Title</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {contentItems.map((item, index) => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="py-3 px-4 font-mono text-xs">{item.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium truncate max-w-xs" title={item.title}>
                      {item.title}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      <span className="mr-1">{getStatusIcon(item.status)}</span>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(item.lastUpdated).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
