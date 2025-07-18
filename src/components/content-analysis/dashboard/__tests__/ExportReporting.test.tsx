import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportReporting } from '../ExportReporting';

describe('ExportReporting', () => {
  const mockOnExport = jest.fn();
  const mockOnGenerateReport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnExport.mockResolvedValue(undefined);
    mockOnGenerateReport.mockResolvedValue(undefined);
  });

  it('renders all export options correctly', () => {
    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    expect(screen.getByText('Export and Reporting')).toBeInTheDocument();
    expect(screen.getByText('Quick Export')).toBeInTheDocument();
    expect(screen.getByText('Detailed Reports')).toBeInTheDocument();
    
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
    expect(screen.getByText('Generate Comprehensive Report')).toBeInTheDocument();
  });

  it('calls onExport with correct format when CSV button is clicked', async () => {
    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    const csvButton = screen.getByText('Export CSV');
    fireEvent.click(csvButton);
    
    expect(mockOnExport).toHaveBeenCalledWith('csv');
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onExport with correct format when PDF button is clicked', async () => {
    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    const pdfButton = screen.getByText('Export PDF');
    fireEvent.click(pdfButton);
    
    expect(mockOnExport).toHaveBeenCalledWith('pdf');
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onExport with correct format when JSON button is clicked', async () => {
    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    const jsonButton = screen.getByText('Export JSON');
    fireEvent.click(jsonButton);
    
    expect(mockOnExport).toHaveBeenCalledWith('json');
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onGenerateReport when comprehensive report button is clicked', async () => {
    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    const reportButton = screen.getByText('Generate Comprehensive Report');
    fireEvent.click(reportButton);
    
    expect(mockOnGenerateReport).toHaveBeenCalledTimes(1);
  });

  it('disables export buttons during export operation', async () => {
    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    mockOnExport.mockReturnValue(exportPromise);

    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    const csvButton = screen.getByText('Export CSV');
    fireEvent.click(csvButton);
    
    // Buttons should be disabled during export
    expect(screen.getByText('Export CSV')).toBeDisabled();
    expect(screen.getByText('Export PDF')).toBeDisabled();
    expect(screen.getByText('Export JSON')).toBeDisabled();
    
    // Resolve the export
    resolveExport!();
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).not.toBeDisabled();
    });
  });

  it('disables report button during report generation', async () => {
    let resolveReport: () => void;
    const reportPromise = new Promise<void>((resolve) => {
      resolveReport = resolve;
    });
    mockOnGenerateReport.mockReturnValue(reportPromise);

    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    const reportButton = screen.getByText('Generate Comprehensive Report');
    fireEvent.click(reportButton);
    
    // Button should be disabled during generation
    expect(reportButton).toBeDisabled();
    
    // Resolve the report generation
    resolveReport!();
    await waitFor(() => {
      expect(reportButton).not.toBeDisabled();
    });
  });

  it('displays export options information', () => {
    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    expect(screen.getByText('Export Options')).toBeInTheDocument();
    expect(screen.getByText('• CSV: Raw data for spreadsheet analysis')).toBeInTheDocument();
    expect(screen.getByText('• PDF: Formatted report for presentations')).toBeInTheDocument();
    expect(screen.getByText('• JSON: Structured data for API integration')).toBeInTheDocument();
    expect(screen.getByText('• Comprehensive: Full analysis with visualizations')).toBeInTheDocument();
  });

  it('shows loading indicators during operations', async () => {
    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    mockOnExport.mockReturnValue(exportPromise);

    render(<ExportReporting onExport={mockOnExport} onGenerateReport={mockOnGenerateReport} />);
    
    const csvButton = screen.getByText('Export CSV');
    fireEvent.click(csvButton);
    
    // Should show loading indicator
    expect(screen.getAllByText('⏳')).toHaveLength(3); // One for each export button
    
    resolveExport!();
    await waitFor(() => {
      expect(screen.queryByText('⏳')).not.toBeInTheDocument();
    });
  });
});