-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS links_status_idx ON links (status);
CREATE INDEX IF NOT EXISTS links_url_idx ON links (url);
CREATE INDEX IF NOT EXISTS links_chat_id_idx ON links (chat_id);
CREATE INDEX IF NOT EXISTS links_created_at_idx ON links (created_at);
CREATE INDEX IF NOT EXISTS summaries_link_id_idx ON summaries (link_id);

-- Add comments
COMMENT ON TABLE links IS 'Stores links extracted from Matrix messages';
COMMENT ON TABLE summaries IS 'Stores summaries of the content from links';
COMMENT ON COLUMN links.url IS 'The URL extracted from the message';
COMMENT ON COLUMN links.chat_id IS 'The Matrix room ID where the link was posted';
COMMENT ON COLUMN links.message_id IS 'The Matrix message ID that contained the link';
COMMENT ON COLUMN links.sender_name IS 'The name of the Matrix user who shared the link';
COMMENT ON COLUMN links.status IS 'The status of the link processing: pending, summarized, or failed';
COMMENT ON COLUMN summaries.link_id IS 'Reference to the link this summary is for';
COMMENT ON COLUMN summaries.summary IS 'The AI-generated summary of the link content'; 