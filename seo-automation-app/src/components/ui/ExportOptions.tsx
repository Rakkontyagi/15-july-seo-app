
import React from 'react';
import { Button } from './Button'; // Assuming a Button component exists

interface ExportOptionsProps {
  content: string;
  onExport: (format: 'html' | 'wordpress' | 'text') => void;
  className?: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  content,
  onExport,
  className,
}) => {
  const handleExportHtml = () => {
    onExport('html');
  };

  const handleExportWordPress = () => {
    // For WordPress, we might need to convert HTML to a format suitable for the WordPress editor
    // This is a simplified representation.
    onExport('wordpress');
  };

  const handleExportText = () => {
    onExport('text');
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Export Options</h3>
      <div className="flex space-x-2">
        <Button onClick={handleExportHtml} variant="primary">
          Export HTML
        </Button>
        <Button onClick={handleExportWordPress} variant="secondary">
          Export WordPress
        </Button>
        <Button onClick={handleExportText} variant="outline">
          Export Plain Text
        </Button>
      </div>
    </div>
  );
  };

export default ExportOptions;
