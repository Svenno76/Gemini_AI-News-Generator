import { GoogleGenAI } from "@google/genai";
import { NewsResponse, NewsItem, GroundingChunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchBioplasticNews = async (): Promise<NewsResponse> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Add randomization to ensure different news on refresh
    const topics = [
      "packaging solutions", 
      "marine biodegradability", 
      "agricultural mulch films", 
      "medical biopolymers", 
      "consumer electronics materials", 
      "textile and fiber innovations", 
      "automotive interior materials", 
      "food service ware",
      "new PHA/PLA production facilities",
      "algae-based plastics"
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const prompt = `
      Find the latest bioplastic news from the last 30 days using Google Search. 
      To ensure variety, focus the search particularly on '${randomTopic}' and other emerging stories.
      Select at least 6-10 relevant and distinct news items.
      
      For each story, perform a verification step:
      - Search for the specific news article URL.
      - Search for an official press release on the company's website.
      - Search for confirmation on the company's official LinkedIn or X (Twitter) page.
      
      For each item, provide:
      - publishing date (YYYY-MM-DD format)
      - company name
      - title
      - description (max 50 words)
      - source name (e.g., "Company Press Release", "Plastics News", "News Outlet Name")
      - url (The direct URL to the news story/article found)
      - verificationUrl (The direct URL to the press release or social post. Null if not found.)

      Strictly format the output as a JSON array of objects. 
      Do not include any markdown formatting (like \`\`\`json). 
      Just return the raw JSON array.
      
      Example format:
      [
        {
          "date": "2023-10-27",
          "company": "Example Corp",
          "title": "New biodegradable polymer launched",
          "description": "Example Corp announces a new marine-degradable plastic...",
          "source": "Example Corp Newsroom",
          "url": "https://example.com/news/story-123",
          "verificationUrl": "https://example.com/press-release/new-polymer"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    // Attempt to extract and parse JSON
    let items: NewsItem[] = [];
    try {
      // Find the array brackets in case there is conversational text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        console.warn("No JSON array found in response text. Returning raw text.");
      }
    } catch (e) {
      console.error("Failed to parse news JSON:", e);
    }

    return {
      items,
      groundingChunks,
      rawText: items.length === 0 ? text : undefined
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateDeepDiveReport = async (item: NewsItem): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    // Use the user's preferred URL if available, otherwise fallback to system detected URLs
    const preferredUrl = item.userUrl && item.userUrl.trim() !== '' ? item.userUrl : (item.url || item.verificationUrl);

    const prompt = `
      You are an expert bioplastic news analyst. Research the following news story and write a report formatted for a Hugo static site generator.

      Story Details:
      - Title: ${item.title}
      - Company: ${item.company}
      - Date: ${item.date}
      - Initial Description: ${item.description}
      - Primary Link to Analyze: ${preferredUrl} 

      Task:
      1. Search for more details if necessary using the googleSearch tool to flesh out the report to approx 250 words. Focus on the content at the Primary Link if provided.
      2. Classify the Company into EXACTLY ONE of these types: 
         "Additive Producer", "Bioplastic Producer", "Compounder", "Equipment Manufacturer", "Technology Company", "Research Institute", "Consulting", "Recycler", "Brand Owner / FMCG", "Waste Management", "Distributor".
      3. Classify the News into EXACTLY ONE of these categories: 
         "Certifications", "Investment & Funding", "M&A", "Partnerships", "Plant Announcements", "Product Launch", "Regulatory & Policy", "Sustainability Goals", "Market Analysis".
      4. Write the final output as a Markdown file with YAML frontmatter.

      Strict Output Format:
      ---
      title: "${item.title.replace(/"/g, '\\"')}"
      date: ${item.date}
      draft: false
      summary: "A concise 1-2 sentence summary of the story."
      tags: ["${item.company}", "keyword2", "keyword3"]
      category: "Selected Category"
      company: "${item.company}"
      company_type: "Selected Company Type"
      source: "${item.source || 'Industry News'}"
      ---

      (Write the body content here. Approx 250 words.)
      (Use ## for section headers. Suggested structure: ## Details, ## Impact, etc.)
      
      **Source:** [Read more](${preferredUrl})

      Rules:
      - Do NOT wrap the output in markdown code blocks.
      - Ensure the YAML frontmatter is valid.
      - Do not output anything before the first "---".
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || `Failed to generate report for ${item.title}`;
  } catch (error) {
    console.error("Error generating deep dive:", error);
    return `Error generating report for ${item.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};