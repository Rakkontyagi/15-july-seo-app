import { TriggerSystem, ContentGeneratedEvent } from '../trigger-system';

describe('TriggerSystem', () => {
  let triggerSystem: TriggerSystem;

  beforeEach(() => {
    triggerSystem = new TriggerSystem();
  });

  it('should trigger content analysis when content is generated', (done) => {
    const event: ContentGeneratedEvent = {
      contentId: 'test-content-123',
      contentType: 'article',
      timestamp: new Date(),
      metadata: { author: 'test-user' }
    };

    triggerSystem.on('startAnalysis', (contentId: string) => {
      expect(contentId).toBe('test-content-123');
      done();
    });

    triggerSystem.triggerContentAnalysis(event);
  });

  it('should handle errors gracefully', (done) => {
    const event: ContentGeneratedEvent = {
      contentId: 'test-content-456',
      contentType: 'article',
      timestamp: new Date()
    };

    triggerSystem.on('triggerError', (errorData: any) => {
      expect(errorData.contentId).toBe('test-content-456');
      done();
    });

    // Simulate an error by removing the startAnalysis handler
    triggerSystem.triggerContentAnalysis(event);
  });
});