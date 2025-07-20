# ADR-007: Real-Time Communication Architecture

## Status
Accepted

## Context
The SEO automation application requires real-time communication for:
- Content generation progress tracking (30-300 seconds per generation)
- Live collaboration features (team editing, comments)
- System notifications (subscription updates, usage alerts)
- Performance monitoring (system health, error alerts)

We need to choose a real-time communication strategy that is scalable, reliable, and works well with our Next.js/Supabase architecture.

## Decision
We will implement **Server-Sent Events (SSE)** as our primary real-time communication method, with **Supabase Realtime** for database-driven updates.

### Primary: Server-Sent Events (SSE)
- **Use Case**: Content generation progress tracking, system notifications
- **Implementation**: Next.js API routes with SSE
- **Rationale**: 
  - Simpler than WebSockets for one-way communication
  - Automatic reconnection handling
  - Better performance for our use cases
  - No connection scaling issues
  - Works through firewalls and proxies

### Secondary: Supabase Realtime
- **Use Case**: Database-driven updates (comments, collaboration)
- **Implementation**: Supabase PostgreSQL triggers and realtime subscriptions
- **Rationale**:
  - Native integration with our database
  - Automatic scaling and connection management
  - Built-in authentication and authorization
  - Perfect for database change notifications

## Implementation Details

### Server-Sent Events Architecture
```typescript
// API Route: /api/content/[id]/progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  // Verify authentication
  const user = await authenticateRequest(request);
  if (!user || user.id !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', contentId: params.id })}\n\n`)
      );
      
      // Set up progress tracking
      const progressTracker = new ContentGenerationProgressTracker(params.id);
      
      progressTracker.on('progress', (progress) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`)
        );
      });
      
      progressTracker.on('complete', (result) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', ...result })}\n\n`)
        );
        controller.close();
      });
      
      progressTracker.on('error', (error) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
        );
        controller.close();
      });
      
      // Start tracking
      progressTracker.start();
    },
    
    cancel() {
      // Cleanup when client disconnects
      progressTracker.stop();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
```

### Client-Side SSE Implementation
```typescript
// Custom Hook for SSE
export function useContentGenerationProgress(contentId: string) {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!contentId) return;
    
    const eventSource = new EventSource(
      `/api/content/${contentId}/progress?userId=${user.id}`
    );
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            setIsConnected(true);
            break;
          case 'progress':
            setProgress(data);
            break;
          case 'complete':
            setProgress(data);
            eventSource.close();
            break;
          case 'error':
            setError(data.error);
            eventSource.close();
            break;
        }
      } catch (err) {
        setError('Failed to parse progress data');
      }
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost');
    };
    
    return () => {
      eventSource.close();
    };
  }, [contentId, user.id]);
  
  return { progress, isConnected, error };
}
```

### Supabase Realtime for Collaboration
```typescript
// Real-time collaboration setup
export function useCollaborationUpdates(projectId: string) {
  const supabase = useSupabaseClient();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  useEffect(() => {
    // Subscribe to collaborator presence
    const collaboratorChannel = supabase
      .channel(`project:${projectId}:collaborators`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = collaboratorChannel.presenceState();
        const activeCollaborators = Object.values(presenceState).flat();
        setCollaborators(activeCollaborators);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Handle new collaborator joining
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Handle collaborator leaving
      })
      .subscribe();
    
    // Subscribe to comment updates
    const commentChannel = supabase
      .channel(`project:${projectId}:comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_comments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments(prev => [...prev, payload.new as Comment]);
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev => 
              prev.map(comment => 
                comment.id === payload.new.id ? payload.new as Comment : comment
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => 
              prev.filter(comment => comment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
    
    return () => {
      collaboratorChannel.unsubscribe();
      commentChannel.unsubscribe();
    };
  }, [projectId, supabase]);
  
  return { collaborators, comments };
}
```

### Progress Tracking System
```typescript
// Content Generation Progress Tracker
export class ContentGenerationProgressTracker extends EventEmitter {
  private contentId: string;
  private stages: ProgressStage[];
  private currentStage: number = 0;
  private isRunning: boolean = false;
  
  constructor(contentId: string) {
    super();
    this.contentId = contentId;
    this.stages = [
      { id: 'serp-analysis', label: 'Analyzing Search Results', estimatedDuration: 30 },
      { id: 'competitor-scraping', label: 'Extracting Competitor Content', estimatedDuration: 60 },
      { id: 'seo-analysis', label: 'Calculating SEO Metrics', estimatedDuration: 45 },
      { id: 'content-generation', label: 'Generating Expert Content', estimatedDuration: 90 },
      { id: 'validation', label: 'Validating Content Quality', estimatedDuration: 30 },
      { id: 'optimization', label: 'Final SEO Optimization', estimatedDuration: 15 },
    ];
  }
  
  async start() {
    this.isRunning = true;
    
    for (let i = 0; i < this.stages.length; i++) {
      if (!this.isRunning) break;
      
      this.currentStage = i;
      const stage = this.stages[i];
      
      this.emit('progress', {
        stage: stage.id,
        label: stage.label,
        currentStep: i + 1,
        totalSteps: this.stages.length,
        percentage: Math.round(((i + 1) / this.stages.length) * 100),
        estimatedTimeRemaining: this.calculateRemainingTime(i),
      });
      
      // Simulate stage processing
      await this.processStage(stage);
    }
    
    if (this.isRunning) {
      this.emit('complete', {
        contentId: this.contentId,
        completedAt: new Date().toISOString(),
        totalDuration: this.calculateTotalDuration(),
      });
    }
  }
  
  stop() {
    this.isRunning = false;
  }
  
  private async processStage(stage: ProgressStage): Promise<void> {
    // Actual implementation would call the appropriate service
    // For now, simulate with timeout
    await new Promise(resolve => setTimeout(resolve, stage.estimatedDuration * 1000));
  }
  
  private calculateRemainingTime(currentStageIndex: number): number {
    return this.stages
      .slice(currentStageIndex + 1)
      .reduce((total, stage) => total + stage.estimatedDuration, 0);
  }
  
  private calculateTotalDuration(): number {
    return this.stages.reduce((total, stage) => total + stage.estimatedDuration, 0);
  }
}
```

## Consequences

### Positive
- **Scalability**: SSE handles many concurrent connections efficiently
- **Reliability**: Automatic reconnection and error handling
- **Performance**: Lower overhead than WebSockets for one-way communication
- **Simplicity**: Easier to implement and debug than WebSockets
- **Firewall Friendly**: Works through corporate firewalls and proxies

### Negative
- **One-Way Communication**: SSE is primarily for server-to-client communication
- **Browser Limits**: Limited concurrent SSE connections per domain (6 in most browsers)
- **Complexity**: Need to manage both SSE and Supabase Realtime

## Alternatives Considered

### WebSockets
- **Pros**: Bi-directional communication, lower latency
- **Cons**: More complex, connection scaling issues, firewall problems

### Polling
- **Pros**: Simple to implement, works everywhere
- **Cons**: Higher server load, delayed updates, inefficient

### Supabase Realtime Only
- **Pros**: Single solution, integrated with database
- **Cons**: Limited to database changes, less control over custom events

## Implementation Plan

1. **Phase 1**: Implement SSE for content generation progress
2. **Phase 2**: Set up Supabase Realtime for collaboration features
3. **Phase 3**: Create custom hooks and components
4. **Phase 4**: Add error handling and reconnection logic
5. **Phase 5**: Performance testing and optimization

## Monitoring and Success Criteria

- **Connection Stability**: >99% successful connections
- **Latency**: <500ms for progress updates
- **Scalability**: Handle 100+ concurrent progress tracking sessions
- **User Experience**: Smooth real-time updates without lag

## References
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Next.js Streaming Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
