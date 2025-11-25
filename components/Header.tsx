import React from 'react';
import { Leaf, RefreshCw, Download, FileText, X } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  selectedCount: number;
  onGenerateReports: () => void;
  isGenerating: boolean;
  onClearSelection: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onRefresh, 
  isLoading, 
  selectedCount, 
  onGenerateReports,
  isGenerating,
  onClearSelection
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-full">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Eco<span className="text-green-600">Pulse</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedCount > 0 ? (
            <div className="flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="hidden sm:flex items-center bg-green-50 text-green-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                <span className="mr-2 font-bold">{selectedCount}</span>
                selected
              </div>

              <button
                onClick={onClearSelection}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                onClick={onGenerateReports}
                disabled={isGenerating}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all duration-200 
                  ${isGenerating 
                    ? 'bg-green-100 text-green-800 cursor-wait' 
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md active:transform active:scale-95'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Generate Reports</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
                ${isLoading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Updating...' : 'Refresh News'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
