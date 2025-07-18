
import React from 'react';

interface InlineSuggestionsProps {
  suggestions: string[];
  className?: string;
}

const InlineSuggestions: React.FC<InlineSuggestionsProps> = ({
  suggestions,
  className,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm bg-blue-50 ${className}`}>
      <h3 className="text-lg font-semibold mb-3 text-blue-800">Optimization Suggestions</h3>
      <ul className="list-disc list-inside space-y-1 text-blue-700">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="text-sm">
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InlineSuggestions;
