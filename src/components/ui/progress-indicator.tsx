'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Progress } from './progress';
import { Button } from './button';
import { LoadingSpinner } from './loading';
import { useToast } from './toast';
import { X, Check, AlertCircle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  onCancel?: () => void;
  onComplete?: () => void;
  className?: string;
  showSteps?: boolean;
  compact?: boolean;
}

export function ProgressIndicator({
  steps,
  currentStep,
  onCancel,
  onComplete,
  className,
  showSteps = true,
  compact = false
}: ProgressIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { addToast } = useToast();

  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const hasErrors = steps.some(step => step.status === 'error');
  const isComplete = completedSteps === totalSteps && !hasErrors;
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const currentStepData = steps.find(step => step.id === currentStep);
  const activeStep = currentStepData || steps.find(step => step.status === 'in_progress');

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
      addToast({
        type: 'success',
        title: 'Process Complete',
        description: 'All steps completed successfully!'
      });
    }
  }, [isComplete, onComplete, addToast]);

  useEffect(() => {
    if (hasErrors) {
      const errorStep = steps.find(step => step.status === 'error');
      if (errorStep) {
        addToast({
          type: 'error',
          title: 'Process Error',
          description: errorStep.error || `Error in step: ${errorStep.name}`
        });
      }
    }
  }, [hasErrors, steps, addToast]);

  if (!isVisible) return null;

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-3 p-3 bg-muted rounded-lg', className)}>
        {activeStep && (
          <LoadingSpinner size="sm" className="text-primary" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {activeStep ? activeStep.name : isComplete ? 'Complete' : 'Ready'}
            </span>
            <span className="text-xs text-muted-foreground">
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-background border rounded-lg p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Progress</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {completedSteps}/{totalSteps} completed
          </span>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Overall Progress
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {showSteps && (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : step.status === 'error' ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                ) : step.status === 'in_progress' ? (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <LoadingSpinner size="sm" className="text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    'text-sm font-medium',
                    step.status === 'completed' ? 'text-green-600' : 
                    step.status === 'error' ? 'text-red-600' : 
                    step.status === 'in_progress' ? 'text-primary' : 
                    'text-muted-foreground'
                  )}>
                    {step.name}
                  </p>
                  {step.progress !== undefined && step.status === 'in_progress' && (
                    <span className="text-xs text-muted-foreground">
                      {step.progress}%
                    </span>
                  )}
                </div>
                
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
                
                {step.error && step.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    {step.error}
                  </p>
                )}
                
                {step.progress !== undefined && step.status === 'in_progress' && (
                  <Progress value={step.progress} className="h-1 mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Hook for managing progress state
export function useProgressIndicator() {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | undefined>();

  const updateStep = (stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  const startStep = (stepId: string) => {
    updateStep(stepId, { status: 'in_progress' });
    setCurrentStep(stepId);
  };

  const completeStep = (stepId: string) => {
    updateStep(stepId, { status: 'completed', progress: 100 });
  };

  const failStep = (stepId: string, error: string) => {
    updateStep(stepId, { status: 'error', error });
  };

  const resetSteps = () => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({ ...step, status: 'pending' as const, progress: undefined, error: undefined }))
    );
    setCurrentStep(undefined);
  };

  return {
    steps,
    setSteps,
    currentStep,
    setCurrentStep,
    updateStep,
    startStep,
    completeStep,
    failStep,
    resetSteps
  };
}