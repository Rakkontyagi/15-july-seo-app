
import React from 'react';
import { Button } from './Button'; // Assuming a Button component exists

interface QuickGenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

const QuickGenerateButton: React.FC<QuickGenerateButtonProps> = ({
  onClick,
  isLoading = false,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded ${className}`}
    >
      {isLoading ? 'Generating...' : 'Quick Generate Content'}
    </Button>
  );
};

export default QuickGenerateButton;
