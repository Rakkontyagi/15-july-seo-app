'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeywordInputForm } from '@/components/forms/KeywordInputForm';
import { LocationSelector } from '@/components/ui/LocationSelector';
import { ContentTypeSelector } from '@/components/ui/ContentTypeSelector';
import { RealTimeProgress } from '@/components/ui/RealTimeProgress';
import { GenerationHistory } from '@/components/ui/GenerationHistory';
import { useContentGeneration } from '@/hooks/useContentGeneration';
import { 
  FileText, 
  Settings, 
  Target,
  Globe,
  Zap,
  Brain,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ContentGenerationConfig {
  keyword: string;
  location: string;
  contentType: string;
  targetAudience: string;
  tone: string;
  wordCount: number;
  includeImages: boolean;
  includeSchema: boolean;
  competitorAnalysis: boolean;
}

export function ContentGenerationDashboard() {
  const [activeStep, setActiveStep] = useState<'setup' | 'generating' | 'review'>('setup');
  const [config, setConfig] = useState<Partial<ContentGenerationConfig>>({
    keyword: '',
    location: 'US',
    contentType: 'blog-post',
    targetAudience: '',
    tone: 'professional',
    wordCount: 1500,
    includeImages: true,
    includeSchema: true,
    competitorAnalysis: true
  });

  const {
    isGenerating,
    progress,
    currentStage,
    generatedContent,
    qualityMetrics,
    startGeneration,
    resetGeneration
  } = useContentGeneration();

  const handleConfigUpdate = (updates: Partial<ContentGenerationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleStartGeneration = async () => {
    if (!config.keyword) {
      alert('Please enter a keyword');
      return;
    }

    setActiveStep('generating');
    await startGeneration(config as ContentGenerationConfig);
    setActiveStep('review');
  };

  const handleNewGeneration = () => {
    resetGeneration();
    setActiveStep('setup');
    setConfig({
      keyword: '',
      location: 'US',
      contentType: 'blog-post',
      targetAudience: '',
      tone: 'professional',
      wordCount: 1500,
      includeImages: true,
      includeSchema: true,
      competitorAnalysis: true
    });
  };

  if (activeStep === 'generating') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Generating Content: "{config.keyword}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealTimeProgress 
              progress={progress}
              currentStage={currentStage}
              isGenerating={isGenerating}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeStep === 'review') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Content Generated Successfully
              </span>
              <Button onClick={handleNewGeneration} variant="outline">
                Generate New Content
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {qualityMetrics.overallScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {qualityMetrics.seoScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">SEO Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {qualityMetrics.readabilityScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Readability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {generatedContent?.split(' ').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Words</div>
                  </div>
                </div>
              )}
              
              {generatedContent && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Generated Content Preview</h4>
                  <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                    {generatedContent.substring(0, 500)}...
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Content
                </Button>
                <Button variant="outline">
                  Edit Content
                </Button>
                <Button variant="outline">
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Content Generation Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
              <TabsTrigger value="optimization">SEO Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <KeywordInputForm 
                    value={config.keyword || ''}
                    onChange={(keyword) => handleConfigUpdate({ keyword })}
                  />
                </div>
                <div>
                  <LocationSelector
                    value={config.location || 'US'}
                    onChange={(location) => handleConfigUpdate({ location })}
                  />
                </div>
              </div>
              
              <ContentTypeSelector
                value={config.contentType || 'blog-post'}
                onChange={(contentType) => handleConfigUpdate({ contentType })}
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Small business owners, Marketing professionals"
                    value={config.targetAudience || ''}
                    onChange={(e) => handleConfigUpdate({ targetAudience: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={config.tone || 'professional'}
                    onChange={(e) => handleConfigUpdate({ tone: e.target.value })}
                  >
                    <option value="professional">Professional</option>
                    <option value="conversational">Conversational</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="friendly">Friendly</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Word Count</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  min="300"
                  max="5000"
                  value={config.wordCount || 1500}
                  onChange={(e) => handleConfigUpdate({ wordCount: parseInt(e.target.value) })}
                />
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeImages"
                    checked={config.includeImages || false}
                    onChange={(e) => handleConfigUpdate({ includeImages: e.target.checked })}
                  />
                  <label htmlFor="includeImages" className="text-sm font-medium">
                    Include Image Suggestions
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeSchema"
                    checked={config.includeSchema || false}
                    onChange={(e) => handleConfigUpdate({ includeSchema: e.target.checked })}
                  />
                  <label htmlFor="includeSchema" className="text-sm font-medium">
                    Include Schema Markup
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="competitorAnalysis"
                    checked={config.competitorAnalysis || false}
                    onChange={(e) => handleConfigUpdate({ competitorAnalysis: e.target.checked })}
                  />
                  <label htmlFor="competitorAnalysis" className="text-sm font-medium">
                    Perform Competitor Analysis
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Estimated generation time: 2-4 minutes
            </div>
            <Button 
              onClick={handleStartGeneration}
              disabled={!config.keyword || isGenerating}
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent History */}
      <GenerationHistory />
    </div>
  );
}
