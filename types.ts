

export interface Contact {
  name: string;
  title?: string;
  linkedin?: string;
}

export interface NewsItem {
  date: string;
  company: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  verificationUrl?: string | null;
  userUrl?: string; // Field for manual user override
  generatedImage?: string; // Base64 image data
  contacts?: Contact[];
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
  estimatedCost?: number; // Cost in CHF
}

export interface GeneratedReport {
  fileName: string;
  content: string;
  title: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
}