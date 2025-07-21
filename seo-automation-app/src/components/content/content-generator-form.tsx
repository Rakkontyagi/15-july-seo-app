'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProgressIndicator, useProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  FormField, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage,
  FormGrid,
  FormSection
} from '@/components/ui/form';
import { 
  Globe, 
  Target, 
  FileText, 
  Zap, 
  Settings,
  Copy,
  Download,
  Share,
  Edit
} from 'lucide-react';
import { createComponentLogger } from '@/lib/logging/logger';

interface ContentGeneratorFormProps {
  onGenerate?: (data: ContentFormData) => void;
  className?: string;
}

interface ContentFormData {
  keyword: string;
  targetCountry: string;
  contentType: string;
  tone: string;
  targetAudience: string;
  wordCount: number;
  includeImages: boolean;
  includeSchema: boolean;
  competitorAnalysis: boolean;
}

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
];

const contentTypes = [
  { id: 'blog', name: 'Blog Post', icon: FileText },
  { id: 'landing', name: 'Landing Page', icon: Globe },
  { id: 'product', name: 'Product Description', icon: Target },
  { id: 'social', name: 'Social Media', icon: Share },
];

const tones = [
  'Professional', 'Casual', 'Friendly', 'Authoritative', 
  'Conversational', 'Technical', 'Educational', 'Persuasive'
];

export function ContentGeneratorForm({ onGenerate, className }: ContentGeneratorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  
  const { 
    steps, 
    setSteps, 
    currentStep, 
    startStep, 
    completeStep,
    failStep,
    resetSteps 
  } = useProgressIndicator();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ContentFormData>({
    defaultValues: {
      keyword: '',
      targetCountry: 'US',
      contentType: 'blog',
      tone: 'Professional',
      targetAudience: '',
      wordCount: 1000,
      includeImages: true,
      includeSchema: true,
      competitorAnalysis: true
    }
  });

  const watchedValues = watch();

  const handleGenerate = async (data: ContentFormData) => {
    setIsGenerating(true);
    setActiveTab('progress');
    
    // Initialize progress steps
    const progressSteps = [
      {
        id: 'keyword-analysis',
        name: 'Keyword Analysis',
        description: 'Analyzing keyword difficulty and search volume',
        status: 'pending' as const
      },
      {
        id: 'competitor-research',
        name: 'Competitor Research',
        description: 'Researching top-ranking competitors',
        status: 'pending' as const
      },
      {
        id: 'content-outline',
        name: 'Content Outline',
        description: 'Creating content structure and outline',
        status: 'pending' as const
      },
      {
        id: 'content-generation',
        name: 'Content Generation',
        description: 'Generating optimized content',
        status: 'pending' as const
      },
      {
        id: 'seo-optimization',
        name: 'SEO Optimization',
        description: 'Optimizing for search engines',
        status: 'pending' as const
      }
    ];

    setSteps(progressSteps);

    try {
      // Simulate content generation process
      for (let i = 0; i < progressSteps.length; i++) {
        const step = progressSteps[i];
        startStep(step.id);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (Math.random() > 0.9) { // 10% chance of error for demo
          failStep(step.id, 'Failed to complete step');
          break;
        }
        
        completeStep(step.id);
      }

      // Mock generated content
      setGeneratedContent(`
# ${data.keyword} - Complete Guide

## Introduction
This comprehensive guide covers everything you need to know about ${data.keyword}. Our ${data.tone.toLowerCase()} approach ensures you get the most relevant and actionable information.

## Main Content
[Generated content would appear here based on the keyword: ${data.keyword}]

### Key Benefits
- Benefit 1
- Benefit 2
- Benefit 3

### How to Get Started
1. Step 1
2. Step 2
3. Step 3

## Conclusion
In conclusion, ${data.keyword} is an important topic that requires careful consideration...

*Generated for ${countries.find(c => c.code === data.targetCountry)?.name} audience*
*Content Type: ${contentTypes.find(c => c.id === data.contentType)?.name}*
*Word Count: ~${data.wordCount} words*
      `);
      
      setActiveTab('result');
      onGenerate?.(data);
    } catch (error) {
      const logger = createComponentLogger('content-generator-form');
      logger.error('Generation failed:', { error: error instanceof Error ? error.message : error });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedContent(null);
    setActiveTab('form');
    resetSteps();
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Configuration</TabsTrigger>
          <TabsTrigger value="progress" disabled={!isGenerating && !generatedContent}>
            Progress
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedContent}>
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Content Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleGenerate)} className="space-y-6">
                <FormSection title="Basic Configuration">
                  <FormGrid columns={2}>
                    <FormField name="keyword" error={errors.keyword?.message}>
                      <FormLabel>Target Keyword</FormLabel>
                      <FormControl>
                        <Input
                          {...register('keyword', { required: 'Keyword is required' })}
                          placeholder="e.g., best coffee makers"
                        />
                      </FormControl>
                      <FormDescription>
                        Main keyword you want to target
                      </FormDescription>
                    </FormField>

                    <FormField name="targetCountry">
                      <FormLabel>Target Country</FormLabel>
                      <FormControl>
                        <select
                          {...register('targetCountry')}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          {countries.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    </FormField>
                  </FormGrid>
                </FormSection>

                <FormSection title="Content Settings">
                  <FormGrid columns={2}>
                    <FormField name="contentType">
                      <FormLabel>Content Type</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          {contentTypes.map(type => {
                            const Icon = type.icon;
                            return (
                              <label
                                key={type.id}
                                className={`flex items-center space-x-2 p-3 rounded-md border cursor-pointer transition-colors ${
                                  watchedValues.contentType === type.id
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-accent border-input'
                                }`}
                              >
                                <input
                                  type="radio"
                                  {...register('contentType')}
                                  value={type.id}
                                  className="sr-only"
                                />
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{type.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </FormControl>
                    </FormField>

                    <FormField name="tone">
                      <FormLabel>Tone</FormLabel>
                      <FormControl>
                        <select
                          {...register('tone')}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          {tones.map(tone => (
                            <option key={tone} value={tone}>
                              {tone}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    </FormField>
                  </FormGrid>

                  <FormGrid columns={2}>
                    <FormField name="targetAudience">
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input
                          {...register('targetAudience')}
                          placeholder="e.g., coffee enthusiasts, beginners"
                        />
                      </FormControl>
                    </FormField>

                    <FormField name="wordCount">
                      <FormLabel>Word Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...register('wordCount', { min: 100, max: 5000 })}
                          min="100"
                          max="5000"
                          step="100"
                        />
                      </FormControl>
                    </FormField>
                  </FormGrid>
                </FormSection>

                <FormSection title="Advanced Options">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register('includeImages')}
                        className="rounded border-input"
                      />
                      <Label>Include image suggestions</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register('includeSchema')}
                        className="rounded border-input"
                      />
                      <Label>Include schema markup</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register('competitorAnalysis')}
                        className="rounded border-input"
                      />
                      <Label>Perform competitor analysis</Label>
                    </div>
                  </div>
                </FormSection>

                <Separator />

                <div className="flex justify-between items-center">
                  <Badge variant="outline">
                    Usage: 3/10 this month
                  </Badge>
                  <Button type="submit" disabled={isGenerating} className="min-w-32">
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Content'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressIndicator
                steps={steps}
                currentStep={currentStep}
                onCancel={handleReset}
                showSteps={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Content</span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedContent && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {generatedContent}
                    </pre>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={handleReset}>
                      Generate New Content
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        Word Count: ~{watchedValues.wordCount}
                      </Badge>
                      <Badge variant="secondary">
                        SEO Score: 85/100
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}