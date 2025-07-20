'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ContentOptimizer } from '@/components/optimization/ContentOptimizer';
import { SEOAuditDashboard } from '@/components/optimization/SEOAuditDashboard';
import { CompetitorAnalysis } from '@/components/optimization/CompetitorAnalysis';
import { PerformanceTracker } from '@/components/optimization/PerformanceTracker';
import { 
  TrendingUp, 
  Target, 
  Zap,
  BarChart3,
  Users,
  Search,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus
} from 'lucide-react';

interface OptimizationProject {
  id: string;
  title: string;
  url: string;
  status: 'analyzing' | 'optimizing' | 'completed' | 'needs-attention';
  overallScore: number;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  lastOptimized: string;
  improvements: number;
}

export default function OptimizePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [projects] = useState<OptimizationProject[]>([
    {
      id: '1',
      title: 'Homepage Optimization',
      url: 'https://example.com',
      status: 'completed',
      overallScore: 92,
      seoScore: 95,
      performanceScore: 88,
      accessibilityScore: 94,
      lastOptimized: '2025-01-20T10:30:00Z',
      improvements: 12
    },
    {
      id: '2',
      title: 'Product Pages SEO',
      url: 'https://example.com/products',
      status: 'optimizing',
      overallScore: 76,
      seoScore: 82,
      performanceScore: 71,
      accessibilityScore: 75,
      lastOptimized: '2025-01-19T15:45:00Z',
      improvements: 8
    },
    {
      id: '3',
      title: 'Blog Content Audit',
      url: 'https://example.com/blog',
      status: 'needs-attention',
      overallScore: 64,
      seoScore: 68,
      performanceScore: 59,
      accessibilityScore: 66,
      lastOptimized: '2025-01-18T09:20:00Z',
      improvements: 15
    }
  ]);

  const getStatusColor = (status: OptimizationProject['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'optimizing': return 'bg-blue-100 text-blue-800';
      case 'analyzing': return 'bg-yellow-100 text-yellow-800';
      case 'needs-attention': return 'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = (status: OptimizationProject['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'optimizing': return <Zap className="h-4 w-4" />;
      case 'analyzing': return <Search className="h-4 w-4" />;
      case 'needs-attention': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const overallStats = {
    totalProjects: projects.length,
    avgScore: Math.round(projects.reduce((sum, p) => sum + p.overallScore, 0) / projects.length),
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalImprovements: projects.reduce((sum, p) => sum + p.improvements, 0)
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content Optimization' }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold">Content Optimization</h1>
          <p className="text-muted-foreground text-responsive-base">
            Analyze, optimize, and track your content performance with AI-powered insights
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Optimization Project
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.completedProjects} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(overallStats.avgScore)}`}>
              {overallStats.avgScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvements Made</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalImprovements}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Optimizations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'optimizing').length}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="optimizer">
            <Zap className="h-4 w-4 mr-2" />
            Optimizer
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Search className="h-4 w-4 mr-2" />
            SEO Audit
          </TabsTrigger>
          <TabsTrigger value="competitors">
            <Users className="h-4 w-4 mr-2" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{project.title}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1">{project.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {project.url}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(project.lastOptimized)}
                        </span>
                        <span>{project.improvements} improvements</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                          <div className={`font-medium ${getScoreColor(project.overallScore)}`}>
                            {project.overallScore}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">SEO</div>
                          <div className={`font-medium ${getScoreColor(project.seoScore)}`}>
                            {project.seoScore}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Performance</div>
                          <div className={`font-medium ${getScoreColor(project.performanceScore)}`}>
                            {project.performanceScore}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Accessibility</div>
                          <div className={`font-medium ${getScoreColor(project.accessibilityScore)}`}>
                            {project.accessibilityScore}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">
                        Optimize
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizer" className="space-y-6">
          <ContentOptimizer />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <SEOAuditDashboard />
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <CompetitorAnalysis />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
