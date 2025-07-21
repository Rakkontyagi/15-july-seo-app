'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Bold, Italic, Underline, List, Link } from 'lucide-react';
import { Button } from './button';
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

export const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your content here...',
  className = '',
  enableSanitization = true,
  sanitizationLevel = 'rich',
  onSanitizationReport,
}) => {
  const [sanitizationWarning, setSanitizationWarning] = useState<string | null>(null);
  const [lastSanitizedValue, setLastSanitizedValue] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  // Handle content change with sanitization
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.innerHTML;
    
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

  // Format text commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current?.focus();
  };

  // Toolbar buttons
  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    value, 
    title 
  }: { 
    icon: React.ComponentType<any>; 
    command: string; 
    value?: string; 
    title: string; 
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => execCommand(command, value)}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !isEditorFocused) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isEditorFocused]);

  // Clear warning after 5 seconds
  useEffect(() => {
    if (sanitizationWarning) {
      const timer = setTimeout(() => {
        setSanitizationWarning(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sanitizationWarning]);

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex items-center space-x-1">
        <ToolbarButton icon={Bold} command="bold" title="Bold" />
        <ToolbarButton icon={Italic} command="italic" title="Italic" />
        <ToolbarButton icon={Underline} command="underline" title="Underline" />
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h2')}
          title="Heading 2"
          className="h-8 px-2 text-sm"
        >
          H2
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h3')}
          title="Heading 3"
          className="h-8 px-2 text-sm"
        >
          H3
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCommand('createLink', url);
          }}
          title="Insert Link"
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>

        {enableSanitization && (
          <div className="ml-auto flex items-center">
            <Shield className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-xs text-gray-600">
              {sanitizationLevel.charAt(0).toUpperCase() + sanitizationLevel.slice(1)} Mode
            </span>
          </div>
        )}
      </div>

      {/* Sanitization Warning */}
      {sanitizationWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-2 flex items-center">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
          <span className="text-sm text-yellow-800">{sanitizationWarning}</span>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
        style={{ whiteSpace: 'pre-wrap' }}
        onInput={handleContentChange}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        data-placeholder={placeholder}
      />

      {/* Placeholder styling */}
      <style jsx>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default ContentEditor;