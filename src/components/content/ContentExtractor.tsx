/**
 * Content Extractor Component
 * Interface for extracting and analyzing content from URLs
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  FileText, 
  Image, 
  Link, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Settings,
  Download,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentExtractionResult {
  url: string;
  title?: string;
  description?: string;
  content: {
    plainText: string;
    markdown?: string;
    wordCount: number;
    characterCount: number;
  };
  headings?: {
    structure: any[];
    statistics: any;
    tableOfContents?: any;
  };
  textAnalysis?: {
    statistics: any;
    readability: any;
    sentiment: any;
    keywords: any;
    seo: any;
  };
  images?: {
    statistics: any;
    images: any[];
  };
  links?: {
    statistics: any;
    domains: any[];
    links: any[];
  };
  quality: {
    overall: number;
    seo: number;
    accessibility: number;
    readability: number;
    performance: number;
  };
  issues: any[];
  recommendations: string[];
  metadata: any;
}

interface ExtractionOptions {
  extractHeadings: boolean;
  analyzeText: boolean;
  processImages: boolean;
  analyzeLinks: boolean;
  onlyMainContent: boolean;
  removeAds: boolean;
  targetKeywords: string;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  extractHeadings: true,
  analyzeText: true,
  processImages: true,
  analyzeLinks: true,
  onlyMainContent: true,
  removeAds: true,
  targetKeywords: '',
};

export default function ContentExtractor() {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState<ExtractionOptions>(DEFAULT_OPTIONS);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ContentExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleExtract = useCallback(async () => {
    if (!url.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await fetch('/api/content/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          options: {
            analysisOptions: {
              extractHeadings: options.extractHeadings,
              analyzeText: options.analyzeText,
              processImages: options.processImages,
              analyzeLinks: options.analyzeLinks,
              targetKeywords: options.targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
            },
            firecrawlOptions: {
              onlyMainContent: options.onlyMainContent,
            },
            cleaningOptions: {
              removeAds: options.removeAds,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Extraction failed');
      }

      if (data.success) {
        setResult(data.data);
        toast({
          title: 'Success',
          description: 'Content extracted successfully',
        });
      } else {
        throw new Error(data.message || 'Extraction failed');
      }

    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setIsExtracting(false);
    }
  }, [url, options, toast]);

  const handleCopyContent = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    });
  }, [toast]);

  const handleDownloadContent = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Content Extraction
          </CardTitle>
          <CardDescription>
            Extract and analyze content from any webpage using advanced AI-powered tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isExtracting}
            />
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Label>Extraction Options</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="extractHeadings"
                  checked={options.extractHeadings}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, extractHeadings: checked }))}
                />
                <Label htmlFor="extractHeadings">Extract Headings</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="analyzeText"
                  checked={options.analyzeText}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, analyzeText: checked }))}
                />
                <Label htmlFor="analyzeText">Analyze Text</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="processImages"
                  checked={options.processImages}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, processImages: checked }))}
                />
                <Label htmlFor="processImages">Process Images</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="analyzeLinks"
                  checked={options.analyzeLinks}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, analyzeLinks: checked }))}
                />
                <Label htmlFor="analyzeLinks">Analyze Links</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="onlyMainContent"
                  checked={options.onlyMainContent}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, onlyMainContent: checked }))}
                />
                <Label htmlFor="onlyMainContent">Main Content Only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="removeAds"
                  checked={options.removeAds}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, removeAds: checked }))}
                />
                <Label htmlFor="removeAds">Remove Ads</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetKeywords">Target Keywords (comma-separated)</Label>
              <Input
                id="targetKeywords"
                placeholder="SEO, content marketing, optimization"
                value={options.targetKeywords}
                onChange={(e) => setOptions(prev => ({ ...prev, targetKeywords: e.target.value }))}
                disabled={isExtracting}
              />
            </div>
          </div>

          <Button 
            onClick={handleExtract} 
            disabled={isExtracting || !url.trim()}
            className="w-full"
          >
            {isExtracting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Extracting Content...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Extract Content
              </>
            )}
          </Button>

          {isExtracting && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Processing content... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Extraction Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Extraction Results</span>
                <Badge variant="outline">{result.url}</Badge>
              </CardTitle>
              {result.title && (
                <CardDescription className="text-lg font-medium">
                  {result.title}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {result.description && (
                <p className="text-muted-foreground mb-4">{result.description}</p>
              )}
              
              {/* Quality Scores */}
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getQualityColor(result.quality.overall)}`}>
                    {result.quality.overall}
                  </div>
                  <div className="text-sm text-muted-foreground">Overall</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getQualityColor(result.quality.seo)}`}>
                    {result.quality.seo}
                  </div>
                  <div className="text-sm text-muted-foreground">SEO</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getQualityColor(result.quality.accessibility)}`}>
                    {result.quality.accessibility}
                  </div>
                  <div className="text-sm text-muted-foreground">Accessibility</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getQualityColor(result.quality.readability)}`}>
                    {Math.round(result.quality.readability)}
                  </div>
                  <div className="text-sm text-muted-foreground">Readability</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getQualityColor(result.quality.performance)}`}>
                    {result.quality.performance}
                  </div>
                  <div className="text-sm text-muted-foreground">Performance</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Words:</span> {result.content.wordCount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Characters:</span> {result.content.characterCount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Issues:</span> {result.issues.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="content">
                <FileText className="h-4 w-4 mr-1" />
                Content
              </TabsTrigger>
              {result.headings && (
                <TabsTrigger value="headings">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Headings
                </TabsTrigger>
              )}
              {result.textAnalysis && (
                <TabsTrigger value="analysis">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analysis
                </TabsTrigger>
              )}
              {result.images && (
                <TabsTrigger value="images">
                  <Image className="h-4 w-4 mr-1" />
                  Images
                </TabsTrigger>
              )}
              {result.links && (
                <TabsTrigger value="links">
                  <Link className="h-4 w-4 mr-1" />
                  Links
                </TabsTrigger>
              )}
              <TabsTrigger value="recommendations">
                <CheckCircle className="h-4 w-4 mr-1" />
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Extracted Content
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyContent(result.content.plainText)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadContent(result.content.plainText, 'extracted-content.txt')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.content.plainText}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {result.headings && (
              <TabsContent value="headings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Heading Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold">{result.headings.statistics.totalHeadings}</div>
                        <div className="text-sm text-muted-foreground">Total Headings</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{result.headings.statistics.maxDepth}</div>
                        <div className="text-sm text-muted-foreground">Max Depth</div>
                      </div>
                      <div>
                        <Badge variant={result.headings.statistics.hasProperHierarchy ? "default" : "destructive"}>
                          {result.headings.statistics.hasProperHierarchy ? "Proper" : "Issues"}
                        </Badge>
                        <div className="text-sm text-muted-foreground">Hierarchy</div>
                      </div>
                    </div>
                    
                    {result.headings.tableOfContents && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Table of Contents</h4>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: result.headings.tableOfContents.html }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {result.textAnalysis && (
              <TabsContent value="analysis" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Readability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Flesch Reading Ease:</span>
                          <Badge variant={getQualityBadgeVariant(result.textAnalysis.readability.fleschReadingEase)}>
                            {Math.round(result.textAnalysis.readability.fleschReadingEase)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Grade Level:</span>
                          <span>{Math.round(result.textAnalysis.readability.fleschKincaidGrade)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reading Time:</span>
                          <span>{result.textAnalysis.readability.estimatedReadingTime} min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Overall:</span>
                          <Badge>{result.textAnalysis.sentiment.label}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span>{result.textAnalysis.sentiment.score.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span>{Math.round(result.textAnalysis.sentiment.confidence * 100)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {result.textAnalysis.keywords && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.textAnalysis.keywords.singleWords.slice(0, 10).map((keyword: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {keyword.word} ({keyword.frequency})
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {result.images && (
              <TabsContent value="images" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Image Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold">{result.images.statistics.totalImages}</div>
                        <div className="text-sm text-muted-foreground">Total Images</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{result.images.statistics.imagesWithoutAlt}</div>
                        <div className="text-sm text-muted-foreground">Missing Alt Text</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getQualityColor(result.images.statistics.seoScore)}`}>
                          {result.images.statistics.seoScore}
                        </div>
                        <div className="text-sm text-muted-foreground">SEO Score</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getQualityColor(result.images.statistics.accessibilityScore)}`}>
                          {result.images.statistics.accessibilityScore}
                        </div>
                        <div className="text-sm text-muted-foreground">Accessibility</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {result.links && (
              <TabsContent value="links" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Link Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold">{result.links.statistics.totalLinks}</div>
                        <div className="text-sm text-muted-foreground">Total Links</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{result.links.statistics.externalLinks}</div>
                        <div className="text-sm text-muted-foreground">External</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{result.links.statistics.brokenLinks}</div>
                        <div className="text-sm text-muted-foreground">Broken</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getQualityColor(result.links.statistics.seoScore)}`}>
                          {result.links.statistics.seoScore}
                        </div>
                        <div className="text-sm text-muted-foreground">SEO Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Issues & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.issues.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Issues Found</h4>
                      <div className="space-y-2">
                        {result.issues.map((issue, index) => (
                          <Alert key={index} variant={issue.severity === 'high' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="capitalize">{issue.type} - {issue.severity}</AlertTitle>
                            <AlertDescription>{issue.message}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {result.recommendations.map((recommendation, index) => (
                          <Alert key={index}>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>{recommendation}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.issues.length === 0 && result.recommendations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>No issues found! Your content looks great.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
