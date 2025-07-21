
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  majorMarkets?: string[];
  placeholder?: string;
  className?: string;
}

const DEFAULT_MAJOR_MARKETS = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Japan', 'Brazil', 'United Arab Emirates',
];

const LocationSelect: React.FC<LocationSelectProps> = ({
  value,
  onChange,
  majorMarkets = DEFAULT_MAJOR_MARKETS,
  placeholder = 'Select or enter location',
  className,
}) => {
  const [isCustom, setIsCustom] = useState(!majorMarkets.includes(value) && value !== '');
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (!majorMarkets.includes(value) && value !== '') {
      setIsCustom(true);
      setInputValue(value);
    } else {
      setIsCustom(false);
      setInputValue(value);
    }
  }, [value, majorMarkets]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'custom') {
      setIsCustom(true);
      onChange(''); // Clear value for custom input
      setInputValue('');
    } else {
      setIsCustom(false);
      onChange(selectedValue);
      setInputValue(selectedValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <select
        value={isCustom ? 'custom' : value}
        onChange={handleSelectChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {majorMarkets.map((market) => (
          <option key={market} value={market}>
            {market}
          </option>
        ))}
        <option value="custom">Other (specify)</option>
      </select>

      {isCustom && (
        <input
          type="text"
          value={inputValue}
          onChange={handleCustomInputChange}
          placeholder="Enter custom location (e.g., Dubai, UAE)"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
};

export default LocationSelect;
