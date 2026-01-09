
import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { CategoryFilter } from './components/CategoryFilter';
import { TimeRangeSlider } from './components/TimeRangeSlider';
import { UrlInput } from './components/UrlInput';
import { SourceList } from './components/SourceList';
import { ApprovalModal } from './components/ApprovalModal';
import { 
  fetchBioplasticNews, 
  generateDeepDiveReport, 
  generateNewsImage, 
  researchNewsContact, 
  extractNewsFromUrl 
} from './services/geminiService';
import { uploadToGitHub } from './services/githubService';
import { NewsItem, GroundingChunk, NewsCategory, GeneratedReport, GitHubConfig } from './types';
import { AlertCircle, Search, Sparkles, Info } from 'lucide-react';

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('All News');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  const [sessionCost, setSessionCost] = useState<number>(0);
  const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);

  const [imageLoadingStates, setImageLoadingStates] = useState<Set<number>>(new Set());
  const [reportLoadingStates, setReportLoadingStates] = useState<Set<number>>(new Set());
  const [contactLoadingStates, setContactLoadingStates] = useState<Set<number>>(new Set());
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [pendingReports, setPendingReports] = useState<GeneratedReport[]>([]);

  const loadNews = async (query: string = '', category: NewsCategory = 'All News', days: number = 30) => {
    setLoading(true);
    setError(null);
    setRawResponse(undefined);
    try {
      const data = await fetchBioplasticNews(query, category, days);
      setNews(data.items);
      setGroundingChunks(data.groundingChunks || []);
      if (data.estimatedCost) setSessionCost(prev => prev + data.estimatedCost!);
      if (data.items.length === 0 && data.rawText) setRawResponse(data.rawText);
    } catch (err) {
      setError("Intelligence engine busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(searchQuery, selectedCategory, timeRangeDays);
  }, [selectedCategory, timeRangeDays]);

  const handleRefresh = () => loadNews(searchQuery, selectedCategory, timeRangeDays);

  const handleUpdateUrl = (index: number, newUrl: string) => {
    const updated = [...news];
    updated[index] = { ...updated[index], userUrl: newUrl };
    setNews(updated);
  };

  const downloadFile = (href: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      if (href.startsWith('blob:')) URL.revokeObjectURL(href);
    }, 150);
  };

  const handleGenerateImage = async (index: number) => {
    const newLoading = new Set(imageLoadingStates);
    newLoading.add(index);
    setImageLoadingStates(newLoading);
    try {
      const { imageUrl, cost } = await generateNewsImage(news[index]);
      setSessionCost(prev => prev + cost);
      if (imageUrl) {
        const updated = [...news];
        updated[index] = { ...updated[index], generatedImage: imageUrl };
        setNews(updated);
      }
    } finally {
      const finished = new Set(imageLoadingStates);
      finished.delete(index);
      setImageLoadingStates(finished);
    }
  };

  const handleGenerateReport = async (index: number) => {
    const newLoading = new Set(reportLoadingStates);
    newLoading.add(index);
    setReportLoadingStates(newLoading);
    try {
      const item = news[index];
      const { content, cost } = await generateDeepDiveReport(item);
      setSessionCost(prev => prev + cost);
      
      const safeHeadline = item.title.toLowerCase().replace(/[^a-z0-9]/gi, '-').substring(0, 60);
      const fileName = `${item.date}-${safeHeadline}.md`;
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const reportUrl = URL.createObjectURL(blob);
      downloadFile(reportUrl, fileName);

      setPendingReports([{
        title: item.title,
        fileName,
        content,
        status: 'pending'
      }]);
      setPublishModalOpen(true);
    } finally {
      const finished = new Set(reportLoadingStates);
      finished.delete(index);
      setReportLoadingStates(finished);
    }
  };

  const handleResearchContact = async (index: number) => {
    const newLoading = new Set(contactLoadingStates);
    newLoading.add(index);
    setContactLoadingStates(newLoading);
    try {
      const { contacts, cost } = await researchNewsContact(news[index]);
      setSessionCost(prev => prev + cost);
      if (contacts && contacts.length > 0) {
        const updated = [...news];
        updated[index] = { ...updated[index], contacts };
        setNews(updated);
      }
    } finally {
      const finished = new Set(contactLoadingStates);
      finished.delete(index);
      setContactLoadingStates(finished);
    }
  };

  const handleUrlAnalysis = async (url: string, action: 'research' | 'report') => {
    setIsUrlProcessing(true);
    try {
      const { item, cost } = await extractNewsFromUrl(url);
      setSessionCost(prev => prev + cost);
      
      if (!item || !item.title) {
        alert("Could not extract news details from this URL.");
        return;
      }

      const newItem = { ...item, userUrl: url };
      setNews(prev => [newItem, ...prev]);

      if (action === 'research') {
        const { contacts, cost: cCost } = await researchNewsContact(newItem);
        setSessionCost(prev => prev + cCost);
        setNews(prev => [{ ...newItem, contacts }, ...prev.slice(1)]);
      } else {
        const { content, cost: rCost } = await generateDeepDiveReport(newItem);
        setSessionCost(prev => prev + rCost);
        const safeHeadline = newItem.title.toLowerCase().replace(/[^a-z0-9]/gi, '-').substring(0, 60);
        const fileName = `${newItem.date}-${safeHeadline}.md`;
        downloadFile(URL.createObjectURL(new Blob([content], { type: 'text/markdown' })), fileName);
        setPendingReports([{ title: newItem.title, fileName, content, status: 'pending' }]);
        setPublishModalOpen(true);
      }
    } catch (err) {
      alert("Error analyzing URL.");
    } finally {
      setIsUrlProcessing(false);
    }
  };

  const handleGitHubPublish = async (config: GitHubConfig) => {
    const updatedReports = [...pendingReports];
    for (let i = 0; i < updatedReports.length; i++) {
      try {
        updatedReports[i].status = 'uploading';
        setPendingReports([...updatedReports]);
        await uploadToGitHub(config, updatedReports[i].fileName, updatedReports[i].content);
        updatedReports[i].status = 'success';
      } catch (e: any) {
        updatedReports[i].status = 'error';
        updatedReports[i].errorMessage = e.message;
      }
      setPendingReports([...updatedReports]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        onRefresh={handleRefresh} 
        isLoading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        lastSessionCost={sessionCost}
      />
      
      <div className="glass sticky top-16 z-40 border-b border-slate-200 shadow-sm">
        <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} isLoading={loading} />
        <TimeRangeSlider days={timeRangeDays} onDaysChange={setTimeRangeDays} isLoading={loading} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        <UrlInput onAnalyzeAndAction={handleUrlAnalysis} isProcessing={isUrlProcessing} />
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-96 animate-pulse" />
            ))}
          </div>
        ) : news.length > 0 ? (
          <>
            <div className="flex items-center space-x-2 mb-6 ml-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Latest Insights Found ({news.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item, index) => (
                <NewsCard 
                  key={index} 
                  item={item} 
                  onUpdateUrl={(url) => handleUpdateUrl(index, url)}
                  onGenerateImage={() => handleGenerateImage(index)}
                  isImageLoading={imageLoadingStates.has(index)}
                  onGenerateReport={() => handleGenerateReport(index)}
                  isReportGenerating={reportLoadingStates.has(index)}
                  onResearchContact={() => handleResearchContact(index)}
                  isContactLoading={contactLoadingStates.has(index)}
                />
              ))}
            </div>
            <SourceList chunks={groundingChunks} />
          </>
        ) : rawResponse ? (
          <div className="bg-white rounded-2xl border border-orange-100 p-8 shadow-sm max-w-4xl mx-auto">
            <div className="flex items-center text-orange-600 mb-6">
              <Info className="w-6 h-6 mr-3" />
              <h2 className="text-xl font-bold">Search Synthesis</h2>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {rawResponse}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No results detected</h3>
            <p className="text-slate-500 px-8">Try adjusting your filters or expanding the time horizon.</p>
          </div>
        )}
      </main>

      <ApprovalModal 
        isOpen={publishModalOpen} 
        onClose={() => setPublishModalOpen(false)} 
        reports={pendingReports} 
        onUpload={handleGitHubPublish} 
      />

      <footer className="bg-white border-t border-slate-200 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-slate-900 tracking-tight">EcoPulse Bioplastic Intelligence</p>
          <p className="text-xs text-slate-400 mt-1">Real-time data sourced via Google Search Grounding</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
