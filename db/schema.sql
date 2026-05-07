-- Run this once to set up the database schema

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sku_reviews (
    id                       SERIAL PRIMARY KEY,

    -- Populated by backend
    sku_group                VARCHAR(255) NOT NULL,
    category                 VARCHAR(255),
    return_pct               DECIMAL(5,2),
    online_inventory         INTEGER,
    image_url                TEXT,
    week_date                DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Production team fills these
    size_check               BOOLEAN DEFAULT NULL,
    size_issue_found         BOOLEAN DEFAULT NULL,
    fit_trial_done           BOOLEAN DEFAULT NULL,
    debit_note_raised        BOOLEAN DEFAULT NULL,
    remarks                  TEXT DEFAULT NULL,
    description_updated      BOOLEAN DEFAULT NULL,
    description_update_notes TEXT DEFAULT NULL,

    -- Workflow status
    review_status            VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Audit
    last_updated_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_updated_at          TIMESTAMPTZ,
    created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sku_reviews_week_date ON sku_reviews(week_date);
CREATE INDEX IF NOT EXISTS idx_sku_reviews_status    ON sku_reviews(review_status);
