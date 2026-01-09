
import React from 'react';
import { Clock } from 'lucide-react';

interface TimeRangeSliderProps {
  days: number;
  onDaysChange: (days: number) => void;
  isLoading: boolean;
}

const STEPS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '2 Months', days: 60 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
];

export const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({ days, onDaysChange, isLoading }) => {
  const currentIndex = STEPS.findIndex(s => s.days === days);

  return (
    <div className="w-full bg-white/30 backdrop-blur-sm border-b border-gray-100 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold">Time Horizon:</span>
            <span className="text-sm font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {STEPS[currentIndex]?.label || `${days} Days`}
            </span>
          </div>
          
          <div className="flex-1 max-w-xl w-full px-2">
            <input
              type="range"
              min="0"
              max={STEPS.length - 1}
              step="1"
              value={currentIndex === -1 ? 3 : currentIndex}
              disabled={isLoading}
              onChange={(e) => onDaysChange(STEPS[parseInt(e.target.value)].days)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 disabled:opacity-50"
            />
            <div className="flex justify-between mt-2 px-1">
              {STEPS.map((step, idx) => (
                <span 
                  key={step.days} 
                  className={`text-[10px] ${idx === currentIndex ? 'text-green-600 font-bold' : 'text-gray-400'}`}
                >
                  {step.label.split(' ')[0]}{step.label.includes('Week') ? 'w' : 'm'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
