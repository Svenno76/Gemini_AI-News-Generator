import { GoogleGenAI } from "@google/genai";
import { NewsResponse, NewsItem, GroundingChunk, Contact } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Pricing constants (Approximate USD)
const PRICE_PER_1M_INPUT_TOKENS = 0.075;
const PRICE_PER_1M_OUTPUT_TOKENS = 0.30;
const PRICE_PER_SEARCH_QUERY = 0.035;
const USD_TO_CHF_RATE = 0.90; // Approx exchange rate

// Helper to calculate cost
const calculateCostCHF = (usage: any, searchToolUsed: boolean = false): number => {
  if (!usage) return 0;
  const inputCost = (usage.promptTokenCount / 1_000_000) * PRICE_PER_1M_INPUT_TOKENS;
  const outputCost = (usage.candidatesTokenCount / 1_000_000) * PRICE_PER_1M_OUTPUT_TOKENS;
  const searchCost = searchToolUsed ? PRICE_PER_SEARCH_QUERY : 0;
  
  return (inputCost + outputCost + searchCost) * USD_TO_CHF_RATE;
};

// Helper to clean Markdown JSON blocks
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\n?|\n?```/g, "");
  cleaned = cleaned.replace(/```/g, ""); // Catch generic blocks
  // Attempt to find the first '{' or '[' if there is conversational text
  const firstBrace = cleaned.search(/[{[]/);
  
  if (firstBrace !== -1) {
    const substring = cleaned.substring(firstBrace);
    return substring.trim();
  }
  return cleaned.trim();
};

export const fetchBioplasticNews = async (companyFilter?: string): Promise<NewsResponse> => {
  try {
    const model = 'gemini-2.5-flash';
    
    let searchContext = "";
    
    if (companyFilter && companyFilter.trim() !== "") {
      // Specific Company Search
      searchContext = `
        Find the latest bioplastic news specifically related to the company "${companyFilter}".
        Search for press releases, partnerships, product launches, or investments involving "${companyFilter}" from the last 6 months.
        If no direct news is found for this company, return an empty list.
      `;
    } else {
      // General Discovery (Randomized)
      const topics = [
        "mergers & acquisitions", 
        "plant openings", 
        "plant closures", 
        "partnerships", 
        "regulations", 
        "policies", 
        "product launches", 
        "financial reporting", 
        "annual report", 
        "plastic recycling",
        "new scientific article",
        "patents expired",
        "packaging solutions",
        "agricultural mulch films",
        "biodegradability"
      ];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      searchContext = `
        Find the latest bioplastic news from the last 30 days.
        To ensure variety, focus the search particularly on '${randomTopic}' and other emerging stories.
      `;
    }

    const prompt = `
      ${searchContext}
      Select at least 6-10 relevant and distinct news items.
      
      CRITICAL URL INSTRUCTION:
      For each news item, you MUST find the specific URL of the article or press release.
      - Do NOT provide a generic homepage (e.g., 'https://www.bioplasticsmagazine.com' is BAD).
      - Do NOT provide an irrelevant link that doesn't mention the specific story.
      - The 'url' field must point directly to the text of the story described in the title.
      - If you cannot find a specific, direct link to the story, set 'url' to null.

      For each item, provide:
      - publishing date (YYYY-MM-DD format)
      - company name
      - title
      - description (comprehensive summary, around 80 words)
      - source name (e.g., "Company Press Release", "Plastics News", "News Outlet Name")
      - url (The DIRECT URL to the specific story. Null if not found.)
      - verificationUrl (A second direct URL if available, like a social post. Null otherwise.)

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
          "url": "https://example.com/news/story-123-launch",
          "verificationUrl": "https://twitter.com/example/status/12345"
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
    const usage = response.usageMetadata;

    // Calculate Estimated Cost
    const estimatedCost = calculateCostCHF(usage, true);

    // Attempt to extract and parse JSON
    let items: NewsItem[] = [];
    try {
      // Find the array brackets in case there is conversational text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to cleaning logic if match fails
        items = JSON.parse(cleanJson(text));
      }
    } catch (e) {
      console.warn("No JSON array found in response text or parse error.");
      // We don't error out completely, allowing rawText to show if parsing failed
    }

    return {
      items,
      groundingChunks,
      rawText: items.length === 0 ? text : undefined,
      estimatedCost
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const extractNewsFromUrl = async (url: string): Promise<{ item: NewsItem | null, cost: number }> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze the news article found at this specific URL: ${url}
      
      Task:
      1. Access the information about this URL using Google Search to understand the content if you cannot access it directly.
      2. Extract the key metadata for this news story.
      
      Return ONLY a JSON object with the following fields:
      - date (YYYY-MM-DD format, best guess if not explicit)
      - company (The main company or organization subject of the news)
      - title (The headline of the article)
      - description (A comprehensive summary of the news, around 80 words)
      - source (The name of the website or publisher)
      - url (Return the input URL: ${url})
      
      Do not include markdown formatting. Return raw JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is NOT allowed with googleSearch
      },
    });

    const usage = response.usageMetadata;
    const cost = calculateCostCHF(usage, true);
    
    let item: NewsItem | null = null;
    try {
        const text = response.text || "{}";
        item = JSON.parse(cleanJson(text));
    } catch (e) {
        console.error("Failed to parse extracted news JSON", e);
    }

    return { item, cost };

  } catch (error) {
    console.error("Error extracting news from URL:", error);
    return { item: null, cost: 0 };
  }
};

export const researchNewsContact = async (item: NewsItem): Promise<{ contacts: Contact[], cost: number }> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a research assistant. Find the key people mentioned in or associated with this news story (e.g. Spokespeople, CEO, Head of Sustainability, VP, or specific people quoted in the article).
      
      News Title: ${item.title}
      Company: ${item.company}
      Summary: ${item.description}
      Source URL: ${item.url || item.userUrl || 'N/A'}

      Task:
      1. Use Google Search to find the names, job titles, and LinkedIn profile URLs of ALL relevant contacts mentioned in this specific story or key executives if no specific person is named.
      2. IMPORTANT: Verify the LinkedIn URL is a specific PERSONAL profile (containing /in/), not a company page or search result.
      3. If you cannot find a valid personal LinkedIn profile URL for a person, do NOT include them in the list.

      Return ONLY a JSON ARRAY of objects in the following format:
      [
        {
          "name": "Name of person",
          "title": "Job Title",
          "linkedin": "URL to LinkedIn profile (must contain /in/)"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is NOT allowed with googleSearch
      }
    });

    const usage = response.usageMetadata;
    const cost = calculateCostCHF(usage, true);
    
    let contacts: Contact[] = [];
    try {
        const text = response.text || "[]";
        // Ensure we parse array
        const cleaned = cleanJson(text);
        let parsed: any;
        if (cleaned.startsWith('{')) {
             // Handle case where model returns single object instead of array
             parsed = [JSON.parse(cleaned)];
        } else {
             parsed = JSON.parse(cleaned);
        }

        // Filter contacts to ensure valid LinkedIn URLs (basic regex check)
        const linkedInRegex = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w\-\_%\+]+/i;
        
        contacts = (Array.isArray(parsed) ? parsed : [parsed]).filter((c: any) => 
            c && c.name && c.linkedin && linkedInRegex.test(c.linkedin)
        );

    } catch (e) {
        console.error("Failed to parse contact JSON", e);
    }

    return { contacts, cost };

  } catch (error) {
    console.error("Error researching contact:", error);
    return { contacts: [], cost: 0 };
  }
};

export const generateDeepDiveReport = async (item: NewsItem): Promise<{ content: string, cost: number }> => {
  try {
    const model = 'gemini-2.5-flash';
    // Use the user's preferred URL if available, otherwise fallback to system detected URLs
    const preferredUrl = item.userUrl && item.userUrl.trim() !== '' ? item.userUrl : (item.url || item.verificationUrl);
    
    // Format contacts for Markdown body footer and frontmatter
    let contactLine = '';
    let contactNames = 'None';

    // Double check validity using regex just to be safe, even if researchNewsContact filtered it
    const validContacts = (item.contacts || []).filter(c => 
        c.linkedin && /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w\-\_%\+]+/i.test(c.linkedin)
    );

    if (validContacts.length > 0) {
        // For frontmatter: Comma separated names
        contactNames = validContacts.map(c => c.name).join(', ');

        // For footer: formatted list
        if (validContacts.length === 1) {
             const c = validContacts[0];
             contactLine = `\n\n**Contact:** [${c.name}${c.title ? `, ${c.title}` : ''}](${c.linkedin})`;
        } else {
             contactLine = `\n\n**Contacts:**\n` + validContacts.map(c => 
                `* [${c.name}${c.title ? `, ${c.title}` : ''}](${c.linkedin})`
            ).join('\n');
        }
    }

    const prompt = `
      You are an expert bioplastic news analyst. Research the following news story and write a report formatted for a Hugo static site generator.

      Story Details:
      - Title: ${item.title}
      - Company: ${item.company}
      - Date: ${item.date}
      - Initial Description: ${item.description}
      - Primary Link to Analyze: ${preferredUrl} 
      - Identified Contacts: ${contactNames}

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
      contact: "${contactNames}"
      ---

      (Write the body content here. Approx 250 words.)
      (Use ## for section headers. Suggested structure: ## Details, ## Impact, etc.)
      
      **Source:** [Read more](${preferredUrl})${contactLine}

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

    const usage = response.usageMetadata;
    const cost = calculateCostCHF(usage, true);

    return { 
      content: response.text || `Failed to generate report for ${item.title}`, 
      cost 
    };
  } catch (error) {
    console.error("Error generating deep dive:", error);
    return { 
      content: `Error generating report for ${item.title}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      cost: 0 
    };
  }
};

export const generateNewsImage = async (item: NewsItem): Promise<{ imageUrl: string | null, cost: number }> => {
  try {
    const model = 'gemini-2.5-flash-image';
    const prompt = `
      Create a high-quality, professional editorial illustration for a news story about: ${item.title}.
      
      Context: ${item.description}
      Company: ${item.company}
      
      Key Elements:
      - Try to prominently feature the logo or branding of '${item.company}' naturally integrated into the scene (e.g. on a building, product, or sign).
      - Text is permitted ONLY for the company logo/name.
      
      Style:
      - Photorealistic or high-end 3D render.
      - Clean, modern, corporate but eco-friendly aesthetic (bioplastics, nature meets technology).
      - Bright, professional lighting.
      - Aspect ratio 16:9.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    const usage = response.usageMetadata;
    const cost = calculateCostCHF(usage, false);

    // Check for inline data (image)
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return { 
          imageUrl: `data:image/png;base64,${part.inlineData.data}`,
          cost
        };
      }
    }
    
    return { imageUrl: null, cost };
  } catch (error) {
    console.error("Image generation error:", error);
    return { imageUrl: null, cost: 0 };
  }
};