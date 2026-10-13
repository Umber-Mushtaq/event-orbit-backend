# Wedding Planner Marketplace

A full-stack, role-based wedding-services platform that connects couples (customers) with verified wedding vendors (venues, caterers, photographers, decorators, etc.) to streamline event planning, discovery, booking requests, and administrative oversight.

This platform centralizes the complete wedding planning workflow:
- **For Customers:** Provides a searchable, filterable catalogue of wedding services complete with pricing models, capacity details, locations, ratings, reviews, photo galleries, and map integrations.
- **For Vendors:** Offers a dedicated dashboard to manage business profiles, service listings, gallery images, incoming booking requests, and customer feedback.
- **For Administrators:** Delivers a secure operations workspace to monitor platform analytics, oversee vendors and users, moderate categories and events, manage blogs, and configure system settings.

---

## Main User Roles & Modules

| Role | Key Functionality |
| :--- | :--- |
| **Public Visitor** | Landing page discovery, advanced search & filtering, vendor profiles, service details, help centre, contact & about pages. |
| **Customer** | Registration/login, customer dashboard, filter-based booking flow, booking history, wishlist/favourites management, availability calendar, and service reviews/ratings. |
| **Vendor** | Vendor dashboard, business profile management, service CRUD operations, gallery/image management, booking-request handling (confirm/decline), and review analytics. |
| **Administrator** | Protected admin dashboard, marketplace revenue & booking analytics, vendor approval workflow, user management, category/event oversight, CMS blogs, notifications, and settings. |

---

## Core Features

- **Authentication & Security:** JWT-based session protection, `bcrypt` password hashing, role-based access control (RBAC) via Express middleware and protected frontend routes, and forgot/reset password flows using Nodemailer.
- **Search and Filters:** Filter services by keyword, category, location, pricing model (`fixed`, `per_guest`, `hourly`), date, and price range.
- **Vendor Approval Workflow:** Multi-stage vendor status management supporting `pending`, `approved`, `rejected`, and `suspended` states.
- **Booking & Availability System:** Event date and guest count validation, automated amount calculations, payment-status tracking, and an availability API exposing booked dates to prevent scheduling conflicts.
- **Wishlist System:** Save favorite services with database-level duplicate prevention.
- **Reviews & Ratings:** User ratings and reviews with automatic aggregate rating recalculations for vendor profiles.
- **Image Processing Pipeline:** Secure multipart file uploads via `Multer` (memory storage), image optimization and resizing via `Sharp`, and asset hosting via `Cloudinary`.
- **Maps & Location UX:** Interactive map presentation using Leaflet and React Leaflet.
- **Admin Analytics:** Comprehensive dashboard charts powered by Recharts tracking revenue, booking volumes, vendor performance, and recent activity.
- **CMS Blog & Content Management:** Administrative workspace for creating and managing educational wedding blogs and announcements.

---

## Tech Stack

### Frontend
* **Core:** React 19, Vite 8, JavaScript
* **Routing:** React Router 7
* **Styling:** Tailwind CSS 4, Lucide React (Icons)
* **Data Fetching:** Axios
* **Data Visualization & UI:** Recharts, React Calendar, date-fns
* **Maps:** Leaflet & React Leaflet
* **Quality Control:** ESLint

### Backend
* **Runtime & Framework:** Node.js, Express 5 REST API
* **Database & ODM:** MongoDB, Mongoose
* **Authentication:** JSON Web Tokens (JWT), bcrypt
* **File Management:** Multer, Sharp, Cloudinary SDK
* **Email Service:** Nodemailer
* **Utilities:** dotenv, CORS, Nodemon (Development)

---

## Architecture

The application follows a decoupled client–server architecture:

```text
[React + Vite Frontend]
        │
        ▼ (Axios REST APIs / JWT Auth Headers)
[Express + Node.js REST API Backend]
        │
        ├──► [Mongoose ODM] ──► [MongoDB Database]
        ├──► [Multer + Sharp] ──► [Cloudinary Media Storage]
        └──► [Nodemailer] ──► [SMTP Email Delivery]
```

---

## Project Structure

```text
wedding-planner/
├── backend/
│   ├── config/          # DB connection, Cloudinary, transporter config
│   ├── controllers/     # Route logic for auth, users, services, bookings, etc.
│   ├── middleware/      # JWT auth, role validation, error handling, upload handlers
│   ├── models/          # Mongoose schemas (User, Service, Booking, Review, etc.)
│   ├── routes/          # Express API route endpoints
│   ├── utils/           # Helper scripts and image processing pipelines
│   └── server.js        # Express application entry point
│
└── frontend/
    ├── public/          # Static assets
    ├── src/
    │   ├── components/  # Reusable UI components (Modals, Badges, Loaders, Headers)
    │   ├── context/     # Auth and application state contexts
    │   ├── hooks/       # Custom React hooks
    │   ├── pages/       # Page views (Public, Customer, Vendor, Admin portals)
    │   ├── services/    # Axios client instances and API service wrappers
    │   ├── App.jsx      # Root component & route declarations
    │   └── main.jsx     # Vite application entry point
    ├── tailwind.config.js
    └── package.json
```

---

## API Endpoints Reference

### 1. Authentication (`/api/auth`)
* `POST /api/auth/register` - Register a new user (Customer or Vendor)
* `POST /api/auth/login` - Authenticate user and issue JWT session token
* `POST /api/auth/forgot-password` - Trigger password-reset email with token
* `POST /api/auth/reset-password/:token` - Update user password via secure token

### 2. Services Marketplace (`/api/services`)
* `GET /api/services` - Retrieve all services with query filters (category, location, price, date, keyword)
* `GET /api/services/:id` - Fetch single service details, gallery, and vendor profile
* `POST /api/services` - Create a new service listing (Vendor only)
* `PUT /api/services/:id` - Update existing service details (Vendor owner or Admin)
* `DELETE /api/services/:id` - Remove service listing (Vendor owner or Admin)
* `GET /api/services/:id/availability` - Retrieve booked dates for a specific service

### 3. Bookings (`/api/bookings`)
* `POST /api/bookings` - Submit a new date-aware booking request (Customer only)
* `GET /api/bookings` - Retrieve user/vendor-specific booking list
* `PUT /api/bookings/:id/status` - Confirm or decline booking requests (Vendor only)
* `PUT /api/bookings/:id/cancel` - Cancel active booking request (Customer)

### 4. Wishlists (`/api/wishlists`)
* `GET /api/wishlists` - Fetch authenticated customer's favorite services
* `POST /api/wishlists` - Add service to wishlist with database-level duplicate prevention
* `DELETE /api/wishlists/:serviceId` - Remove service from wishlist

### 5. Reviews (`/api/reviews`)
* `GET /api/reviews/service/:serviceId` - Get all reviews for a service
* `POST /api/reviews` - Submit a review and rating (Customer with completed booking)

### 6. Administration (`/api/admin`)
* `GET /api/admin/analytics` - Fetch platform revenue, booking metrics, and statistics
* `GET /api/admin/users` - List all system users
* `PUT /api/admin/vendors/:id/status` - Update vendor approval status (`pending`, `approved`, `rejected`, `suspended`)
* `GET /api/admin/blogs` - Manage CMS blog posts and platform announcements

---

## Getting Started & Installation

### Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas connection URI)

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory based on the following template:
```env
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRE=

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Nodemailer Configuration 
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Start the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=
```

Start the frontend development server:
```bash
npm run dev
```
