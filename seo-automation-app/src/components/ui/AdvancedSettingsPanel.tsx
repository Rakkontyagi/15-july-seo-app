
import React from 'react';
import { Input } from './Input'; // Assuming an Input component exists
import { Select } from './Select'; // Assuming a Select component exists

interface AdvancedSettingsPanelProps {
  wordCount: number;
  onWordCountChange: (count: number) => void;
  tone: string;
  onToneChange: (tone: string) => void;
  // Add other optimization parameters as needed
  className?: string;
}

const toneOptions = [
  { label: 'Professional', value: 'professional' },
  { label: 'Casual', value: 'casual' },
  { label: 'Informative', value: 'informative' },
  { label: 'Persuasive', value: 'persuasive' },
  { label: 'Humorous', value: 'humorous' },
];

const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({
  wordCount,
  onWordCountChange,
  tone,
  onToneChange,
  className,
}) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Advanced Settings</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-1">
            Word Count
          </label>
          <Input
            id="wordCount"
            type="number"
            value={wordCount}
            onChange={(e) => onWordCountChange(Number(e.target.value))}
            min={100}
            max={5000}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
            Tone
          </label>
          <Select
            id="tone"
            value={tone}
            onChange={(e) => onToneChange(e.target.value)}
            options={toneOptions}
            className="w-full"
          />
        </div>
        {/* Add more advanced settings here */}
      </div>
    </div>
  );
};

export default AdvancedSettingsPanel;
