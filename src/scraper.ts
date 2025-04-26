/**
 * Scraper module for fetching content from URLs
 */

/**
 * Fetches the content of a URL
 * @param url The URL to fetch
 * @returns The text content of the page or null if there was an error
 */
export const scrapeUrl = async (url: string): Promise<string | null> => {
  try {
    console.log(`Scraping URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        // Setting a user agent to avoid being blocked by some sites
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsAppMatrixSummarizer/1.0)'
      }
    });

    if (!response.ok) {
      console.error(`Error fetching URL: ${url}, status: ${response.status}`);
      return null;
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || '';
    
    // Only process HTML pages for now
    if (contentType.includes('text/html')) {
      const html = await response.text();
      
      // Basic HTML text extraction - could be improved with a proper HTML parser
      const textContent = extractTextFromHtml(html);
      return textContent;
    } else {
      console.log(`Skipping non-HTML content: ${contentType} for URL: ${url}`);
      return `[This content is in format: ${contentType} and cannot be summarized]`;
    }
  } catch (error) {
    console.error(`Error scraping URL: ${url}`, error);
    return null;
  }
};

/**
 * Very basic HTML to text extraction
 * This is a simplified version and could be improved with libraries like cheerio
 */
const extractTextFromHtml = (html: string): string => {
  // Remove all script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  
  // Remove all HTML tags
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, ' ');
  
  return text;
}; 