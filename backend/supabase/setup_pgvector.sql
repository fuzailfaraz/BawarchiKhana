-- Run in Supabase SQL editor (or your Cloud SQL instance)
CREATE EXTENSION IF NOT EXISTS vector;

-- KB 1: Shared recipe knowledge base
CREATE TABLE recipe_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   TEXT NOT NULL,
  content     TEXT NOT NULL,           -- Full recipe text used for embedding
  embedding   vector(768),             -- Google text-embedding-004 = 768 dims
  metadata    JSONB,                   -- title, region, ingredients, spiceLevel, halal, etc.
  source      TEXT DEFAULT 'curated',  -- 'curated' | 'community'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- KB 2: Per-user personal history (private)
CREATE TABLE user_history_embeddings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  content    TEXT NOT NULL,
  embedding  vector(768),
  metadata   JSONB,                    -- dishName, rating, tags, dateCooked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KB 3: Pakistani ingredient knowledge base (shared)
CREATE TABLE ingredient_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id TEXT NOT NULL,
  content       TEXT NOT NULL,
  embedding     vector(768),
  metadata      JSONB,                 -- nameUrdu, nameEnglish, halal, substitutes
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- KB 4: Pakistani cultural context (shared)
CREATE TABLE cultural_embeddings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic      TEXT NOT NULL,            -- "Ramadan", "Eid ul Adha", "Lahori style", etc.
  content    TEXT NOT NULL,
  embedding  vector(768),
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat indexes for fast cosine similarity search
CREATE INDEX ON recipe_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX ON user_history_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX ON ingredient_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX ON cultural_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Recipe similarity search
CREATE OR REPLACE FUNCTION match_recipes(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 3,
  filter_halal boolean DEFAULT true
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id, re.content, re.metadata,
    1 - (re.embedding <=> query_embedding) AS similarity
  FROM recipe_embeddings re
  WHERE
    1 - (re.embedding <=> query_embedding) > match_threshold
    AND (NOT filter_halal OR (re.metadata->>'halal')::boolean = true)
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END; $$;

-- Per-user history search
CREATE OR REPLACE FUNCTION match_user_history(
  query_embedding vector(768),
  p_user_id text,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.75
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    uh.id, uh.content, uh.metadata,
    1 - (uh.embedding <=> query_embedding) AS similarity
  FROM user_history_embeddings uh
  WHERE
    uh.user_id = p_user_id
    AND 1 - (uh.embedding <=> query_embedding) > match_threshold
  ORDER BY uh.embedding <=> query_embedding
  LIMIT match_count;
END; $$;

-- Ingredient knowledge search
CREATE OR REPLACE FUNCTION match_ingredients(
  query_embedding vector(768),
  match_count int DEFAULT 1,
  match_threshold float DEFAULT 0.85
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ie.id, ie.content, ie.metadata,
    1 - (ie.embedding <=> query_embedding) AS similarity
  FROM ingredient_embeddings ie
  WHERE 1 - (ie.embedding <=> query_embedding) > match_threshold
  ORDER BY ie.embedding <=> query_embedding
  LIMIT match_count;
END; $$;

-- Cultural context search
CREATE OR REPLACE FUNCTION match_cultural_context(
  query_embedding vector(768),
  match_count int DEFAULT 1,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id, ce.content, ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM cultural_embeddings ce
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END; $$;
