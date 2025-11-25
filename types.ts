export interface NewsItem {
  date: string;
  company: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  verificationUrl?: string | null;
  userUrl?: string; // Field for manual user override
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface NewsResponse {
  items: NewsItem[];
  groundingChunks: GroundingChunk[];
  rawText?: string; // Fallback if parsing fails
}