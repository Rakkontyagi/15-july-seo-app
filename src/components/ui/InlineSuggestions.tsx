
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Lightbulb, X, Check, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { generateA11yId, ScreenReader, AriaAttributes, KeyboardNavigation } from '@/lib/accessibility/a11y-utils';

export interface Suggestion {
  id: string;
  type: 'keyword' | 'readability' | 'seo' | 'structure' | 'engagement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  position?: {
    start: number;
    end: number;
  };
  autoFix?: boolean;
  confidence: number; // 0-100
}

interface InlineSuggestionsProps {
  content: string;
  targetKeywords?: string[];
  suggestions?: string[]; // Legacy support
  onApplySuggestion?: (suggestionId: string, content: string) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
  className?: string;
}

const InlineSuggestions: React.FC<InlineSuggestionsProps> = ({
  content = '',
  targetKeywords = [],
  suggestions: legacySuggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
  className,
}) => {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const componentId = useMemo(() => generateA11yId('suggestions'), []);

  // Generate intelligent suggestions based on content analysis
  const suggestions = useMemo(() => {
    // If legacy suggestions provided, convert them
    if (legacySuggestions.length > 0) {
      return legacySuggestions.map((suggestion, index) => ({
        id: `legacy-${index}`,
        type: 'seo' as const,
        severity: 'medium' as const,
        title: 'SEO Suggestion',
        description: suggestion,
        suggestion: suggestion,
        autoFix: false,
        confidence: 75
      }));
    }

    if (!content) return [];

    const generatedSuggestions: Suggestion[] = [];
    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Keyword density suggestions
    targetKeywords.forEach((keyword, index) => {
      const keywordCount = words.filter(word =>
        word.includes(keyword.toLowerCase())
      ).length;
      const density = words.length > 0 ? (keywordCount / words.length) * 100 : 0;

      if (density < 0.5) {
        generatedSuggestions.push({
          id: `keyword-low-${index}`,
          type: 'keyword',
          severity: 'medium',
          title: `Low keyword density for "${keyword}"`,
          description: `Current density: ${density.toFixed(2)}%. Recommended: 0.5-2%`,
          suggestion: `Consider adding "${keyword}" naturally in 2-3 more places throughout your content.`,
          autoFix: false,
          confidence: 85
        });
      } else if (density > 3) {
        generatedSuggestions.push({
          id: `keyword-high-${index}`,
          type: 'keyword',
          severity: 'high',
          title: `High keyword density for "${keyword}"`,
          description: `Current density: ${density.toFixed(2)}%. This may be considered keyword stuffing.`,
          suggestion: `Reduce usage of "${keyword}" and use synonyms or related terms instead.`,
          autoFix: false,
          confidence: 90
        });
      }
    });

    // Readability suggestions
    if (sentences.length > 0) {
      const avgWordsPerSentence = words.length / sentences.length;
      if (avgWordsPerSentence > 20) {
        generatedSuggestions.push({
          id: 'readability-long-sentences',
          type: 'readability',
          severity: 'medium',
          title: 'Long sentences detected',
          description: `Average sentence length: ${avgWordsPerSentence.toFixed(1)} words. Recommended: 15-20 words.`,
          suggestion: 'Break down long sentences into shorter, more digestible ones for better readability.',
          autoFix: false,
          confidence: 80
        });
      }
    }

    // Structure suggestions
    const headingMatches = content.match(/^#{1,6}\s+.+$/gm);
    if (!headingMatches || headingMatches.length === 0) {
      generatedSuggestions.push({
        id: 'structure-no-headings',
        type: 'structure',
        severity: 'high',
        title: 'No headings found',
        description: 'Content lacks proper heading structure.',
        suggestion: 'Add H2 and H3 headings to break up your content and improve SEO.',
        autoFix: false,
        confidence: 95
      });
    }

    // Engagement suggestions
    const questionMarks = (content.match(/\?/g) || []).length;
    if (questionMarks === 0 && words.length > 100) {
      generatedSuggestions.push({
        id: 'engagement-no-questions',
        type: 'engagement',
        severity: 'low',
        title: 'Consider adding questions',
        description: 'Questions can increase reader engagement.',
        suggestion: 'Add 1-2 rhetorical or direct questions to engage your readers.',
        autoFix: false,
        confidence: 70
      });
    }

    // SEO suggestions
    if (words.length < 300) {
      generatedSuggestions.push({
        id: 'seo-short-content',
        type: 'seo',
        severity: 'medium',
        title: 'Content is too short',
        description: `Current word count: ${words.length}. Recommended: 300+ words.`,
        suggestion: 'Expand your content with more detailed information, examples, or explanations.',
        autoFix: false,
        confidence: 85
      });
    }

    return generatedSuggestions;
  }, [content, targetKeywords, legacySuggestions]);

  const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id));

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };
  // Setup keyboard navigation
  useEffect(() => {
    if (!containerRef.current) return;

    const cleanup = KeyboardNavigation.handleArrowNavigation(
      containerRef.current,
      '[role="button"][tabindex="0"]',
      'vertical'
    );

    return cleanup;
  }, [activeSuggestions.length]);

  // Announce suggestion changes to screen readers
  useEffect(() => {
    if (activeSuggestions.length > 0) {
      const message = `${activeSuggestions.length} optimization suggestion${activeSuggestions.length === 1 ? '' : 's'} available`;
      ScreenReader.announceChange(message, 'polite');
    }
  }, [activeSuggestions.length]);

  const handleApplySuggestion = (suggestion: Suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion.id, content);
    }
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
    ScreenReader.announceChange(`Applied suggestion: ${suggestion.title}`, 'assertive');
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    const suggestion = activeSuggestions.find(s => s.id === suggestionId);
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    if (onDismissSuggestion) {
      onDismissSuggestion(suggestionId);
    }
    if (suggestion) {
      ScreenReader.announceChange(`Dismissed suggestion: ${suggestion.title}`, 'polite');
    }
  };

  const handleSuggestionToggle = (suggestionId: string) => {
    const newSelected = selectedSuggestion === suggestionId ? null : suggestionId;
    setSelectedSuggestion(newSelected);

    if (newSelected) {
      const suggestion = activeSuggestions.find(s => s.id === suggestionId);
      if (suggestion) {
        ScreenReader.announceChange(`Expanded suggestion: ${suggestion.title}`, 'polite');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, suggestionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSuggestionToggle(suggestionId);
    }
  };

  if (activeSuggestions.length === 0) {
    return (
      <div
        className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-green-600">
          <Check className="h-5 w-5" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Great job!</h3>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          No optimization suggestions at the moment. Your content looks good!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}
      role="region"
      aria-labelledby={`${componentId}-heading`}
      aria-describedby={`${componentId}-description`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" aria-hidden="true" />
        <h3 id={`${componentId}-heading`} className="text-lg font-semibold">
          Optimization Suggestions
        </h3>
        <span
          className="text-sm text-gray-500"
          aria-label={`${activeSuggestions.length} suggestions available`}
        >
          ({activeSuggestions.length})
        </span>
      </div>

      <div
        id={`${componentId}-description`}
        className="sr-only"
      >
        Content optimization suggestions to improve SEO and readability. Use arrow keys to navigate, Enter or Space to expand details.
      </div>

      <div
        className="space-y-3 max-h-96 overflow-y-auto"
        role="list"
        aria-label="Optimization suggestions"
      >
        {activeSuggestions.map((suggestion, index) => {
          const isExpanded = selectedSuggestion === suggestion.id;
          const suggestionId = `${componentId}-suggestion-${suggestion.id}`;
          const detailsId = `${componentId}-details-${suggestion.id}`;

          return (
            <div
              key={suggestion.id}
              ref={(el) => {
                if (el) suggestionRefs.current.set(suggestion.id, el);
              }}
              className={`p-3 border rounded-lg transition-all ${getSeverityColor(suggestion.severity)} ${
                isExpanded ? 'ring-2 ring-blue-300' : ''
              }`}
              role="listitem"
            >
              <div
                role="button"
                tabIndex={0}
                className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                onClick={() => handleSuggestionToggle(suggestion.id)}
                onKeyDown={(e) => handleKeyDown(e, suggestion.id)}
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                aria-describedby={suggestionId}
                aria-label={`${suggestion.title}. Severity: ${suggestion.severity}. ${isExpanded ? 'Expanded' : 'Collapsed'}. Press Enter or Space to ${isExpanded ? 'collapse' : 'expand'}.`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div aria-hidden="true">
                      {getSeverityIcon(suggestion.severity)}
                    </div>
                    <div className="flex-1">
                      <h4
                        id={suggestionId}
                        className="text-sm font-medium text-gray-900"
                      >
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {suggestion.description}
                      </p>

                      {isExpanded && (
                        <div
                          id={detailsId}
                          className="mt-3 p-3 bg-white rounded border"
                          role="region"
                          aria-label="Suggestion details"
                        >
                          <p className="text-sm text-gray-700 mb-3">
                            {suggestion.suggestion}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Confidence: {suggestion.confidence}%
                            </span>
                            <div className="flex gap-2">
                              {suggestion.autoFix && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplySuggestion(suggestion);
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  aria-label={`Apply automatic fix for ${suggestion.title}`}
                                >
                                  Apply Fix
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDismissSuggestion(suggestion.id);
                                }}
                                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                                aria-label={`Dismiss ${suggestion.title} suggestion`}
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissSuggestion(suggestion.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                    aria-label={`Dismiss ${suggestion.title} suggestion`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestion Types</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-yellow-500" />
            <span>Keyword Optimization</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            <span>SEO Improvements</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            <span>Readability</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-3 w-3 text-green-500" />
            <span>Engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineSuggestions;
