# Architecture Planning for summarise-whatsapp-matrix

## 1. Overview

This document outlines the end-to-end architecture for a Matrix-based bridge to WhatsApp that tracks any links shared in group chats, stores them in a Postgres database, scrapes each link for content, generates a summary, and surfaces results via a frontend UI.

*(Note: Implementation may follow a phased approach, potentially starting with simpler persistence before integrating Postgres fully.)*

### 1.1 Goals
- Detect URLs in Matrix & WhatsApp group messages
- Persist link metadata in Postgres
- Scrape each URL and generate concise summaries
- Provide a responsive frontend listing links and their summaries

## 2. High-Level Components

```
[Matrix Client & WhatsApp Bridge]
    └── Event Listener & Link Extractor
            └── Postgres Database
                    └── Scraper + Summarizer Worker
                            └── Summary Store (Postgres)
                                    └── API Layer
                                            └── React Frontend
``` 

### 2.1 Matrix Client & WhatsApp Bridge
- Listens for new messages in group chats
- Uses environment variables for WhatsApp credentials (`WHATSAPP_IDS`, tokens, etc.)
- Emits parsed message events to the Link Extractor module
- **Responsibility:** Also needs capability to send messages back to specific chats.

### 2.2 Link Extractor
- Applies a URL regex to incoming messages
- Deduplicates URLs per chat and per time window
- Enqueues new link records into Postgres

### 2.3 Postgres Database
- **Tables**:
  - `links` (id, url, chat_id, message_id, timestamp, status)
  - `summaries` (id, link_id, summary_text, created_at)
- Uses a connection pool (e.g. `pg` or ORM)

### 2.4 Scraper + Summarizer Worker
- Polls for new `links` with `status = 'pending'`
- Fetches page content (with axios/fetch)
- Uses an AI service or lightweight text summarizer
- Updates `summaries` table and marks `links.status = 'completed'`
- **New Action:** After successful summarization, triggers sending the summary back to the original chat via the Matrix/WhatsApp bridge.
- Retries on failure after a backoff

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

## 3. Data Flow Sequence
1. **Message Arrives** in Matrix/WhatsApp bridge
2. **Extractor** identifies URL and writes new record in `links`
3. **Worker** scrapes URL, generates summary, writes to `summaries`
4. **Worker** triggers the bridge to send the summary message back to the original chat.
5. **User** loads frontend → triggers API call → UI displays summary (summary is already available in chat)

## 4. Environment Variables
- `MATRIX_HOMESERVER_URL`
- `MATRIX_ACCESS_TOKEN`
- `WHATSAPP_IDS`
- `DATABASE_URL`
- `AI_API_KEY` (for summarisation)

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