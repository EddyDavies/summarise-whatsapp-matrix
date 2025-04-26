import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { SummarizeUrlFn } from "../../src/summarizer";
import { sendMessage } from "../../src/matrixClientRequests";

// Mock for summarizeUrl as we're only testing Matrix integration
const mockSummarizeUrl = mock<SummarizeUrlFn>(() => 
  Promise.resolve({ summary: "Test summary", originalUrl: "https://example.com" })
);

// Create the mock for summarizer only
mock.module("../../src/summarizer", () => ({
  summarizeUrl: mockSummarizeUrl,
}));

// Import the function after setting up mocks for summarizer
import { extractAndForwardLinks } from "../../src/linkExtractor";

describe("Link Extractor with Real Matrix", () => {
  const originalEnv = { ...process.env };
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  // Configure test environment
  let testRoomId: string;
  
  beforeEach(() => {
    // Check required environment variables
    if (!process.env.MATRIX_HOMESERVER_URL || 
        !process.env.MATRIX_ACCESS_TOKEN || 
        !process.env.MATRIX_USER_ID) {
      console.warn("Skipping test: Matrix environment variables not set");
      return;
    }
    
    // Use test room ID for forwarding
    testRoomId = process.env.FORWARDING_ROOM_ID || "";
    process.env.FORWARDING_ROOM_ID = testRoomId;
    
    // Silence console output during tests
    console.log = mock(() => {});
    console.error = mock(() => {});
    
    // Reset mocks
    mockSummarizeUrl.mockClear();
    mockSummarizeUrl.mockImplementation(() => Promise.resolve({ 
      summary: "Test summary", 
      originalUrl: "https://example.com" 
    }));
  });
  
  afterEach(() => {
    // Restore environment variables and console
    process.env = { ...originalEnv };
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  test("should send a real Matrix message", async () => {
    // Skip test if no test room ID is configured
    if (!testRoomId) {
      console.warn("Skipping test: FORWARDING_ROOM_ID not set");
      return;
    }
    
    // Send a test message directly to validate Matrix connection
    const testMessage = `Matrix integration test message ${Date.now()}`;
    
    try {
      const response = await sendMessage(testRoomId, testMessage);
      
      expect(response.ok).toBe(true);
      const responseData = await response.json();
      expect(responseData).toHaveProperty("event_id");
    } catch (error) {
      console.error("Failed to send Matrix message:", error);
      throw error;
    }
  }, 10000); // Allow 10 seconds for this test
  
  test("should extract and forward a link via real Matrix", async () => {
    // Skip test if no test room ID is configured
    if (!testRoomId) {
      console.warn("Skipping test: FORWARDING_ROOM_ID not set");
      return;
    }
    
    const link = "https://example.com";
    const message = `Check out this link: ${link}`;
    const senderName = "TestUser";
    const sourceRoomId = "source-room";
    
    await extractAndForwardLinks(message, senderName, sourceRoomId);
    
    // Check if summarizeUrl was called with the link
    expect(mockSummarizeUrl.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(mockSummarizeUrl.mock.calls[0][0]).toBe(link);
    
    // Note: We don't check sendMessage calls directly because we're using real implementation
    // Instead we're verifying that the process completes without errors
  }, 15000); // Allow 15 seconds for this test
  
  test("should not process duplicate links within cache period", async () => {
    // Skip test if no test room ID is configured
    if (!testRoomId) {
      console.warn("Skipping test: FORWARDING_ROOM_ID not set");
      return;
    }
    
    const link = "https://example.com";
    const message = `Check out this link: ${link}`;
    const senderName = "TestUser";
    const sourceRoomId = "source-room";
    
    // First call
    await extractAndForwardLinks(message, senderName, sourceRoomId);
    
    // Reset mock for second call
    mockSummarizeUrl.mockClear();
    
    // Second call should not process the same link due to caching
    await extractAndForwardLinks(message, senderName, sourceRoomId);
    
    // No calls should be made to summarizeUrl on the second attempt due to caching
    expect(mockSummarizeUrl.mock.calls.length).toBe(0);
  }, 15000); // Allow 15 seconds for this test
}); 