-- =============================================================
--  MANGALA PROPOSALS -- Database Schema
--  Encoding : utf8mb4 | Engine : InnoDB
--  Run this file once in MySQL Workbench to set up the database.
--  After running this file, run seed.sql to insert initial data.
-- =============================================================

CREATE DATABASE IF NOT EXISTS mangala_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mangala_db;

-- -------------------------------------------------------------
-- 1. USERS  (login accounts -- customers and admins)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(150) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('user','admin') NOT NULL DEFAULT 'user',

  -- Verification
  is_verified     TINYINT(1)   NOT NULL DEFAULT 0,
  otp_code        VARCHAR(6),
  otp_expires_at  DATETIME,

  -- Account flags
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  admin_created   TINYINT(1)   NOT NULL DEFAULT 0,

  -- Preferences
  preferred_lang  ENUM('si','en','ta') NOT NULL DEFAULT 'si',

  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 2. DISTRICTS  (lookup table -- all 25 Sri Lanka districts)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS districts (
  id        INT          AUTO_INCREMENT PRIMARY KEY,
  name_en   VARCHAR(50)  NOT NULL,
  name_si   VARCHAR(50)  NOT NULL,
  name_ta   VARCHAR(50)  NOT NULL,
  province  VARCHAR(50)
);

-- -------------------------------------------------------------
-- 3. PROFILES  (matrimony proposal listings)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  ref_code        VARCHAR(12)  NOT NULL UNIQUE,

  -- Who is the profile for
  profile_for     ENUM('self','son','daughter','brother','sister','other')
                  NOT NULL DEFAULT 'self',

  -- Personal details
  full_name       VARCHAR(100) NOT NULL,
  gender          ENUM('male','female') NOT NULL,
  birth_date      DATE         NOT NULL,
  height_cm       SMALLINT,
  marital_status  ENUM('never_married','divorced','widowed')
                  NOT NULL DEFAULT 'never_married',
  religion        ENUM('buddhist','hindu','christian','catholic','muslim','other')
                  NOT NULL,
  caste           VARCHAR(60),
  district_id     INT,

  -- Professional
  education       VARCHAR(120),
  occupation      VARCHAR(120),
  income_range    VARCHAR(40),

  -- Free text
  about           TEXT,
  partner_pref    TEXT,

  -- Contact
  contact_phone   VARCHAR(20),
  contact_email   VARCHAR(150),

  -- Consent
  consent_given   TINYINT(1)   NOT NULL DEFAULT 1,

  -- Moderation
  status          ENUM('pending','approved','rejected','hidden')
                  NOT NULL DEFAULT 'pending',

  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
  INDEX idx_search (gender, religion, district_id, status)
);

-- -------------------------------------------------------------
-- 4. PROFILE PHOTOS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_photos (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  profile_id  INT          NOT NULL,
  file_path   VARCHAR(255) NOT NULL,
  is_primary  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 5. HOROSCOPES  (optional astrological details per profile)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horoscopes (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  profile_id   INT          NOT NULL UNIQUE,
  birth_time   TIME,
  birth_place  VARCHAR(100),
  nakath       VARCHAR(40),
  lagna        VARCHAR(40),
  raashi       VARCHAR(40),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 6. INTERESTS  (profile A expresses interest in profile B)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interests (
  id               INT  AUTO_INCREMENT PRIMARY KEY,
  from_profile_id  INT  NOT NULL,
  to_profile_id    INT  NOT NULL,
  status           ENUM('sent','accepted','declined') NOT NULL DEFAULT 'sent',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_interest (from_profile_id, to_profile_id),
  FOREIGN KEY (from_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (to_profile_id)   REFERENCES profiles(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 7. REPORTS  (flag fake / abusive profiles)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  profile_id   INT          NOT NULL,
  reporter_id  INT          NOT NULL,
  reason       VARCHAR(255) NOT NULL,
  status       ENUM('open','reviewed','closed') NOT NULL DEFAULT 'open',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id)  REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id)    ON DELETE CASCADE
);
