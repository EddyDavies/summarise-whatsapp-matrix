# Tests for WhatsApp-Matrix Link Summarizer

This directory contains tests for the WhatsApp-Matrix Link Summarizer application, particularly focusing on Phase 1 implementation (core link extraction and forwarding).

## Test Structure

The tests are organized in the following structure:

- `unit/`: Unit tests for individual components
  - `linkExtractor.test.ts`: Tests for the link extraction and forwarding functionality
  - `matrixClientRequests.test.ts`: Tests for Matrix client API requests
  - `urlRegex.test.ts`: Tests for the URL regular expression pattern

- `integration/`: Integration tests between components
  - `messages.test.ts`: Tests for message handling and interaction with link extraction

## Running Tests

Tests are set up to run with [Bun](https://bun.sh), a fast JavaScript runtime and test runner.

To run all tests:

```bash
bun test
```

To run only unit tests:

```bash
bun test:unit
```

To run only integration tests:

```bash
bun test:integration
```

## Test Coverage

Current tests cover:

1. **URL Recognition**: Verifying the regex pattern correctly identifies various URL formats
2. **Link Extraction**: Testing the extraction of URLs from messages
3. **Duplicate Link Handling**: Ensuring the same link isn't processed multiple times in a short period
4. **Message Forwarding**: Testing the forwarding of extracted links to a designated room
5. **Error Handling**: Verifying proper handling of errors during link processing
6. **Matrix API Interactions**: Testing the API calls made to the Matrix server

## Adding Tests

When adding new functionality, please also add appropriate tests following these patterns:

1. Create unit tests for isolated components
2. Create integration tests for component interactions
3. Use mock functions to isolate dependencies
4. Follow the existing structure and naming conventions

If you're adding a new feature, create a new test file in the appropriate directory (unit or integration) with a descriptive name ending in `.test.ts`. 