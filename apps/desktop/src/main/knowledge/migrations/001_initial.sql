CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  language TEXT,
  domain TEXT,
  quality REAL DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  rejected INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]'
);

CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts
  USING fts5(id UNINDEXED, text, language, domain, content=snippets);

CREATE TABLE IF NOT EXISTS embeddings (
  snippet_id TEXT PRIMARY KEY REFERENCES snippets(id) ON DELETE CASCADE,
  vector BLOB NOT NULL,
  model TEXT DEFAULT 'e5-small-v2'
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  rationale TEXT,
  alternatives TEXT DEFAULT '[]',
  outcome TEXT,
  project_path TEXT,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_stats (
  domain TEXT PRIMARY KEY,
  language TEXT,
  snippet_count INTEGER DEFAULT 0,
  last_updated INTEGER
);

CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_domain ON snippets(domain);
CREATE INDEX IF NOT EXISTS idx_snippets_quality ON snippets(quality DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions(timestamp DESC);
