
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS
import { contentSanitizer, SANITIZATION_CONFIGS } from '@/lib/security/content-sanitizer';

interface ContentEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  enableSanitization?: boolean;
  sanitizationLevel?: 'strict' | 'standard' | 'rich';
  onSanitizationReport?: (report: any) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your content here...',
  className,
  enableSanitization = true,
  sanitizationLevel = 'rich',
  onSanitizationReport,
}) => {
  const [sanitizationWarning, setSanitizationWarning] = useState<string | null>(null);
  const [lastSanitizedValue, setLastSanitizedValue] = useState<string>('');
  const quillRef = useRef<ReactQuill>(null);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],

      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction

      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],

      ['link', 'image'],                                // link and image
      ['clean']                                         // remove formatting button
    ],
    clipboard: {
      // Sanitize pasted content
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background',
    'script', 'code-block', 'direction', 'align'
  ];

  // Handle content change with sanitization
  const handleChange = useCallback((content: string) => {
    if (!enableSanitization) {
      onChange(content);
      return;
    }

    // Get sanitization config based on level
    const config = SANITIZATION_CONFIGS[sanitizationLevel.toUpperCase() as keyof typeof SANITIZATION_CONFIGS];

    // Get sanitization report
    const report = contentSanitizer.getSanitizationReport(content, config);

    if (report.isModified) {
      setSanitizationWarning(`Content was sanitized: ${report.removedElements.join(', ')}`);
      setLastSanitizedValue(report.sanitized);

      // Call report callback if provided
      if (onSanitizationReport) {
        onSanitizationReport(report);
      }

      // Use sanitized content
      onChange(report.sanitized);
    } else {
      setSanitizationWarning(null);
      onChange(content);
    }
  }, [enableSanitization, sanitizationLevel, onChange, onSanitizationReport]);

  // Clear warning after 5 seconds
  useEffect(() => {
    if (sanitizationWarning) {
      const timer = setTimeout(() => {
        setSanitizationWarning(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sanitizationWarning]);

  const getSanitizationIcon = () => {
    if (sanitizationWarning) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Security Status Bar */}
      {enableSanitization && (
        <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-t-md">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">
              XSS Protection: <span className="font-medium capitalize">{sanitizationLevel}</span>
            </span>
            {getSanitizationIcon()}
          </div>

          {sanitizationWarning && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{sanitizationWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={`h-96 mb-12 ${enableSanitization ? 'rounded-t-none' : ''}`}
        style={{
          borderTopLeftRadius: enableSanitization ? '0' : undefined,
          borderTopRightRadius: enableSanitization ? '0' : undefined,
        }}
      />

      {/* Security Info */}
      {enableSanitization && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            <span>
              Content is automatically sanitized to prevent XSS attacks.
              Level: <strong>{sanitizationLevel}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentEditor;
