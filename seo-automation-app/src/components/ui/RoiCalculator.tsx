
import React, { useState } from 'react';
import { Input } from './Input'; // Assuming an Input component exists
import { Button } from './Button'; // Assuming a Button component exists

interface RoiCalculatorProps {
  className?: string;
}

const RoiCalculator: React.FC<RoiCalculatorProps> = ({
  className,
}) => {
  const [contentCost, setContentCost] = useState(0);
  const [trafficIncrease, setTrafficIncrease] = useState(0); // Percentage
  const [conversionRateIncrease, setConversionRateIncrease] = useState(0); // Percentage
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [existingTraffic, setExistingTraffic] = useState(0);
  const [existingConversionRate, setExistingConversionRate] = useState(0);
  const [calculatedRoi, setCalculatedRoi] = useState<number | null>(null);

  const calculateRoi = () => {
    // Convert percentages to decimals
    const trafficMultiplier = 1 + (trafficIncrease / 100);
    const conversionMultiplier = 1 + (conversionRateIncrease / 100);

    // Calculate new traffic and conversions
    const newTraffic = existingTraffic * trafficMultiplier;
    const newConversions = newTraffic * (existingConversionRate / 100) * conversionMultiplier;

    // Calculate new revenue
    const newRevenue = newConversions * averageOrderValue;

    // Calculate ROI
    if (contentCost > 0) {
      const roi = ((newRevenue - contentCost) / contentCost) * 100;
      setCalculatedRoi(roi);
    } else {
      setCalculatedRoi(null);
    }
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">ROI Calculator</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="contentCost" className="block text-sm font-medium text-gray-700 mb-1">
            Content Generation Cost ($)
          </label>
          <Input
            id="contentCost"
            type="number"
            value={contentCost}
            onChange={(e) => setContentCost(Number(e.target.value))}
            min={0}
          />
        </div>
        <div>
          <label htmlFor="existingTraffic" className="block text-sm font-medium text-gray-700 mb-1">
            Existing Monthly Organic Traffic
          </label>
          <Input
            id="existingTraffic"
            type="number"
            value={existingTraffic}
            onChange={(e) => setExistingTraffic(Number(e.target.value))}
            min={0}
          />
        </div>
        <div>
          <label htmlFor="trafficIncrease" className="block text-sm font-medium text-gray-700 mb-1">
            Traffic Increase (%) (e.g., 10 for 10%)
          </label>
          <Input
            id="trafficIncrease"
            type="number"
            value={trafficIncrease}
            onChange={(e) => setTrafficIncrease(Number(e.target.value))}
            min={0}
          />
        </div>
        <div>
          <label htmlFor="existingConversionRate" className="block text-sm font-medium text-gray-700 mb-1">
            Existing Conversion Rate (%)
          </label>
          <Input
            id="existingConversionRate"
            type="number"
            value={existingConversionRate}
            onChange={(e) => setExistingConversionRate(Number(e.target.value))}
            min={0}
            max={100}
          />
        </div>
        <div>
          <label htmlFor="conversionRateIncrease" className="block text-sm font-medium text-gray-700 mb-1">
            Conversion Rate Increase (%) (e.g., 5 for 5%)
          </label>
          <Input
            id="conversionRateIncrease"
            type="number"
            value={conversionRateIncrease}
            onChange={(e) => setConversionRateIncrease(Number(e.target.value))}
            min={0}
          />
        </div>
        <div>
          <label htmlFor="averageOrderValue" className="block text-sm font-medium text-gray-700 mb-1">
            Average Order Value ($)
          </label>
          <Input
            id="averageOrderValue"
            type="number"
            value={averageOrderValue}
            onChange={(e) => setAverageOrderValue(Number(e.target.value))}
            min={0}
          />
        </div>
        <Button onClick={calculateRoi} className="w-full">
          Calculate ROI
        </Button>
        {
          calculatedRoi !== null && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-lg font-semibold text-blue-800">
                Calculated ROI: {calculatedRoi.toFixed(2)}%
              </p>
              {
                calculatedRoi < 0 ? (
                  <p className="text-sm text-red-600">Consider optimizing content strategy or reducing costs.</p>
                ) : calculatedRoi > 0 ? (
                  <p className="text-sm text-green-600">Positive ROI! Your content is generating value.</p>
                ) : (
                  <p className="text-sm text-gray-600">ROI is neutral.</p>
                )
              }
            </div>
          )
        }
      </div>
    </div>
  );
};

export default RoiCalculator;
