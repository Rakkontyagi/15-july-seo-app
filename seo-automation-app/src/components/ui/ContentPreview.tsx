
import React from 'react';

interface ContentPreviewProps {
  htmlContent: string; // HTML content to preview
  className?: string;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  htmlContent,
  className,
}) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm overflow-auto ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Content Preview</h3>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default ContentPreview;
