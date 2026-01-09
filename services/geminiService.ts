
import { GoogleGenAI } from "@google/genai";
import { NewsResponse, NewsItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PRICE_PER_1M_INPUT_TOKENS = 0.075;
const PRICE_PER_1M_OUTPUT_TOKENS = 0.30;
const PRICE_PER_SEARCH_QUERY = 0.035;
const USD_TO_CHF_RATE = 0.90;

const calculateCostCHF = (usage: any, searchToolUsed: boolean = false): number => {
  if (!usage) return 0;
  const inputCost = (usage.promptTokenCount / 1_000_000) * PRICE_PER_1M_INPUT_TOKENS;
  const outputCost = (usage.candidatesTokenCount / 1_000_000) * PRICE_PER_1M_OUTPUT_TOKENS;
  const searchCost = searchToolUsed ? PRICE_PER_SEARCH_QUERY : 0;
  return (inputCost + outputCost + searchCost) * USD_TO_CHF_RATE;
};

const cleanJson = (text: string): string => {
  const match = text.match(/\[[\s\S]*\]/);
  return match ? match[0] : text.replace(/```json|```/g, "").trim();
};

export const fetchBioplasticNews = async (companyFilter?: string): Promise<NewsResponse> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Find the latest corporate news for the bioplastics industry from the last 30 days.
    ${companyFilter ? `Focus specifically on the company: ${companyFilter}` : ''}
    Return 6-10 items.
    
    STRICT EXCLUSION: No market research reports or CAGR forecasts. Only company actions like M&A, plant openings, or R&D breakthroughs.
    
    Format as JSON: [{ "date": "YYYY-MM-DD", "company": "Name", "title": "Headline", "description": "Short summary", "source": "Site", "url": "Link" }]
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const usage = response.usageMetadata;
  const estimatedCost = calculateCostCHF(usage, true);
  
  let items: NewsItem[] = [];
  try {
    items = JSON.parse(cleanJson(response.text || "[]"));
  } catch (e) {
    console.error("Parse error", e);
  }

  return { items, groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [], estimatedCost };
};

export const generateDeepDiveReport = async (item: NewsItem): Promise<{ content: string, cost: number }> => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Write a 200-word deep dive report on this bioplastic news: ${item.title} by ${item.company}. Source: ${item.url}`,
  });
  return { content: response.text || "", cost: calculateCostCHF(response.usageMetadata) };
};

export const generateNewsImage = async (item: NewsItem): Promise<{ imageUrl: string | null, cost: number }> => {
  const model = 'gemini-2.5-flash-image';
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: `A professional industrial illustration for: ${item.title}` }] },
  });
  const usage = response.usageMetadata;
  const cost = calculateCostCHF(usage);
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return { imageUrl: part ? `data:image/png;base64,${part.inlineData.data}` : null, cost };
};
