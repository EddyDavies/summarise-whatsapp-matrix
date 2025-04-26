import { sendMessage } from "./matrixClientRequests";

// Cache to prevent duplicates within a short time frame
const linkCache = new Set<string>();
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// Regular expression to match URLs in text
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Track the most recent links for testing summarization
export const recentLinks = new Map<string, string>();

// Mock function to demonstrate future summarization functionality
export const generateMockSummary = (url: string): string => {
  return `🔗 Mock Summary for ${url}:

This is a placeholder for the actual summary that will be implemented in Phase 2. The summary would typically include key points from the linked content, extracted using AI-based text analysis.`;
};
