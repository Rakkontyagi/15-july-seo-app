
import React, { useState } from 'react';

interface ExportReportingProps {
  onExport: (format: string) => void;
  onGenerateReport: () => void;
}

export const ExportReporting: React.FC<ExportReportingProps> = ({ onExport, onGenerateReport }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await onGenerateReport();
    } finally {
      setIsGenerating(false);
    }
  };

  const ExportButton = ({ format, icon, label, disabled }: { format: string; icon: string; label: string; disabled: boolean }) => (
    <button
      onClick={() => handleExport(format)}
      disabled={disabled}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
        disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
      {disabled && <span className="animate-spin">⏳</span>}
    </button>
  );

  return (
    <div className="export-reporting p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Export and Reporting</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Export</h4>
          <div className="flex flex-wrap gap-3">
            <ExportButton 
              format="csv" 
              icon="📊" 
              label="Export CSV" 
              disabled={isExporting}
            />
            <ExportButton 
              format="pdf" 
              icon="📄" 
              label="Export PDF" 
              disabled={isExporting}
            />
            <ExportButton 
              format="json" 
              icon="📋" 
              label="Export JSON" 
              disabled={isExporting}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Reports</h4>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isGenerating
                ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <span className="text-lg">📈</span>
            <span>Generate Comprehensive Report</span>
            {isGenerating && <span className="animate-spin">⏳</span>}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Includes quality metrics, performance analysis, and trend insights
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Export Options</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• CSV: Raw data for spreadsheet analysis</li>
            <li>• PDF: Formatted report for presentations</li>
            <li>• JSON: Structured data for API integration</li>
            <li>• Comprehensive: Full analysis with visualizations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
