
import { EventEmitter } from 'events';

export interface WorkflowStep {
  id: string;
  name: string;
  execute: (context: WorkflowContext) => Promise<WorkflowStepResult>;
  retryable: boolean;
  timeout?: number;
}

export interface WorkflowContext {
  contentId: string;
  contentType?: string;
  metadata: Record<string, any>;
  stepResults: Record<string, any>;
  startTime: Date;
}

export interface WorkflowStepResult {
  success: boolean;
  data?: any;
  error?: Error;
  nextStep?: string;
}

export interface WorkflowConfig {
  maxRetries: number;
  stepTimeout: number;
  enableParallelExecution: boolean;
}

export class WorkflowOrchestrator {
  private events: EventEmitter;
  private steps: Map<string, WorkflowStep>;
  private activeWorkflows: Map<string, WorkflowContext>;
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig = {
    maxRetries: 3,
    stepTimeout: 30000,
    enableParallelExecution: false
  }) {
    this.events = new EventEmitter();
    this.steps = new Map();
    this.activeWorkflows = new Map();
    this.config = config;
    this.setupEventHandlers();
    this.registerDefaultSteps();
  }

  private setupEventHandlers(): void {
    this.events.on('startAnalysis', this.handleStartAnalysis.bind(this));
    this.events.on('stepComplete', this.handleStepComplete.bind(this));
    this.events.on('stepFailed', this.handleStepFailed.bind(this));
    this.events.on('workflowComplete', this.handleWorkflowComplete.bind(this));
    this.events.on('workflowFailed', this.handleWorkflowFailed.bind(this));
  }

  private registerDefaultSteps(): void {
    // Analysis step
    this.registerStep({
      id: 'analysis',
      name: 'Content Analysis',
      retryable: true,
      timeout: 30000,
      execute: async (context: WorkflowContext) => {
        try {
          const response = await fetch('/api/content-analysis/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId: context.contentId,
              contentType: context.contentType,
              priority: 'medium'
            })
          });

          if (!response.ok) {
            throw new Error(`Analysis API returned ${response.status}`);
          }

          const result = await response.json();
          return { success: true, data: result, nextStep: 'validation' };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      }
    });

    // Validation step
    this.registerStep({
      id: 'validation',
      name: 'Result Validation',
      retryable: false,
      execute: async (context: WorkflowContext) => {
        const analysisResult = context.stepResults.analysis;
        if (!analysisResult || !analysisResult.analysisId) {
          return { success: false, error: new Error('Invalid analysis result') };
        }
        return { success: true, data: { validated: true }, nextStep: 'notification' };
      }
    });

    // Notification step
    this.registerStep({
      id: 'notification',
      name: 'Send Notifications',
      retryable: true,
      execute: async (context: WorkflowContext) => {
        // Send notifications to interested parties
        console.log(`Sending notifications for content ${context.contentId}`);
        return { success: true, data: { notificationsSent: true } };
      }
    });
  }

  public registerStep(step: WorkflowStep): void {
    this.steps.set(step.id, step);
  }

  private async handleStartAnalysis(contentId: string, contentType?: string): Promise<void> {
    console.log(`Workflow: Starting analysis for content ID: ${contentId}`);
    
    const context: WorkflowContext = {
      contentId,
      contentType,
      metadata: {},
      stepResults: {},
      startTime: new Date()
    };

    this.activeWorkflows.set(contentId, context);
    await this.executeStep('analysis', context);
  }

  private async executeStep(stepId: string, context: WorkflowContext, retryCount = 0): Promise<void> {
    const step = this.steps.get(stepId);
    if (!step) {
      this.events.emit('workflowFailed', context.contentId, new Error(`Step ${stepId} not found`));
      return;
    }

    try {
      console.log(`Executing step: ${step.name} for content ${context.contentId}`);
      
      const timeoutPromise = step.timeout 
        ? new Promise<WorkflowStepResult>((_, reject) => 
            setTimeout(() => reject(new Error(`Step ${stepId} timed out`)), step.timeout)
          )
        : null;

      const stepPromise = step.execute(context);
      const result = timeoutPromise 
        ? await Promise.race([stepPromise, timeoutPromise])
        : await stepPromise;

      if (result.success) {
        context.stepResults[stepId] = result.data;
        this.events.emit('stepComplete', context.contentId, stepId, result);
        
        if (result.nextStep) {
          await this.executeStep(result.nextStep, context);
        } else {
          this.events.emit('workflowComplete', context.contentId, context);
        }
      } else {
        this.events.emit('stepFailed', context.contentId, stepId, result.error, retryCount);
      }
    } catch (error) {
      this.events.emit('stepFailed', context.contentId, stepId, error, retryCount);
    }
  }

  private async handleStepComplete(contentId: string, stepId: string, result: WorkflowStepResult): Promise<void> {
    console.log(`Workflow: Step ${stepId} completed for content ${contentId}`);
  }

  private async handleStepFailed(contentId: string, stepId: string, error: Error, retryCount: number): Promise<void> {
    console.error(`Workflow: Step ${stepId} failed for content ${contentId}:`, error.message);
    
    const step = this.steps.get(stepId);
    const context = this.activeWorkflows.get(contentId);
    
    if (step?.retryable && retryCount < this.config.maxRetries && context) {
      console.log(`Retrying step ${stepId} for content ${contentId} (attempt ${retryCount + 1})`);
      setTimeout(() => this.executeStep(stepId, context, retryCount + 1), 1000 * (retryCount + 1));
    } else {
      this.events.emit('workflowFailed', contentId, error);
    }
  }

  private handleWorkflowComplete(contentId: string, context: WorkflowContext): void {
    console.log(`Workflow: Analysis workflow completed for content ${contentId}`);
    const duration = Date.now() - context.startTime.getTime();
    console.log(`Total workflow duration: ${duration}ms`);
    this.activeWorkflows.delete(contentId);
  }

  private handleWorkflowFailed(contentId: string, error: Error): void {
    console.error(`Workflow: Analysis workflow failed for content ${contentId}:`, error.message);
    this.activeWorkflows.delete(contentId);
    // TODO: Implement failure notifications and cleanup
  }

  public startWorkflow(contentId: string, contentType?: string): void {
    this.events.emit('startAnalysis', contentId, contentType);
  }

  public getActiveWorkflows(): string[] {
    return Array.from(this.activeWorkflows.keys());
  }

  public getWorkflowStatus(contentId: string): WorkflowContext | undefined {
    return this.activeWorkflows.get(contentId);
  }
}
