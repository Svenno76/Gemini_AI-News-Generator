import React, { useState } from 'react';
import { UserSearch, FileText, Loader2, Link } from 'lucide-react';

interface UrlInputProps {
  onAnalyzeAndAction: (url: string, action: 'research' | 'report') => void;
  isProcessing: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyzeAndAction, isProcessing }) => {
  const [url, setUrl] = useState('');

  const handleAction = (action: 'research' | 'report') => {
    if (!url.trim()) return;
    onAnalyzeAndAction(url, action);
    setUrl('');
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm py-4">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Paste specific news article URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button
                onClick={() => handleAction('research')}
                disabled={isProcessing || !url.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
             >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserSearch className="w-4 h-4"/>}
                <span>Research Contact</span>
             </button>
             <button
                onClick={() => handleAction('report')}
                disabled={isProcessing || !url.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
             >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4"/>}
                <span>Create Story</span>
             </button>
          </div>
       </div>
    </div>
  );
};