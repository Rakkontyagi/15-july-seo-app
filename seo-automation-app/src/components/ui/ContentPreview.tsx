
import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Monitor, Smartphone, Search } from 'lucide-react';

interface ContentPreviewProps {
  content: string;
  title?: string;
  metaDescription?: string;
  className?: string;
}

interface PreviewMode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  title = 'Untitled Content',
  metaDescription = '',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedMode, setSelectedMode] = useState('reader');

  const previewModes: PreviewMode[] = [
    {
      id: 'reader',
      label: 'Reader View',
      icon: <Eye className="h-4 w-4" />,
      description: 'How readers will see your content'
    },
    {
      id: 'search',
      label: 'Search Engine',
      icon: <Search className="h-4 w-4" />,
      description: 'How search engines will interpret your content'
    },
    {
      id: 'mobile',
      label: 'Mobile View',
      icon: <Smartphone className="h-4 w-4" />,
      description: 'Mobile-optimized preview'
    },
    {
      id: 'desktop',
      label: 'Desktop View',
      icon: <Monitor className="h-4 w-4" />,
      description: 'Desktop-optimized preview'
    }
  ];

  // Process content for different preview modes
  const processedContent = useMemo(() => {
    const htmlContent = content.replace(/\n/g, '<br>');

    switch (selectedMode) {
      case 'search':
        return {
          title: title,
          metaDescription: metaDescription || content.substring(0, 160) + '...',
          snippet: content.substring(0, 200) + '...',
          url: 'https://example.com/your-content'
        };
      case 'mobile':
        return {
          content: htmlContent,
          viewport: 'mobile'
        };
      case 'desktop':
        return {
          content: htmlContent,
          viewport: 'desktop'
        };
      default:
        return {
          content: htmlContent,
          viewport: 'reader'
        };
    }
  }, [content, title, metaDescription, selectedMode]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isVisible) {
    return (
      <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Content Preview</h3>
          <button
            onClick={toggleVisibility}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Show preview"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Content Preview</h3>
        <button
          onClick={toggleVisibility}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="Hide preview"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      {/* Preview Mode Tabs */}
      <div className="flex space-x-2 mb-4 border-b">
        {previewModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              selectedMode === mode.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title={mode.description}
          >
            {mode.icon}
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Preview Content */}
      <div className="space-y-4">
        {selectedMode === 'reader' && (
          <div className="prose prose-sm max-w-none">
            <h1 className="text-xl font-bold mb-4">{title}</h1>
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processedContent.content }}
            />
          </div>
        )}

        {selectedMode === 'search' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Search Engine Result Preview</h4>
              <div className="space-y-2">
                <div>
                  <h5 className="text-lg text-blue-600 hover:underline cursor-pointer">
                    {processedContent.title}
                  </h5>
                  <p className="text-xs text-green-700">{processedContent.url}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {processedContent.metaDescription}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Content Snippet</h4>
              <p className="text-sm text-gray-600">
                {processedContent.snippet}
              </p>
            </div>
          </div>
        )}

        {selectedMode === 'mobile' && (
          <div className="max-w-sm mx-auto border rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gray-100 p-2 text-center text-xs text-gray-600">
              Mobile View (375px)
            </div>
            <div className="p-4 bg-white">
              <h1 className="text-lg font-bold mb-3">{title}</h1>
              <div
                className="text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processedContent.content }}
              />
            </div>
          </div>
        )}

        {selectedMode === 'desktop' && (
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gray-100 p-2 text-center text-xs text-gray-600">
              Desktop View (1200px)
            </div>
            <div className="p-8 bg-white">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">{title}</h1>
                <div
                  className="text-base text-gray-700 leading-relaxed prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: processedContent.content }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Features</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Reader View: Clean, distraction-free reading experience</li>
          <li>• Search Engine: How your content appears in search results</li>
          <li>• Mobile View: Optimized for mobile devices (375px width)</li>
          <li>• Desktop View: Full desktop experience (1200px width)</li>
        </ul>
      </div>
    </div>
  );
};

export default ContentPreview;
