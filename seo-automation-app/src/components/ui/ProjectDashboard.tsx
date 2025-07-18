
import React from 'react';

export interface ProjectMetrics {
  totalContentPieces: number;
  completedContentPieces: number;
  averageSeoScore: number;
  averageWordCount: number;
  projectsOverdue: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  client: string;
  campaign: string;
  status: 'active' | 'completed' | 'on_hold' | 'archived';
  completionPercentage: number;
  dueDate: string; // ISO date string
}

interface ProjectDashboardProps {
  metrics: ProjectMetrics;
  projects: ProjectSummary[];
  className?: string;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  metrics,
  projects,
  className,
}) => {
  const getStatusColor = (status: ProjectSummary['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'active':
        return 'text-blue-600';
      case 'on_hold':
        return 'text-yellow-600';
      case 'archived':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Project Dashboard</h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">Total Content Pieces</p>
          <p className="text-xl font-bold text-blue-800">{metrics.totalContentPieces}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">Completed Pieces</p>
          <p className="text-xl font-bold text-green-800">{metrics.completedContentPieces}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">Avg. SEO Score</p>
          <p className="text-xl font-bold text-yellow-800">{metrics.averageSeoScore.toFixed(1)}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">Projects Overdue</p>
          <p className="text-xl font-bold text-red-800">{metrics.projectsOverdue}</p>
        </div>
      </div>

      {/* Project List */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Active Projects</h4>
        {
          projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No active projects.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map(project => (
                <li key={project.id} className="p-3 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-800">{project.name} ({project.client} - {project.campaign})</p>
                    <span className={`text-xs font-semibold ${getStatusColor(project.status)}`}>{project.status.toUpperCase()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${project.completionPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Completion: {project.completionPercentage.toFixed(0)}% | Due: {new Date(project.dueDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
};

export default ProjectDashboard;
