'use client';

import { useState } from 'react';
import { RealTimeContentEditor } from '@/components/editor/RealTimeContentEditor';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  FolderOpen,
  Clock,
  Target,
  TrendingUp,
  Settings,
  Download,
  Share
} from 'lucide-react';

interface ContentProject {
  id: string;
  title: string;
  keyword: string;
  status: 'draft' | 'in-progress' | 'completed';
  lastModified: string;
  wordCount: number;
  seoScore: number;
  content: string;
}

export default function EditorPage() {
  const [activeProject, setActiveProject] = useState<ContentProject | null>(null);
  const [projects] = useState<ContentProject[]>([
    {
      id: '1',
      title: 'Complete SEO Guide',
      keyword: 'seo optimization',
      status: 'in-progress',
      lastModified: '2025-01-20T10:30:00Z',
      wordCount: 1250,
      seoScore: 78,
      content: `# Complete SEO Guide

Search Engine Optimization (SEO) is the practice of increasing the quantity and quality of traffic to your website through organic search engine results.

## What is SEO?

SEO involves making certain changes to your website design and content that make your site more attractive to a search engine. You do this in hopes that the search engine will display your website as a top result on the search engine results page.

## Key SEO Factors

### 1. Content Quality
High-quality, relevant content is the foundation of good SEO. Your content should provide value to your readers and answer their questions.

### 2. Keywords
Strategic use of keywords helps search engines understand what your content is about. However, avoid keyword stuffing.

### 3. Technical SEO
This includes site speed, mobile-friendliness, and proper HTML structure.

## Getting Started

To begin with SEO optimization, start by conducting keyword research to understand what your target audience is searching for.`
    },
    {
      id: '2',
      title: 'Digital Marketing Trends 2025',
      keyword: 'digital marketing trends',
      status: 'draft',
      lastModified: '2025-01-19T15:45:00Z',
      wordCount: 0,
      seoScore: 0,
      content: ''
    },
    {
      id: '3',
      title: 'Content Marketing Strategy',
      keyword: 'content marketing',
      status: 'completed',
      lastModified: '2025-01-18T09:20:00Z',
      wordCount: 2100,
      seoScore: 92,
      content: `# Content Marketing Strategy

Content marketing is a strategic marketing approach focused on creating and distributing valuable, relevant, and consistent content to attract and retain a clearly defined audience.

## Why Content Marketing Matters

Content marketing helps businesses build trust with their audience, establish thought leadership, and drive profitable customer action.

## Key Components

1. **Strategy Development**
2. **Content Creation**
3. **Distribution**
4. **Performance Measurement**

Content marketing requires a long-term commitment but delivers sustainable results when executed properly.`
    }
  ]);

  const handleSaveContent = (content: string) => {
    if (activeProject) {
      console.log('Saving content for project:', activeProject.id);
      // In a real app, this would save to the backend
    }
  };

  const handleExportContent = (content: string, format: string) => {
    console.log('Exporting content in format:', format);
    // In a real app, this would trigger a download
  };

  const handleNewProject = () => {
    const newProject: ContentProject = {
      id: Date.now().toString(),
      title: 'New Content Project',
      keyword: '',
      status: 'draft',
      lastModified: new Date().toISOString(),
      wordCount: 0,
      seoScore: 0,
      content: ''
    };
    setActiveProject(newProject);
  };

  const getStatusColor = (status: ContentProject['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
    }
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

  if (activeProject) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b">
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Editor', href: '/dashboard/editor' },
            { label: activeProject.title }
          ]} />
        </div>
        
        <RealTimeContentEditor
          initialContent={activeProject.content}
          targetKeyword={activeProject.keyword}
          onSave={handleSaveContent}
          onExport={handleExportContent}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content Editor' }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold">Content Editor</h1>
          <p className="text-muted-foreground text-responsive-base">
            Create and edit content with real-time SEO optimization
          </p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter(p => p.status === 'in-progress').length} in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SEO Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(projects.reduce((sum, p) => sum + p.seoScore, 0) / projects.length) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + p.wordCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Words written
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Your Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first content project to get started.
              </p>
              <Button onClick={handleNewProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setActiveProject(project)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium">{project.title}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      {project.keyword && (
                        <Badge variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          {project.keyword}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(project.lastModified)}
                      </span>
                      <span>{project.wordCount} words</span>
                      {project.seoScore > 0 && (
                        <span>SEO: {project.seoScore}%</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
