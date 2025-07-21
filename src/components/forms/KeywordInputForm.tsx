'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  Target, 
  Lightbulb,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cpc: number;
  trend: 'up' | 'down' | 'stable';
}

interface KeywordInputFormProps {
  value: string;
  onChange: (keyword: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
}

export function KeywordInputForm({ 
  value, 
  onChange, 
  placeholder = "Enter your target keyword...",
  showSuggestions = true 
}: KeywordInputFormProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [keywordAnalysis, setKeywordAnalysis] = useState<{
    difficulty: 'easy' | 'medium' | 'hard';
    searchVolume: number;
    competition: number;
    opportunity: number;
  } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Mock keyword suggestions - in real app, this would come from an API
  const mockSuggestions: KeywordSuggestion[] = [
    {
      keyword: 'seo optimization',
      searchVolume: 12000,
      difficulty: 'medium',
      cpc: 2.45,
      trend: 'up'
    },
    {
      keyword: 'seo best practices',
      searchVolume: 8500,
      difficulty: 'easy',
      cpc: 1.89,
      trend: 'stable'
    },
    {
      keyword: 'search engine optimization guide',
      searchVolume: 15000,
      difficulty: 'hard',
      cpc: 3.21,
      trend: 'up'
    },
    {
      keyword: 'seo tools',
      searchVolume: 22000,
      difficulty: 'hard',
      cpc: 4.56,
      trend: 'up'
    },
    {
      keyword: 'on page seo',
      searchVolume: 9800,
      difficulty: 'medium',
      cpc: 2.12,
      trend: 'stable'
    }
  ];

  useEffect(() => {
    if (value && value.length > 2) {
      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounce
      debounceRef.current = setTimeout(() => {
        analyzeKeyword(value);
        if (showSuggestions) {
          fetchSuggestions(value);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setKeywordAnalysis(null);
      setShowSuggestionPanel(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, showSuggestions]);

  const analyzeKeyword = async (keyword: string) => {
    setIsAnalyzing(true);
    
    // Mock analysis - in real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setKeywordAnalysis({
      difficulty: keyword.length > 15 ? 'hard' : keyword.length > 8 ? 'medium' : 'easy',
      searchVolume: Math.floor(Math.random() * 50000) + 1000,
      competition: Math.floor(Math.random() * 100),
      opportunity: Math.floor(Math.random() * 100)
    });
    
    setIsAnalyzing(false);
  };

  const fetchSuggestions = async (keyword: string) => {
    // Mock API call - filter suggestions based on input
    const filtered = mockSuggestions.filter(s => 
      s.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(s.keyword.toLowerCase())
    );
    
    setSuggestions(filtered);
    setShowSuggestionPanel(filtered.length > 0);
  };

  const handleSuggestionSelect = (suggestion: KeywordSuggestion) => {
    onChange(suggestion.keyword);
    setShowSuggestionPanel(false);
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      case 'stable': return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Target Keyword *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestionPanel(true)}
          />
          {isAnalyzing && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Keyword Analysis */}
      {keywordAnalysis && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Keyword Analysis
              </h4>
              <Badge className={getDifficultyColor(keywordAnalysis.difficulty)}>
                {keywordAnalysis.difficulty} difficulty
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Search Volume</div>
                <div className="font-medium">{keywordAnalysis.searchVolume.toLocaleString()}/mo</div>
              </div>
              <div>
                <div className="text-muted-foreground">Competition</div>
                <div className="font-medium">{keywordAnalysis.competition}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Opportunity</div>
                <div className="font-medium">{keywordAnalysis.opportunity}%</div>
              </div>
            </div>
            
            {keywordAnalysis.opportunity > 70 && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center text-sm text-green-800">
                  <Check className="h-4 w-4 mr-2" />
                  Great keyword choice! High opportunity with manageable competition.
                </div>
              </div>
            )}
            
            {keywordAnalysis.difficulty === 'hard' && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  This keyword has high competition. Consider long-tail variations.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keyword Suggestions */}
      {showSuggestionPanel && suggestions.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Related Keywords
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestionPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{suggestion.keyword}</div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.searchVolume.toLocaleString()} searches/mo • ${suggestion.cpc} CPC
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(suggestion.trend)}
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(suggestion.difficulty)}
                    >
                      {suggestion.difficulty}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
