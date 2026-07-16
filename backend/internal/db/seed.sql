-- Database Seeds for TechAZsure 3D Print
-- Target path: backend/internal/db/seed.sql

-- 1. Bangalore Core Hub (Pincodes 560001 to 560110)
-- Tier: express, Express Eligible: true
INSERT INTO pincodes (pincode, tier, is_eligible_express, message)
SELECT 
    to_char(g, 'FM000000'), 
    'express', 
    true, 
    '8-Hour Express Available! Order before 2 PM for tonight.'
FROM generate_series(560001, 560110) AS g
ON CONFLICT (pincode) DO UPDATE 
SET 
    tier = EXCLUDED.tier,
    is_eligible_express = EXCLUDED.is_eligible_express,
    message = EXCLUDED.message,
    updated_at = CURRENT_TIMESTAMP;

-- 2. Campus Priority Pincodes (Pincodes 123021 to 123035)
-- Tier: campus, Express Eligible: false
INSERT INTO pincodes (pincode, tier, is_eligible_express, message)
SELECT 
    to_char(g, 'FM000000'), 
    'campus', 
    false, 
    'Campus Priority Active! Evening hand-delivery.'
FROM generate_series(123021, 123035) AS g
ON CONFLICT (pincode) DO UPDATE 
SET 
    tier = EXCLUDED.tier,
    is_eligible_express = EXCLUDED.is_eligible_express,
    message = EXCLUDED.message,
    updated_at = CURRENT_TIMESTAMP;
