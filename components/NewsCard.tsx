import React from 'react';
import { Calendar, Building2, ExternalLink, Link as LinkIcon, Image as ImageIcon, Loader2, FileText, Download, UserSearch } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
  onUpdateUrl: (url: string) => void;
  onGenerateImage: () => void;
  isImageLoading: boolean;
  onGenerateReport: () => void;
  isReportGenerating: boolean;
  onResearchContact: () => void;
  isContactLoading: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  item, 
  onUpdateUrl,
  onGenerateImage,
  isImageLoading,
  onGenerateReport,
  isReportGenerating,
  onResearchContact,
  isContactLoading
}) => {
  // Prioritize the user URL, then direct URL, then verification URL
  const displayUrl = item.userUrl && item.userUrl.trim() !== '' ? item.userUrl : (item.url || item.verificationUrl);

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Image Section */}
      {item.generatedImage ? (
        <div className="w-full h-48 overflow-hidden border-b border-gray-100 relative group-image">
          <img 
            src={item.generatedImage} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
      ) : null}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 pr-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
            <Building2 className="w-3 h-3 mr-1" />
            {item.company}
          </span>
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            {item.date}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-green-700 transition-colors">
          {item.title}
        </h3>
        
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {item.description}
        </p>

        <div className="mt-auto">
          {/* Contact Info Display */}
          {item.contacts && item.contacts.length > 0 && (
            <div className="mb-3 pt-3 border-t border-gray-100 text-sm">
              <span className="font-bold text-gray-900 block mb-1">Contacts: </span>
              <div className="flex flex-col gap-1">
                {item.contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center text-sm">
                    {contact.linkedin ? (
                      <a 
                        href={contact.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline hover:text-blue-800 flex items-center gap-1"
                        title="Open LinkedIn"
                      >
                         {contact.name}{contact.title ? `, ${contact.title}` : ''}
                      </a>
                    ) : (
                      <span className="text-gray-700">
                        {contact.name}{contact.title ? `, ${contact.title}` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Source Input */}
          <div className={`${item.contacts && item.contacts.length > 0 ? 'pt-2' : 'pt-4 border-t border-gray-100'}`}>
            <label className="flex items-center text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
              <LinkIcon className="w-3 h-3 mr-1" />
              Source URL Override
            </label>
            <input
              type="text"
              placeholder="Paste verified source link..."
              value={item.userUrl || ''}
              onChange={(e) => onUpdateUrl(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Actions Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
        
        {/* Source Link */}
        <div className="flex-1 min-w-0">
          {displayUrl ? (
            <a 
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-xs truncate max-w-full"
              title={displayUrl}
            >
              <ExternalLink className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">Read Story</span>
            </a>
          ) : (
            <span className="text-xs text-gray-400 italic">No link available</span>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Research Contact Button */}
          <button
            onClick={onResearchContact}
            disabled={isContactLoading}
            className={`p-2 rounded-lg transition-all border flex items-center justify-center
              ${isContactLoading
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm'}`}
            title="Research Contacts"
          >
            {isContactLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserSearch className="w-4 h-4" />
            )}
          </button>

          {/* Generate Report Button */}
          <button
            onClick={onGenerateReport}
            disabled={isReportGenerating}
            className={`p-2 rounded-lg transition-all border flex items-center justify-center
              ${isReportGenerating 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 shadow-sm'}`}
            title="Generate & Download Report (MD)"
          >
            {isReportGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </button>

          {/* Generate Image Button */}
          {!item.generatedImage ? (
            <button
              onClick={onGenerateImage}
              disabled={isImageLoading}
              className={`p-2 rounded-lg transition-all border flex items-center justify-center
                ${isImageLoading 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shadow-sm'}`}
              title="Generate & Download Image"
            >
              {isImageLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </button>
          ) : (
            <button
               onClick={() => {
                 const a = document.createElement('a');
                 a.href = item.generatedImage!;
                 a.download = `${item.title.substring(0,20).replace(/\s+/g, '_')}_illustration.png`;
                 document.body.appendChild(a);
                 a.click();
                 document.body.removeChild(a);
               }}
               className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
               title="Download Image Again"
            >
               <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};