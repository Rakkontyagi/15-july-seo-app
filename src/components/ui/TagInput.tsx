
import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder = 'Add tags...',
  className,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      onAddTag(inputValue.trim());
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      e.preventDefault();
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={`border border-gray-300 rounded-md p-2 flex flex-wrap items-center gap-2 ${className}`}>
      {tags.map((tag) => (
        <span key={tag} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center">
          {tag}
          <button
            type="button"
            onClick={() => onRemoveTag(tag)}
            className="ml-1 text-blue-800 hover:text-blue-900 focus:outline-none"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="flex-grow outline-none border-none bg-transparent text-sm"
      />
    </div>
  );
};

export default TagInput;
