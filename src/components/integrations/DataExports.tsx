'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText,
  Database,
  Calendar,
  Filter,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Plus,
  BarChart3,
  Users,
  Target
} from 'lucide-react';

interface DataExport {
  id: string;
  name: string;
  type: 'content' | 'analytics' | 'seo' | 'team' | 'integrations';
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  status: 'completed' | 'processing' | 'failed' | 'scheduled';
  size: string;
  records: number;
  createdAt: string;
  downloadUrl?: string;
  schedule?: 'daily' | 'weekly' | 'monthly';
  filters: string[];
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'analytics' | 'seo' | 'team' | 'integrations';
  fields: string[];
  popular: boolean;
}

export function DataExports() {
  const [exports] = useState<DataExport[]>([
    {
      id: '1',
      name: 'Monthly Content Report',
      type: 'content',
      format: 'xlsx',
      status: 'completed',
      size: '2.4 MB',
      records: 1247,
      createdAt: '2025-01-20 10:30',
      downloadUrl: '/exports/monthly-content-report.xlsx',
      schedule: 'monthly',
      filters: ['published', 'last_30_days']
    },
    {
      id: '2',
      name: 'SEO Performance Data',
      type: 'seo',
      format: 'csv',
      status: 'processing',
      size: '1.8 MB',
      records: 890,
      createdAt: '2025-01-20 11:15',
      filters: ['keywords', 'rankings', 'traffic']
    },
    {
      id: '3',
      name: 'Team Analytics Export',
      type: 'team',
      format: 'json',
      status: 'completed',
      size: '456 KB',
      records: 234,
      createdAt: '2025-01-19 16:45',
      downloadUrl: '/exports/team-analytics.json',
      filters: ['performance', 'productivity']
    },
    {
      id: '4',
      name: 'Integration Logs',
      type: 'integrations',
      format: 'csv',
      status: 'failed',
      size: '0 KB',
      records: 0,
      createdAt: '2025-01-19 14:20',
      filters: ['api_calls', 'errors', 'last_7_days']
    },
    {
      id: '5',
      name: 'Weekly Analytics Summary',
      type: 'analytics',
      format: 'pdf',
      status: 'scheduled',
      size: '0 KB',
      records: 0,
      createdAt: '2025-01-21 09:00',
      schedule: 'weekly',
      filters: ['traffic', 'conversions', 'engagement']
    }
  ]);

  const [exportTemplates] = useState<ExportTemplate[]>([
    {
      id: '1',
      name: 'Content Performance Report',
      description: 'Comprehensive content analytics with engagement metrics',
      type: 'content',
      fields: ['title', 'views', 'engagement', 'seo_score', 'publish_date'],
      popular: true
    },
    {
      id: '2',
      name: 'SEO Keyword Analysis',
      description: 'Keyword rankings, search volume, and optimization data',
      type: 'seo',
      fields: ['keyword', 'position', 'search_volume', 'difficulty', 'traffic'],
      popular: true
    },
    {
      id: '3',
      name: 'Team Productivity Report',
      description: 'Team member performance and project completion metrics',
      type: 'team',
      fields: ['member_name', 'content_created', 'tasks_completed', 'performance_score'],
      popular: false
    },
    {
      id: '4',
      name: 'Integration Health Check',
      description: 'API usage, connection status, and error logs',
      type: 'integrations',
      fields: ['integration_name', 'status', 'api_calls', 'success_rate', 'last_sync'],
      popular: false
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Play className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <FileText className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'seo': return <Target className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'integrations': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return '📊';
      case 'json': return '📄';
      case 'xlsx': return '📈';
      case 'pdf': return '📋';
      default: return '📄';
    }
  };

  const exportStats = {
    total: exports.length,
    completed: exports.filter(e => e.status === 'completed').length,
    processing: exports.filter(e => e.status === 'processing').length,
    scheduled: exports.filter(e => e.schedule).length,
    totalSize: exports.reduce((sum, e) => {
      const size = parseFloat(e.size.replace(/[^\d.]/g, ''));
      return sum + (e.size.includes('MB') ? size : size / 1000);
    }, 0)
  };

  return (
    <div className="space-y-6">
      {/* Export Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
            <Download className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exportStats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{exportStats.completed}</div>
            <p className="text-xs text-muted-foreground">Ready for download</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exportStats.scheduled}</div>
            <p className="text-xs text-muted-foreground">Automated exports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exportStats.totalSize.toFixed(1)} MB</div>
            <p className="text-xs text-muted-foreground">Data exported</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Export Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {exportTemplates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(template.type)}
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      {template.popular && (
                        <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                
                <div className="space-y-2">
                  <div className="text-xs font-medium">Included Fields:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.fields.slice(0, 3).map((field, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {template.fields.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.fields.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Exports ({exports.length})</span>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exports.map((exportItem) => (
              <div key={exportItem.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(exportItem.status)}
                    <div>
                      <h4 className="font-medium">{exportItem.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(exportItem.status)}>
                          {exportItem.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getFormatIcon(exportItem.format)} {exportItem.format.toUpperCase()}
                        </span>
                        {exportItem.schedule && (
                          <Badge variant="outline" className="text-xs">
                            {exportItem.schedule}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {exportItem.status === 'completed' && exportItem.downloadUrl && (
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    {exportItem.status === 'processing' && (
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Size</div>
                    <div className="font-medium">{exportItem.size}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Records</div>
                    <div className="font-medium">{exportItem.records.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-medium">{exportItem.createdAt}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-medium capitalize">{exportItem.type}</div>
                  </div>
                </div>

                {exportItem.status === 'processing' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Processing...</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium">Applied Filters:</div>
                  <div className="flex flex-wrap gap-2">
                    {exportItem.filters.map((filter, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Export Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Export Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Monthly Content Report"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Type</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background">
                    <option value="content">Content</option>
                    <option value="analytics">Analytics</option>
                    <option value="seo">SEO</option>
                    <option value="team">Team</option>
                    <option value="integrations">Integrations</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background">
                    <option value="csv">CSV</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="json">JSON</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background">
                    <option value="last_7_days">Last 7 days</option>
                    <option value="last_30_days">Last 30 days</option>
                    <option value="last_90_days">Last 90 days</option>
                    <option value="custom">Custom range</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Schedule (Optional)</label>
                <select className="w-full px-3 py-2 border rounded-md bg-background">
                  <option value="">One-time export</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Create Export
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
