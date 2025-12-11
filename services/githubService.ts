
import { GitHubConfig } from '../types';

// Helper to encode UTF-8 strings to Base64 safely
const toBase64 = (str: string) => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
          return String.fromCharCode(parseInt(p1, 16));
  }));
};

export const uploadToGitHub = async (
  config: GitHubConfig,
  fileName: string,
  content: string
): Promise<void> => {
  const { token, owner, repo, path } = config;
  
  // Clean path to ensure no double slashes
  const cleanPath = path.endsWith('/') ? path : `${path}/`;
  const fullPath = `${cleanPath}${fileName}`;
  
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`;

  try {
    // 1. Check if file exists to get SHA (needed for updates, though we mostly create new)
    let sha: string | undefined;
    try {
      const existingRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      if (existingRes.ok) {
        const data = await existingRes.json();
        sha = data.sha;
      }
    } catch (e) {
      // Ignore error if file doesn't exist
    }

    // 2. Create or Update file
    const body: any = {
      message: `Add news: ${fileName}`,
      content: toBase64(content),
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload to GitHub');
    }

  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
};
