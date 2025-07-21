'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Search, 
  FileText, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  Eye
} from 'lucide-react';

interface GenerationStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number;
  estimatedTime: number;
  actualTime?: number;
  details?: string[];
}

interface RealTimeProgressProps {
  progress: number;
  currentStage: string;
  isGenerating: boolean;
  onCancel?: () => void;
}

const generationStages: GenerationStage[] = [
  {
    id: 'analysis',
    name: 'Keyword Analysis',
    description: 'Analyzing keyword difficulty and search intent',
    icon: <Search className="h-4 w-4" />,
    status: 'pending',
    progress: 0,
    estimatedTime: 15,
    details: ['Checking search volume', 'Analyzing competition', 'Identifying intent']
  },
  {
    id: 'research',
    name: 'Content Research',
    description: 'Gathering relevant information and sources',
    icon: <Brain className="h-4 w-4" />,
    status: 'pending',
    progress: 0,
    estimatedTime: 30,
    details: ['Competitor analysis', 'Topic research', 'Source validation']
  },
  {
    id: 'outline',
    name: 'Content Outline',
    description: 'Creating structured content outline',
    icon: <FileText className="h-4 w-4" />,
    status: 'pending',
    progress: 0,
    estimatedTime: 20,
    details: ['Heading structure', 'Content flow', 'SEO optimization']
  },
  {
    id: 'generation',
    name: 'Content Generation',
    description: 'Writing high-quality, SEO-optimized content',
    icon: <Zap className="h-4 w-4" />,
    status: 'pending',
    progress: 0,
    estimatedTime: 60,
    details: ['Introduction writing', 'Body content', 'Conclusion crafting']
  },
  {
    id: 'optimization',
    name: 'SEO Optimization',
    description: 'Optimizing content for search engines',
    icon: <Target className="h-4 w-4" />,
    status: 'pending',
    progress: 0,
    estimatedTime: 25,
    details: ['Keyword integration', 'Meta optimization', 'Schema markup']
  },
  {
    id: 'quality',
    name: 'Quality Check',
    description: 'Performing final quality and readability checks',
    icon: <Eye className="h-4 w-4" />,
    status: 'pending',
    progress: 0,
    estimatedTime: 15,
    details: ['Grammar check', 'Readability score', 'Fact verification']
  }
];

export function RealTimeProgress({ 
  progress, 
  currentStage, 
  isGenerating,
  onCancel 
}: RealTimeProgressProps) {
  const [stages, setStages] = useState<GenerationStage[]>(generationStages);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isGenerating, startTime]);

  useEffect(() => {
    setStages(prevStages => 
      prevStages.map(stage => {
        if (stage.id === currentStage) {
          return { ...stage, status: 'active' as const, progress };
        } else if (prevStages.findIndex(s => s.id === stage.id) < prevStages.findIndex(s => s.id === currentStage)) {
          return { ...stage, status: 'completed' as const, progress: 100 };
        } else {
          return { ...stage, status: 'pending' as const, progress: 0 };
        }
      })
    );
  }, [currentStage, progress]);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: GenerationStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'active':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const totalEstimatedTime = stages.reduce((sum, stage) => sum + stage.estimatedTime, 0);
  const completedStages = stages.filter(stage => stage.status === 'completed').length;
  const overallProgress = (completedStages / stages.length) * 100 + (progress / stages.length);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Content Generation Progress</h3>
              <p className="text-sm text-muted-foreground">
                {isGenerating ? 'Generating your content...' : 'Ready to start'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
          
          <Progress value={overallProgress} className="h-2 mb-4" />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Stage {completedStages + 1} of {stages.length}</span>
            <span>Est. {Math.round(totalEstimatedTime / 60)} minutes total</span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stage Progress */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Generation Stages</h4>
          
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(stage.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-sm font-medium">{stage.name}</h5>
                    <Badge 
                      variant={
                        stage.status === 'completed' ? 'default' :
                        stage.status === 'active' ? 'secondary' :
                        stage.status === 'error' ? 'destructive' : 'outline'
                      }
                    >
                      {stage.status === 'active' ? `${stage.progress}%` : stage.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {stage.description}
                  </p>
                  
                  {stage.status === 'active' && (
                    <div className="space-y-2">
                      <Progress value={stage.progress} className="h-1" />
                      {stage.details && (
                        <div className="text-xs text-muted-foreground">
                          Current: {stage.details[Math.floor((stage.progress / 100) * stage.details.length)] || stage.details[0]}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {stage.status === 'completed' && stage.actualTime && (
                    <div className="text-xs text-green-600">
                      Completed in {Math.round(stage.actualTime / 1000)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Real-time Metrics
            </h4>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{Math.round(overallProgress)}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{formatTime(elapsedTime)}</div>
                <div className="text-xs text-muted-foreground">Elapsed</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {Math.round((totalEstimatedTime * 1000 - elapsedTime) / 1000 / 60)}m
                </div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
