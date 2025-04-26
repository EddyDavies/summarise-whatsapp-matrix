import { describe, test, expect, beforeEach, mock } from "bun:test";
import handleMessage from "../../src/messages";
import { extractAndForwardLinks } from "../../src/linkExtractor";

// Create a mock function for extractAndForwardLinks
const mockExtractAndForwardLinks = mock(() => Promise.resolve());

// Mock the linkExtractor module
mock.module("../../src/linkExtractor", () => ({
  extractAndForwardLinks: mockExtractAndForwardLinks,
}));

describe("Message Handler Integration", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockExtractAndForwardLinks.mockClear();
  });

  test("should call extractAndForwardLinks with the correct parameters", async () => {
    // Create a mock Matrix event
    const mockEvent = {
      event: {
        content: {
          body: "Check out this link: https://example.com",
        },
        room_id: "test-room-id",
        sender: "test-user-id",
      },
      sender: {
        name: "Test User",
      },
    };

    // Call the message handler
    await handleMessage(mockEvent);

    // Check if extractAndForwardLinks was called with the correct parameters
    expect(mockExtractAndForwardLinks.mock.calls.length).toBe(1);
    expect(mockExtractAndForwardLinks.mock.calls[0][0]).toBe("Check out this link: https://example.com");
    expect(mockExtractAndForwardLinks.mock.calls[0][1]).toBe("Test User");
    expect(mockExtractAndForwardLinks.mock.calls[0][2]).toBe("test-room-id");
  });

  test("should use sender ID if sender name is not available", async () => {
    // Create a mock Matrix event without sender name
    const mockEvent = {
      event: {
        content: {
          body: "Check out this link: https://example.com",
        },
        room_id: "test-room-id",
        sender: "test-user-id",
      },
      // No sender object with name
    };

    // Call the message handler
    await handleMessage(mockEvent);

    // Check if extractAndForwardLinks was called with the correct parameters
    expect(mockExtractAndForwardLinks.mock.calls.length).toBe(1);
    expect(mockExtractAndForwardLinks.mock.calls[0][0]).toBe("Check out this link: https://example.com");
    expect(mockExtractAndForwardLinks.mock.calls[0][1]).toBe("test-user-id");
    expect(mockExtractAndForwardLinks.mock.calls[0][2]).toBe("test-room-id");
  });

  test("should handle messages without links", async () => {
    // Create a mock Matrix event without links
    const mockEvent = {
      event: {
        content: {
          body: "This is a message without any links",
        },
        room_id: "test-room-id",
        sender: "test-user-id",
      },
      sender: {
        name: "Test User",
      },
    };

    // Call the message handler
    await handleMessage(mockEvent);

    // extractAndForwardLinks should still be called, but it won't find any links
    expect(mockExtractAndForwardLinks.mock.calls.length).toBe(1);
    expect(mockExtractAndForwardLinks.mock.calls[0][0]).toBe("This is a message without any links");
    expect(mockExtractAndForwardLinks.mock.calls[0][1]).toBe("Test User");
    expect(mockExtractAndForwardLinks.mock.calls[0][2]).toBe("test-room-id");
  });
}); 