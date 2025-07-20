/**
 * Content Template Library
 * Completes Story 1.1 - Pre-built templates for different content types
 * Industry-specific templates with SEO optimization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  TrendingUp, 
  Users, 
  Briefcase,
  ShoppingCart,
  Heart,
  Zap,
  BookOpen,
  Code,
  Camera
} from 'lucide-react';

// Types
interface ContentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  industry: string;
  contentType: 'blog-post' | 'service-page' | 'product-description' | 'landing-page';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  wordCount: number;
  seoScore: number;
  popularity: number;
  tags: string[];
  template: string;
  variables: TemplateVariable[];
  preview: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

interface ContentTemplateLibraryProps {
  onSelectTemplate: (template: ContentTemplate, variables: Record<string, string>) => void;
}

// Mock template data
const MOCK_TEMPLATES: ContentTemplate[] = [
  {
    id: 'blog-ultimate-guide',
    title: 'Ultimate Guide Blog Post',
    description: 'Comprehensive guide template for in-depth topic coverage',
    category: 'Educational',
    industry: 'General',
    contentType: 'blog-post',
    difficulty: 'intermediate',
    estimatedTime: 45,
    wordCount: 2500,
    seoScore: 95,
    popularity: 4.8,
    tags: ['guide', 'comprehensive', 'seo-optimized'],
    template: `# The Ultimate Guide to {{topic}}

## Introduction

Welcome to the most comprehensive guide on {{topic}}. Whether you're a {{target_audience}} looking to {{primary_goal}}, this guide will provide you with everything you need to know.

## What is {{topic}}?

{{topic}} is {{definition}}. In today's {{industry}} landscape, understanding {{topic}} is crucial for {{benefits}}.

## Why {{topic}} Matters

### Key Benefits
1. **{{benefit_1}}** - {{benefit_1_description}}
2. **{{benefit_2}}** - {{benefit_2_description}}
3. **{{benefit_3}}** - {{benefit_3_description}}

## Getting Started with {{topic}}

### Step 1: {{step_1_title}}
{{step_1_description}}

### Step 2: {{step_2_title}}
{{step_2_description}}

### Step 3: {{step_3_title}}
{{step_3_description}}

## Advanced {{topic}} Strategies

### Strategy 1: {{advanced_strategy_1}}
{{strategy_1_description}}

### Strategy 2: {{advanced_strategy_2}}
{{strategy_2_description}}

## Common Mistakes to Avoid

1. **{{mistake_1}}** - {{mistake_1_solution}}
2. **{{mistake_2}}** - {{mistake_2_solution}}
3. **{{mistake_3}}** - {{mistake_3_solution}}

## Tools and Resources

### Recommended Tools
- **{{tool_1}}** - {{tool_1_description}}
- **{{tool_2}}** - {{tool_2_description}}
- **{{tool_3}}** - {{tool_3_description}}

## Conclusion

{{topic}} is essential for {{conclusion_benefit}}. By following this guide, you'll be able to {{final_outcome}}.

## Next Steps

1. {{next_step_1}}
2. {{next_step_2}}
3. {{next_step_3}}`,
    variables: [
      { name: 'topic', label: 'Main Topic', type: 'text', required: true, placeholder: 'e.g., Digital Marketing' },
      { name: 'target_audience', label: 'Target Audience', type: 'text', required: true, placeholder: 'e.g., business owner' },
      { name: 'primary_goal', label: 'Primary Goal', type: 'text', required: true, placeholder: 'e.g., increase sales' },
      { name: 'industry', label: 'Industry', type: 'text', required: true, placeholder: 'e.g., technology' },
      { name: 'definition', label: 'Topic Definition', type: 'textarea', required: true },
      { name: 'benefits', label: 'Main Benefits', type: 'text', required: true },
    ],
    preview: 'A comprehensive, SEO-optimized guide template perfect for establishing thought leadership...',
    author: 'SEO Expert Team',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: 'service-page-professional',
    title: 'Professional Service Page',
    description: 'Convert visitors with this high-converting service page template',
    category: 'Business',
    industry: 'Professional Services',
    contentType: 'service-page',
    difficulty: 'beginner',
    estimatedTime: 30,
    wordCount: 1500,
    seoScore: 92,
    popularity: 4.6,
    tags: ['conversion', 'professional', 'service'],
    template: `# {{service_name}} - {{company_name}}

## Transform Your {{business_area}} with Expert {{service_name}}

{{company_name}} provides {{service_description}} to help {{target_market}} achieve {{primary_outcome}}.

## Why Choose Our {{service_name}}?

### {{unique_value_prop}}

We understand that {{pain_point}}. That's why our {{service_name}} is designed to {{solution_approach}}.

### Our Process

1. **{{process_step_1}}** - {{step_1_description}}
2. **{{process_step_2}}** - {{step_2_description}}
3. **{{process_step_3}}** - {{step_3_description}}
4. **{{process_step_4}}** - {{step_4_description}}

## What You Get

- {{deliverable_1}}
- {{deliverable_2}}
- {{deliverable_3}}
- {{deliverable_4}}

## Success Stories

"{{testimonial_1}}" - {{client_1_name}}, {{client_1_title}}

"{{testimonial_2}}" - {{client_2_name}}, {{client_2_title}}

## Pricing

### {{package_name}}
Starting at ${{price}}

{{package_description}}

**Includes:**
- {{feature_1}}
- {{feature_2}}
- {{feature_3}}

## Ready to Get Started?

{{cta_text}}

**Contact us today:**
- Phone: {{phone}}
- Email: {{email}}
- Schedule a consultation: {{booking_link}}`,
    variables: [
      { name: 'service_name', label: 'Service Name', type: 'text', required: true },
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { name: 'business_area', label: 'Business Area', type: 'text', required: true },
      { name: 'target_market', label: 'Target Market', type: 'text', required: true },
      { name: 'primary_outcome', label: 'Primary Outcome', type: 'text', required: true },
      { name: 'pain_point', label: 'Customer Pain Point', type: 'textarea', required: true },
    ],
    preview: 'A professional service page template designed to convert visitors into customers...',
    author: 'Conversion Expert',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
  },
  {
    id: 'product-description-ecommerce',
    title: 'E-commerce Product Description',
    description: 'High-converting product descriptions that drive sales',
    category: 'E-commerce',
    industry: 'Retail',
    contentType: 'product-description',
    difficulty: 'beginner',
    estimatedTime: 15,
    wordCount: 800,
    seoScore: 88,
    popularity: 4.7,
    tags: ['ecommerce', 'sales', 'product'],
    template: `# {{product_name}} - {{brand_name}}

## {{headline}}

{{product_name}} is the {{product_category}} that {{main_benefit}}. Perfect for {{target_customer}}, this {{product_type}} delivers {{key_outcome}}.

### Key Features

- **{{feature_1}}** - {{feature_1_benefit}}
- **{{feature_2}}** - {{feature_2_benefit}}
- **{{feature_3}}** - {{feature_3_benefit}}
- **{{feature_4}}** - {{feature_4_benefit}}

### Specifications

- {{spec_1}}: {{spec_1_value}}
- {{spec_2}}: {{spec_2_value}}
- {{spec_3}}: {{spec_3_value}}
- {{spec_4}}: {{spec_4_value}}

### What's Included

- {{included_1}}
- {{included_2}}
- {{included_3}}

### Why Choose {{product_name}}?

{{unique_selling_point}}

### Customer Reviews

⭐⭐⭐⭐⭐ "{{review_1}}" - {{reviewer_1}}

⭐⭐⭐⭐⭐ "{{review_2}}" - {{reviewer_2}}

### Guarantee

{{guarantee_text}}

### Order Now

{{cta_text}}

**Price: ${{price}}**
{{shipping_info}}`,
    variables: [
      { name: 'product_name', label: 'Product Name', type: 'text', required: true },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true },
      { name: 'headline', label: 'Compelling Headline', type: 'text', required: true },
      { name: 'product_category', label: 'Product Category', type: 'text', required: true },
      { name: 'main_benefit', label: 'Main Benefit', type: 'text', required: true },
      { name: 'target_customer', label: 'Target Customer', type: 'text', required: true },
    ],
    preview: 'A high-converting product description template optimized for e-commerce sales...',
    author: 'E-commerce Specialist',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-19',
  },
];

const CATEGORIES = ['All', 'Educational', 'Business', 'E-commerce', 'Technology', 'Healthcare', 'Finance'];
const INDUSTRIES = ['All', 'General', 'Professional Services', 'Retail', 'Technology', 'Healthcare', 'Finance'];
const CONTENT_TYPES = ['All', 'blog-post', 'service-page', 'product-description', 'landing-page'];

export function ContentTemplateLibrary({ onSelectTemplate }: ContentTemplateLibraryProps) {
  const [templates, setTemplates] = useState<ContentTemplate[]>(MOCK_TEMPLATES);
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>(MOCK_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedContentType, setSelectedContentType] = useState('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'recent' | 'seo-score'>('popularity');

  // Filter and search templates
  useEffect(() => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply industry filter
    if (selectedIndustry !== 'All') {
      filtered = filtered.filter(template => template.industry === selectedIndustry);
    }

    // Apply content type filter
    if (selectedContentType !== 'All') {
      filtered = filtered.filter(template => template.contentType === selectedContentType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'seo-score':
          return b.seoScore - a.seoScore;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedIndustry, selectedContentType, sortBy]);

  const handleTemplateSelect = (template: ContentTemplate) => {
    // Create a simple variable collection interface
    const variables: Record<string, string> = {};
    
    // For demo purposes, we'll use placeholder values
    template.variables.forEach(variable => {
      variables[variable.name] = variable.defaultValue || `[${variable.label}]`;
    });

    onSelectTemplate(template, variables);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Educational': return <BookOpen className="w-4 h-4" />;
      case 'Business': return <Briefcase className="w-4 h-4" />;
      case 'E-commerce': return <ShoppingCart className="w-4 h-4" />;
      case 'Technology': return <Code className="w-4 h-4" />;
      case 'Healthcare': return <Heart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Template Library</h2>
          <p className="text-muted-foreground">
            Choose from professionally crafted templates to jumpstart your content creation
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map(industry => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedContentType} onValueChange={setSelectedContentType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'All' ? 'All Types' : type.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popular</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="seo-score">SEO Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <div>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-yellow-600">
                  <Star className="w-3 h-3 fill-current" />
                  {template.popularity}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Template Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {template.estimatedTime}m
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {template.wordCount} words
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  SEO {template.seoScore}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="outline">{template.contentType.replace('-', ' ')}</Badge>
              </div>

              {/* Preview */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.preview}
              </p>

              {/* Action Button */}
              <Button 
                className="w-full" 
                onClick={() => handleTemplateSelect(template)}
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}
    </div>
  );
}
