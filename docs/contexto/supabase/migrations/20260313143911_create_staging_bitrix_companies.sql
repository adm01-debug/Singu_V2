CREATE TABLE staging_bitrix_companies (
  bitrix_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  web TEXT,
  extracted_at TIMESTAMPTZ DEFAULT NOW()
);
