
import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { fetchBioplasticNews, generateDeepDiveReport, generateNewsImage } from './services/geminiService';
import { NewsItem } from './types';
import { AlertCircle, Search } from 'lucide-react';

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionCost, setSessionCost] = useState<number>(0);

  const [imageLoadingStates, setImageLoadingStates] = useState<Set<number>>(new Set());
  const [reportLoadingStates, setReportLoadingStates] = useState<Set<number>>(new Set());

  const loadNews = async (query: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBioplasticNews(query);
      setNews(data.items);
      if (data.estimatedCost) {
        setSessionCost(prev => prev + data.estimatedCost!);
      }
    } catch (err) {
      setError("Failed to fetch news. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleRefresh = () => {
    loadNews(searchQuery);
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
      const { content, cost } = await generateDeepDiveReport(news[index]);
      setSessionCost(prev => prev + cost);
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${news[index].company.toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      const finished = new Set(reportLoadingStates);
      finished.delete(index);
      setReportLoadingStates(finished);
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
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-80 animate-pulse" />
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item, index) => (
              <NewsCard 
                key={index} 
                item={item} 
                onUpdateUrl={() => {}}
                onGenerateImage={() => handleGenerateImage(index)}
                isImageLoading={imageLoadingStates.has(index)}
                onGenerateReport={() => handleGenerateReport(index)}
                isReportGenerating={reportLoadingStates.has(index)}
                onResearchContact={() => {}}
                isContactLoading={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No news found</h3>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          EcoPulse Bioplastic Intelligence Dashboard
        </div>
      </footer>
    </div>
  );
};

export default App;
