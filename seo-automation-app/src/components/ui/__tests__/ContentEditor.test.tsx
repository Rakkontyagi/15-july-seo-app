import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ContentEditor from '../ContentEditor';

// Mock ReactQuill since it requires DOM
jest.mock('react-quill', () => {
  return function MockReactQuill({ value, onChange, placeholder }: any) {
    return (
      <div data-testid="react-quill-mock">
        <textarea
          data-testid="quill-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  };
});

// Mock the content sanitizer
jest.mock('@/lib/security/content-sanitizer', () => ({
  contentSanitizer: {
    getSanitizationReport: jest.fn((content) => ({
      original: content,
      sanitized: content,
      isModified: false,
      removedElements: []
    }))
  },
  SANITIZATION_CONFIGS: {
    RICH: {},
    STANDARD: {},
    STRICT: {}
  }
}));

describe('ContentEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ContentEditor {...defaultProps} />);
    expect(screen.getByTestId('react-quill-mock')).toBeInTheDocument();
  });

  it('displays the correct placeholder', () => {
    const placeholder = 'Custom placeholder text';
    render(<ContentEditor {...defaultProps} placeholder={placeholder} />);
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  it('calls onChange when content changes', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(<ContentEditor {...defaultProps} onChange={onChange} />);
    
    const editor = screen.getByTestId('quill-editor');
    await user.type(editor, 'Hello World');
    
    expect(onChange).toHaveBeenCalled();
  });

  it('displays security status bar when sanitization is enabled', () => {
    render(<ContentEditor {...defaultProps} enableSanitization={true} />);
    expect(screen.getByText(/XSS Protection/)).toBeInTheDocument();
  });

  it('does not display security status bar when sanitization is disabled', () => {
    render(<ContentEditor {...defaultProps} enableSanitization={false} />);
    expect(screen.queryByText(/XSS Protection/)).not.toBeInTheDocument();
  });

  it('displays the correct sanitization level', () => {
    render(<ContentEditor {...defaultProps} enableSanitization={true} sanitizationLevel="strict" />);
    expect(screen.getByText(/strict/i)).toBeInTheDocument();
  });

  it('shows sanitization warning when content is modified', async () => {
    const { contentSanitizer } = require('@/lib/security/content-sanitizer');
    contentSanitizer.getSanitizationReport.mockReturnValue({
      original: '<script>alert("xss")</script>Hello',
      sanitized: 'Hello',
      isModified: true,
      removedElements: ['1 HTML elements removed']
    });

    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(<ContentEditor {...defaultProps} onChange={onChange} enableSanitization={true} />);
    
    const editor = screen.getByTestId('quill-editor');
    await user.type(editor, '<script>alert("xss")</script>Hello');
    
    await waitFor(() => {
      expect(screen.getByText(/Content was sanitized/)).toBeInTheDocument();
    });
  });

  it('calls onSanitizationReport when provided', async () => {
    const onSanitizationReport = jest.fn();
    const { contentSanitizer } = require('@/lib/security/content-sanitizer');
    
    const mockReport = {
      original: '<script>alert("xss")</script>Hello',
      sanitized: 'Hello',
      isModified: true,
      removedElements: ['1 HTML elements removed']
    };
    
    contentSanitizer.getSanitizationReport.mockReturnValue(mockReport);

    const user = userEvent.setup();
    
    render(
      <ContentEditor 
        {...defaultProps} 
        enableSanitization={true}
        onSanitizationReport={onSanitizationReport}
      />
    );
    
    const editor = screen.getByTestId('quill-editor');
    await user.type(editor, '<script>alert("xss")</script>Hello');
    
    await waitFor(() => {
      expect(onSanitizationReport).toHaveBeenCalledWith(mockReport);
    });
  });

  it('applies custom className', () => {
    const customClass = 'custom-editor-class';
    render(<ContentEditor {...defaultProps} className={customClass} />);
    
    const container = screen.getByTestId('react-quill-mock').closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('displays security info when sanitization is enabled', () => {
    render(<ContentEditor {...defaultProps} enableSanitization={true} />);
    expect(screen.getByText(/Content is automatically sanitized/)).toBeInTheDocument();
  });

  it('hides sanitization warning after timeout', async () => {
    jest.useFakeTimers();
    
    const { contentSanitizer } = require('@/lib/security/content-sanitizer');
    contentSanitizer.getSanitizationReport.mockReturnValue({
      original: '<script>alert("xss")</script>Hello',
      sanitized: 'Hello',
      isModified: true,
      removedElements: ['1 HTML elements removed']
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(<ContentEditor {...defaultProps} enableSanitization={true} />);
    
    const editor = screen.getByTestId('quill-editor');
    await user.type(editor, '<script>alert("xss")</script>Hello');
    
    // Warning should be visible
    await waitFor(() => {
      expect(screen.getByText(/Content was sanitized/)).toBeInTheDocument();
    });
    
    // Fast-forward time
    jest.advanceTimersByTime(5000);
    
    // Warning should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Content was sanitized/)).not.toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('handles different sanitization levels correctly', () => {
    const { rerender } = render(
      <ContentEditor {...defaultProps} enableSanitization={true} sanitizationLevel="strict" />
    );
    expect(screen.getByText(/strict/i)).toBeInTheDocument();

    rerender(
      <ContentEditor {...defaultProps} enableSanitization={true} sanitizationLevel="standard" />
    );
    expect(screen.getByText(/standard/i)).toBeInTheDocument();

    rerender(
      <ContentEditor {...defaultProps} enableSanitization={true} sanitizationLevel="rich" />
    );
    expect(screen.getByText(/rich/i)).toBeInTheDocument();
  });
});
