# Architecture Planning for summarise-whatsapp-matrix

## 1. Overview

This document outlines the end-to-end architecture for a Matrix-based bridge to WhatsApp that tracks any links shared in group chats, stores them in a Postgres database, scrapes each link for content, generates a summary, and surfaces results via a frontend UI.

*(Note: Implementation may follow a phased approach, potentially starting with simpler persistence before integrating Postgres fully.)*

### 1.1 Goals
- Detect URLs in Matrix & WhatsApp group messages
- Persist link metadata in Postgres (`links` table with status like 'pending', 'summarized')
- Scrape URLs and generate concise summaries for all pending links **in batches**
- Post batch summaries to a designated Matrix room, triggered either **periodically** or by a **keyword command**
- Provide a responsive frontend listing links and their summaries

## 2. High-Level Components

```
[Matrix Client & WhatsApp Bridge]
    └── Event Listener & Link Storage Service
            │   └── Postgres Database (`links` table)
            │
            └── Batch Summarization Service
                    │   └── Scraper + Summarizer Worker
                    │           └── Summary Store (Postgres `summaries` table)
                    │
                    └── Trigger Service (Time-based & Keyword-based)
                            │
                            └── API Layer
                                    └── React Frontend
```

### 2.1 Matrix Client & WhatsApp Bridge
- Listens for new messages in group chats
- Uses environment variables for configuration (Homeserver, Token, Monitored Room ID, Forwarding Room ID, optional WhatsApp credentials)
- Emits parsed message events to the Link Storage Service
- **Responsibility:**
    - Listen for a specific **trigger keyword** (e.g., "/summarize") in the monitored room to initiate manual batch summarization.
    - Send the final batch summary message to the designated `FORWARDING_ROOM_ID`.

### 2.2 Link Storage Service (formerly Link Extractor)
- Applies a URL regex to incoming messages
- Deduplicates URLs within a configurable time window (or checks against existing DB entries)
- Writes new, unique link records into the `links` table in Postgres with `status = 'pending'`. **Does not trigger immediate summarization.**

### 2.3 Postgres Database
- **Tables**:
  - `links` (id, url, chat_id, message_id, sender_name, timestamp, status: 'pending' | 'summarized' | 'failed')
  - `summaries` (id, link_id, summary_text, created_at)
- Uses a connection pool (e.g. `pg` or ORM)

### 2.4 Scraper + Summarizer Worker
- **Triggered** by the Batch Summarization Service (not polling directly).
- Receives a **batch** of pending links (`links` records with `status = 'pending'`).
- For each link in the batch:
    - Fetches page content (with axios/fetch)
    - Uses an AI service or lightweight text summarizer
    - Writes the result to the `summaries` table
    - Updates the corresponding `links` record status to `'summarized'` or `'failed'`.
- Handles errors gracefully for individual links within a batch.
- Returns the results (summaries and original links) for the batch to the Batch Summarization Service.

### 2.4.1 Batch Summarization Service
- **Orchestrates** the batch summarization process.
- **Triggered** either periodically (e.g., weekly cron job/interval) or manually (by keyword detection in the Matrix Client).
- Queries the database for all links with `status = 'pending'`.
- Passes the batch of pending links to the Scraper + Summarizer Worker.
- Receives the summarization results from the worker.
- Compiles a single, formatted message containing all successful summaries from the batch.
- Instructs the Matrix Client to send the compiled summary message to the `FORWARDING_ROOM_ID`.

### 2.5 API Layer
- A REST or GraphQL server (e.g. Express, Hono) exposing endpoints:
  - `GET /api/links?chat_id=` → paginated list with summary preview
  - `GET /api/links/:id` → full URL metadata and summary
- Implements TanStack React Query on the frontend for caching

### 2.6 React Frontend
- Built with React, Tailwind CSS and shadcn/ui components
- Displays:
  - List view of recent links with summary snippets
  - Detail view for each link and its full summary
- Uses toasts for important events (e.g. fetch errors)
- Responsive design for desktop and mobile

## 3. Data Flow Sequence (Batch Summarization)
1. **Message Arrives** in Matrix bridge from a monitored room.
2. **Link Storage Service** identifies URL(s) and writes new record(s) to `links` table with `status = 'pending'`.
3. **Trigger Occurs:**
    *   **Time-based:** Scheduled interval fires (e.g., weekly).
    *   **Manual:** User sends trigger keyword (e.g., "/summarize") in the monitored room, detected by the Matrix Client.
4. **Batch Summarization Service** is activated by the trigger.
5. **Service** queries Postgres for all `links` where `status = 'pending'`.
6. **Service** passes the batch of pending links to the **Scraper + Summarizer Worker**.
7. **Worker** processes each link: scrapes, summarizes, updates `summaries` table, and updates `links.status` to 'summarized' or 'failed'.
8. **Worker** returns results to the **Batch Summarization Service**.
9. **Service** formats a single message containing all successful summaries.
10. **Service** instructs the **Matrix Client** to send the compiled summary to the `FORWARDING_ROOM_ID`.
11. **User** loads frontend → triggers API call → UI displays all links and summaries fetched from the database.

## 4. Environment Variables
- `MATRIX_HOMESERVER_URL`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MONITORED_ROOM_ID`
- `FORWARDING_ROOM_ID`
- `DATABASE_URL`
- `AI_API_KEY`
- `AI_API_URL` (optional)
- `AI_MODEL` (optional)
- `SUMMARY_INTERVAL` (optional, e.g., "weekly", "daily", or cron string - defaults to weekly)
- `SUMMARY_TRIGGER_KEYWORD` (optional, e.g., "/summarize" - defaults to "/summarize")
- `WHATSAPP_IDS` (optional, if WhatsApp bridge is used)

## 5. Tech Stack
- **Language:** TypeScript
- **Package Manager:** Bun
- **Database:** PostgreSQL
- **HTTP Server:** Hono / Express
- **ORM / Driver:** pg or Prisma
- **Frontend:** React, TailwindCSS, shadcn/ui, Lucide Icons
- **Data Fetching:** @tanstack/react-query
- **Charting (optional):** recharts

## 6. Next Steps
- Define detailed database schema (DDL)
- Sketch API contract (request/response models)
- Build link extraction module
- Set up worker and summariser pipeline
- Scaffold frontend pages and routes 