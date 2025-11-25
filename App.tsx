import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { fetchBioplasticNews, generateDeepDiveReport } from './services/geminiService';
import { NewsItem, GroundingChunk } from './types';
import { AlertCircle, Info } from 'lucide-react';
// @ts-ignore
import JSZip from 'jszip';

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection & Generation State
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    setNews([]);
    setGroundingChunks([]);
    setRawResponse(undefined);
    setSelectedIndices(new Set());

    try {
      const data = await fetchBioplasticNews();
      if (data.items.length > 0) {
        setNews(data.items);
      } else {
        setRawResponse(data.rawText);
      }
      setGroundingChunks(data.groundingChunks);
    } catch (err) {
      setError("Failed to fetch news. Please check your API key configuration or try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedIndices(newSelection);
  };

  const clearSelection = () => {
    setSelectedIndices(new Set());
  };

  const handleUpdateUrl = (index: number, newUrl: string) => {
    const updatedNews = [...news];
    updatedNews[index] = { ...updatedNews[index], userUrl: newUrl };
    setNews(updatedNews);
  };

  const handleGenerateReports = async () => {
    if (selectedIndices.size === 0) return;
    
    setIsGenerating(true);
    setGenerationProgress('Initializing research...');

    try {
      const selectedItems = Array.from(selectedIndices).map(idx => news[idx]);
      const zip = new JSZip();
      
      setGenerationProgress(`Researching ${selectedItems.length} stories...`);

      // Process reports
      const reports = await Promise.all(selectedItems.map(async (item) => {
        const content = await generateDeepDiveReport(item);
        // Sanitize filename: YYYY-MM-DD-[Title].md
        const safeTitle = item.title.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
        const fileName = `${item.date}-${safeTitle}.md`;
        return { fileName, content };
      }));

      // If only one report, download directly as .md
      if (reports.length === 1) {
        const { fileName, content } = reports[0];
        downloadFile(content, fileName, 'text/markdown');
      } else {
        // If multiple, zip them
        reports.forEach(report => {
          zip.file(report.fileName, report.content);
        });
        
        const content = await zip.generateAsync({ type: "blob" });
        const zipName = `EcoPulse_News_Batch_${new Date().toISOString().split('T')[0]}.zip`;
        downloadBlob(content, zipName);
      }

      setGenerationProgress('Download started!');
      setTimeout(() => setGenerationProgress(''), 2000);

    } catch (err) {
      console.error("Generation failed", err);
      setError("Failed to generate reports. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    downloadBlob(blob, fileName);
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        onRefresh={loadNews} 
        isLoading={loading}
        selectedCount={selectedIndices.size}
        onGenerateReports={handleGenerateReports}
        isGenerating={isGenerating}
        onClearSelection={clearSelection}
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

        {/* Generation Progress Toast */}
        {isGenerating && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
             <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">{generationProgress}</span>
             </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white h-64 rounded-xl border border-gray-100 p-5">
                <div className="flex justify-between mb-4">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success State - Structured News */}
        {!loading && !error && news.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item, index) => (
                <NewsCard 
                  key={index} 
                  item={item} 
                  isSelected={selectedIndices.has(index)}
                  onToggle={() => toggleSelection(index)}
                  onUpdateUrl={(url) => handleUpdateUrl(index, url)}
                />
              ))}
            </div>
          </>
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