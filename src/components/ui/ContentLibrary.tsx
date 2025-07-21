
import React, { useState } from 'react';
import { Input } from './Input'; // Assuming an Input component exists
import { Button } from './Button'; // Assuming a Button component exists

export interface ContentItem {
  id: string;
  title: string;
  keyword: string;
  client: string;
  campaign: string;
  category: string;
  status: 'draft' | 'generated' | 'published' | 'archived';
  wordCount: number;
  seoScore?: number;
  createdAt: string;
}

interface ContentLibraryProps {
  contentItems: ContentItem[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const ContentLibrary: React.FC<ContentLibraryProps> = ({
  contentItems,
  onView,
  onEdit,
  onDelete,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredItems = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.campaign.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Content Library</h3>
      <div className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Search content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="generated">Generated</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {
        filteredItems.length === 0 ? (
          <p className="text-gray-500">No content found matching your criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEO Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.keyword}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.client}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.campaign}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.wordCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.seoScore?.toFixed(1) || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button onClick={() => onView(item.id)} variant="link" size="sm">View</Button>
                      <Button onClick={() => onEdit(item.id)} variant="link" size="sm" className="ml-2">Edit</Button>
                      <Button onClick={() => onDelete(item.id)} variant="link" size="sm" className="text-red-600 hover:text-red-900 ml-2">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
};

export default ContentLibrary;
