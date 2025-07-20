'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedAIEnhancer } from '@/components/ai/AdvancedAIEnhancer';
import { ContentInsightsDashboard } from '@/components/ai/ContentInsightsDashboard';
import { SmartRecommendationsEngine } from '@/components/ai/SmartRecommendationsEngine';
import { 
  Brain, 
  Sparkles, 
  Zap,
  Target,
  TrendingUp,
  Eye,
  Users,
  Globe,
  BarChart3,
  Lightbulb,
  Wand2,
  Activity,
  Settings,
  Rocket,
  Star
} from 'lucide-react';

export default function AILabPage() {
  const [activeTab, setActiveTab] = useState('enhancer');
  const [sampleContent, setSampleContent] = useState(`# The Future of Content Marketing

Content marketing has evolved significantly over the past decade. With the rise of artificial intelligence and machine learning, businesses now have unprecedented opportunities to create, optimize, and distribute content at scale.

## Key Trends Shaping Content Marketing

1. **AI-Powered Content Creation**: Tools that can generate high-quality content in minutes
2. **Personalization at Scale**: Delivering unique experiences to millions of users
3. **Voice Search Optimization**: Adapting content for voice-first interactions
4. **Interactive Content**: Engaging audiences with polls, quizzes, and dynamic experiences

The companies that embrace these technologies will have a significant competitive advantage in the coming years.`);

  const aiFeatures = [
    {
      id: 'enhancer',
      name: 'AI Content Enhancer',
      description: 'Automatically improve your content across multiple dimensions',
      icon: <Wand2 className="h-5 w-5" />,
      badge: 'ADVANCED',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'insights',
      name: 'Content Insights',
      description: 'Get AI-powered insights about your content performance',
      icon: <Brain className="h-5 w-5" />,
      badge: 'SMART',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'recommendations',
      name: 'Smart Recommendations',
      description: 'Discover content opportunities with AI analysis',
      icon: <Lightbulb className="h-5 w-5" />,
      badge: 'INTELLIGENT',
      color: 'bg-green-100 text-green-800'
    }
  ];

  const labStats = [
    {
      name: 'AI Models Active',
      value: '12',
      icon: <Brain className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      name: 'Content Analyzed',
      value: '2.4K',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      name: 'Improvements Made',
      value: '8.9K',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      name: 'Success Rate',
      value: '94%',
      icon: <Target className="h-4 w-4" />,
      color: 'text-orange-600'
    }
  ];

  const handleContentUpdate = (newContent: string) => {
    setSampleContent(newContent);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'AI Lab' }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-600" />
            AI Lab
            <Badge className="ml-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              BETA
            </Badge>
          </h1>
          <p className="text-muted-foreground text-responsive-base">
            Advanced AI-powered tools for content creation, optimization, and analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
          <Button>
            <Rocket className="h-4 w-4 mr-2" />
            Upgrade AI
          </Button>
        </div>
      </div>

      {/* AI Lab Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {labStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-600">+12.5%</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            AI-Powered Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {aiFeatures.map((feature) => (
              <div
                key={feature.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  activeTab === feature.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                }`}
                onClick={() => setActiveTab(feature.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {feature.icon}
                    <span className="font-medium">{feature.name}</span>
                  </div>
                  <Badge className={feature.color}>
                    {feature.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={activeTab === feature.id ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {activeTab === feature.id ? 'Active' : 'Try Now'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Tools Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enhancer">
            <Wand2 className="h-4 w-4 mr-2" />
            AI Enhancer
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            Content Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="h-4 w-4 mr-2" />
            Smart Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhancer" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sample Content Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Content Input
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={sampleContent}
                  onChange={(e) => setSampleContent(e.target.value)}
                  className="w-full h-64 p-3 border rounded-md resize-none font-mono text-sm"
                  placeholder="Paste your content here to analyze and enhance..."
                />
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{sampleContent.length} characters</span>
                  <span>~{Math.round(sampleContent.length / 5)} words</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Enhancer */}
            <div>
              <AdvancedAIEnhancer
                content={sampleContent}
                targetAudience="marketing professionals"
                contentGoal="educate"
                onContentUpdate={handleContentUpdate}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <ContentInsightsDashboard content={sampleContent} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <SmartRecommendationsEngine />
        </TabsContent>
      </Tabs>

      {/* AI Lab Footer */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900 mb-1">
                🚀 Unlock Advanced AI Features
              </h3>
              <p className="text-sm text-purple-700">
                Get access to GPT-4, Claude, and custom AI models for even better results
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-purple-900">Pro Plan</div>
                <div className="text-xs text-purple-600">Starting at $29/month</div>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Star className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
