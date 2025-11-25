import React from 'react';
import { Calendar, Building2, ArrowUpRight, Check, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
  isSelected: boolean;
  onToggle: () => void;
  onUpdateUrl: (url: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, isSelected, onToggle, onUpdateUrl }) => {
  // Prioritize the user URL, then direct URL, then verification URL
  const displayUrl = item.userUrl && item.userUrl.trim() !== '' ? item.userUrl : (item.url || item.verificationUrl);

  return (
    <div 
      onClick={onToggle}
      className={`group relative rounded-xl border shadow-sm transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full
        ${isSelected 
          ? 'bg-green-100 border-green-500 ring-1 ring-green-500 shadow-md translate-y-[-2px]' 
          : 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 hover:shadow-lg hover:-translate-y-1'
        }`}
    >
      <div className="absolute top-4 right-4 z-10">
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200
          ${isSelected 
            ? 'bg-green-600 border-green-600 text-white' 
            : 'bg-white/50 border-yellow-300 text-transparent group-hover:border-green-400'
          }`}>
          <Check className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="p-5 flex-1">
        <div className="flex items-center justify-between mb-3 pr-6">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors
            ${isSelected ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
            <Building2 className="w-3 h-3 mr-1" />
            {item.company}
          </span>
        </div>
        <div className="flex items-center text-xs text-gray-500 mb-2">
            <Calendar className="w-3 h-3 mr-1" />
            {item.date}
        </div>
        
        <h3 className={`text-lg font-semibold mb-2 line-clamp-2 transition-colors
          ${isSelected ? 'text-green-900' : 'text-gray-900 group-hover:text-green-700'}`}>
          {item.title}
        </h3>
        
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
          {item.description}
        </p>

        {/* Manual Source Input */}
        <div onClick={(e) => e.stopPropagation()} className="mt-4">
          <label className="flex items-center text-xs text-gray-500 mb-1 font-medium">
            <LinkIcon className="w-3 h-3 mr-1" />
            Preferred Source URL (Optional)
          </label>
          <input
            type="text"
            placeholder="Paste your source link here..."
            value={item.userUrl || ''}
            onChange={(e) => onUpdateUrl(e.target.value)}
            className={`w-full text-xs px-2 py-1.5 rounded border focus:ring-1 outline-none transition-colors
              ${isSelected 
                ? 'bg-white border-green-300 focus:border-green-500 focus:ring-green-500' 
                : 'bg-white border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'}`}
          />
        </div>
      </div>
      
      <div className={`px-5 py-3 border-t flex items-center justify-between transition-colors
        ${isSelected ? 'bg-green-200/50 border-green-200' : 'bg-yellow-100/50 border-yellow-200'}`}>
        
        {displayUrl ? (
          <a 
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center text-blue-700 hover:text-blue-900 hover:underline font-medium text-xs z-20 max-w-[200px]"
            title={displayUrl}
          >
            <ExternalLink className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">Read at {item.source || 'Source'}</span>
          </a>
        ) : (
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
             Source: <span className="ml-1 text-gray-700 normal-case truncate max-w-[150px]">{item.source}</span>
          </span>
        )}

        <div className={`transition-opacity ${isSelected ? 'opacity-100 text-green-700' : 'opacity-0 group-hover:opacity-100 text-yellow-700'}`}>
            <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};