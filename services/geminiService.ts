import { NewsResponse, NewsItem } from '../types';

export const fetchBioplasticNews = async (companyFilter?: string): Promise<NewsResponse> => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'news', companyFilter }),
  });
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
};

export const generateDeepDiveReport = async (item: NewsItem): Promise<{ content: string; cost: number }> => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'report', item }),
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
};

export const generateNewsImage = async (item: NewsItem): Promise<{ imageUrl: string | null; cost: number }> => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'image', item }),
  });
  if (!res.ok) throw new Error('Failed to generate image');
  return res.json();
};
