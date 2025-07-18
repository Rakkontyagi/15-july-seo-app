
import React, { useState } from 'react';
import { Input } from './Input'; // Assuming an Input component exists
import { Button } from './Button'; // Assuming a Button component exists
import { Select } from './Select'; // Assuming a Select component exists

interface ProjectCreationFormProps {
  onSubmit: (project: { name: string; client: string; campaign: string; category: string }) => void;
  isLoading?: boolean;
  className?: string;
}

const categories = [
  { label: 'Blog Posts', value: 'blog_posts' },
  { label: 'Service Pages', value: 'service_pages' },
  { label: 'Product Descriptions', value: 'product_descriptions' },
  { label: 'Landing Pages', value: 'landing_pages' },
  { label: 'Email Campaigns', value: 'email_campaigns' },
  { label: 'Ad Campaigns', value: 'ad_campaigns' },
  { label: 'Other', value: 'other' },
];

const ProjectCreationForm: React.FC<ProjectCreationFormProps> = ({
  onSubmit,
  isLoading = false,
  className,
}) => {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName && clientName && campaignName && category) {
      onSubmit({ name: projectName, client: clientName, campaign: campaignName, category });
    } else {
      alert('Please fill in all fields.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <Input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Summer Marketing Campaign Content"
            required
          />
        </div>
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
            Client Name
          </label>
          <Input
            id="clientName"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g., Acme Corp"
            required
          />
        </div>
        <div>
          <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name
          </label>
          <Input
            id="campaignName"
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Q3 Lead Generation"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories}
            placeholder="Select a category"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectCreationForm;
