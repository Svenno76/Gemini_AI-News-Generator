
import React from 'react';
import { NewsCategory } from '../types';
import { 
  Globe, 
  Handshake, 
  BarChart3, 
  Factory, 
  Microscope, 
  Rocket, 
  Coins, 
  Scale, 
  Leaf, 
  Waves, 
  Package, 
  RefreshCcw,
  Zap
} from 'lucide-react';

const CATEGORIES: { label: NewsCategory; icon: React.ReactNode }[] = [
  { label: 'All News', icon: <Globe className="w-3.5 h-3.5" /> },
  { label: 'M&A', icon: <Handshake className="w-3.5 h-3.5" /> },
  { label: 'Annual / Quarterly Report', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { label: 'Partnerships', icon: <Zap className="w-3.5 h-3.5" /> },
  { label: 'Plant Announcements', icon: <Factory className="w-3.5 h-3.5" /> },
  { label: 'R&D News', icon: <Microscope className="w-3.5 h-3.5" /> },
  { label: 'Start-ups', icon: <Rocket className="w-3.5 h-3.5" /> },
  { label: 'Funding Rounds', icon: <Coins className="w-3.5 h-3.5" /> },
  { label: 'Regulatory & Policy', icon: <Scale className="w-3.5 h-3.5" /> },
  { label: 'Bio-based Feedstocks', icon: <Leaf className="w-3.5 h-3.5" /> },
  { label: 'Marine Bioplastics', icon: <Waves className="w-3.5 h-3.5" /> },
  { label: 'Packaging Innovation', icon: <Package className="w-3.5 h-3.5" /> },
  { label: 'Circular Economy', icon: <RefreshCcw className="w-3.5 h-3.5" /> },
];

interface CategoryFilterProps {
  selectedCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  isLoading: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onSelectCategory,
  isLoading
}) => {
  return (
    <div className="w-full bg-white/50 backdrop-blur-sm border-b border-gray-100 py-3 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              disabled={isLoading}
              onClick={() => onSelectCategory(cat.label)}
              className={`
                flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300
                ${selectedCategory === cat.label 
                  ? 'bg-green-600 text-white shadow-md shadow-green-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:bg-green-50'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
            >
              <span className={selectedCategory === cat.label ? 'text-white' : 'text-green-600'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
