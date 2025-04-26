import { describe, test, expect } from "bun:test";

// Extract the regex from linkExtractor.ts for testing
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

describe("URL Regex Pattern", () => {
  test("should match simple URLs", () => {
    const text = "Check out https://example.com";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("https://example.com");
  });
  
  test("should match multiple URLs in a message", () => {
    const text = "Check these: https://example.com and http://test.org";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(2);
    expect(matches?.[0]).toBe("https://example.com");
    expect(matches?.[1]).toBe("http://test.org");
  });
  
  test("should match URLs with query parameters", () => {
    const text = "See https://example.com/search?q=test&page=2";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("https://example.com/search?q=test&page=2");
  });
  
  test("should match URLs with paths and fragments", () => {
    const text = "Visit https://example.com/path/to/page#section";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("https://example.com/path/to/page#section");
  });
  
  test("should match URLs with ports", () => {
    const text = "Connect to http://localhost:3000";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("http://localhost:3000");
  });
  
  test("should match URLs with subdomains", () => {
    const text = "Go to https://subdomain.example.com";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("https://subdomain.example.com");
  });
  
  test("should match URLs inside parentheses", () => {
    const text = "Info (see https://example.com)";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("https://example.com)");
  });
  
  test("should not match plain text without URLs", () => {
    const text = "This is a message without any links";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toBeNull();
  });
  
  test("should not match incomplete URLs", () => {
    const text = "This is invalid: example.com";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toBeNull();
  });
  
  test("should match URLs followed by punctuation", () => {
    const text = "Check this https://example.com. It's great!";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("https://example.com.");
  });
  
  test("should handle URLs with non-ASCII characters", () => {
    const text = "Unicode: https://example.com/ünicode/path";
    const matches = text.match(URL_REGEX);
    
    expect(matches).toHaveLength(1);
    expect(matches?.[0]).toBe("https://example.com/ünicode/path");
  });
}); 