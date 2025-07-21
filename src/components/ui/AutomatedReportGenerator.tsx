
import React, { useState } from 'react';
import { Button } from './Button'; // Assuming a Button component exists
import { Select } from './Select'; // Assuming a Select component exists

interface AutomatedReportGeneratorProps {
  onGenerateReport: (type: 'weekly' | 'monthly') => void;
  isLoading?: boolean;
  className?: string;
}

const reportTypes = [
  { label: 'Weekly Performance Summary', value: 'weekly' },
  { label: 'Monthly Performance Summary', value: 'monthly' },
];

const AutomatedReportGenerator: React.FC<AutomatedReportGeneratorProps> = ({
  onGenerateReport,
  isLoading = false,
  className,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<'weekly' | 'monthly'>('weekly');

  const handleGenerate = () => {
    onGenerateReport(selectedReportType);
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Automated Reporting</h3>
      <div className="flex flex-col space-y-3">
        <div>
          <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
            Select Report Type
          </label>
          <Select
            id="reportType"
            value={selectedReportType}
            onChange={(e) => setSelectedReportType(e.target.value as 'weekly' | 'monthly')}
            options={reportTypes}
            className="w-full"
          />
        </div>
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          {isLoading ? 'Generating Report...' : 'Generate Report'}
        </Button>
      </div>
    </div>
  );
};

export default AutomatedReportGenerator;
