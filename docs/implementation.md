# Implementation Plan

This document outlines the phased development steps for the `summarise-whatsapp-matrix` project, based on the defined [architecture](architecture.md).

## Phase 1: Core Link Extraction & Forwarding (No DB)

**Goal:** Set up the basic message listening, link extraction, and forwarding mechanism without persistent storage.

**Status:** Basic project structure (TypeScript, Bun, `package.json`, `tsconfig.json`) is already in place.

1.  **Setup Matrix Client & Bridge:**
    *   Initialize a basic Matrix client (using a suitable library like `matrix-js-sdk`) within the `src` directory.
    *   Configure it to listen to messages in specified group chats using `MATRIX_HOMESERVER_URL` and `MATRIX_ACCESS_TOKEN` environment variables.
2.  **Implement Link Extractor:**
    *   Create a module within `src` that receives message events from the client.
    *   Use a robust regex to identify URLs within message bodies.
    *   Handle potential duplicates within a short time window (e.g., using an in-memory Set or cache).
3.  **Forward Links:**
    *   Modify the client/bridge component to send extracted URLs as new messages to a designated "summary" or "links" chat room. Define this target room ID via an environment variable (e.g., `FORWARDING_ROOM_ID`).


**Next Steps:** Implement Matrix client initialization, message listening, link extraction, and forwarding logic within the `src` directory. Define necessary environment variables (`MATRIX_HOMESERVER_URL`, `MATRIX_ACCESS_TOKEN`, `FORWARDING_ROOM_ID`).

**Testing:**
*   **Unit Tests:**
    *   Test the URL extraction regex with various message formats (no links, single link, multiple links, links with different TLDs, malformed links).
    *   Test the in-memory cache logic (adding, checking existence, expiration).
*   **Integration Tests:**
    *   Mock the Matrix client `sendMessage` function.
    *   Simulate incoming message events (with and without links) and verify that `sendMessage` is called correctly (or not called) with the expected arguments (room ID, message format) for the forwarding room.
    *   Test duplicate message handling over a short interval.

**Outcome:** A running service that listens to specific chats and forwards any found links to another chat.

## Phase 2: Add Summarization

**Goal:** Integrate scraping and summarization, posting results back.

1.  **Develop Scraper & Summarizer Worker:**
    *   Create a worker module/function that can accept a URL.
    *   Use `fetch` or `axios` to retrieve the content of the URL.
    *   Integrate a summarization library or API (e.g., using `AI_API_KEY`).
    *   Handle basic error scenarios during scraping/summarization.
2.  **Integrate Worker with Link Forwarding:**
    *   Modify the Phase 1 flow: Instead of just forwarding the *link*, pass the link to the summarizer worker.
    *   The worker should then generate the summary.
3.  **Post Summary:**
    *   Update the worker to send the *generated summary* (perhaps along with the original link) back to the `FORWARDING_ROOM_ID` or potentially the *original* chat room where the link was found (requires passing the original `chat_id` through the flow). Let's start with forwarding to the designated room for simplicity.

**Testing:**
*   **Unit Tests:**
    *   Mock `fetch`/`axios` and test the scraper logic for different content types and error responses.
    *   Mock the AI API (`fetch`) and test the summarizer logic, including handling API errors and trimming long content.
    *   Test the integration between scraper and summarizer.
*   **Integration Tests:**
    *   Mock the Matrix client `sendMessage` function.
    *   Simulate incoming messages with links.
    *   Mock the scraper (`scrapeUrl`) to return predefined content.
    *   Mock the AI API to return predefined summaries.
    *   Verify that `sendMessage` is called with the correctly formatted summary message in the forwarding room.
    *   Test error handling paths (scrape failure, summary failure) and verify appropriate messages are sent.

**Outcome:** The service now scrapes links, summarizes them, and posts the summary to the designated chat.

## Phase 3: Introduce Persistence & Batch Summarization Logic

**Goal:** Implement robust Postgres persistence and shift to a batch summarization model triggered periodically or manually.

1.  **Define Database Schema:**
    *   Define schema for `links` (including `status` field: 'pending', 'summarized', 'failed', and `sender_name`) and `summaries` tables as per `architecture.md`. Create SQL DDL scripts.
2.  **Setup Docker Compose:**
    *   Create `docker-compose.yml` with services for Postgres (data volumes, `DATABASE_URL`) and the application (building from `Dockerfile`).
3.  **Integrate Postgres & Refactor Link Handling:**
    *   Add a database client library (e.g., `pg` or Prisma).
    *   Refactor the **Link Storage Service** (formerly Link Extractor): Remove summarization calls. When a link is detected, check if it exists in the DB (by URL and recent timestamp). If unique, write link details (URL, `chat_id`, `message_id`, `sender_name`, timestamp) to the `links` table with `status = 'pending'`.
4.  **Implement Batch Summarization Service:**
    *   Create a new service/module responsible for orchestrating batch summaries.
    *   Implement a function `runBatchSummary(roomId: string)`:
        *   Queries the `links` table for all records with `status = 'pending'`.
        *   If pending links exist, calls the **Scraper + Summarizer Worker** for each link.
        *   Collects results (successful summaries and original links/sender).
        *   Formats a single summary message (e.g., "Summary of links since last run:
 - [Sender]: [Link] -> [Summary]
 ...").
        *   Calls the Matrix client's `sendMessage` function to post the compiled summary to the `FORWARDING_ROOM_ID`.
        *   Updates the status of processed links in the `links` table to `'summarized'` or `'failed'`.
5.  **Implement Triggers:**
    *   **Time-based Trigger:** Set up an interval timer (e.g., using `setInterval` or a cron library) that calls `runBatchSummary` based on the `SUMMARY_INTERVAL` environment variable (default: weekly).
    *   **Keyword Trigger:** Modify the Matrix client's message handler (`handleMessage` in `messages.ts` or `index.ts`):
        *   Check if an incoming message exactly matches the `SUMMARY_TRIGGER_KEYWORD` (default: "/summarize").
        *   If it matches, call `runBatchSummary(roomId)`.
6.  **Refactor Scraper + Summarizer Worker:**
    *   Ensure the worker function now accepts a single link object (from the DB record) and returns the result (summary or error) without directly sending messages. It should only perform scraping and AI summarization.
7.  **Containerize Application:**
    *   Create/update `Dockerfile` for the application service (Node.js/Bun runtime, copy code, install dependencies, expose ports if needed for API).

**Testing:**
*   **Unit Tests:**
    *   Test database interaction functions (connecting, writing links, querying pending links, updating status) using a mocked database client or an in-memory DB.
    *   Test the `runBatchSummary` logic: mocking DB calls, worker calls, and message sending; verify correct formatting and status updates.
    *   Test the trigger logic (interval setup, keyword matching).
    *   Test the refactored worker function (accepting DB object, returning result).
*   **Integration Tests (using Docker Compose):**
    *   Spin up the application and a test Postgres DB using Docker Compose.
    *   Simulate incoming messages via the Matrix listener (or directly call the link storage service).
    *   Verify links are correctly written to the DB with `status = 'pending'`. 
    *   Manually trigger the keyword command:
        *   Mock the scraper and AI API.
        *   Verify the `runBatchSummary` function executes, calls the (mocked) worker for pending links.
        *   Verify the compiled summary message is sent to the Matrix client (mocked `sendMessage`).
        *   Verify link statuses are updated to `summarized` or `failed` in the DB.
    *   Test the time-based trigger (may require manipulating time in tests or using short intervals).

**Outcome:** A Dockerized application suite where links are persisted in Postgres. Summarization happens in batches, triggered automatically by a timer or manually via a chat command, with the combined summary posted to the forwarding room.

## Phase 4: API Layer & Frontend

**Goal:** Build the user-facing web interface to browse stored links and summaries.

1.  **Develop API Layer:**
     *   Set up an HTTP server framework (e.g., Hono or Express).
    *   Create API endpoints to query data from the Postgres database:
        *   `GET /api/links`: Retrieve paginated list of all links (regardless of status), potentially allowing filtering by `chat_id` or status. Include associated summary text if available.
        *   `GET /api/links/:id`: Retrieve full details for a specific link and its summary.
    *   Consider adding an endpoint to manually trigger a batch summary (optional, for admin/debug).
2.  **Scaffold React Frontend:**
    *   Set up a React project (e.g., using Vite).
    *   Install dependencies: `react`, `tailwindcss`, `shadcn/ui`, `lucide-react`, `@tanstack/react-query`.
3.  **Implement UI Components:**
    *   Create reusable components using `shadcn/ui` for displaying link lists (including URL, sender, timestamp, status, and summary snippet), detail views, loading states, and error messages.
    *   Apply Tailwind CSS for styling and responsive design.
4.  **Data Fetching:**
    *   Use `@tanstack/react-query` (`useQuery`) to fetch data from the API Layer (`/api/links`).
    *   Implement UI states for loading, success, and error. Handle pagination if implemented in the API.
5.  **Features:**
    *   Build the main view showing a sortable/filterable list of all captured links and their status/summaries.
    *   Build the detail view (optional, or modal) for a selected link showing full details.
    *   Add toasts for notifications (e.g., API errors).

**Testing:**
*   **Backend (API Layer):**
    *   **Unit Tests:** Test API route handlers, request validation, and database query logic (mocking the DB).
    *   **Integration Tests:** Test API endpoints using an HTTP client (like `supertest`) against a running server connected to a test database (via Docker Compose). Verify responses, status codes, pagination, and filtering.
*   **Frontend (React):**
    *   **Unit Tests (using Vitest/Jest + React Testing Library):**
        *   Test individual components for rendering, props handling, and basic interactions.
        *   Test data fetching hooks (`useQuery`) by mocking API responses.
    *   **Integration Tests (React Testing Library):**
        *   Test user flows like viewing the link list, applying filters, viewing details (if applicable).
    *   **End-to-End Tests (Optional, e.g., using Playwright or Cypress):**
        *   Run tests in a real browser against the full application stack (frontend + backend API + test DB) deployed via Docker Compose.
        *   Verify key user scenarios from end-to-end (loading page, seeing links, interacting with UI).

**Outcome:** A functional web application displaying links and their summaries fetched from the backend API, providing a persistent archive and view into the collected data. 