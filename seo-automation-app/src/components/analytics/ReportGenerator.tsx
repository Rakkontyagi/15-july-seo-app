'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText,
  Calendar,
  Mail,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Eye,
  Clock,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'powerpoint';
  sections: string[];
  recipients: string[];
  lastGenerated: string;
  nextScheduled: string;
  status: 'active' | 'paused' | 'draft';
}

interface ReportSection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  included: boolean;
  required: boolean;
}

export function ReportGenerator() {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [recipients, setRecipients] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Monthly SEO Performance',
      description: 'Comprehensive monthly SEO performance report',
      frequency: 'monthly',
      format: 'pdf',
      sections: ['overview', 'keywords', 'content', 'technical'],
      recipients: ['manager@company.com', 'team@company.com'],
      lastGenerated: '2025-01-15',
      nextScheduled: '2025-02-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Weekly Content Report',
      description: 'Weekly content performance and engagement metrics',
      frequency: 'weekly',
      format: 'excel',
      sections: ['content', 'social', 'engagement'],
      recipients: ['content@company.com'],
      lastGenerated: '2025-01-18',
      nextScheduled: '2025-01-25',
      status: 'active'
    },
    {
      id: '3',
      name: 'Quarterly Executive Summary',
      description: 'High-level quarterly performance summary for executives',
      frequency: 'quarterly',
      format: 'powerpoint',
      sections: ['overview', 'roi', 'goals'],
      recipients: ['ceo@company.com', 'cmo@company.com'],
      lastGenerated: '2024-12-31',
      nextScheduled: '2025-03-31',
      status: 'active'
    }
  ];

  const availableSections: ReportSection[] = [
    {
      id: 'overview',
      name: 'Executive Overview',
      description: 'High-level performance summary and key metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      included: true,
      required: true
    },
    {
      id: 'keywords',
      name: 'Keyword Performance',
      description: 'Ranking positions, search volume, and keyword opportunities',
      icon: <Target className="h-4 w-4" />,
      included: true,
      required: false
    },
    {
      id: 'content',
      name: 'Content Analytics',
      description: 'Page views, engagement, and content performance metrics',
      icon: <FileText className="h-4 w-4" />,
      included: true,
      required: false
    },
    {
      id: 'technical',
      name: 'Technical SEO',
      description: 'Site health, crawl errors, and technical issues',
      icon: <Settings className="h-4 w-4" />,
      included: false,
      required: false
    },
    {
      id: 'competitors',
      name: 'Competitor Analysis',
      description: 'Competitive landscape and gap analysis',
      icon: <Users className="h-4 w-4" />,
      included: false,
      required: false
    },
    {
      id: 'social',
      name: 'Social Media Metrics',
      description: 'Social engagement and referral traffic',
      icon: <TrendingUp className="h-4 w-4" />,
      included: false,
      required: false
    },
    {
      id: 'engagement',
      name: 'User Engagement',
      description: 'Bounce rate, session duration, and user behavior',
      icon: <Eye className="h-4 w-4" />,
      included: false,
      required: false
    },
    {
      id: 'roi',
      name: 'ROI Analysis',
      description: 'Return on investment and conversion metrics',
      icon: <TrendingUp className="h-4 w-4" />,
      included: false,
      required: false
    },
    {
      id: 'goals',
      name: 'Goals & Objectives',
      description: 'Progress towards set goals and future objectives',
      icon: <Target className="h-4 w-4" />,
      included: false,
      required: false
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    const section = availableSections.find(s => s.id === sectionId);
    if (section?.required) return; // Can't toggle required sections

    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsGenerating(false);
    
    // In a real app, this would trigger a download
    console.log('Report generated with sections:', selectedSections);
  };

  const getStatusColor = (status: ReportTemplate['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'powerpoint': return '📈';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Initialize selected sections with default included sections
  useState(() => {
    const defaultSections = availableSections
      .filter(section => section.included)
      .map(section => section.id);
    setSelectedSections(defaultSections);
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'generate' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('generate')}
        >
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
        <Button
          variant={activeTab === 'templates' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('templates')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
        <Button
          variant={activeTab === 'scheduled' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('scheduled')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Scheduled Reports
        </Button>
      </div>

      {/* Generate Report Tab */}
      {activeTab === 'generate' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Name
                </label>
                <Input
                  placeholder="e.g., Monthly SEO Report"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Brief description of the report..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Time Period
                </label>
                <select className="w-full px-3 py-2 border rounded-md bg-background">
                  <option value="last-30-days">Last 30 days</option>
                  <option value="last-90-days">Last 90 days</option>
                  <option value="last-year">Last year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Format
                </label>
                <select className="w-full px-3 py-2 border rounded-md bg-background">
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="powerpoint">PowerPoint Presentation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Recipients (Optional)
                </label>
                <Input
                  placeholder="email1@company.com, email2@company.com"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Report Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableSections.map((section) => (
                  <div
                    key={section.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg ${
                      selectedSections.includes(section.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => handleSectionToggle(section.id)}
                      disabled={section.required}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {section.icon}
                        <span className="font-medium text-sm">{section.name}</span>
                        {section.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || selectedSections.length === 0}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Report Templates</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge className={getStatusColor(template.status)}>
                      {template.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Frequency:</span>
                      <span className="font-medium capitalize">{template.frequency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Format:</span>
                      <span className="font-medium">
                        {getFormatIcon(template.format)} {template.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sections:</span>
                      <span className="font-medium">{template.sections.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Recipients:</span>
                      <span className="font-medium">{template.recipients.length}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-2">
                      Last generated: {formatDate(template.lastGenerated)}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Scheduled Reports
              </span>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportTemplates.filter(t => t.status === 'active').map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {template.frequency}
                      </Badge>
                      <Badge className={getStatusColor(template.status)}>
                        {template.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Next scheduled: {formatDate(template.nextScheduled)} • 
                      Recipients: {template.recipients.length} • 
                      Format: {template.format.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
