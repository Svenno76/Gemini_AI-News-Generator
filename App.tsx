import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { NewsCard } from './components/NewsCard';
import { fetchBioplasticNews, generateDeepDiveReport, generateNewsImage, researchNewsContact, extractNewsFromUrl } from './services/geminiService';
import { NewsItem, GroundingChunk } from './types';
import { AlertCircle, Info, Search } from 'lucide-react';

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cost State - Initialized to 0 to support accumulation
  const [sessionCost, setSessionCost] = useState<number>(0);

  // Loading States for individual items
  const [imageLoadingStates, setImageLoadingStates] = useState<Set<number>>(new Set());
  const [reportLoadingStates, setReportLoadingStates] = useState<Set<number>>(new Set());
  const [contactLoadingStates, setContactLoadingStates] = useState<Set<number>>(new Set());
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);

  const loadNews = async (query: string = '') => {
    setLoading(true);
    setError(null);
    setNews([]);
    setGroundingChunks([]);
    setRawResponse(undefined);
    setImageLoadingStates(new Set());
    setReportLoadingStates(new Set());
    setContactLoadingStates(new Set());
    
    // We do NOT reset sessionCost here, to allow accumulation per user session.

    try {
      const data = await fetchBioplasticNews(query);
      if (data.items.length > 0) {
        setNews(data.items);
      } else {
        setRawResponse(data.rawText);
      }
      setGroundingChunks(data.groundingChunks);
      
      // Accumulate cost
      if (data.estimatedCost) {
        setSessionCost(prev => prev + data.estimatedCost!);
      }
    } catch (err) {
      setError("Failed to fetch news. Please check your API key configuration or try again later.");
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

  const handleUpdateUrl = (index: number, newUrl: string) => {
    const updatedNews = [...news];
    updatedNews[index] = { ...updatedNews[index], userUrl: newUrl };
    setNews(updatedNews);
  };

  const downloadFile = (href: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGenerateImage = async (index: number) => {
    if (imageLoadingStates.has(index)) return;

    const newLoading = new Set(imageLoadingStates);
    newLoading.add(index);
    setImageLoadingStates(newLoading);

    try {
      const item = news[index];
      const { imageUrl, cost } = await generateNewsImage(item);
      
      // Update session cost
      setSessionCost(prev => prev + cost);
      
      if (imageUrl) {
        const updatedNews = [...news];
        updatedNews[index] = { ...updatedNews[index], generatedImage: imageUrl };
        setNews(updatedNews);

        // Auto download the PNG
        const safeTitle = item.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        downloadFile(imageUrl, `${safeTitle}_illustration.png`);
      }
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      const finishedLoading = new Set(imageLoadingStates);
      finishedLoading.delete(index);
      setImageLoadingStates(finishedLoading);
    }
  };

  const handleGenerateReport = async (index: number) => {
    if (reportLoadingStates.has(index)) return;

    const newLoading = new Set(reportLoadingStates);
    newLoading.add(index);
    setReportLoadingStates(newLoading);

    try {
      const item = news[index];
      const { content, cost } = await generateDeepDiveReport(item);
      
      // Update session cost
      setSessionCost(prev => prev + cost);
      
      const safeTitle = item.title.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
      const fileName = `${item.date}-${safeTitle}.md`;
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      downloadFile(url, fileName);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Report generation failed", err);
      setError("Failed to generate report.");
    } finally {
      const finishedLoading = new Set(reportLoadingStates);
      finishedLoading.delete(index);
      setReportLoadingStates(finishedLoading);
    }
  };

  const handleResearchContact = async (index: number) => {
    if (contactLoadingStates.has(index)) return;

    const newLoading = new Set(contactLoadingStates);
    newLoading.add(index);
    setContactLoadingStates(newLoading);

    try {
      const item = news[index];
      const { contacts, cost } = await researchNewsContact(item);
      
      setSessionCost(prev => prev + cost);
      
      if (contacts && contacts.length > 0) {
        const updatedNews = [...news];
        updatedNews[index] = { 
          ...updatedNews[index], 
          contacts: contacts
        };
        setNews(updatedNews);
      } else {
        console.log("No contacts found for", item.title);
      }
    } catch (err) {
      console.error("Contact research failed", err);
    } finally {
      const finishedLoading = new Set(contactLoadingStates);
      finishedLoading.delete(index);
      setContactLoadingStates(finishedLoading);
    }
  };

  const handleUrlAnalysis = async (url: string, action: 'research' | 'report') => {
    setIsUrlProcessing(true);
    try {
      // 1. Extract metadata from URL
      const { item, cost } = await extractNewsFromUrl(url);
      setSessionCost(prev => prev + cost);

      if (!item) {
        alert("Could not analyze this URL. Please ensure it is a valid news article.");
        return;
      }

      const newItem = { ...item, userUrl: url };
      
      // Add the new item to the top of the list
      // Note: We use functional update to ensure we have the latest list
      setNews(prev => [newItem, ...prev]);

      // 2. Perform the requested action on this new item
      // Since state update is async, we perform the action on `newItem` directly and then update state again
      
      if (action === 'research') {
        const { contacts, cost: researchCost } = await researchNewsContact(newItem);
        setSessionCost(prev => prev + researchCost);
        
        if (contacts && contacts.length > 0) {
           const updatedItem = {
             ...newItem,
             contacts
           };
           // Update the first item in the list (which is our new item)
           setNews(prev => [updatedItem, ...prev.slice(1)]);
        }
      } else if (action === 'report') {
        // Generate and download report
        const { content, cost: reportCost } = await generateDeepDiveReport(newItem);
        setSessionCost(prev => prev + reportCost);
        
        const safeTitle = newItem.title.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
        const fileName = `${newItem.date}-${safeTitle}.md`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const downloadUrl = URL.createObjectURL(blob);
        downloadFile(downloadUrl, fileName);
        URL.revokeObjectURL(downloadUrl);
      }

    } catch (e) {
      console.error("Manual URL analysis failed", e);
      setError("Failed to process the provided URL.");
    } finally {
      setIsUrlProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        onRefresh={handleRefresh} 
        isLoading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        lastSessionCost={sessionCost}
      />
      
      <UrlInput 
        onAnalyzeAndAction={handleUrlAnalysis} 
        isProcessing={isUrlProcessing}
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white h-80 rounded-xl border border-gray-100 p-5">
                <div className="flex justify-between mb-4">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2 mb-8">
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
                </div>
                <div className="mt-auto h-10 w-full bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Success State - Structured News */}
        {!loading && !error && news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}

        {/* Success State - Unstructured Fallback (Raw Text) */}
        {!loading && !error && !news.length && rawResponse && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-orange-100 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4 text-orange-600">
                    <Info className="w-5 h-5" />
                    <h2 className="font-semibold">Unstructured Report</h2>
                </div>
                <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap font-sans">
                    {rawResponse}
                </div>
            </div>
          </div>
        )}

        {/* Empty State for Search */}
        {!loading && !error && news.length === 0 && !rawResponse && (
           <div className="text-center py-20">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                 <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No stories found</h3>
              <p className="text-gray-500 mt-1">Try searching for a company or paste a URL above.</p>
           </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            Powered by Google Gemini 2.5 Flash & Search Grounding
          </p>
          <p className="text-sm text-gray-400 mt-2 md:mt-0">
            © {new Date().getFullYear()} EcoPulse
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;