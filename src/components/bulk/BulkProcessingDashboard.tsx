/**
 * Bulk Processing Dashboard Component
 * Implements NFR13: 50 pages simultaneously processing
 * Provides UI for bulk content generation with real-time progress tracking
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Download, 
  Settings, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

interface BulkProcessingItem {
  keyword: string;
  location?: string;
  language: string;
  contentType: 'blog' | 'product' | 'service' | 'landing';
  wordCount: number;
}

interface ProcessingProgress {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemainingMs: number;
  throughputPerSecond: number;
}

interface ProcessingResult {
  success: boolean;
  data?: {
    totalItems: number;
    successCount: number;
    failureCount: number;
    processingTimeMs: number;
    results: any[];
    errors: any[];
    performance: {
      averageProcessingTimeMs: number;
      throughputPerSecond: number;
      memoryUsageMB: number;
      concurrencyUtilization: number;
    };
  };
  error?: string;
}

export default function BulkProcessingDashboard() {
  const [items, setItems] = useState<BulkProcessingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [config, setConfig] = useState({
    maxConcurrency: 25,
    batchSize: 10,
    retryAttempts: 3,
    timeoutMs: 300000,
  });

  // Add single item
  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      keyword: '',
      location: '',
      language: 'en',
      contentType: 'blog',
      wordCount: 1500,
    }]);
  }, []);

  // Remove item
  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update item
  const updateItem = useCallback((index: number, field: keyof BulkProcessingItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  // Import from CSV
  const importFromCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').slice(1); // Skip header
      const newItems: BulkProcessingItem[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [keyword, location, language, contentType, wordCount] = line.split(',');
          return {
            keyword: keyword?.trim() || '',
            location: location?.trim() || '',
            language: language?.trim() || 'en',
            contentType: (contentType?.trim() as any) || 'blog',
            wordCount: parseInt(wordCount?.trim()) || 1500,
          };
        });
      setItems(prev => [...prev, ...newItems]);
    };
    reader.readAsText(file);
  }, []);

  // Start bulk processing
  const startProcessing = useCallback(async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProgress(null);
    setResult(null);

    try {
      const response = await fetch('/api/content/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'demo-key',
        },
        body: JSON.stringify({
          items,
          config,
          userId: 'current-user',
          projectId: 'current-project',
        }),
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [items, config]);

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Content Generation</h1>
          <p className="text-muted-foreground">
            Process up to 100 content pieces simultaneously with advanced parallel processing
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          50+ Concurrent Operations
        </Badge>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Content Items ({items.length})
              </CardTitle>
              <CardDescription>
                Add content generation requests manually or import from CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import Controls */}
              <div className="flex gap-2">
                <Button onClick={addItem} variant="outline">
                  Add Item
                </Button>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={importFromCSV}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline">
                    Import CSV
                  </Button>
                </div>
                <Button 
                  onClick={startProcessing}
                  disabled={items.length === 0 || isProcessing}
                  className="ml-auto"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Processing
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Keyword"
                      value={item.keyword}
                      onChange={(e) => updateItem(index, 'keyword', e.target.value)}
                    />
                    <Input
                      placeholder="Location"
                      value={item.location}
                      onChange={(e) => updateItem(index, 'location', e.target.value)}
                    />
                    <select
                      value={item.language}
                      onChange={(e) => updateItem(index, 'language', e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                    <select
                      value={item.contentType}
                      onChange={(e) => updateItem(index, 'contentType', e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="blog">Blog</option>
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                      <option value="landing">Landing</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Words"
                      value={item.wordCount}
                      onChange={(e) => updateItem(index, 'wordCount', parseInt(e.target.value))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Click "Add Item" or "Import CSV" to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Processing Configuration
              </CardTitle>
              <CardDescription>
                Optimize performance settings for your bulk processing needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxConcurrency">Max Concurrency</Label>
                  <Input
                    id="maxConcurrency"
                    type="number"
                    min="1"
                    max="50"
                    value={config.maxConcurrency}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      maxConcurrency: parseInt(e.target.value) 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum parallel operations (1-50)
                  </p>
                </div>
                <div>
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    min="1"
                    max="20"
                    value={config.batchSize}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      batchSize: parseInt(e.target.value) 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Items per batch (1-20)
                  </p>
                </div>
                <div>
                  <Label htmlFor="retryAttempts">Retry Attempts</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    min="0"
                    max="5"
                    value={config.retryAttempts}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      retryAttempts: parseInt(e.target.value) 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Retry failed items (0-5)
                  </p>
                </div>
                <div>
                  <Label htmlFor="timeoutMs">Timeout (minutes)</Label>
                  <Input
                    id="timeoutMs"
                    type="number"
                    min="1"
                    max="10"
                    value={config.timeoutMs / 60000}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      timeoutMs: parseInt(e.target.value) * 60000 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Per-item timeout (1-10 minutes)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Processing Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing && progress && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{progress.completedItems} / {progress.totalItems}</span>
                    </div>
                    <Progress 
                      value={(progress.completedItems / progress.totalItems) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Completed: {progress.completedItems}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Failed: {progress.failedItems}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">
                        ETA: {formatTime(progress.estimatedTimeRemainingMs)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">
                        {progress.throughputPerSecond.toFixed(1)}/sec
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Batch {progress.currentBatch} of {progress.totalBatches}
                  </div>
                </>
              )}

              {!isProcessing && !progress && (
                <div className="text-center py-8 text-muted-foreground">
                  Start processing to see real-time progress
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Processing Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result && (
                <>
                  {result.success && result.data ? (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {result.data.successCount}
                          </div>
                          <div className="text-sm text-muted-foreground">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {result.data.failureCount}
                          </div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatTime(result.data.processingTimeMs)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {result.data.performance.throughputPerSecond.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">Items/sec</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Performance Metrics</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            Average Processing Time: {formatTime(result.data.performance.averageProcessingTimeMs)}
                          </div>
                          <div>
                            Memory Usage: {result.data.performance.memoryUsageMB.toFixed(1)} MB
                          </div>
                          <div>
                            Concurrency Utilization: {result.data.performance.concurrencyUtilization.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {result.data.errors.length > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {result.data.errors.length} items failed processing. 
                            Check the detailed error log for more information.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Processing failed: {result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {!result && (
                <div className="text-center py-8 text-muted-foreground">
                  Results will appear here after processing completes
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
