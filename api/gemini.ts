import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, companyFilter, item } = req.body || {};

  try {
    if (action === 'news') {
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

      let items: any[] = [];
      try {
        items = JSON.parse(cleanJson(response.text || '[]'));
      } catch (e) {
        console.error('Parse error', e);
      }

      return res.status(200).json({ items, groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [], estimatedCost });
    }

    if (action === 'report') {
      if (!item) return res.status(400).json({ error: 'Missing item for report' });
      const model = 'gemini-3-flash-preview';
      const response = await ai.models.generateContent({
        model,
        contents: `Write a 200-word deep dive report on this bioplastic news: ${item.title} by ${item.company}. Source: ${item.url}`,
      });
      return res.status(200).json({ content: response.text || '', cost: calculateCostCHF(response.usageMetadata) });
    }

    if (action === 'image') {
      if (!item) return res.status(400).json({ error: 'Missing item for image' });
      const model = 'gemini-2.5-flash-image';
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: `A professional industrial illustration for: ${item.title}` }] },
      });
      const usage = response.usageMetadata;
      const cost = calculateCostCHF(usage);
      const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
      const imageUrl = part ? `data:image/png;base64,${part.inlineData.data}` : null;
      return res.status(200).json({ imageUrl, cost });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e: any) {
    console.error('API error', e);
    return res.status(500).json({ error: e?.message || 'Internal server error' });
  }
}
