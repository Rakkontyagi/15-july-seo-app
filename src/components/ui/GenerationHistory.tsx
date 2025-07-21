'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  FileText, 
  Clock, 
  Target,
  TrendingUp,
  Eye,
  Download,
  Edit,
  Copy,
  Star,
  Trash2
} from 'lucide-react';

interface GenerationHistoryItem {
  id: string;
  title: string;
  keyword: string;
  contentType: string;
  status: 'completed' | 'draft' | 'failed';
  createdAt: string;
  wordCount: number;
  qualityScore: number;
  seoScore: number;
  readabilityScore: number;
  isFavorite: boolean;
  location: string;
  tone: string;
}

interface GenerationHistoryProps {
  limit?: number;
  showActions?: boolean;
}

const mockHistory: GenerationHistoryItem[] = [
  {
    id: '1',
    title: 'Complete Guide to SEO Optimization',
    keyword: 'seo optimization',
    contentType: 'comprehensive-guide',
    status: 'completed',
    createdAt: '2025-01-20T10:30:00Z',
    wordCount: 3200,
    qualityScore: 92,
    seoScore: 88,
    readabilityScore: 85,
    isFavorite: true,
    location: 'US',
    tone: 'professional'
  },
  {
    id: '2',
    title: 'Top 10 Digital Marketing Strategies',
    keyword: 'digital marketing strategies',
    contentType: 'listicle',
    status: 'completed',
    createdAt: '2025-01-20T09:15:00Z',
    wordCount: 1800,
    qualityScore: 89,
    seoScore: 91,
    readabilityScore: 92,
    isFavorite: false,
    location: 'US',
    tone: 'conversational'
  },
  {
    id: '3',
    title: 'Content Marketing vs Social Media Marketing',
    keyword: 'content marketing comparison',
    contentType: 'comparison',
    status: 'completed',
    createdAt: '2025-01-19T16:45:00Z',
    wordCount: 2400,
    qualityScore: 87,
    seoScore: 85,
    readabilityScore: 88,
    isFavorite: false,
    location: 'GB',
    tone: 'authoritative'
  }
];

export function GenerationHistory({ limit = 5, showActions = true }: GenerationHistoryProps) {
  const [history, setHistory] = useState<GenerationHistoryItem[]>(mockHistory);

  const displayedHistory = history.slice(0, limit);

  const handleToggleFavorite = (id: string) => {
    setHistory(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const getStatusColor = (status: GenerationHistoryItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'blog-post': 'Blog Post',
      'comprehensive-guide': 'Guide',
      'listicle': 'Listicle',
      'faq': 'FAQ',
      'comparison': 'Comparison',
      'case-study': 'Case Study'
    };
    return labels[type] || type;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Recent Generations
          </span>
          {history.length > limit && (
            <Button variant="outline" size="sm">
              View All ({history.length})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedHistory.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No content generated yet</h3>
            <p className="text-muted-foreground">
              Start by creating your first piece of content above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                    {item.isFavorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      {item.keyword}
                    </span>
                    <span>{getContentTypeLabel(item.contentType)}</span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(item.status)}
                    >
                      {item.status}
                    </Badge>
                    
                    {item.status === 'completed' && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {item.wordCount} words
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          Quality: {item.qualityScore}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {showActions && (
                  <div className="flex items-center space-x-1 ml-4">
                    {item.status === 'completed' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(item.id)}
                        >
                          <Star className={`h-4 w-4 ${item.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {item.status === 'draft' && (
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {item.status === 'failed' && (
                      <Button variant="ghost" size="sm">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
