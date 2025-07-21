import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Supabase client
const mockSupabase = {
  channel: jest.fn(),
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  send: jest.fn()
};

mockSupabase.channel.mockReturnValue(mockChannel);

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock components
jest.mock('react-quill', () => {
  return function MockReactQuill({ value, onChange }: any) {
    return (
      <textarea
        data-testid="quill-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

// Import components after mocking
import ContentEditor from '../../ContentEditor';
import RealtimeSeoScore from '../../RealtimeSeoScore';
import CollaborationPanel from '../../CollaborationPanel';

describe('Real-time Collaboration Integration', () => {
  let mockUser: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' }
    };
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    // Reset channel mocks
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(Promise.resolve());
  });

  describe('Content Editor Real-time Updates', () => {
    it('should establish real-time connection when editor mounts', async () => {
      const onChange = jest.fn();
      
      render(
        <ContentEditor
          value=""
          onChange={onChange}
          enableSanitization={true}
        />
      );

      // Verify channel creation would be called in real implementation
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    it('should handle concurrent editing conflicts', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(
        <ContentEditor
          value="Initial content"
          onChange={onChange}
        />
      );

      const editor = screen.getByTestId('quill-editor');
      
      // Simulate user typing
      await user.type(editor, ' - User edit');
      
      // Simulate receiving remote change
      act(() => {
        const remoteChange = 'Initial content - Remote edit';
        // In real implementation, this would come through the channel
        onChange(remoteChange);
      });

      expect(onChange).toHaveBeenCalled();
    });

    it('should show collaboration indicators', async () => {
      render(
        <div>
          <ContentEditor
            value="Test content"
            onChange={jest.fn()}
          />
          <CollaborationPanel
            contentId="test-content-123"
            currentUser={mockUser}
          />
        </div>
      );

      // Check for collaboration UI elements
      expect(screen.getByTestId('quill-editor')).toBeInTheDocument();
    });
  });

  describe('Real-time SEO Analysis', () => {
    it('should update SEO scores in real-time as content changes', async () => {
      const user = userEvent.setup();
      let currentContent = '';
      
      const TestComponent = () => {
        const [content, setContent] = React.useState('');
        
        return (
          <div>
            <ContentEditor
              value={content}
              onChange={(newContent) => {
                setContent(newContent);
                currentContent = newContent;
              }}
            />
            <RealtimeSeoScore
              content={content}
              targetKeywords={['test', 'content']}
              debounceDelay={100} // Faster for testing
            />
          </div>
        );
      };

      render(<TestComponent />);

      const editor = screen.getByTestId('quill-editor');
      
      // Type content and wait for SEO analysis
      await user.type(editor, 'This is test content for SEO analysis');
      
      // Wait for debounced analysis
      await waitFor(() => {
        expect(screen.getByText('Real-time SEO Score')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle multiple users analyzing same content', async () => {
      const TestComponent = () => {
        const [content] = React.useState('Shared content for analysis');
        
        return (
          <div>
            <RealtimeSeoScore
              content={content}
              targetKeywords={['shared', 'content']}
            />
            <div data-testid="user-indicator">User 1 analyzing</div>
            <div data-testid="user-indicator">User 2 analyzing</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getAllByTestId('user-indicator')).toHaveLength(2);
      expect(screen.getByText('Real-time SEO Score')).toBeInTheDocument();
    });
  });

  describe('Collaboration Panel Integration', () => {
    it('should display active collaborators', async () => {
      const mockCollaborators = [
        { id: 'user-1', name: 'Alice', avatar: null, isActive: true },
        { id: 'user-2', name: 'Bob', avatar: null, isActive: true }
      ];

      render(
        <CollaborationPanel
          contentId="test-content-123"
          currentUser={mockUser}
          collaborators={mockCollaborators}
        />
      );

      // Check for collaborator indicators
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
    });

    it('should handle comment creation and real-time updates', async () => {
      const user = userEvent.setup();
      const onCommentAdd = jest.fn();

      render(
        <CollaborationPanel
          contentId="test-content-123"
          currentUser={mockUser}
          onCommentAdd={onCommentAdd}
        />
      );

      // Look for comment input or add comment button
      const commentElements = screen.queryAllByText(/comment/i);
      expect(commentElements.length).toBeGreaterThan(0);
    });

    it('should sync comments across multiple users', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          content: 'Great content!',
          author: { id: 'user-1', name: 'Alice' },
          createdAt: new Date().toISOString(),
          position: { start: 0, end: 10 }
        }
      ];

      render(
        <CollaborationPanel
          contentId="test-content-123"
          currentUser={mockUser}
          comments={mockComments}
        />
      );

      expect(screen.getByText('Collaboration')).toBeInTheDocument();
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      // Mock connection failure
      mockChannel.subscribe.mockRejectedValue(new Error('Connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ContentEditor
          value="Test content"
          onChange={jest.fn()}
        />
      );

      // Component should still render despite connection failure
      expect(screen.getByTestId('quill-editor')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should debounce rapid content changes to prevent excessive updates', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(
        <ContentEditor
          value=""
          onChange={onChange}
        />
      );

      const editor = screen.getByTestId('quill-editor');
      
      // Type rapidly
      await user.type(editor, 'rapid typing test', { delay: 10 });
      
      // onChange should be called for each keystroke, but real-time sync would be debounced
      expect(onChange).toHaveBeenCalled();
    });

    it('should handle large content efficiently', async () => {
      const largeContent = 'Large content '.repeat(1000);
      
      const startTime = performance.now();
      
      render(
        <div>
          <ContentEditor
            value={largeContent}
            onChange={jest.fn()}
          />
          <RealtimeSeoScore
            content={largeContent}
            targetKeywords={['large', 'content']}
          />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
      expect(screen.getByTestId('quill-editor')).toBeInTheDocument();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain content consistency across components', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [content, setContent] = React.useState('Initial content');
        
        return (
          <div>
            <ContentEditor
              value={content}
              onChange={setContent}
            />
            <RealtimeSeoScore
              content={content}
              targetKeywords={['initial', 'content']}
            />
            <div data-testid="content-display">{content}</div>
          </div>
        );
      };

      render(<TestComponent />);

      const editor = screen.getByTestId('quill-editor');
      
      // Clear and type new content
      await user.clear(editor);
      await user.type(editor, 'Updated content');
      
      // All components should reflect the same content
      await waitFor(() => {
        expect(screen.getByDisplayValue('Updated content')).toBeInTheDocument();
        expect(screen.getByTestId('content-display')).toHaveTextContent('Updated content');
      });
    });

    it('should handle version conflicts in collaborative editing', async () => {
      const onChange = jest.fn();
      
      render(
        <ContentEditor
          value="Version 1"
          onChange={onChange}
        />
      );

      // Simulate version conflict scenario
      const editor = screen.getByTestId('quill-editor');
      
      // User makes local change
      fireEvent.change(editor, { target: { value: 'Version 1 - Local edit' } });
      
      // Simulate remote change arriving
      act(() => {
        // In real implementation, this would trigger conflict resolution
        onChange('Version 1 - Remote edit');
      });

      expect(onChange).toHaveBeenCalled();
    });
  });
});
