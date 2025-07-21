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
    template: "# The Ultimate Guide to [TOPIC]\\n\\n## Introduction\\n\\nWelcome to the most comprehensive guide on [TOPIC]. This guide will provide you with everything you need to know.\\n\\n## What is [TOPIC]?\\n\\n[TOPIC] is an important concept in today's landscape.\\n\\n## Key Benefits\\n\\n1. Benefit 1\\n2. Benefit 2\\n3. Benefit 3\\n\\n## Getting Started\\n\\n### Step 1\\nFirst step description\\n\\n### Step 2\\nSecond step description\\n\\n### Step 3\\nThird step description\\n\\n## Conclusion\\n\\nThis guide has covered the essential aspects of [TOPIC].",


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
    template: "# [SERVICE_NAME] - [COMPANY_NAME]\\n\\n## Transform Your Business with Expert Services\\n\\n[COMPANY_NAME] provides professional services to help businesses achieve their goals.\\n\\n## Why Choose Our Services?\\n\\n### Professional Excellence\\n\\nWe understand your needs and provide tailored solutions.\\n\\n### Our Process\\n\\n1. Consultation\\n2. Planning\\n3. Implementation\\n4. Results\\n\\n## Contact Us\\n\\nReady to get started? Contact us today!"

,
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
    template: "# [PRODUCT_NAME] - [BRAND_NAME]\\n\\n## Amazing Product Features\\n\\n[PRODUCT_NAME] is the perfect solution for your needs.\\n\\n### Key Features\\n\\n- Feature 1\\n- Feature 2\\n- Feature 3\\n\\n### Order Now\\n\\nGet yours today!"

,
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
