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

**Outcome:** The service now scrapes links, summarizes them, and posts the summary to the designated chat.

## Phase 3: Introduce Persistence (Docker & Postgres)

**Goal:** Replace temporary storage/forwarding with a robust Postgres database using Docker Compose.

1.  **Define Database Schema:**
    *   Finalize the schema for `links` and `summaries` tables (as outlined in `architecture.md`). Create SQL DDL scripts.
2.  **Setup Docker Compose:**
    *   Create a `docker-compose.yml` file.
    *   Define a service for Postgres, configuring data volumes and credentials (`DATABASE_URL`).
    *   Define a service for the application, building from the project's Dockerfile.
3.  **Integrate Postgres:**
    *   Add a database client library (e.g., `pg` or Prisma).
    *   Refactor the **Link Extractor**: Instead of forwarding/processing immediately, write link details to the `links` table with `status = 'pending'`.
    *   Refactor the **Scraper + Summarizer Worker**:
        *   Change it to poll the `links` table for records with `status = 'pending'`.
        *   On successful summarization, write the result to the `summaries` table and update the corresponding `links` record's status to `'completed'`.
        *   Implement the logic to send the summary back to the *original* chat (using `chat_id` stored in the `links` table) via the Matrix client.
4.  **Containerize Application:**
    *   Create a `Dockerfile` for the application service (Node.js/Bun runtime, copy code, install dependencies).

**Outcome:** A Dockerized application suite where links are persisted in Postgres, processed by a worker, and summaries are stored and sent back to the originating chat.

## Phase 4: API Layer & Frontend

**Goal:** Build the user-facing web interface.

1.  **Develop API Layer:**
    *   Set up an HTTP server framework (e.g., Hono or Express).
    *   Create API endpoints (e.g., `GET /api/links`, `GET /api/links/:id`) to query data from the Postgres database.
    *   Implement pagination and filtering (e.g., by `chat_id`).
2.  **Scaffold React Frontend:**
    *   Set up a React project (e.g., using Vite).
    *   Install necessary dependencies: `react`, `tailwindcss`, `shadcn/ui`, `lucide-react`, `@tanstack/react-query`.
3.  **Implement UI Components:**
    *   Create reusable components using `shadcn/ui` for displaying lists, details, etc.
    *   Apply Tailwind CSS for styling and responsive design.
4.  **Data Fetching:**
    *   Use `@tanstack/react-query` (`useQuery`) to fetch data from the API Layer.
    *   Implement UI states for loading, success, and error.
5.  **Features:**
    *   Build the main link list view (with summary snippets).
    *   Build the detail view for a selected link.
    *   Add toasts for notifications.

**Outcome:** A functional web application displaying summarized links fetched from the backend API. 