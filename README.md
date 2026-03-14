# Anjali Thaivazhi Unavagam (அஞ்சலி தாய்வழி உணவகம்)

Full-stack Hotel & Restaurant website.

- **Frontend**: React.js + Vite + Tailwind CSS
- **Backend**: PHP (REST-ish JSON APIs)
- **Database**: MySQL

---

## Project structure

```
Hotal/
  frontend/                # React + Vite + Tailwind
  backend/
    api/                   # PHP endpoints (JSON + CORS)
    config/
    uploads/
  database.sql             # schema + seed
```

---

## 1) Prerequisites

- **Node.js** (LTS recommended)
- **XAMPP/WAMP** (Apache + PHP + MySQL)
- **MySQL** access (phpMyAdmin is fine)

---

## 2) Install database (schema + seed)

1. Create the database + tables + seed data by importing:
   - `database.sql`

Using phpMyAdmin:
- Open phpMyAdmin → **Import** → choose `database.sql` → **Go**

This creates DB **`anjali_restaurant`**, seeds:
- menu items (morning/afternoon/night/snacks/juices)
- admin user (**admin / admin123**) → **change after setup**

---

## 3) Backend setup (PHP)

### Place project under Apache web root

For XAMPP on Windows:
- Copy this whole project folder into:
  - `C:\\xampp\\htdocs\\anjali-restaurant\\`

So these should exist:
- `http://localhost/anjali-restaurant/backend/api/menu.php`
- `http://localhost/anjali-restaurant/backend/api/auth.php`

### Configure DB credentials

Edit:
- `backend/config/db.php`

Update:
- `$host`, `$db`, `$user`, `$pass`

### Configure admin token secret

Edit:
- `backend/api/_helpers.php`

Change:
- `auth_secret()` to a strong secret string.

### Upload folder

Uploads are saved into:
- `backend/uploads/`

API returns:
- `/backend/uploads/<filename>`

---

## 4) Frontend setup (React + Vite)

From `frontend/`:

```bash
npm install
npm run dev
```

### Environment variables

File:
- `frontend/.env`

Defaults:
```
VITE_WHATSAPP_NUMBER=91XXXXXXXXXX
VITE_RESTAURANT_NAME=Anjali Thaivazhi Unavagam
VITE_UPI_ID=anjali.restaurant@upi
VITE_API_BASE=/api
```

### Vite proxy

Configured in `frontend/vite.config.js` (via `frontend/.env`):
- Default: `/api/*` → `http://localhost:8000/api/*` (PHP built-in server)
- Optional (Apache/XAMPP): `/api/*` → `http://localhost/anjali-restaurant/backend/api/*`

So the frontend calls:
- `GET /api/menu.php`
- `POST /api/orders.php`
- etc.

---

## Admin login

Route:
- `/admin`

Default credentials (seeded in DB):
- **Username**: `admin`
- **Password**: `admin123`

After login, token is stored in `localStorage` as:
- `admin_token`

Admin-only APIs require:
- `Authorization: Bearer <token>`

---

## Backend API endpoints

Base path:
- `backend/api/`

### `menu.php`
- `GET` `/menu.php` → all items
- `GET` `/menu.php?category=morning` → filter
- `POST` `/menu.php` (admin) → add item
- `PUT` `/menu.php` (admin) → update item
- `DELETE` `/menu.php` (admin) → delete item

### `orders.php`
- `POST` `/orders.php` → create order (from payment)
- `GET` `/orders.php` (admin) → list orders
- `PUT` `/orders.php` (admin) → update status

### `booking.php`
- `POST` `/booking.php` → create table booking
- `GET` `/booking.php` (admin) → list bookings
- `PUT` `/booking.php` (admin) → update status

### `catering.php`
- `POST` `/catering.php` → create catering booking
- `GET` `/catering.php` (admin) → list catering bookings
- `PUT` `/catering.php` (admin) → update status

### `upload.php`
- `POST` `/upload.php` (admin) → multipart upload (field name `image`)
- returns `{ "image_url": "/backend/uploads/filename.jpg" }`

### `sales.php`
- `GET` `/sales.php` (admin) → monthly totals
- returns `{ data: [{ month: "2024-01", total: 45000, orders: 150 }] }`

### `auth.php`
- `POST` `/auth.php` → `{ username, password }` → returns `{ token }`

---

## Notes / Customization

- **WhatsApp number**: update `VITE_WHATSAPP_NUMBER`
- **UPI ID**: update `VITE_UPI_ID`
- **Restaurant name**: update `VITE_RESTAURANT_NAME`
- **Theme**: edit `frontend/src/index.css`

