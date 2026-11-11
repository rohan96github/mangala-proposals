# Mangala Proposals â€“ Sri Lankan Matrimony Platform

Development guide for building the project with **VS Code** and **MySQL Workbench**.

**Languages:** Sinhala (à·ƒà·’à¶‚à·„à¶½), English, and Tamil (à®¤à®®à®¿à®´à¯) are supported across the interface, database, and API.

---

## 1. Project Overview

An online matrimony platform where people can register, create profiles, search for matches, and send interests, similar to the newspaper "Mangala Kinkini" section but online.

### Core features (MVP)
- User registration and login (email + password)
- Create / edit a marriage profile (bride or groom)
- Photo upload
- Search and filter (gender, age, district, religion, caste, education)
- Contact details hidden until the owner approves
- Send / accept / decline interest
- Admin panel: approve profiles, remove fake profiles, handle reports
- **Trilingual interface (Sinhala / English / Tamil)** with a language switcher

### Later features
- Horoscope (Jathaka) details and matching
- Payments (premium plans)
- Phone OTP verification and ID verification
- Chat between matched users
- Email / SMS notifications

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + react-i18next (multi-language) |
| Backend | Node.js + Express |
| Database | MySQL 8 (managed with MySQL Workbench) |
| Auth | JWT + bcrypt |
| File upload | Multer (local folder first, cloud storage later) |
| Validation | express-validator |
| Fonts | Noto Sans Sinhala, Noto Sans Tamil (Google Fonts) |
| Dev tools | VS Code, Postman / Thunder Client, Git |

---

## 3. Prerequisites (install these first)

1. **Node.js LTS** â€“ https://nodejs.org
2. **MySQL Community Server 8.x** and **MySQL Workbench** â€“ https://dev.mysql.com/downloads/
3. **VS Code** â€“ https://code.visualstudio.com
4. **Git** â€“ https://git-scm.com

### Recommended VS Code extensions
- ESLint
- Prettier â€“ Code formatter
- Thunder Client (or REST Client) for API testing
- MySQL (by Jun Han) â€“ optional quick queries inside VS Code
- DotENV
- GitLens

---

## 4. Folder Structure

```
mangala-matrimony/
â”œâ”€â”€ README.md
â”œâ”€â”€ .gitignore
â”œâ”€â”€ database/
â”‚   â”œâ”€â”€ schema.sql
â”‚   â””â”€â”€ seed.sql
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ .env
â”‚   â”œâ”€â”€ server.js
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ db.js
â”‚   â”œâ”€â”€ middleware/
â”‚   â”‚   â”œâ”€â”€ auth.js
â”‚   â”‚   â””â”€â”€ upload.js
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ auth.routes.js
â”‚   â”‚   â”œâ”€â”€ profile.routes.js
â”‚   â”‚   â”œâ”€â”€ interest.routes.js
â”‚   â”‚   â””â”€â”€ admin.routes.js
â”‚   â””â”€â”€ uploads/
â””â”€â”€ frontend/
    â”œâ”€â”€ package.json
    â”œâ”€â”€ index.html
    â””â”€â”€ src/
        â”œâ”€â”€ main.jsx
        â”œâ”€â”€ App.jsx
        â”œâ”€â”€ api.js
        â”œâ”€â”€ i18n.js
        â”œâ”€â”€ locales/
        â”‚   â”œâ”€â”€ si.json
        â”‚   â”œâ”€â”€ en.json
        â”‚   â””â”€â”€ ta.json
        â”œâ”€â”€ pages/
        â”‚   â”œâ”€â”€ Home.jsx
        â”‚   â”œâ”€â”€ Login.jsx
        â”‚   â”œâ”€â”€ Register.jsx
        â”‚   â”œâ”€â”€ Search.jsx
        â”‚   â”œâ”€â”€ ProfileView.jsx
        â”‚   â”œâ”€â”€ ProfileForm.jsx
        â”‚   â””â”€â”€ Dashboard.jsx
        â””â”€â”€ components/
            â”œâ”€â”€ ProfileCard.jsx
            â”œâ”€â”€ Filters.jsx
            â””â”€â”€ LanguageSwitcher.jsx
```

---

## 5. Database Setup (MySQL Workbench)

### 5.1 Connect
1. Open **MySQL Workbench**.
2. Click **+** next to *MySQL Connections* and set:
   - Connection Name: `mangala_local`
   - Hostname: `127.0.0.1`, Port: `3306`
   - Username: `root`
3. Click **Test Connection**, then **OK**, and open the connection.

### 5.2 Create the database
Open a new SQL tab (**Ctrl+T**), paste the schema below, then run it with **Ctrl+Shift+Enter**.

### 5.3 Schema (`database/schema.sql`)

```sql
CREATE DATABASE IF NOT EXISTS mangala_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mangala_db;

-- Users (login accounts)
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_verified   TINYINT(1) NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  preferred_lang ENUM('si','en','ta') NOT NULL DEFAULT 'si',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lookup: districts
CREATE TABLE districts (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(50) NOT NULL,
  name_si VARCHAR(50) NOT NULL,
  name_ta VARCHAR(50) NOT NULL,
  province VARCHAR(50)
);

-- Profiles (one user can create profiles for themselves or a family member)
CREATE TABLE profiles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  ref_code        VARCHAR(12) NOT NULL UNIQUE,
  profile_for     ENUM('self','son','daughter','brother','sister','other') NOT NULL DEFAULT 'self',
  full_name       VARCHAR(100) NOT NULL,
  gender          ENUM('male','female') NOT NULL,
  birth_date      DATE NOT NULL,
  height_cm       SMALLINT,
  marital_status  ENUM('never_married','divorced','widowed') NOT NULL DEFAULT 'never_married',
  religion        ENUM('buddhist','hindu','christian','catholic','muslim','other') NOT NULL,
  caste           VARCHAR(60),
  district_id     INT,
  education       VARCHAR(120),
  occupation      VARCHAR(120),
  income_range    VARCHAR(40),
  about           TEXT,
  partner_pref    TEXT,
  contact_phone   VARCHAR(20),
  contact_email   VARCHAR(150),
  status          ENUM('pending','approved','rejected','hidden') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (district_id) REFERENCES districts(id),
  INDEX idx_search (gender, religion, district_id, status)
);

-- Photos
CREATE TABLE profile_photos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  file_path  VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Horoscope details (optional)
CREATE TABLE horoscopes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  profile_id    INT NOT NULL UNIQUE,
  birth_time    TIME,
  birth_place   VARCHAR(100),
  nakath        VARCHAR(40),
  lagna         VARCHAR(40),
  raashi        VARCHAR(40),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Interests (one profile expressing interest in another)
CREATE TABLE interests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  from_profile_id INT NOT NULL,
  to_profile_id   INT NOT NULL,
  status          ENUM('sent','accepted','declined') NOT NULL DEFAULT 'sent',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_interest (from_profile_id, to_profile_id),
  FOREIGN KEY (from_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (to_profile_id)   REFERENCES profiles(id) ON DELETE CASCADE
);

-- Reports (flag fake / abusive profiles)
CREATE TABLE reports (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  profile_id  INT NOT NULL,
  reporter_id INT NOT NULL,
  reason      VARCHAR(255) NOT NULL,
  status      ENUM('open','reviewed','closed') NOT NULL DEFAULT 'open',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id)  REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id)    ON DELETE CASCADE
);
```

### 5.4 Seed data (`database/seed.sql`)

```sql
USE mangala_db;

INSERT INTO districts (name_en, name_si, name_ta, province) VALUES
('Colombo','à¶šà·œà·…à¶¹','à®•à¯Šà®´à¯à®®à¯à®ªà¯','Western'),
('Gampaha','à¶œà¶¸à·Šà¶´à·„','à®•à®®à¯à®ªà®¹à®¾','Western'),
('Kalutara','à¶šà·…à·”à¶­à¶»','à®•à®³à¯à®¤à¯à®¤à¯à®±à¯ˆ','Western'),
('Kandy','à¶¸à·„à¶±à·”à·€à¶»','à®•à®£à¯à®Ÿà®¿','Central'),
('Matale','à¶¸à·à¶­à¶½à·š','à®®à®¾à®¤à¯à®¤à®³à¯ˆ','Central'),
('Nuwara Eliya','à¶±à·”à·€à¶»à¶‘à·…à·’à¶º','à®¨à¯à®µà®°à¯†à®²à®¿à®¯à®¾','Central'),
('Galle','à¶œà·à¶½à·Šà¶½','à®•à®¾à®²à®¿','Southern'),
('Matara','à¶¸à·à¶­à¶»','à®®à®¾à®¤à¯à®¤à®±à¯ˆ','Southern'),
('Hambantota','à·„à¶¸à·Šà¶¶à¶±à·Šà¶­à·œà¶§','à®…à®®à¯à®ªà®¾à®¨à¯à®¤à¯‹à®Ÿà¯à®Ÿà¯ˆ','Southern'),
('Jaffna','à¶ºà·à¶´à¶±à¶º','à®¯à®¾à®´à¯à®ªà¯à®ªà®¾à®£à®®à¯','Northern'),
('Kilinochchi','à¶šà·’à¶½à·’à¶±à·œà¶ à·Šà¶ à·’','à®•à®¿à®³à®¿à®¨à¯Šà®šà¯à®šà®¿','Northern'),
('Mannar','à¶¸à¶±à·Šà¶±à·à¶»à¶¸','à®®à®©à¯à®©à®¾à®°à¯','Northern'),
('Vavuniya','à·€à·€à·”à¶±à·’à¶ºà·à·€','à®µà®µà¯à®©à®¿à®¯à®¾','Northern'),
('Mullaitivu','à¶¸à·”à¶½à¶­à·’à·€à·Š','à®®à¯à®²à¯à®²à¯ˆà®¤à¯à®¤à¯€à®µà¯','Northern'),
('Batticaloa','à¶¸à¶©à¶šà¶½à¶´à·”à·€','à®®à®Ÿà¯à®Ÿà®•à¯à®•à®³à®ªà¯à®ªà¯','Eastern'),
('Ampara','à¶…à¶¸à·Šà¶´à·à¶»','à®…à®®à¯à®ªà®¾à®±à¯ˆ','Eastern'),
('Trincomalee','à¶­à·Šâ€à¶»à·’à¶šà·”à¶«à·à¶¸à¶½à¶º','à®¤à®¿à®°à¯à®•à¯‹à®£à®®à®²à¯ˆ','Eastern'),
('Kurunegala','à¶šà·”à¶»à·”à¶«à·‘à¶œà¶½','à®•à¯à®°à¯à®£à®¾à®•à®²à¯','North Western'),
('Puttalam','à¶´à·”à¶­à·Šà¶­à¶½à¶¸','à®ªà¯à®¤à¯à®¤à®³à®®à¯','North Western'),
('Anuradhapura','à¶…à¶±à·”à¶»à·à¶°à¶´à·”à¶»','à®…à®©à¯à®°à®¾à®¤à®ªà¯à®°à®®à¯','North Central'),
('Polonnaruwa','à¶´à·œà·…à·œà¶±à·Šà¶±à¶»à·”à·€','à®ªà¯Šà®²à®©à¯à®©à®±à¯à®µà¯ˆ','North Central'),
('Badulla','à¶¶à¶¯à·”à¶½à·Šà¶½','à®ªà®¤à¯à®³à¯ˆ','Uva'),
('Monaragala','à¶¸à·œà¶«à¶»à·à¶œà¶½','à®®à¯Šà®©à®°à®¾à®•à®²à¯ˆ','Uva'),
('Ratnapura','à¶»à¶­à·Šà¶±à¶´à·”à¶»','à®‡à®°à®¤à¯à®¤à®¿à®©à®ªà¯à®°à®¿','Sabaragamuwa'),
('Kegalle','à¶šà·‘à¶œà¶½à·Šà¶½','à®•à¯‡à®•à®¾à®²à¯ˆ','Sabaragamuwa');
```

> **Already ran the old schema?** Add the new columns instead of recreating the database:
>
> ```sql
> ALTER TABLE users ADD COLUMN preferred_lang ENUM('si','en','ta') NOT NULL DEFAULT 'si';
> ALTER TABLE districts ADD COLUMN name_ta VARCHAR(50) NOT NULL DEFAULT '' AFTER name_si;
> -- then re-insert or UPDATE the district rows with the Sinhala and Tamil names above
> ```

### Unicode check (important for Sinhala and Tamil)
- The database uses `utf8mb4`, so Sinhala and Tamil text is stored correctly.
- In MySQL Workbench, open **Edit â†’ Preferences â†’ Fonts & Colors** and choose a font that supports Sinhala and Tamil (for example *Nirmala UI* on Windows) so the text is readable in the result grid.
- Verify with: `SELECT name_en, name_si, name_ta FROM districts LIMIT 5;`

### 5.5 Create a dedicated DB user (recommended)

```sql
CREATE USER 'mangala_app'@'localhost' IDENTIFIED BY 'ChangeThisStrongPassword!';
GRANT SELECT, INSERT, UPDATE, DELETE ON mangala_db.* TO 'mangala_app'@'localhost';
FLUSH PRIVILEGES;
```

### 5.6 Visual check in Workbench
Go to **Database â†’ Reverse Engineerâ€¦** to generate an EER diagram of your tables. Use it to check the relationships.

---

## 6. Backend Setup

### 6.1 Initialise

```bash
mkdir mangala-matrimony && cd mangala-matrimony
mkdir backend && cd backend
npm init -y
npm install express mysql2 bcrypt jsonwebtoken dotenv cors multer express-validator helmet express-rate-limit
npm install --save-dev nodemon
```

In `package.json` add:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

### 6.2 Environment file (`backend/.env`)

```
PORT=5000
DB_HOST=127.0.0.1
DB_USER=mangala_app
DB_PASSWORD=ChangeThisStrongPassword!
DB_NAME=mangala_db
JWT_SECRET=put_a_long_random_string_here
CLIENT_URL=http://localhost:5173
```

> Add `.env` and `uploads/` to `.gitignore`. Never commit passwords.

### 6.3 Database connection (`backend/config/db.js`)

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
```

### 6.4 Server entry (`backend/server.js`)

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));
app.use('/api/interests', require('./routes/interest.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Districts in all three languages
app.get('/api/districts', async (req, res) => {
  const [rows] = await require('./config/db').query(
    'SELECT id, name_en, name_si, name_ta FROM districts ORDER BY id');
  res.json(rows);
});

app.listen(process.env.PORT, () =>
  console.log(`API running on http://localhost:${process.env.PORT}`)
);
```

### 6.5 Auth middleware (`backend/middleware/auth.js`)

```js
const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
};
```

### 6.6 Auth routes (`backend/routes/auth.routes.js`)

```js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, phone, password, preferred_lang } = req.body;
    const lang = ['si', 'en', 'ta'].includes(preferred_lang) ? preferred_lang : 'si';
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const [r] = await db.query(
      'INSERT INTO users (email, phone, password_hash, preferred_lang) VALUES (?,?,?,?)',
      [email, phone || null, hash, lang]
    );
    res.status(201).json({ id: r.insertId });
  });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Wrong email or password' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role, preferred_lang: user.preferred_lang });
});

module.exports = router;
```

### 6.7 Profile routes (`backend/routes/profile.routes.js`)

```js
const router = require('express').Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const refCode = () => 'M' + Math.random().toString(36).slice(2, 8).toUpperCase();

// Create profile
router.post('/', requireAuth, async (req, res) => {
  const p = req.body;
  const [r] = await db.query(
    `INSERT INTO profiles
     (user_id, ref_code, profile_for, full_name, gender, birth_date, height_cm,
      marital_status, religion, caste, district_id, education, occupation,
      about, partner_pref, contact_phone, contact_email)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.id, refCode(), p.profile_for, p.full_name, p.gender, p.birth_date,
     p.height_cm, p.marital_status, p.religion, p.caste, p.district_id,
     p.education, p.occupation, p.about, p.partner_pref, p.contact_phone, p.contact_email]
  );
  res.status(201).json({ id: r.insertId });
});

// Search (public list, contact details NOT included)
router.get('/', async (req, res) => {
  const { gender, religion, district_id, min_age, max_age } = req.query;
  let sql = `SELECT p.id, p.ref_code, p.full_name, p.gender, p.religion, p.education,
             p.occupation, p.height_cm,
             d.name_en AS district_en, d.name_si AS district_si, d.name_ta AS district_ta,
             TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age
             FROM profiles p LEFT JOIN districts d ON d.id = p.district_id
             WHERE p.status = 'approved'`;
  const args = [];
  if (gender)      { sql += ' AND p.gender = ?';      args.push(gender); }
  if (religion)    { sql += ' AND p.religion = ?';    args.push(religion); }
  if (district_id) { sql += ' AND p.district_id = ?'; args.push(district_id); }
  if (min_age)     { sql += ' AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) >= ?'; args.push(min_age); }
  if (max_age)     { sql += ' AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) <= ?'; args.push(max_age); }
  sql += ' ORDER BY p.created_at DESC LIMIT 50';
  const [rows] = await db.query(sql, args);
  res.json(rows);
});

// Contact details: only if the viewer's profile has an accepted interest
router.get('/:id/contact', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.contact_phone, p.contact_email
     FROM profiles p
     JOIN interests i ON i.to_profile_id = p.id AND i.status = 'accepted'
     JOIN profiles me ON me.id = i.from_profile_id AND me.user_id = ?
     WHERE p.id = ?`, [req.user.id, req.params.id]);
  if (!rows.length) return res.status(403).json({ error: 'Contact not unlocked yet' });
  res.json(rows[0]);
});

module.exports = router;
```

### 6.8 Interest routes (outline)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/interests` | Send interest `{from_profile_id, to_profile_id}` |
| GET | `/api/interests/received` | List interests sent to my profiles |
| PATCH | `/api/interests/:id` | Accept or decline `{status}` |

### 6.9 Admin routes (outline)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/profiles?status=pending` | Profiles waiting for approval |
| PATCH | `/api/admin/profiles/:id` | Approve / reject / hide |
| GET | `/api/admin/reports` | Open reports |
| PATCH | `/api/admin/users/:id` | Deactivate a user |

### 6.10 Photo upload (`backend/middleware/upload.js`)

```js
const multer = require('multer');
const path = require('path');

module.exports = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname)),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },           // 3 MB
  fileFilter: (req, file, cb) =>
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});
```

---

## 7. Frontend Setup

```bash
cd ..                       # back to project root
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
npm run dev                 # http://localhost:5173
```

### 7.1 API helper (`frontend/src/api.js`)

```js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
```

### 7.2 Pages to build (in this order)
1. **Register / Login** â€“ store the token in `localStorage`
2. **ProfileForm** â€“ create a profile (all fields from the `profiles` table)
3. **Search** â€“ filters plus a grid of `ProfileCard`
4. **ProfileView** â€“ full profile and a "Send interest" button
5. **Dashboard** â€“ my profiles, interests sent and received
6. **Admin** â€“ approve or reject pending profiles

---

## 8. Multi-Language Support (Sinhala / English / Tamil)

### 8.1 Approach

| What | How |
|---|---|
| Interface text (buttons, labels, messages) | `react-i18next` with one JSON file per language |
| Fixed lists (districts) | Names stored in all 3 languages in the database (`name_en`, `name_si`, `name_ta`) |
| Fixed lists (religion, marital status) | Stored as English codes in the DB and translated in the locale files |
| User-written text (about, partner preferences) | Stored as typed. It is **not** auto-translated |
| Chosen language | Saved in `localStorage` and in `users.preferred_lang` after login |

> Store **codes** (`buddhist`, `never_married`) in the database and translate them only in the interface. This keeps search and filters working in every language.

### 8.2 Install

```bash
cd frontend
npm install i18next react-i18next
```

### 8.3 Fonts (`frontend/index.html`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600&family=Noto+Sans+Tamil:wght@400;600&display=swap" rel="stylesheet">
```

```css
body {
  font-family: "Noto Sans Sinhala", "Noto Sans Tamil", system-ui, sans-serif;
}
```

### 8.4 i18n setup (`frontend/src/i18n.js`)

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import si from './locales/si.json';
import en from './locales/en.json';
import ta from './locales/ta.json';

const saved = localStorage.getItem('lang') || 'si';

i18n.use(initReactI18next).init({
  resources: { si: { translation: si }, en: { translation: en }, ta: { translation: ta } },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', lng => {
  localStorage.setItem('lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
```

Import it once in `main.jsx`:

```js
import './i18n';
```

### 8.5 Locale files (`frontend/src/locales/`)

**en.json**
```json
{
  "app": { "title": "Mangala Proposals", "tagline": "Find a life partner Â· Sri Lankan matrimony" },
  "nav": { "brides": "Brides", "grooms": "Grooms", "post": "Post a profile", "login": "Login", "register": "Register" },
  "filters": { "allDistricts": "All districts", "anyReligion": "Any religion", "anyAge": "Any age" },
  "profile": {
    "age": "{{count}} yrs", "ref": "Ref", "showContact": "Show contact",
    "sendInterest": "Send interest", "height": "Height", "district": "District",
    "religion": "Religion", "education": "Education / profession"
  },
  "religion": { "buddhist": "Buddhist", "hindu": "Hindu", "christian": "Christian", "catholic": "Catholic", "muslim": "Muslim", "other": "Other" },
  "marital": { "never_married": "Never married", "divorced": "Divorced", "widowed": "Widowed" },
  "errors": { "required": "Please fill all required fields", "login": "Wrong email or password" },
  "safety": "Meet in public places, involve family, and never send money or ID documents to someone you haven't met."
}
```

**si.json**
```json
{
  "app": { "title": "à¶¸à¶‚à¶œà¶½ à¶ºà·à¶¢à¶±à·", "tagline": "à¶”à¶¶à·š à¶¢à·“à·€à¶± à·ƒà·„à¶šà¶»à·”/à·ƒà·„à¶šà·à¶»à·’à¶º à·ƒà·œà¶ºà· à¶œà¶±à·Šà¶± Â· à·à·Šâ€à¶»à·“ à¶½à·à¶‚à¶šà·’à¶š à·€à·’à·€à·à·„ à·ƒà·šà·€à·à·€" },
  "nav": { "brides": "à¶¸à¶±à·à¶½à·’à¶ºà·", "grooms": "à¶¸à¶±à·à¶½à¶ºà·", "post": "à¶´à·Šâ€à¶»à·œà·†à¶ºà·’à¶½à¶ºà¶šà·Š à¶¯à¶¸à¶±à·Šà¶±", "login": "à¶‡à¶­à·”à¶½à·Š à·€à¶±à·Šà¶±", "register": "à¶½à·’à¶ºà·à¶´à¶¯à·’à¶‚à¶ à·’ à·€à¶±à·Šà¶±" },
  "filters": { "allDistricts": "à·ƒà·’à¶ºà¶½à·” à¶¯à·’à·ƒà·Šà¶­à·Šâ€à¶»à·’à¶šà·Šà¶š", "anyReligion": "à¶•à¶±à·‘à¶¸ à¶†à¶œà¶¸à¶šà·Š", "anyAge": "à¶•à¶±à·‘à¶¸ à·€à¶ºà·ƒà¶šà·Š" },
  "profile": {
    "age": "à·€à¶ºà·ƒ {{count}}", "ref": "à¶ºà·œà¶¸à·”à·€", "showContact": "à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶°à¶­à· à¶´à·™à¶±à·Šà·€à¶±à·Šà¶±",
    "sendInterest": "à¶šà·à¶¸à·à¶­à·Šà¶­ à¶ºà·€à¶±à·Šà¶±", "height": "à¶‹à·ƒ", "district": "à¶¯à·’à·ƒà·Šà¶­à·Šâ€à¶»à·’à¶šà·Šà¶šà¶º",
    "religion": "à¶†à¶œà¶¸", "education": "à¶…à¶°à·Šâ€à¶ºà·à¶´à¶±à¶º / à¶»à·à¶šà·’à¶ºà·à·€"
  },
  "religion": { "buddhist": "à¶¶à·žà¶¯à·Šà¶°", "hindu": "à·„à·’à¶±à·Šà¶¯à·”", "christian": "à¶šà·Šâ€à¶»à·’à·ƒà·Šà¶­à·’à¶ºà·à¶±à·’", "catholic": "à¶šà¶­à·à¶½à·’à¶š", "muslim": "à¶‰à·ƒà·Šà¶½à·à¶¸à·Š", "other": "à·€à·™à¶±à¶­à·Š" },
  "marital": { "never_married": "à¶…à·€à·’à·€à·à·„à¶š", "divorced": "à¶¯à·’à¶šà·Šà¶šà·ƒà·à¶¯", "widowed": "à·€à·à¶±à·Šà¶¯à¶¹à·”" },
  "errors": { "required": "à¶šà¶»à·”à¶«à·à¶šà¶» à¶…à·€à·à·Šâ€à¶º à·ƒà·’à¶ºà¶½à·” à¶­à·œà¶»à¶­à·”à¶»à·” à¶´à·”à¶»à·€à¶±à·Šà¶±", "login": "à¶Šà¶¸à·šà¶½à·Š à·„à· à¶¸à·”à¶»à¶´à¶¯à¶º à·€à·à¶»à¶¯à·’à¶ºà·’" },
  "safety": "à·„à¶¸à·” à·€à¶±à·Šà¶±à·š à¶´à·œà¶¯à·” à·ƒà·Šà¶®à·à¶±à·€à¶½à¶º, à¶´à·€à·”à¶½à·š à¶…à¶º à¶¯ à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à¶šà¶» à¶œà¶±à·Šà¶±, à¶±à·œà·„à¶³à·”à¶±à¶± à¶…à¶ºà¶§ à¶šà·’à·ƒà·’ à·€à·’à¶§à·™à¶šà¶­à·Š à¶¸à·”à¶¯à¶½à·Š à·„à· à·„à·à¶³à·”à¶±à·”à¶¸à·Šà¶´à¶­à·Š à¶½à·šà¶›à¶± à¶±à·œà¶ºà·€à¶±à·Šà¶±."
}
```

**ta.json**
```json
{
  "app": { "title": "à®®à®™à¯à®•à®² à®®à¯à®©à¯à®®à¯Šà®´à®¿à®µà¯à®•à®³à¯", "tagline": "à®‰à®™à¯à®•à®³à¯ à®µà®¾à®´à¯à®•à¯à®•à¯ˆà®¤à¯ à®¤à¯à®£à¯ˆà®¯à¯ˆà®¤à¯ à®¤à¯‡à®Ÿà¯à®™à¯à®•à®³à¯ Â· à®‡à®²à®™à¯à®•à¯ˆ à®¤à®¿à®°à¯à®®à®£ à®šà¯‡à®µà¯ˆ" },
  "nav": { "brides": "à®®à®£à®ªà¯à®ªà¯†à®£à¯à®•à®³à¯", "grooms": "à®®à®£à®®à®•à®©à¯à®•à®³à¯", "post": "à®šà¯à®¯à®µà®¿à®µà®°à®®à¯ à®ªà®¤à®¿à®µà®¿à®Ÿà¯à®™à¯à®•à®³à¯", "login": "à®‰à®³à¯à®¨à¯à®´à¯ˆà®•", "register": "à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯à®•" },
  "filters": { "allDistricts": "à®…à®©à¯ˆà®¤à¯à®¤à¯ à®®à®¾à®µà®Ÿà¯à®Ÿà®™à¯à®•à®³à¯", "anyReligion": "à®Žà®¨à¯à®¤ à®®à®¤à®®à¯à®®à¯", "anyAge": "à®Žà®¨à¯à®¤ à®µà®¯à®¤à¯à®®à¯" },
  "profile": {
    "age": "à®µà®¯à®¤à¯ {{count}}", "ref": "à®•à¯à®±à®¿à®ªà¯à®ªà¯", "showContact": "à®¤à¯Šà®Ÿà®°à¯à®ªà¯ˆà®•à¯ à®•à®¾à®Ÿà¯à®Ÿà¯",
    "sendInterest": "à®µà®¿à®°à¯à®ªà¯à®ªà®®à¯ à®…à®©à¯à®ªà¯à®ªà¯", "height": "à®‰à®¯à®°à®®à¯", "district": "à®®à®¾à®µà®Ÿà¯à®Ÿà®®à¯",
    "religion": "à®®à®¤à®®à¯", "education": "à®•à®²à¯à®µà®¿ / à®¤à¯Šà®´à®¿à®²à¯"
  },
  "religion": { "buddhist": "à®ªà¯Œà®¤à¯à®¤à®®à¯", "hindu": "à®‡à®¨à¯à®¤à¯", "christian": "à®•à®¿à®±à®¿à®¸à¯à®¤à®µà®®à¯", "catholic": "à®•à®¤à¯à®¤à¯‹à®²à®¿à®•à¯à®•à®®à¯", "muslim": "à®‡à®¸à¯à®²à®¾à®®à¯", "other": "à®®à®±à¯à®±à®µà¯ˆ" },
  "marital": { "never_married": "à®¤à®¿à®°à¯à®®à®£à®®à®¾à®•à®¾à®¤à®µà®°à¯", "divorced": "à®µà®¿à®µà®¾à®•à®°à®¤à¯à®¤à®¾à®©à®µà®°à¯", "widowed": "à®µà®¿à®¤à®µà¯ˆ / à®®à®©à¯ˆà®µà®¿à®¯à¯ˆ à®‡à®´à®¨à¯à®¤à®µà®°à¯" },
  "errors": { "required": "à®¤à¯‡à®µà¯ˆà®¯à®¾à®© à®…à®©à¯ˆà®¤à¯à®¤à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®¨à®¿à®°à®ªà¯à®ªà®µà¯à®®à¯", "login": "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®…à®²à¯à®²à®¤à¯ à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®¤à®µà®±à¯" },
  "safety": "à®ªà¯Šà®¤à¯ à®‡à®Ÿà®™à¯à®•à®³à®¿à®²à¯ à®šà®¨à¯à®¤à®¿à®¯à¯à®™à¯à®•à®³à¯, à®•à¯à®Ÿà¯à®®à¯à®ªà®¤à¯à®¤à®¿à®©à®°à¯ˆà®¯à¯à®®à¯ à®ˆà®Ÿà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®™à¯à®•à®³à¯, à®šà®¨à¯à®¤à®¿à®•à¯à®•à®¾à®¤à®µà®°à¯à®•à®³à¯à®•à¯à®•à¯à®ªà¯ à®ªà®£à®®à¯‹ à®…à®Ÿà¯ˆà®¯à®¾à®³ à®†à®µà®£à®™à¯à®•à®³à¯‹ à®…à®©à¯à®ªà¯à®ªà®¾à®¤à¯€à®°à¯à®•à®³à¯."
}
```

> Have a native Sinhala speaker and a native Tamil speaker review these translations before launch.

### 8.6 Language switcher (`frontend/src/components/LanguageSwitcher.jsx`)

```jsx
import { useTranslation } from 'react-i18next';
import api from '../api';

const LANGS = [
  { code: 'si', label: 'à·ƒà·’à¶‚à·„à¶½' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'à®¤à®®à®¿à®´à¯' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const change = async code => {
    i18n.changeLanguage(code);
    if (localStorage.getItem('token')) {
      api.patch('/auth/language', { preferred_lang: code }).catch(() => {});
    }
  };

  return (
    <div className="lang">
      {LANGS.map(l => (
        <button key={l.code}
                className={i18n.language === l.code ? 'on' : ''}
                onClick={() => change(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
```

Add this route to `auth.routes.js` so the choice is remembered after login:

```js
const { requireAuth } = require('../middleware/auth');

router.patch('/language', requireAuth, async (req, res) => {
  const lang = ['si', 'en', 'ta'].includes(req.body.preferred_lang) ? req.body.preferred_lang : 'si';
  await db.query('UPDATE users SET preferred_lang = ? WHERE id = ?', [lang, req.user.id]);
  res.json({ ok: true });
});
```

After login, apply the saved language: `i18n.changeLanguage(res.data.preferred_lang)`.

### 8.7 Using translations in components

```jsx
import { useTranslation } from 'react-i18next';

export default function ProfileCard({ p }) {
  const { t, i18n } = useTranslation();
  const district = p[`district_${i18n.language}`] || p.district_en;

  return (
    <div className="card">
      <h3>{p.full_name} Â· {t('profile.age', { count: p.age })}</h3>
      <div className="ref">{t('profile.ref')}: {p.ref_code}</div>
      <span className="chip">{district}</span>
      <span className="chip">{t(`religion.${p.religion}`)}</span>
      <button>{t('profile.showContact')}</button>
    </div>
  );
}
```

For a district dropdown, read `name_en`, `name_si`, and `name_ta` from `GET /api/districts` (add a simple route that returns all rows) and show `d['name_' + i18n.language]`, while sending `d.id` to the API.

### 8.8 Multi-language checklist
- [ ] Every visible text uses `t('...')` and none is hard-coded
- [ ] Switching language updates the page without a reload
- [ ] The chosen language is remembered after a refresh and after login
- [ ] Sinhala and Tamil text displays correctly (fonts load) on mobile and desktop
- [ ] Filtering by district or religion works in all three languages
- [ ] Long Sinhala and Tamil words do not break the card layout
- [ ] Native speakers have reviewed the translations
- [ ] Error messages from the API are translated (return error codes and translate them in the frontend)

---

## 9. Running the Project

Open **two terminals** in VS Code (**Ctrl+Shift+`**):

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Test the API first: open `http://localhost:5000/api/health`. It should return `{"ok":true}`.

### Create the first admin
Register normally, then in MySQL Workbench run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

### Useful Workbench queries during development

```sql
SELECT * FROM profiles WHERE status = 'pending';
UPDATE profiles SET status = 'approved' WHERE id = 1;
SELECT COUNT(*) FROM users;
```

---

## 10. API Testing Checklist (Thunder Client / Postman)

- [ ] `POST /api/auth/register` returns 201
- [ ] `POST /api/auth/login` returns a token
- [ ] `POST /api/profiles` (with token) creates a profile
- [ ] `GET /api/profiles?gender=female&religion=buddhist` returns only approved profiles
- [ ] `GET /api/profiles/:id/contact` returns 403 before an interest is accepted
- [ ] Admin approval changes the status to `approved`
- [ ] `GET /api/districts` returns names in English, Sinhala, and Tamil
- [ ] `PATCH /api/auth/language` saves the preferred language

---

## 11. Security Checklist (very important for a matrimony site)

- Hash passwords with bcrypt (done) and never log them
- Use **parameterised queries** (`?`) everywhere to prevent SQL injection
- Keep contact details private until the owner approves
- Validate every input on the server, not only in the form
- Rate-limit login and registration
- Limit upload type and size; rename files; never run uploaded files
- Use **HTTPS** in production
- Admin approval for every new profile to reduce fake accounts
- Add a **Report profile** button and review reports quickly
- Follow Sri Lanka's **Personal Data Protection Act (PDPA)**: collect only what you need, allow users to delete their data, and publish a privacy policy
- Show safety tips: meet in public, involve family, never send money

---

## 12. Development Roadmap

| Phase | Tasks | Time (approx.) |
|---|---|---|
| 1 | Install tools, create DB, run schema, `/health` API | 1 day |
| 2 | Register, login, JWT | 2â€“3 days |
| 3 | Profile CRUD + photo upload | 4â€“5 days |
| 4 | Search and filters | 3 days |
| 5 | Interests and contact unlocking | 3â€“4 days |
| 6 | Admin panel and reports | 3â€“4 days |
| 7 | Sinhala / Tamil / English UI (i18n), language switcher, mobile responsive, polish | 1 week |
| 8 | Testing, deploy (VPS or cloud), HTTPS, backups | 1 week |

---

## 13. Deployment Notes

- **Hosting:** a small VPS (e.g. Ubuntu) with Nginx, Node (PM2), and MySQL, or a managed cloud platform
- **Database:** create a separate production DB user; schedule daily `mysqldump` backups
- **Domain + SSL:** use Let's Encrypt for free HTTPS
- **Environment:** set production values in `.env` on the server (never in Git)
- **Photos:** move to cloud storage (S3 or similar) once traffic grows

---

## 14. Git Basics

```bash
git init
echo "node_modules/\n.env\nuploads/" > .gitignore
git add .
git commit -m "Initial project structure"
```

---

## 15. Next Steps

1. Run `schema.sql` and `seed.sql` in MySQL Workbench.
2. Build and test the backend routes with Thunder Client.
3. Build the React pages one by one.
4. Ask Claude to generate any single file (for example `ProfileForm.jsx`, the interest routes, the admin panel, or more translation keys) and paste it into VS Code.

