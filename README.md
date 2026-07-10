# Skincare With Multani — Complete Project

## Project Structure

```
skincare-with-multani/
│
├── app.py                    ← Flask server (main entry point)
├── requirements.txt          ← Python dependencies
├── .env.example              ← Environment variables template
├── README.md                 ← This file
│
├── public/                   ← Frontend
│   ├── index.html            ← Main HTML page
│   ├── css/
│   │   └── style.css         ← All styling
│   ├── js/
│   │   └── main.js           ← All interactivity + API calls
│   └── images/
│       ├── logo-icon.png
│       └── logo-full.png
│
└── backend/                  ← Python Flask Backend
    ├── config/
    │   └── db.py             ← MongoDB connection
    └── routes/
        ├── product_routes.py      ← GET  /api/products
        ├── testimonial_routes.py  ← GET  /api/testimonials
        ├── gallery_routes.py      ← GET  /api/gallery
        ├── faq_routes.py          ← GET  /api/faq
        ├── contact_routes.py      ← POST /api/contact
        └── order_routes.py        ← POST /api/orders
```

---

## Setup & Run (Windows)

### Step 1 — Python & MongoDB check
```bash
python --version      # Python 3.8+ hona chahiye
mongod --version      # MongoDB installed hona chahiye
```

### Step 2 — Dependencies install karo
```bash
pip install -r requirements.txt
```

### Step 3 — .env file banao
`.env.example` ko copy karo aur `.env` naam do:
```bash
copy .env.example .env
```
`.env` file mein apni details daalo:
```
MONGO_URI=mongodb://localhost:27017
DB_NAME=skincare_with_multani
PORT=5000
FLASK_DEBUG=True
```

### Step 4 — MongoDB start karo
```bash
mongod
```
(alag terminal mein chalao)

### Step 5 — Flask server chalao
```bash
python app.py
```
Output aayega:
```
MongoDB Connected: skincare_with_multani
Server: http://localhost:5000
```

### Step 6 — Browser mein kholo
```
http://localhost:5000
```

---

## Step 7 — Data Seed karo (Sirf pehli baar)

Postman ya browser mein ye URLs ko POST karo:

| URL | Kya hoga |
|-----|----------|
| POST http://localhost:5000/api/products/seed | Products add honge |
| POST http://localhost:5000/api/testimonials/seed | Reviews add honge |
| POST http://localhost:5000/api/gallery/seed | Gallery items add honge |
| POST http://localhost:5000/api/faq/seed | FAQs add honge |

---

## All API Endpoints

### Products
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/products/ | Sab products |
| GET | /api/products/?category=powder | Sirf powder |
| GET | /api/products/?category=stone | Sirf stone |
| POST | /api/products/seed | Default data seed |

### Testimonials
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/testimonials/ | Sab reviews |
| POST | /api/testimonials/seed | Default reviews seed |

### Gallery
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/gallery/ | Sab gallery items |
| GET | /api/gallery/?category=powder | Filter by category |
| POST | /api/gallery/seed | Default items seed |

### FAQ
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/faq/ | Sab FAQs |
| POST | /api/faq/seed | Default FAQs seed |

### Contact Form
| Method | URL | Body |
|--------|-----|------|
| POST | /api/contact/ | `{ name, email, phone, inquiryType, message }` |
| GET | /api/contact/ | Sab inquiries (admin) |

### Orders
| Method | URL | Body |
|--------|-----|------|
| POST | /api/orders/ | `{ name, phone, email, address, items[], paymentMethod }` |
| GET | /api/orders/ | Sab orders (admin) |
| PATCH | /api/orders/:id/status | `{ order_status }` |

### Health Check
| Method | URL |
|--------|-----|
| GET | /api/health |

---

## Tech Stack

| Part | Technology |
|------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3, Flask |
| Database | MongoDB (PyMongo) |
| Fonts | Google Fonts (Cormorant Garamond + Jost) |
| Icons | Font Awesome 6 |

---

## Contact Details Change Karne Ke Liye

`public/index.html` mein search karo:
- `919876543210` → apna WhatsApp number
- `+91 98765 43210` → apna phone number
- `support@skincarewithmultani.com` → apni email
- `Mewat, Haryana, India` → apna address
