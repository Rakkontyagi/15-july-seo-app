'use client';

import { useState } from 'react';
import { ContentGenerationDashboard } from '@/components/dashboard/ContentGenerationDashboard';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Zap,
  History,
  BookOpen,
  Target,
  Settings,
  Plus
} from 'lucide-react';

interface GenerationProject {
  id: string;
  title: string;
  keyword: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  wordCount?: number;
  qualityScore?: number;
}

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recentProjects] = useState<GenerationProject[]>([
    {
      id: '1',
      title: 'Complete SEO Guide for E-commerce',
      keyword: 'ecommerce seo',
      status: 'completed',
      progress: 100,
      createdAt: '2025-01-20T10:30:00Z',
      wordCount: 2500,
      qualityScore: 92
    },
    {
      id: '2',
      title: 'Digital Marketing Strategies',
      keyword: 'digital marketing',
      status: 'generating',
      progress: 65,
      createdAt: '2025-01-20T11:15:00Z'
    },
    {
      id: '3',
      title: 'Content Marketing Best Practices',
      keyword: 'content marketing',
      status: 'draft',
      progress: 0,
      createdAt: '2025-01-20T09:45:00Z'
    }
  ]);

  const handleNewProject = () => {
    setActiveTab('dashboard');
  };

  const handleProjectSelect = (projectId: string) => {
    // Handle project selection
    console.log('Selected project:', projectId);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content Generation' }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold">Content Generation</h1>
          <p className="text-muted-foreground text-responsive-base">
            Create high-quality, SEO-optimized content with AI-powered intelligence
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            <Zap className="h-3 w-3 mr-1" />
            3/10 Credits Used
          </Badge>
          <Button onClick={handleNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Words Generated</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2K</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Generation Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2m</div>
            <p className="text-xs text-muted-foreground">
              -15s from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <FileText className="h-4 w-4 mr-2" />
            Generate Content
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Project History
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ContentGenerationDashboard />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Keyword: {project.keyword}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {project.wordCount && (
                        <div className="text-sm">
                          <span className="font-medium">{project.wordCount}</span>
                          <span className="text-muted-foreground"> words</span>
                        </div>
                      )}
                      {project.qualityScore && (
                        <Badge variant="secondary">
                          {project.qualityScore}% Quality
                        </Badge>
                      )}
                      <Badge 
                        variant={
                          project.status === 'completed' ? 'default' :
                          project.status === 'generating' ? 'secondary' :
                          project.status === 'failed' ? 'destructive' : 'outline'
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and insights will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
