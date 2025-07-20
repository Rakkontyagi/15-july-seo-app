'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search,
  Star,
  Clock,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  List,
  HelpCircle,
  BarChart3,
  Lightbulb,
  Copy,
  Eye
} from 'lucide-react';

interface ContentTemplate {
  id: string;
  title: string;
  description: string;
  category: 'blog' | 'landing' | 'product' | 'guide' | 'social' | 'email';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  wordCount: { min: number; max: number };
  seoOptimized: boolean;
  popular: boolean;
  structure: string[];
  template: string;
  variables: string[];
}

interface ContentTemplatesLibraryProps {
  onSelectTemplate?: (template: ContentTemplate) => void;
  onPreviewTemplate?: (template: ContentTemplate) => void;
}

const templates: ContentTemplate[] = [
  {
    id: 'blog-how-to',
    title: 'How-To Blog Post',
    description: 'Step-by-step guide format perfect for tutorials and instructional content',
    category: 'blog',
    difficulty: 'beginner',
    estimatedTime: '30-45 min',
    wordCount: { min: 800, max: 2000 },
    seoOptimized: true,
    popular: true,
    structure: ['Introduction', 'Prerequisites', 'Step-by-step instructions', 'Tips & tricks', 'Conclusion'],
    template: `# How to {TOPIC}: A Complete Guide

## Introduction

{INTRODUCTION_PARAGRAPH}

In this comprehensive guide, you'll learn:
- {LEARNING_POINT_1}
- {LEARNING_POINT_2}
- {LEARNING_POINT_3}

## What You'll Need

Before we begin, make sure you have:
- {PREREQUISITE_1}
- {PREREQUISITE_2}
- {PREREQUISITE_3}

## Step-by-Step Instructions

### Step 1: {STEP_1_TITLE}

{STEP_1_DESCRIPTION}

### Step 2: {STEP_2_TITLE}

{STEP_2_DESCRIPTION}

### Step 3: {STEP_3_TITLE}

{STEP_3_DESCRIPTION}

## Pro Tips

- {TIP_1}
- {TIP_2}
- {TIP_3}

## Common Mistakes to Avoid

1. {MISTAKE_1}
2. {MISTAKE_2}
3. {MISTAKE_3}

## Conclusion

{CONCLUSION_PARAGRAPH}

## Frequently Asked Questions

**Q: {QUESTION_1}**
A: {ANSWER_1}

**Q: {QUESTION_2}**
A: {ANSWER_2}`,
    variables: ['TOPIC', 'INTRODUCTION_PARAGRAPH', 'LEARNING_POINT_1', 'LEARNING_POINT_2', 'LEARNING_POINT_3', 'PREREQUISITE_1', 'PREREQUISITE_2', 'PREREQUISITE_3', 'STEP_1_TITLE', 'STEP_1_DESCRIPTION', 'STEP_2_TITLE', 'STEP_2_DESCRIPTION', 'STEP_3_TITLE', 'STEP_3_DESCRIPTION', 'TIP_1', 'TIP_2', 'TIP_3', 'MISTAKE_1', 'MISTAKE_2', 'MISTAKE_3', 'CONCLUSION_PARAGRAPH', 'QUESTION_1', 'ANSWER_1', 'QUESTION_2', 'ANSWER_2']
  },
  {
    id: 'blog-listicle',
    title: 'Listicle Blog Post',
    description: 'Numbered list format that\'s highly engaging and shareable',
    category: 'blog',
    difficulty: 'beginner',
    estimatedTime: '20-30 min',
    wordCount: { min: 600, max: 1500 },
    seoOptimized: true,
    popular: true,
    structure: ['Compelling headline', 'Introduction', 'Numbered list items', 'Conclusion with CTA'],
    template: `# {NUMBER} {ADJECTIVE} {TOPIC} That Will {BENEFIT}

## Introduction

{INTRODUCTION_PARAGRAPH}

Here are the {NUMBER} {TOPIC} that {PROMISE}:

## 1. {ITEM_1_TITLE}

{ITEM_1_DESCRIPTION}

**Why it works:** {ITEM_1_EXPLANATION}

## 2. {ITEM_2_TITLE}

{ITEM_2_DESCRIPTION}

**Why it works:** {ITEM_2_EXPLANATION}

## 3. {ITEM_3_TITLE}

{ITEM_3_DESCRIPTION}

**Why it works:** {ITEM_3_EXPLANATION}

## Conclusion

{CONCLUSION_PARAGRAPH}

**Ready to get started?** {CALL_TO_ACTION}`,
    variables: ['NUMBER', 'ADJECTIVE', 'TOPIC', 'BENEFIT', 'INTRODUCTION_PARAGRAPH', 'PROMISE', 'ITEM_1_TITLE', 'ITEM_1_DESCRIPTION', 'ITEM_1_EXPLANATION', 'ITEM_2_TITLE', 'ITEM_2_DESCRIPTION', 'ITEM_2_EXPLANATION', 'ITEM_3_TITLE', 'ITEM_3_DESCRIPTION', 'ITEM_3_EXPLANATION', 'CONCLUSION_PARAGRAPH', 'CALL_TO_ACTION']
  },
  {
    id: 'product-comparison',
    title: 'Product Comparison',
    description: 'Side-by-side comparison format for products or services',
    category: 'product',
    difficulty: 'intermediate',
    estimatedTime: '45-60 min',
    wordCount: { min: 1000, max: 2500 },
    seoOptimized: true,
    popular: false,
    structure: ['Introduction', 'Comparison criteria', 'Detailed comparison', 'Pros and cons', 'Recommendation'],
    template: `# {PRODUCT_A} vs {PRODUCT_B}: Which is Better in {YEAR}?

## Introduction

{INTRODUCTION_PARAGRAPH}

## Quick Comparison

| Feature | {PRODUCT_A} | {PRODUCT_B} |
|---------|-------------|-------------|
| {FEATURE_1} | {PRODUCT_A_FEATURE_1} | {PRODUCT_B_FEATURE_1} |
| {FEATURE_2} | {PRODUCT_A_FEATURE_2} | {PRODUCT_B_FEATURE_2} |
| {FEATURE_3} | {PRODUCT_A_FEATURE_3} | {PRODUCT_B_FEATURE_3} |

## Detailed Analysis

### {PRODUCT_A}

**Pros:**
- {PRODUCT_A_PRO_1}
- {PRODUCT_A_PRO_2}
- {PRODUCT_A_PRO_3}

**Cons:**
- {PRODUCT_A_CON_1}
- {PRODUCT_A_CON_2}

### {PRODUCT_B}

**Pros:**
- {PRODUCT_B_PRO_1}
- {PRODUCT_B_PRO_2}
- {PRODUCT_B_PRO_3}

**Cons:**
- {PRODUCT_B_CON_1}
- {PRODUCT_B_CON_2}

## Our Recommendation

{RECOMMENDATION_PARAGRAPH}

**Winner:** {WINNER} - {WINNER_REASON}`,
    variables: ['PRODUCT_A', 'PRODUCT_B', 'YEAR', 'INTRODUCTION_PARAGRAPH', 'FEATURE_1', 'FEATURE_2', 'FEATURE_3', 'PRODUCT_A_FEATURE_1', 'PRODUCT_A_FEATURE_2', 'PRODUCT_A_FEATURE_3', 'PRODUCT_B_FEATURE_1', 'PRODUCT_B_FEATURE_2', 'PRODUCT_B_FEATURE_3', 'PRODUCT_A_PRO_1', 'PRODUCT_A_PRO_2', 'PRODUCT_A_PRO_3', 'PRODUCT_A_CON_1', 'PRODUCT_A_CON_2', 'PRODUCT_B_PRO_1', 'PRODUCT_B_PRO_2', 'PRODUCT_B_PRO_3', 'PRODUCT_B_CON_1', 'PRODUCT_B_CON_2', 'RECOMMENDATION_PARAGRAPH', 'WINNER', 'WINNER_REASON']
  },
  {
    id: 'ultimate-guide',
    title: 'Ultimate Guide',
    description: 'Comprehensive, authoritative guide format for complex topics',
    category: 'guide',
    difficulty: 'advanced',
    estimatedTime: '2-3 hours',
    wordCount: { min: 3000, max: 8000 },
    seoOptimized: true,
    popular: true,
    structure: ['Table of contents', 'Introduction', 'Multiple detailed sections', 'Resources', 'Conclusion'],
    template: `# The Ultimate Guide to {TOPIC}: Everything You Need to Know in {YEAR}

## Table of Contents

1. [Introduction](#introduction)
2. [What is {TOPIC}?](#what-is-topic)
3. [Getting Started](#getting-started)
4. [Advanced Strategies](#advanced-strategies)
5. [Tools and Resources](#tools-and-resources)
6. [Common Mistakes](#common-mistakes)
7. [Future Trends](#future-trends)
8. [Conclusion](#conclusion)

## Introduction

{INTRODUCTION_PARAGRAPH}

This comprehensive guide covers:
- {COVERAGE_POINT_1}
- {COVERAGE_POINT_2}
- {COVERAGE_POINT_3}

## What is {TOPIC}?

{DEFINITION_PARAGRAPH}

### Key Components

1. **{COMPONENT_1}**: {COMPONENT_1_DESCRIPTION}
2. **{COMPONENT_2}**: {COMPONENT_2_DESCRIPTION}
3. **{COMPONENT_3}**: {COMPONENT_3_DESCRIPTION}

## Getting Started

### Step 1: {GETTING_STARTED_STEP_1}

{STEP_1_DETAILS}

### Step 2: {GETTING_STARTED_STEP_2}

{STEP_2_DETAILS}

## Advanced Strategies

{ADVANCED_CONTENT}

## Tools and Resources

### Recommended Tools

- **{TOOL_1}**: {TOOL_1_DESCRIPTION}
- **{TOOL_2}**: {TOOL_2_DESCRIPTION}
- **{TOOL_3}**: {TOOL_3_DESCRIPTION}

## Conclusion

{CONCLUSION_PARAGRAPH}`,
    variables: ['TOPIC', 'YEAR', 'INTRODUCTION_PARAGRAPH', 'COVERAGE_POINT_1', 'COVERAGE_POINT_2', 'COVERAGE_POINT_3', 'DEFINITION_PARAGRAPH', 'COMPONENT_1', 'COMPONENT_1_DESCRIPTION', 'COMPONENT_2', 'COMPONENT_2_DESCRIPTION', 'COMPONENT_3', 'COMPONENT_3_DESCRIPTION', 'GETTING_STARTED_STEP_1', 'STEP_1_DETAILS', 'GETTING_STARTED_STEP_2', 'STEP_2_DETAILS', 'ADVANCED_CONTENT', 'TOOL_1', 'TOOL_1_DESCRIPTION', 'TOOL_2', 'TOOL_2_DESCRIPTION', 'TOOL_3', 'TOOL_3_DESCRIPTION', 'CONCLUSION_PARAGRAPH']
  }
];

export function ContentTemplatesLibrary({ onSelectTemplate, onPreviewTemplate }: ContentTemplatesLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Categories', icon: FileText },
    { value: 'blog', label: 'Blog Posts', icon: BookOpen },
    { value: 'guide', label: 'Guides', icon: BookOpen },
    { value: 'product', label: 'Product', icon: BarChart3 },
    { value: 'landing', label: 'Landing Pages', icon: Target },
    { value: 'social', label: 'Social Media', icon: Users },
    { value: 'email', label: 'Email', icon: FileText }
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    const Icon = categoryData?.icon || FileText;
    return <Icon className="h-4 w-4" />;
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
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Templates</h2>
        <p className="text-muted-foreground">
          Choose from professionally crafted templates to jumpstart your content creation
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          {difficulties.map(difficulty => (
            <option key={difficulty.value} value={difficulty.value}>
              {difficulty.label}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(template.category)}
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                </div>
                {template.popular && (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {template.estimatedTime}
                </Badge>
                {template.seoOptimized && (
                  <Badge variant="outline">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    SEO Optimized
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div>Word count: {template.wordCount.min}-{template.wordCount.max}</div>
                <div>Sections: {template.structure.length}</div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Structure:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {template.structure.slice(0, 3).map((section, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full mr-2" />
                      {section}
                    </li>
                  ))}
                  {template.structure.length > 3 && (
                    <li className="text-xs">+{template.structure.length - 3} more sections</li>
                  )}
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => onSelectTemplate?.(template)}
                  className="flex-1"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Use Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreviewTemplate?.(template)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse all templates.
          </p>
        </div>
      )}
    </div>
  );
}
