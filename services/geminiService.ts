
import { GoogleGenAI, Type } from "@google/genai";
import { NewsResponse, NewsItem, Contact } from '../types';

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
  const match = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text.replace(/```json|```/g, "").trim();
};

export const fetchBioplasticNews = async (query: string = '', category: string = 'All News', days: number = 30): Promise<NewsResponse> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Find the latest corporate news for the bioplastics industry from the last ${days} days.
    ${query ? `Focus query: ${query}` : ''}
    ${category !== 'All News' ? `Filter by category: ${category}` : ''}
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
    const cleaned = cleanJson(response.text || "[]");
    items = JSON.parse(cleaned);
  } catch (e) {
    console.error("Parse error", e);
  }

  return { 
    items, 
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [], 
    estimatedCost,
    rawText: items.length === 0 ? response.text : undefined
  };
};

export const generateDeepDiveReport = async (item: NewsItem): Promise<{ content: string, cost: number }> => {
  const model = 'gemini-3-flash-preview';
  const effectiveSourceUrl = item.userUrl || item.url || item.source || '#';
  
  const prompt = `
    Create a high-quality news story based on this bioplastic news:
    Title: ${item.title}
    Company: ${item.company}
    Date: ${item.date}
    Source: ${effectiveSourceUrl}

    FORMATTING RULES:
    1. Include the following Frontmatter exactly as shown:
    ---
    title: "${item.title}"
    date: ${item.date}
    draft: false
    summary: "[Insert 1-sentence summary here]"
    tags: ['${item.company}', 'innovation', 'sustainability']
    category: "News"
    company: "${item.company}"
    company_type: "Bioplastic Producer"
    source: "${item.source}"
    ---

    2. Follow the frontmatter with 300 words of engaging journalistic content.
    3. Use Markdown headings (##) and sections.
    4. End with a source link: **Source:** [Read more](${effectiveSourceUrl})
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  
  return { 
    content: response.text || "", 
    cost: calculateCostCHF(response.usageMetadata) 
  };
};

export const researchNewsContact = async (item: NewsItem): Promise<{ contacts: Contact[], cost: number }> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Find the key contact people (PR Managers, CEOs, or Sustainability Leads) related to this news:
    "${item.title}" from the company "${item.company}".
    
    Search for their LinkedIn profiles or official contact details.
    Return JSON: [{ "name": "...", "title": "...", "linkedin": "..." }]
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  let contacts: Contact[] = [];
  try {
    contacts = JSON.parse(cleanJson(response.text || "[]"));
  } catch (e) {}

  return { contacts, cost: calculateCostCHF(response.usageMetadata, true) };
};

export const extractNewsFromUrl = async (url: string): Promise<{ item: NewsItem | null, cost: number }> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Visit this URL and extract the core news story: ${url}
    
    Return as JSON: { "date": "YYYY-MM-DD", "company": "Name", "title": "Headline", "description": "Short summary", "source": "Site", "url": "${url}" }
    If it's not a news story, return an empty object.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  let item: NewsItem | null = null;
  try {
    item = JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {}

  return { item, cost: calculateCostCHF(response.usageMetadata, true) };
};

export const generateNewsImage = async (item: NewsItem): Promise<{ imageUrl: string | null, cost: number }> => {
  const model = 'gemini-2.5-flash-image';
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: `A professional industrial illustration for a bioplastic breakthrough: ${item.title}` }] },
  });
  const usage = response.usageMetadata;
  const cost = calculateCostCHF(usage);
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return { imageUrl: part ? `data:image/png;base64,${part.inlineData.data}` : null, cost };
};
