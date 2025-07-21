'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  BookOpen, 
  List, 
  HelpCircle,
  TrendingUp,
  Users,
  Clock,
  Target,
  CheckCircle
} from 'lucide-react';

interface ContentType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  wordCount: {
    min: number;
    max: number;
    recommended: number;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToGenerate: string;
  seoValue: number;
  engagementRate: number;
  features: string[];
  examples: string[];
}

interface ContentTypeSelectorProps {
  value: string;
  onChange: (contentType: string) => void;
  showDetails?: boolean;
}

const contentTypes: ContentType[] = [
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Informative articles that drive organic traffic and establish authority',
    icon: <FileText className="h-5 w-5" />,
    wordCount: { min: 800, max: 3000, recommended: 1500 },
    difficulty: 'beginner',
    timeToGenerate: '2-3 minutes',
    seoValue: 85,
    engagementRate: 75,
    features: ['SEO optimized', 'Social sharing ready', 'Internal linking'],
    examples: ['How-to guides', 'Industry insights', 'Best practices']
  },
  {
    id: 'comprehensive-guide',
    name: 'Comprehensive Guide',
    description: 'In-depth, authoritative content that covers topics thoroughly',
    icon: <BookOpen className="h-5 w-5" />,
    wordCount: { min: 2000, max: 8000, recommended: 4000 },
    difficulty: 'advanced',
    timeToGenerate: '5-8 minutes',
    seoValue: 95,
    engagementRate: 85,
    features: ['Table of contents', 'Expert insights', 'Case studies'],
    examples: ['Ultimate guides', 'Complete tutorials', 'Industry reports']
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Engaging list-based content that\'s easy to scan and share',
    icon: <List className="h-5 w-5" />,
    wordCount: { min: 600, max: 2000, recommended: 1200 },
    difficulty: 'beginner',
    timeToGenerate: '2-3 minutes',
    seoValue: 70,
    engagementRate: 90,
    features: ['Numbered format', 'Visual elements', 'Quick consumption'],
    examples: ['Top 10 lists', 'Best tools', 'Tips and tricks']
  },
  {
    id: 'faq',
    name: 'FAQ Article',
    description: 'Question and answer format targeting specific user queries',
    icon: <HelpCircle className="h-5 w-5" />,
    wordCount: { min: 500, max: 1500, recommended: 800 },
    difficulty: 'beginner',
    timeToGenerate: '1-2 minutes',
    seoValue: 80,
    engagementRate: 70,
    features: ['Schema markup', 'Featured snippets', 'Voice search optimized'],
    examples: ['Common questions', 'Troubleshooting', 'Product info']
  },
  {
    id: 'comparison',
    name: 'Comparison Article',
    description: 'Side-by-side analysis helping users make informed decisions',
    icon: <TrendingUp className="h-5 w-5" />,
    wordCount: { min: 1000, max: 3000, recommended: 2000 },
    difficulty: 'intermediate',
    timeToGenerate: '3-4 minutes',
    seoValue: 90,
    engagementRate: 80,
    features: ['Comparison tables', 'Pros and cons', 'Recommendations'],
    examples: ['Product comparisons', 'Service reviews', 'Tool evaluations']
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Real-world examples showcasing results and methodologies',
    icon: <Target className="h-5 w-5" />,
    wordCount: { min: 1200, max: 4000, recommended: 2500 },
    difficulty: 'advanced',
    timeToGenerate: '4-6 minutes',
    seoValue: 85,
    engagementRate: 75,
    features: ['Data visualization', 'Results metrics', 'Methodology'],
    examples: ['Success stories', 'Implementation guides', 'ROI analysis']
  }
];

export function ContentTypeSelector({ value, onChange, showDetails = true }: ContentTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<ContentType | null>(
    contentTypes.find(type => type.id === value) || null
  );

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type);
    onChange(type.id);
  };

  const getDifficultyColor = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Content Type *
        </label>
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {contentTypes.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType?.id === type.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleTypeSelect(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="mr-3 text-blue-600">
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{type.name}</h3>
                    </div>
                  </div>
                  {selectedType?.id === type.id && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  {type.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={getDifficultyColor(type.difficulty)}
                  >
                    {type.difficulty}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {type.timeToGenerate}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Type Details */}
      {selectedType && showDetails && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium flex items-center">
                {selectedType.icon}
                <span className="ml-2">{selectedType.name} Details</span>
              </h4>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  SEO: {selectedType.seoValue}%
                </Badge>
                <Badge variant="outline">
                  Engagement: {selectedType.engagementRate}%
                </Badge>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Word Count
                </h5>
                <div className="text-sm text-muted-foreground">
                  <div>Minimum: {selectedType.wordCount.min} words</div>
                  <div>Maximum: {selectedType.wordCount.max} words</div>
                  <div className="font-medium text-foreground">
                    Recommended: {selectedType.wordCount.recommended} words
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Generation Time
                </h5>
                <div className="text-sm text-muted-foreground">
                  Estimated: {selectedType.timeToGenerate}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Key Features</h5>
              <div className="flex flex-wrap gap-1">
                {selectedType.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Examples</h5>
              <div className="text-sm text-muted-foreground">
                {selectedType.examples.join(' • ')}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>Optimization:</strong> This content type is optimized for {selectedType.seoValue}% SEO value 
                with {selectedType.engagementRate}% average engagement rate.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
