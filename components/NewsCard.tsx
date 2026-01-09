
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
  const displayUrl = item.userUrl && item.userUrl.trim() !== '' ? item.userUrl : (item.url || item.verificationUrl);

  return (
    <div className="animate-card group relative rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Visual Header */}
      {item.generatedImage ? (
        <div className="w-full h-44 overflow-hidden relative border-b border-slate-100">
          <img 
            src={item.generatedImage} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
            {item.company}
          </span>
          <div className="flex items-center text-xs text-slate-400 font-medium">
            <Calendar className="w-3 h-3 mr-1" />
            {item.date}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug group-hover:text-emerald-700 transition-colors">
          {item.title}
        </h3>
        
        <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-4">
          {item.description}
        </p>

        <div className="mt-auto space-y-4">
          {/* Contact Display */}
          {item.contacts && item.contacts.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Key Contacts</span>
              <div className="space-y-2">
                {item.contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
                    {contact.linkedin ? (
                      <a 
                        href={contact.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                         {contact.name}{contact.title ? ` (${contact.title})` : ''}
                      </a>
                    ) : (
                      <span className="text-slate-700 font-medium">{contact.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URL Override */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              Refine Source
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Paste direct press release link..."
                value={item.userUrl || ''}
                onChange={(e) => onUpdateUrl(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex-1">
          {displayUrl ? (
            <a 
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-bold text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              ORIGINAL SOURCE
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">No source</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResearchContact}
            disabled={isContactLoading}
            className={`p-2 rounded-lg transition-all border
              ${isContactLoading
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm'}`}
            title="Research Contacts"
          >
            {isContactLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserSearch className="w-4 h-4" />}
          </button>

          <button
            onClick={onGenerateReport}
            disabled={isReportGenerating}
            className={`p-2 rounded-lg transition-all border
              ${isReportGenerating 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm'}`}
            title="Download Intelligence Report"
          >
            {isReportGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          </button>

          {!item.generatedImage && (
            <button
              onClick={onGenerateImage}
              disabled={isImageLoading}
              className={`p-2 rounded-lg transition-all border
                ${isImageLoading 
                  ? 'bg-violet-100 text-violet-700 border-violet-200' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 shadow-sm'}`}
              title="Generate Visual"
            >
              {isImageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </button>
          )}
          
          {item.generatedImage && (
            <button
               onClick={() => {
                 const a = document.createElement('a');
                 a.href = item.generatedImage!;
                 a.download = `eco_${item.company.toLowerCase()}_${item.date}.png`;
                 document.body.appendChild(a);
                 a.click();
                 document.body.removeChild(a);
               }}
               className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
               title="Download Visual"
            >
               <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};