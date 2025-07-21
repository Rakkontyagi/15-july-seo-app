import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RealtimeSeoScore from '../RealtimeSeoScore';

// Mock the debounced SEO analysis hook
jest.mock('@/hooks/useDebouncedSeoAnalysis', () => ({
  useDebouncedSeoAnalysis: jest.fn()
}));

describe('RealtimeSeoScore', () => {
  const mockUseDebouncedSeoAnalysis = require('@/hooks/useDebouncedSeoAnalysis').useDebouncedSeoAnalysis;

  const defaultProps = {
    content: 'This is a sample content for testing SEO analysis.',
    targetKeywords: ['testing', 'SEO'],
  };

  const mockAnalysisResult = {
    keywordDensity: 2.5,
    readabilityScore: 75,
    overallSeoScore: 85,
    suggestions: ['Add more content', 'Improve keyword density'],
    wordCount: 150,
    sentenceCount: 8,
    avgWordsPerSentence: 18.75
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: mockAnalysisResult,
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    render(<RealtimeSeoScore {...defaultProps} />);
    expect(screen.getByText('Real-time SEO Score')).toBeInTheDocument();
  });

  it('displays loading state when analyzing', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: null,
      isAnalyzing: true,
      error: null,
      refresh: jest.fn()
    });

    render(<RealtimeSeoScore {...defaultProps} />);
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    // Check for the Loader2 icon by looking for the spinning animation class
    expect(screen.getByText('Analyzing...').previousElementSibling).toHaveClass('animate-spin');
  });

  it('displays analysis results correctly', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: mockAnalysisResult,
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    render(<RealtimeSeoScore {...defaultProps} />);
    
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('2.50%')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('18.8')).toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    const mockRefresh = jest.fn();
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: null,
      isAnalyzing: false,
      error: 'Analysis failed due to network error',
      refresh: mockRefresh
    });

    render(<RealtimeSeoScore {...defaultProps} />);
    
    expect(screen.getByText('SEO Analysis Error')).toBeInTheDocument();
    expect(screen.getByText('Analysis failed due to network error')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retry Analysis');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('displays placeholder when no analysis result', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: null,
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    render(<RealtimeSeoScore {...defaultProps} />);
    expect(screen.getByText('Start writing to see SEO analysis')).toBeInTheDocument();
  });

  it('applies correct color classes for different scores', () => {
    // Test high score (green)
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: { ...mockAnalysisResult, overallSeoScore: 90 },
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    const { rerender } = render(<RealtimeSeoScore {...defaultProps} />);
    let scoreElement = screen.getByText('90/100');
    expect(scoreElement).toHaveClass('text-green-600');

    // Test medium score (yellow)
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: { ...mockAnalysisResult, overallSeoScore: 60 },
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    rerender(<RealtimeSeoScore {...defaultProps} />);
    scoreElement = screen.getByText('60/100');
    expect(scoreElement).toHaveClass('text-yellow-600');

    // Test low score (red)
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: { ...mockAnalysisResult, overallSeoScore: 30 },
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    rerender(<RealtimeSeoScore {...defaultProps} />);
    scoreElement = screen.getByText('30/100');
    expect(scoreElement).toHaveClass('text-red-600');
  });

  it('displays correct score icons', () => {
    // Test high score (green circle)
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: { ...mockAnalysisResult, overallSeoScore: 90 },
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    const { rerender } = render(<RealtimeSeoScore {...defaultProps} />);
    expect(screen.getByText('🟢')).toBeInTheDocument();

    // Test medium score (yellow circle)
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: { ...mockAnalysisResult, overallSeoScore: 60 },
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    rerender(<RealtimeSeoScore {...defaultProps} />);
    expect(screen.getByText('🟡')).toBeInTheDocument();

    // Test low score (red circle)
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: { ...mockAnalysisResult, overallSeoScore: 30 },
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    rerender(<RealtimeSeoScore {...defaultProps} />);
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  it('passes correct props to useDebouncedSeoAnalysis hook', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: mockAnalysisResult,
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    render(
      <RealtimeSeoScore 
        content="Test content"
        targetKeywords={['test', 'keyword']}
        debounceDelay={1000}
      />
    );

    expect(mockUseDebouncedSeoAnalysis).toHaveBeenCalledWith('Test content', {
      debounceDelay: 1000,
      targetKeywords: ['test', 'keyword'],
      minWordCount: 10,
      enabled: true
    });
  });

  it('applies custom className', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: mockAnalysisResult,
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    const customClass = 'custom-seo-score-class';
    render(<RealtimeSeoScore {...defaultProps} className={customClass} />);
    
    const container = screen.getByText('Real-time SEO Score').closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('displays performance indicator', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: mockAnalysisResult,
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    render(<RealtimeSeoScore {...defaultProps} debounceDelay={750} />);
    expect(screen.getByText(/Analysis debounced by 750ms/)).toBeInTheDocument();
  });

  it('handles empty target keywords', () => {
    mockUseDebouncedSeoAnalysis.mockReturnValue({
      analysisResult: mockAnalysisResult,
      isAnalyzing: false,
      error: null,
      refresh: jest.fn()
    });

    render(<RealtimeSeoScore content="Test content" />);
    
    expect(mockUseDebouncedSeoAnalysis).toHaveBeenCalledWith('Test content', {
      debounceDelay: 500,
      targetKeywords: [],
      minWordCount: 10,
      enabled: true
    });
  });
});
