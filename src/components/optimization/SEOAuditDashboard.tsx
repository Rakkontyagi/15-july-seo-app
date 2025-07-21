'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Info,
  Globe,
  FileText,
  Link,
  Image,
  Smartphone,
  Zap,
  Shield,
  Eye
} from 'lucide-react';

interface AuditResult {
  category: string;
  icon: React.ReactNode;
  score: number;
  status: 'passed' | 'warning' | 'failed';
  issues: AuditIssue[];
}

interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  howToFix: string;
  affectedElements?: string[];
}

export function SEOAuditDashboard() {
  const [url, setUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const handleStartAudit = async () => {
    if (!url.trim()) return;

    setIsAuditing(true);
    setAuditResults([]);

    // Simulate audit process
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockResults: AuditResult[] = [
      {
        category: 'Technical SEO',
        icon: <Search className="h-5 w-5" />,
        score: 78,
        status: 'warning',
        issues: [
          {
            id: '1',
            title: 'Missing Meta Description',
            description: 'This page is missing a meta description',
            severity: 'high',
            impact: 'High impact on search result click-through rates',
            howToFix: 'Add a compelling meta description between 150-160 characters',
            affectedElements: ['<head>']
          },
          {
            id: '2',
            title: 'Multiple H1 Tags',
            description: 'Page has multiple H1 tags which can confuse search engines',
            severity: 'medium',
            impact: 'May dilute the main topic focus',
            howToFix: 'Use only one H1 tag per page and use H2-H6 for subheadings',
            affectedElements: ['<h1>Main Title</h1>', '<h1>Secondary Title</h1>']
          }
        ]
      },
      {
        category: 'Content Quality',
        icon: <FileText className="h-5 w-5" />,
        score: 85,
        status: 'passed',
        issues: [
          {
            id: '3',
            title: 'Content Length',
            description: 'Content is shorter than recommended for competitive keywords',
            severity: 'low',
            impact: 'May affect rankings for competitive terms',
            howToFix: 'Expand content to 800-1200 words with valuable information',
            affectedElements: ['Main content area']
          }
        ]
      },
      {
        category: 'Performance',
        icon: <Zap className="h-5 w-5" />,
        score: 72,
        status: 'warning',
        issues: [
          {
            id: '4',
            title: 'Large Images',
            description: 'Several images are not optimized and slow down page loading',
            severity: 'high',
            impact: 'Affects user experience and search rankings',
            howToFix: 'Compress images and use modern formats like WebP',
            affectedElements: ['hero-image.jpg (2.3MB)', 'gallery-1.png (1.8MB)']
          },
          {
            id: '5',
            title: 'Render-blocking Resources',
            description: 'CSS and JavaScript files are blocking page rendering',
            severity: 'medium',
            impact: 'Delays first contentful paint',
            howToFix: 'Defer non-critical CSS and JavaScript loading',
            affectedElements: ['style.css', 'analytics.js']
          }
        ]
      },
      {
        category: 'Mobile Usability',
        icon: <Smartphone className="h-5 w-5" />,
        score: 92,
        status: 'passed',
        issues: [
          {
            id: '6',
            title: 'Touch Targets',
            description: 'Some clickable elements are too small for mobile users',
            severity: 'low',
            impact: 'May affect mobile user experience',
            howToFix: 'Ensure touch targets are at least 44px in size',
            affectedElements: ['Social media icons', 'Footer links']
          }
        ]
      },
      {
        category: 'Security',
        icon: <Shield className="h-5 w-5" />,
        score: 95,
        status: 'passed',
        issues: []
      },
      {
        category: 'Accessibility',
        icon: <Eye className="h-5 w-5" />,
        score: 88,
        status: 'passed',
        issues: [
          {
            id: '7',
            title: 'Missing Alt Text',
            description: 'Some images are missing alternative text',
            severity: 'medium',
            impact: 'Affects accessibility and SEO',
            howToFix: 'Add descriptive alt text to all images',
            affectedElements: ['product-image-1.jpg', 'banner.png']
          }
        ]
      }
    ];

    setAuditResults(mockResults);
    setIsAuditing(false);
    setActiveCategory(mockResults[0]?.category || '');
  };

  const getStatusIcon = (status: 'passed' | 'warning' | 'failed') => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'passed' | 'warning' | 'failed') => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
    }
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const overallScore = auditResults.length > 0 
    ? Math.round(auditResults.reduce((sum, result) => sum + result.score, 0) / auditResults.length)
    : 0;

  const totalIssues = auditResults.reduce((sum, result) => sum + result.issues.length, 0);
  const highPriorityIssues = auditResults.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.severity === 'high').length, 0
  );

  const activeResult = auditResults.find(result => result.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Audit Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            SEO Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Website URL *
            </label>
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleStartAudit}
            disabled={!url.trim() || isAuditing}
            className="w-full"
          >
            {isAuditing ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-pulse" />
                Running Audit...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Start SEO Audit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Audit Results */}
      {auditResults.length > 0 && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Audit Results</span>
                <div className={`text-3xl font-bold ${getStatusColor(
                  overallScore >= 80 ? 'passed' : overallScore >= 60 ? 'warning' : 'failed'
                )}`}>
                  {overallScore}%
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalIssues}</div>
                  <div className="text-sm text-muted-foreground">Total Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{highPriorityIssues}</div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {auditResults.filter(r => r.status === 'passed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Categories Passed</div>
                </div>
              </div>

              {/* Category Overview */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {auditResults.map((result) => (
                  <div
                    key={result.category}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      activeCategory === result.category ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveCategory(result.category)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {result.icon}
                        <span className="font-medium text-sm">{result.category}</span>
                      </div>
                      {getStatusIcon(result.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`text-lg font-bold ${getStatusColor(result.status)}`}>
                        {result.score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.issues.length} issues
                      </div>
                    </div>
                    
                    <Progress value={result.score} className="h-1 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Issues */}
          {activeResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    {activeResult.icon}
                    <span className="ml-2">{activeResult.category} Issues</span>
                  </span>
                  <Badge className={getSeverityColor('high')}>
                    {activeResult.issues.length} issues found
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeResult.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">All Good!</h3>
                    <p className="text-muted-foreground">
                      No issues found in this category.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeResult.issues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium">{issue.title}</h4>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {issue.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Impact
                            </div>
                            <div className="text-sm">{issue.impact}</div>
                          </div>
                          
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              How to Fix
                            </div>
                            <div className="text-sm font-medium">{issue.howToFix}</div>
                          </div>
                          
                          {issue.affectedElements && issue.affectedElements.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Affected Elements
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {issue.affectedElements.map((element, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {element}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
