-- =============================================================
--  MANGALA PROPOSALS -- Seed Data
--  Run AFTER schema.sql
--  Inserts: 25 districts + default admin account
-- =============================================================

USE mangala_db;

-- -------------------------------------------------------------
-- Districts (all 25 Sri Lanka districts)
-- -------------------------------------------------------------
INSERT IGNORE INTO districts (name_en, name_si, name_ta, province) VALUES
('Colombo',       'කොළඹ',          'கொழும்பு',          'Western'),
('Gampaha',       'ගම්පහ',         'கம்பஹா',            'Western'),
('Kalutara',      'කළුතර',         'களுத்துறை',         'Western'),
('Kandy',         'මහනුවර',        'கண்டி',             'Central'),
('Matale',        'මාතලේ',         'மாத்தளை',           'Central'),
('Nuwara Eliya',  'නුවරඑළිය',      'நுவரெலியா',         'Central'),
('Galle',         'ගාල්ල',         'காலி',              'Southern'),
('Matara',        'මාතර',          'மாத்தறை',           'Southern'),
('Hambantota',    'හම්බන්තොට',     'அம்பாந்தோட்டை',     'Southern'),
('Jaffna',        'යාපනය',         'யாழ்ப்பாணம்',       'Northern'),
('Kilinochchi',   'කිලිනොච්චි',    'கிளிநொச்சி',        'Northern'),
('Mannar',        'මන්නාරම',       'மன்னார்',           'Northern'),
('Vavuniya',      'වවුනියාව',      'வவுனியா',           'Northern'),
('Mullaitivu',    'මුලතිව්',       'முல்லைத்தீவு',      'Northern'),
('Batticaloa',    'මඩකලපුව',       'மட்டக்களப்பு',      'Eastern'),
('Ampara',        'අම්පාර',        'அம்பாறை',           'Eastern'),
('Trincomalee',   'ත්‍රිකුණාමලය',  'திருகோணமலை',        'Eastern'),
('Kurunegala',    'කුරුණෑගල',      'குருணாகல்',         'North Western'),
('Puttalam',      'පුත්තලම',       'புத்தளம்',          'North Western'),
('Anuradhapura',  'අනුරාධපුර',     'அனுராதபுரம்',       'North Central'),
('Polonnaruwa',   'පොළොන්නරුව',    'பொலன்னறுவை',        'North Central'),
('Badulla',       'බදුල්ල',        'படுளை',             'Uva'),
('Monaragala',    'මොනරාගල',       'மொனராகலை',          'Uva'),
('Ratnapura',     'රත්නපුර',       'இரத்தினபுரி',       'Sabaragamuwa'),
('Kegalle',       'කිගල්ල',        'கேகாலை',            'Sabaragamuwa');

-- -------------------------------------------------------------
-- Default Admin Account
--   Email    : admin@youremail.com
--   Password : 1234  (bcrypt hash below)
-- -------------------------------------------------------------
INSERT IGNORE INTO users (
  email,
  phone,
  password_hash,
  role,
  is_verified,
  is_active,
  admin_created,
  preferred_lang
) VALUES (
  'admin@youremail.com',
  '+94 70 000 0000',
  '$2b$12$g3aiDOPSZNqe7ElDTsZEg.l7BUG9zNfNEXEZ6FcF8Q8R3ag6V8HaO',
  'admin',
  1,
  1,
  1,
  'si'
);

-- Verify admin was inserted:
SELECT id, email, role, is_verified, is_active FROM users WHERE role = 'admin';
