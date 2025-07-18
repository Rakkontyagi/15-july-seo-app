'use client';

import { ContentGeneratorForm } from '@/components/content/content-generator-form';
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
  Target
} from 'lucide-react';

export default function ContentPage() {
  const recentContent = [
    {
      id: 1,
      title: 'Best Coffee Makers for 2024',
      type: 'Blog Post',
      status: 'Published',
      created: '2 hours ago',
      views: 1234,
      keywords: ['coffee makers', 'kitchen appliances'],
    },
    {
      id: 2,
      title: 'Home Office Setup Guide',
      type: 'Landing Page',
      status: 'Draft',
      created: '1 day ago',
      views: 0,
      keywords: ['home office', 'productivity'],
    },
    {
      id: 3,
      title: 'Digital Marketing Trends',
      type: 'Blog Post',
      status: 'Published',
      created: '3 days ago',
      views: 856,
      keywords: ['digital marketing', 'trends'],
    },
  ];

  const templates = [
    {
      id: 1,
      name: 'Product Review',
      description: 'Comprehensive product review template',
      icon: Target,
      estimatedTime: '15 min',
    },
    {
      id: 2,
      name: 'How-to Guide',
      description: 'Step-by-step instructional content',
      icon: BookOpen,
      estimatedTime: '20 min',
    },
    {
      id: 3,
      name: 'Comparison Article',
      description: 'Compare multiple products or services',
      icon: TrendingUp,
      estimatedTime: '25 min',
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Content Generator' }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold">Content Generator</h1>
          <p className="text-muted-foreground text-responsive-base">
            Create SEO-optimized content for any keyword and target audience
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            <Zap className="h-3 w-3 mr-1" />
            3/10 Credits Used
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <ContentGeneratorForm />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {template.estimatedTime}
                          </Badge>
                          <Button size="sm">Use Template</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContent.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{content.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{content.type}</span>
                          <span>•</span>
                          <span>{content.created}</span>
                          <span>•</span>
                          <span>{content.views} views</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          {content.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={content.status === 'Published' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {content.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}