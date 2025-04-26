/**
 * Summarizer module for generating summaries of web content
 */
import { scrapeUrl } from './scraper';

/**
 * Maximum length of content to summarize (to avoid excessive API usage)
 */
const MAX_CONTENT_LENGTH = 10000;

/**
 * Types for the AI API response
 */
interface AIApiResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Summarizes content from a URL
 * @param url The URL to summarize
 * @returns The summary and original URL, or null if there was an error
 */
export const summarizeUrl = async (url: string): Promise<{ summary: string, originalUrl: string } | null> => {
  try {
    // Fetch the content from the URL
    const content = await scrapeUrl(url);
    
    if (!content) {
      console.error(`Failed to scrape content from URL: ${url}`);
      return null;
    }
    
    // Trim content if it's too long to avoid excessive API usage
    const trimmedContent = content.length > MAX_CONTENT_LENGTH 
      ? content.substring(0, MAX_CONTENT_LENGTH) + "..." 
      : content;
    
    // Generate summary using the AI model
    const summary = await generateSummary(trimmedContent, url);
    
    if (!summary) {
      console.error(`Failed to generate summary for URL: ${url}`);
      return null;
    }
    
    return {
      summary,
      originalUrl: url
    };
  } catch (error) {
    console.error(`Error summarizing URL: ${url}`, error);
    return null;
  }
};

/**
 * Generates a summary of the content using AI API
 * @param content The content to summarize
 * @param url The original URL (for context)
 * @returns The summary or null if there was an error
 */
const generateSummary = async (content: string, url: string): Promise<string | null> => {
  try {
    const API_KEY = process.env.AI_API_KEY;
    
    if (!API_KEY) {
      console.error("AI_API_KEY is not set in environment variables");
      return null;
    }
    
    // API endpoint URL
    const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
    
    // Make API request to the AI model
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes web content. Provide a concise summary highlighting the key points.'
          },
          {
            role: 'user',
            content: `Please summarize the following content from ${url}:\n\n${content}`
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      })
    });
    
    if (!response.ok) {
      console.error(`Error calling AI API: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json() as AIApiResponse;
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}; 