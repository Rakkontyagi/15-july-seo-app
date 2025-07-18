

import React, { useState } from 'react';
import { Input } from './Input'; // Assuming an Input component exists
import { Button } from './Button'; // Assuming a Button component exists
import { Textarea } from './Textarea'; // Assuming a Textarea component exists

interface BulkGenerationFormProps {
  onSubmit: (data: { keywords: string[]; wordCount: number; tone: string }) => void;
  isLoading?: boolean;
  className?: string;
}

const BulkGenerationForm: React.FC<BulkGenerationFormProps> = ({
  onSubmit,
  isLoading = false,
  className,
}) => {
  const [keywordsInput, setKeywordsInput] = useState('');
  const [wordCount, setWordCount] = useState(1000);
  const [tone, setTone] = useState('informative');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsInput.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keywords.length > 0 && wordCount > 0 && tone) {
      onSubmit({ keywords, wordCount, tone });
    } else {
      alert('Please enter keywords, word count, and tone.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Bulk Content Generation</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="keywordsInput" className="block text-sm font-medium text-gray-700 mb-1">
            Keywords (one per line)
          </label>
          <Textarea
            id="keywordsInput"
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            placeholder="Enter keywords, one per line (e.g.,\nSEO best practices\nContent marketing trends)"
            rows={5}
            required
          />
        </div>
        <div>
          <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-1">
            Word Count per Article
          </label>
          <Input
            id="wordCount"
            type="number"
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            min={100}
            max={5000}
            required
          />
        </div>
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
            Tone
          </label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="informative">Informative</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="persuasive">Persuasive</option>
          </select>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Generating...' : 'Generate Content in Bulk'}
        </Button>
      </div>
    </form>
  );
};

export default BulkGenerationForm;
