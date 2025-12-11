
import React from 'react';
import { Leaf, RefreshCw, Search, DollarSign, Coins } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lastSessionCost?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  onRefresh, 
  isLoading, 
  searchQuery, 
  onSearchChange,
  lastSessionCost
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="bg-green-100 p-2 rounded-full">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
            Eco<span className="text-green-600">Pulse</span>
          </h1>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search specific company..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onRefresh()}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Cost Indicator */}
          {lastSessionCost !== undefined && (
            <div className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-100 text-xs font-medium" title="Total API Cost for this session">
              <Coins className="w-3.5 h-3.5" />
              <span>CHF {lastSessionCost.toFixed(3)}</span>
            </div>
          )}

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
            <span>{isLoading ? 'Updating...' : searchQuery ? 'Search' : 'Refresh News'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
