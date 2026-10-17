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

-- 3. Materials Specs & Pricing
INSERT INTO materials (id, name, density, cost_per_gram, machine_hourly_rate, finish_type, is_available) VALUES
('pla', 'PLA (Standard)', 1.24, 2.80, 100.00, 'Matte / Smooth', true),
('petg', 'PETG (Durable & Weather Resistant)', 1.27, 3.50, 120.00, 'Semi-Gloss', true),
('abs', 'ABS (High Impact & Heat Resistant)', 1.04, 3.80, 140.00, 'Textured / Vapor Smoothable', true),
('resin', 'SLA Resin (Ultra Fine Detail)', 1.15, 6.20, 180.00, 'Glossy / Ultra High Resolution', true),
('nylon', 'Nylon PA12 (Engineering Grade)', 1.01, 7.50, 220.00, 'Tough Matte', true),
('carbon', 'Carbon Fiber Composite', 1.30, 9.50, 260.00, 'Carbon Textured Rigid', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    density = EXCLUDED.density,
    cost_per_gram = EXCLUDED.cost_per_gram,
    machine_hourly_rate = EXCLUDED.machine_hourly_rate,
    finish_type = EXCLUDED.finish_type,
    is_available = EXCLUDED.is_available;

-- 4. Catalog Categories
INSERT INTO categories (id, name, slug, description, icon, sort_order) VALUES
('frames', 'Lithophane Frames', 'frames', 'Backlit personalized photo frames etched in high-precision 3D layers.', 'Frame', 1),
('figurines', 'Figurines & Collectibles', 'figurines', 'High-detail idols, character sculptures and artistic figures in resin and composite.', 'Star', 2),
('home-decor', 'Home Decor & Living', 'home-decor', 'Parametric vases, lamp shades, and architectural home fixtures.', 'Home', 3),
('jewelry', 'Jewelry & Accessories', 'jewelry', 'Filigree pendants, earrings, and custom wearable artisan items.', 'Gem', 4),
('keychains', 'Personalized Keychains', 'keychains', 'Custom dual-color typography keychains and corporate badge tags.', 'KeyRound', 5),
('tech', 'Tech & Desk Gadgets', 'tech', 'Cable organizers, MagSafe desk docks, mechanical keyboard accents.', 'Monitor', 6),
('architecture', 'Architectural Models', 'architecture', 'Scale topography miniatures, structural sectionals, and museum displays.', 'Building2', 7)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 5. Catalog Products
INSERT INTO products (id, category_id, name, slug, description, base_price, image_url, material_default, tag, tag_variant, is_active) VALUES
('photo-lamp-frame', 'frames', 'Photo Lamp Frame', 'photo-lamp-frame', 'Your photo 3D-printed as a glowing lithophane panel, seated in a cuboidal LED lamp box with slide-in rails and a warm-white USB-C light engine.', 499.00, '/frames/classic_frame.png', 'pla', 'New', 'badge-cyan', true),
('classic-lithophane', 'frames', 'Classic Lithophane Frame', 'classic-lithophane-frame', 'Signature rectangular frame with precision 3D-etched backlight layout.', 299.00, '/frames/classic_frame.png', 'pla', 'Bestseller', 'badge-accent', true),
('heart-shaped-memory', 'frames', 'Heart-Shaped Memory Frame', 'heart-shaped-memory-frame', 'Romantic heart-profile frame designed for couples and anniversaries.', 349.00, '/frames/heart_frame.png', 'pla', 'Romantic', 'badge-cyan', true),
('ornate-vintage-border', 'frames', 'Ornate Vintage Border Frame', 'ornate-vintage-border-frame', 'Elegant frame styled with classic historical relief patterns and textured borders.', 399.00, '/frames/vintage_frame.png', 'pla', 'Elegant', 'badge-accent', true),
('sleek-minimalist-gallery', 'frames', 'Sleek Minimalist Gallery Frame', 'sleek-minimalist-gallery-frame', 'Clean, borderless contemporary display that fits seamlessly into modern decors.', 249.00, '/frames/minimal_frame.png', 'pla', 'Modern', 'badge-cyan', true),
('embossed-celebration', 'frames', 'Embossed Celebration Frame', 'embossed-celebration-frame', 'Perfect for birthday gifts, featuring festive embossed patterns and customizable borders.', 299.00, '/frames/celebration_frame.png', 'pla', 'Trending', 'badge-accent', true),
('ganesha-figurine', 'figurines', 'Ganesha Deity Figurine', 'ganesha-deity-figurine', 'Intricately detailed 3D printed Ganesha idol in glossy black resin with gold accents.', 799.00, '/models/figurine_ganesha.png', 'resin', 'Popular', 'badge-accent', true),
('voronoi-vase', 'home-decor', 'Voronoi Lattice Vase', 'voronoi-lattice-vase', 'Geometric open-lattice vase with organic Voronoi patterns, matte white finish with gold interior.', 549.00, '/models/homedecor_vase.png', 'pla', 'New', 'badge-cyan', true),
('floral-filigree-pendant', 'jewelry', 'Floral Filigree Pendant', 'floral-filigree-pendant', 'Rose gold resin pendant with intricate floral patterns on a fine chain.', 449.00, '/models/jewelry_pendant.png', 'resin', 'Gifting', 'badge-accent', true),
('name-keychain', 'keychains', 'Custom Name Keychain', 'custom-name-keychain', 'Bold 3D name keychains with dual-color black and orange finish. Personalize with any name.', 149.00, '/models/keychain_custom.png', 'pla', 'Trending', 'badge-cyan', true),
('desk-organizer-set', 'tech', 'Desk Organizer & Phone Stand', 'desk-organizer-and-phone-stand', 'Sleek geometric phone stand and multi-slot desk organizer in matte black, built for any workspace.', 399.00, '/models/tech_phonestand.png', 'pla', 'New', 'badge-accent', true),
('architecture-collectible', 'architecture', 'Heritage Architecture Model', 'heritage-architecture-model', 'Museum-quality 1:160 scale architectural collectible in white PLA with premium acrylic display stand.', 1299.00, '/models/architecture_miniature.png', 'pla', 'Premium', 'badge-accent', true)
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    image_url = EXCLUDED.image_url,
    material_default = EXCLUDED.material_default,
    tag = EXCLUDED.tag,
    tag_variant = EXCLUDED.tag_variant,
    is_active = EXCLUDED.is_active;

-- 6. Sample Initial Order & Timeline for Demo Tracking
INSERT INTO orders (id, file_name, file_size, volume_cm3, file_url, material_type, delivery_tier, pincode, base_price, rush_surcharge, bulk_discount, final_price, status, shipping_address, contact_email, contact_phone)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'classic_lithophane_sample.stl',
    2411724,
    45.80,
    '/uploads/samples/sample_litho.stl',
    'pla',
    'express',
    '560001',
    299.00,
    50.00,
    0.00,
    349.00,
    'in_print',
    'Flat 402, Prestige Tower, MG Road, Bangalore 560001',
    'demo@techazsure.com',
    '+919876543210'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_timeline (order_id, stage, message, location) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'order_placed', 'Order verified and queued into Bangalore Core Farm.', 'Bangalore Hub'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sliced', 'G-code generated at 0.12mm layer resolution with adaptive infill.', 'Bangalore Slicing Cluster'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'in_print', 'Print bed heated to 60°C. Extruding layer 142 of 640 on Farm Station 04.', 'Print Bed 04')
ON CONFLICT DO NOTHING;

-- 8. Default platform settings (admin-editable; DO NOTHING so admin edits
-- made in the dashboard are never overwritten on container reboot).
INSERT INTO settings (key, value) VALUES
('platform_config', '{
  "origin_pincode": "560001",
  "origin_address": "TechAZsure Print Farm, Bangalore 560001",
  "lamp_prices": {"small": 499, "medium": 799, "large": 1299},
  "eco_discount": 100,
  "rush_surcharge_rate": 0.833,
  "machine_rate_per_cm3": 20,
  "bulk_volume_threshold": 100,
  "bulk_price_threshold": 2000,
  "bulk_discount_pct": 0.10,
  "shipping": {
    "same_pincode":  {"min_days": 0, "max_days": 1},
    "same_district": {"min_days": 1, "max_days": 2},
    "same_region":   {"min_days": 2, "max_days": 3},
    "same_zone":     {"min_days": 3, "max_days": 5},
    "national":      {"min_days": 5, "max_days": 7}
  }
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
