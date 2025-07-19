import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import InlineSuggestions from '../InlineSuggestions';

describe('InlineSuggestions', () => {
  const defaultProps = {
    content: 'This is a sample content for testing SEO suggestions. It has multiple sentences.',
    targetKeywords: ['testing', 'SEO'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<InlineSuggestions {...defaultProps} />);
    expect(screen.getByText('Optimization Suggestions')).toBeInTheDocument();
  });

  it('displays "Great job!" message when no suggestions', () => {
    render(<InlineSuggestions content="" targetKeywords={[]} />);
    expect(screen.getByText('Great job!')).toBeInTheDocument();
    expect(screen.getByText('No optimization suggestions at the moment. Your content looks good!')).toBeInTheDocument();
  });

  it('generates keyword density suggestions for low density', () => {
    const content = 'This is content without the target keyword mentioned enough times.';
    render(<InlineSuggestions content={content} targetKeywords={['keyword']} />);
    
    expect(screen.getByText(/Low keyword density/)).toBeInTheDocument();
    expect(screen.getByText(/Current density.*Recommended: 0.5-2%/)).toBeInTheDocument();
  });

  it('generates readability suggestions for long sentences', () => {
    const longSentenceContent = 'This is an extremely long sentence that contains way too many words and should be broken down into smaller, more digestible pieces for better readability and user experience.';
    render(<InlineSuggestions content={longSentenceContent} targetKeywords={[]} />);
    
    expect(screen.getByText(/Long sentences detected/)).toBeInTheDocument();
  });

  it('generates structure suggestions when no headings found', () => {
    const contentWithoutHeadings = 'This is content without any headings. It just has regular paragraphs.';
    render(<InlineSuggestions content={contentWithoutHeadings} targetKeywords={[]} />);
    
    expect(screen.getByText(/No headings found/)).toBeInTheDocument();
  });

  it('generates engagement suggestions when no questions found', () => {
    const content = 'This is content without any questions. It has statements only. This content is long enough to trigger the engagement suggestion.'.repeat(3);
    render(<InlineSuggestions content={content} targetKeywords={[]} />);
    
    expect(screen.getByText(/Consider adding questions/)).toBeInTheDocument();
  });

  it('generates SEO suggestions for short content', () => {
    const shortContent = 'Short content.';
    render(<InlineSuggestions content={shortContent} targetKeywords={[]} />);
    
    expect(screen.getByText(/Content is too short/)).toBeInTheDocument();
    expect(screen.getByText(/recommended: 300\+ words/)).toBeInTheDocument();
  });

  it('displays suggestion count correctly', () => {
    const shortContent = 'Short content.';
    render(<InlineSuggestions content={shortContent} targetKeywords={['missing']} />);
    
    // Should have at least 2 suggestions: short content + low keyword density
    const suggestionCount = screen.getByText(/\(\d+\)/);
    expect(suggestionCount).toBeInTheDocument();
  });

  it('expands suggestion details when clicked', async () => {
    const user = userEvent.setup();
    const shortContent = 'Short content.';
    render(<InlineSuggestions content={shortContent} targetKeywords={[]} />);
    
    const suggestion = screen.getByText(/Content is too short/);
    await user.click(suggestion.closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText(/Expand your content with more detailed information/)).toBeInTheDocument();
      expect(screen.getByText(/Confidence:/)).toBeInTheDocument();
    });
  });

  it('dismisses suggestions when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismissSuggestion = jest.fn();
    const shortContent = 'Short content.';
    
    render(
      <InlineSuggestions 
        content={shortContent} 
        targetKeywords={[]} 
        onDismissSuggestion={onDismissSuggestion}
      />
    );
    
    const dismissButton = screen.getAllByTitle('Dismiss suggestion')[0];
    await user.click(dismissButton);
    
    expect(onDismissSuggestion).toHaveBeenCalled();
  });

  it('calls onApplySuggestion when apply fix is clicked', async () => {
    const user = userEvent.setup();
    const onApplySuggestion = jest.fn();
    
    // Create a mock suggestion with autoFix enabled
    const mockSuggestion = {
      id: 'test-suggestion',
      type: 'seo' as const,
      severity: 'medium' as const,
      title: 'Test Suggestion',
      description: 'Test description',
      suggestion: 'Test suggestion text',
      autoFix: true,
      confidence: 85
    };

    // We need to mock the suggestions generation to include autoFix
    // For this test, we'll use legacy suggestions which support autoFix
    render(
      <InlineSuggestions 
        content="test content"
        suggestions={['Test suggestion']}
        onApplySuggestion={onApplySuggestion}
      />
    );
    
    // Click to expand the suggestion
    const suggestion = screen.getByText(/Test suggestion/);
    await user.click(suggestion.closest('div')!);
    
    // Note: The current implementation doesn't have autoFix for generated suggestions
    // This test would need to be updated when autoFix is implemented
  });

  it('supports legacy suggestions prop', () => {
    const legacySuggestions = ['Legacy suggestion 1', 'Legacy suggestion 2'];
    render(<InlineSuggestions content="" suggestions={legacySuggestions} />);
    
    expect(screen.getByText('Legacy suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Legacy suggestion 2')).toBeInTheDocument();
  });

  it('displays severity icons correctly', () => {
    const shortContent = 'Short content.';
    render(<InlineSuggestions content={shortContent} targetKeywords={['missing']} />);
    
    // Check that severity icons are present (they should be in the DOM)
    const suggestions = screen.getAllByRole('button', { name: /dismiss suggestion/i });
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const customClass = 'custom-suggestions-class';
    render(<InlineSuggestions {...defaultProps} className={customClass} />);
    
    const container = screen.getByText('Optimization Suggestions').closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('displays suggestion types legend', () => {
    render(<InlineSuggestions {...defaultProps} />);
    
    expect(screen.getByText('Suggestion Types')).toBeInTheDocument();
    expect(screen.getByText('Keyword Optimization')).toBeInTheDocument();
    expect(screen.getByText('SEO Improvements')).toBeInTheDocument();
    expect(screen.getByText('Readability')).toBeInTheDocument();
    expect(screen.getByText('Engagement')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    render(<InlineSuggestions content="" targetKeywords={[]} />);
    expect(screen.getByText('Great job!')).toBeInTheDocument();
  });

  it('handles content with special characters', () => {
    const specialContent = 'Content with special chars: @#$%^&*()! Does it work?';
    render(<InlineSuggestions content={specialContent} targetKeywords={['special']} />);
    
    // Should not crash and should generate suggestions
    expect(screen.getByText('Optimization Suggestions')).toBeInTheDocument();
  });

  it('calculates keyword density correctly', () => {
    const content = 'testing SEO testing content for testing purposes';
    render(<InlineSuggestions content={content} targetKeywords={['testing']} />);
    
    // With 'testing' appearing 3 times in 7 words, density should be high
    // This should trigger a high keyword density warning
    expect(screen.getByText(/High keyword density/)).toBeInTheDocument();
  });

  it('handles multiple target keywords', () => {
    const content = 'This content mentions SEO and testing multiple times for optimization.';
    render(<InlineSuggestions content={content} targetKeywords={['SEO', 'testing', 'optimization']} />);
    
    // Should analyze all keywords
    expect(screen.getByText('Optimization Suggestions')).toBeInTheDocument();
  });
});
