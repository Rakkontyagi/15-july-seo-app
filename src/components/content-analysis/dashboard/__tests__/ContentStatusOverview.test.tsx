import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentStatusOverview } from '../ContentStatusOverview';

describe('ContentStatusOverview', () => {
  const mockContentItems = [
    {
      id: 'content-1',
      title: 'SEO Article: Best Practices for 2025',
      status: 'completed',
      lastUpdated: '2025-07-18T10:00:00Z'
    },
    {
      id: 'content-2',
      title: 'Product Review: Latest Tech Gadgets',
      status: 'processing',
      lastUpdated: '2025-07-18T09:30:00Z'
    },
    {
      id: 'content-3',
      title: 'Tutorial: Advanced JavaScript Concepts',
      status: 'pending',
      lastUpdated: '2025-07-18T09:00:00Z'
    },
    {
      id: 'content-4',
      title: 'News Article: Industry Updates',
      status: 'failed',
      lastUpdated: '2025-07-18T08:30:00Z'
    }
  ];

  it('renders empty state correctly', () => {
    render(<ContentStatusOverview contentItems={[]} />);
    
    expect(screen.getByText('Content Status Overview')).toBeInTheDocument();
    expect(screen.getByText('No content items to display')).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders content items with correct information', () => {
    render(<ContentStatusOverview contentItems={mockContentItems} />);
    
    // Check table headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
    
    // Check content items
    expect(screen.getByText('content-1')).toBeInTheDocument();
    expect(screen.getByText('SEO Article: Best Practices for 2025')).toBeInTheDocument();
    expect(screen.getByText('Product Review: Latest Tech Gadgets')).toBeInTheDocument();
  });

  it('displays correct status badges with icons', () => {
    render(<ContentStatusOverview contentItems={mockContentItems} />);
    
    expect(screen.getByText('✅')).toBeInTheDocument(); // completed
    expect(screen.getByText('⏳')).toBeInTheDocument(); // processing
    expect(screen.getByText('⏸️')).toBeInTheDocument(); // pending
    expect(screen.getByText('❌')).toBeInTheDocument(); // failed
    
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<ContentStatusOverview contentItems={mockContentItems} />);
    
    // Check that timestamps are displayed (exact format may vary by locale)
    const timestampElements = screen.getAllByText(/2025/);
    expect(timestampElements.length).toBe(mockContentItems.length);
  });

  it('handles long titles with truncation', () => {
    const longTitleItem = {
      id: 'content-long',
      title: 'This is a very long title that should be truncated when displayed in the table to prevent layout issues and maintain readability',
      status: 'completed',
      lastUpdated: '2025-07-18T10:00:00Z'
    };

    render(<ContentStatusOverview contentItems={[longTitleItem]} />);
    
    const titleElement = screen.getByText(longTitleItem.title);
    expect(titleElement).toHaveClass('truncate');
  });

  it('applies hover effects to table rows', () => {
    const { container } = render(<ContentStatusOverview contentItems={mockContentItems} />);
    
    const tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(mockContentItems.length);
    
    tableRows.forEach(row => {
      expect(row).toHaveClass('hover:bg-gray-50');
    });
  });

  it('alternates row background colors', () => {
    const { container } = render(<ContentStatusOverview contentItems={mockContentItems} />);
    
    const tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows[0]).toHaveClass('bg-white');
    expect(tableRows[1]).toHaveClass('bg-gray-25');
  });
});