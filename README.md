# ✈️ TRAVELMIND AI — Production AI Travel Planner

**TravelMind AI** is a production-ready, full-stack AI-powered travel planning application built on the MERN stack. Users can input a destination, dates, budget, travelers, travel style, and interests — or simply write their trip in free-form English (e.g., *"Plan a 5-day Goa trip for 2 people under ₹50,000 with beaches, food and adventure"*).

---

## 🌟 Key Architecture & Highlights

1. **AI Natural Language Understanding**: Parses natural language requests using OpenAI GPT models into validated parameters.
2. **Grounded in Real-World Google Data**: **Never hallucinates fake places**. Queries verified attractions, landmarks, beaches, museums, hotels, and restaurants via **Google Places API (New)**.
3. **Real Geospatial Coordinates & Distances**: Utilizes **Google Routes API** to compute driving durations, distances, and polyline directions between consecutive stops.
4. **Interactive Google Maps**: Visualizes day-by-day itineraries with color-coded markers (attractions, stays, dining) and dynamic route polylines.
5. **Conversational AI Modification**: Modify itineraries on the fly (e.g., *"Make Day 2 cheaper"*, *"Add more beaches"*, *"Add vegetarian restaurants"*) with surgical modifications that preserve untouched portions.
6. **Full Authentication & Persistent Trips**: Secure JWT + bcrypt authentication with MongoDB persistence for saving, editing, and managing trips.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite build tool)
- **Tailwind CSS** (Custom responsive design system & animations)
- **React Router v6** (Protected and public routing)
- **@react-google-maps/api** (Interactive Google Maps integration)
- **Axios** (API client with interceptors for JWT token attachment and auto-logout)
- **React Hot Toast** (Notifications)
- **React Icons** (Heroicons v2)

### Backend
- **Node.js & Express.js** (ES Modules)
- **MongoDB & Mongoose** (Data schemas with indexes)
- **JWT & bcryptjs** (Authentication & password hashing)
- **Helmet, CORS, express-rate-limit** (Security & DDoS prevention)
- **express-validator** (Input validation & sanitization)

### APIs & AI
- **OpenAI API** (`gpt-4o-mini` / `gpt-4o`)
- **Google Places API (New)** (Text search, place details, photo proxy)
- **Google Routes API v2** (Driving routes, distances, durations, polylines)
- **Google Maps JavaScript API** (Frontend map rendering)

---

## 📁 Project Structure

```
Travella/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js               # Axios instance with auth interceptor
│   │   ├── components/
│   │   │   ├── common/                # Button, LoadingSkeleton, ErrorState, EmptyState, ProtectedRoute
│   │   │   ├── layout/                # Navbar, Footer, Layout
│   │   │   └── map/
│   │   │       └── TripMap.jsx        # Google Map with markers & polylines
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Authentication context & provider
│   │   ├── hooks/
│   │   │   └── useAuth.js             # Auth consumer hook
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Landing page with interactive prompt
│   │   │   ├── Login.jsx              # User sign in
│   │   │   ├── Register.jsx           # User sign up
│   │   │   ├── Profile.jsx            # Account details
│   │   │   ├── TripPlanner.jsx        # Form & natural language planner
│   │   │   ├── GeneratedItinerary.jsx # Day-by-day timeline, map & AI modifier
│   │   │   ├── MyTrips.jsx            # Saved trips dashboard
│   │   │   └── TripDetails.jsx        # View & modify saved trip
│   │   ├── utils/
│   │   │   └── constants.js           # Interests, styles, generation steps
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   │   └── db.js                      # MongoDB connection with retry
│   ├── controllers/
│   │   ├── authController.js          # Register, login, me, profile
│   │   ├── tripController.js          # Trip CRUD
│   │   ├── aiController.js            # Parse trip, generate, modify
│   │   ├── placesController.js        # Search places, photo proxy
│   │   └── routesController.js        # Compute routes & durations
│   ├── middleware/
│   │   ├── auth.js                    # JWT verify middleware
│   │   ├── errorHandler.js            # Centralized error handler
│   │   └── validate.js                # express-validator handler
│   ├── models/
│   │   ├── User.js                    # User schema with bcrypt & JWT
│   │   └── Trip.js                    # Full trip schema with itinerary & places
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── tripRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── placesRoutes.js
│   │   └── routesRoutes.js
│   ├── services/
│   │   ├── openaiService.js           # Natural parsing & itinerary organizer
│   │   ├── placesService.js           # Google Places API client
│   │   ├── routesService.js           # Google Routes API client
│   │   ├── itineraryService.js        # End-to-end trip orchestrator
│   │   └── budgetService.js           # Cost breakdowns & allocations
│   ├── utils/
│   │   └── AppError.js                # Custom operational error class
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0+ or v20.0+
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or [MongoDB Atlas URI](https://www.mongodb.com/atlas)
- **OpenAI API Key**: From [platform.openai.com](https://platform.openai.com)
- **Google Maps Platform API Key**: With Places API (New), Routes API, and Maps JavaScript API enabled.

---

### Step 1: Clone and Configure Environment Variables

#### Backend Configuration (`server/.env`)
Create a file named `.env` inside `server/`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/travelmind
JWT_SECRET=travelmind_jwt_secret_key_super_secure_dev_2026
JWT_EXPIRE=30d
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_server_api_key_here
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Configuration (`client/.env`)
Create a file named `.env` inside `client/`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_client_api_key_here
```

---

### Step 2: Install Dependencies

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

---

### Step 3: Run the Application

#### Start Backend Server
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

#### Start Frontend Client
```bash
cd client
npm run dev
# Frontend will run on http://localhost:5173
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Sign in & receive JWT | No |
| `GET` | `/api/auth/me` | Get profile details | Yes |
| `PUT` | `/api/auth/me` | Update name / avatar | Yes |

### Trips CRUD
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/trips` | Save generated itinerary | Yes |
| `GET` | `/api/trips` | Get list of user's saved trips | Yes |
| `GET` | `/api/trips/:id` | Get full trip details & itinerary | Yes |
| `PUT` | `/api/trips/:id` | Update trip data | Yes |
| `DELETE` | `/api/trips/:id` | Delete saved trip | Yes |

### AI & Itinerary Engine
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/ai/parse-trip` | Parse natural language into structured JSON | No |
| `POST` | `/api/ai/generate-itinerary` | Full pipeline: Places + Routes + AI + Budget | No |
| `POST` | `/api/ai/modify-itinerary` | Modify itinerary with natural language instructions | Optional/Yes |

### Google Places & Routes
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/places/search` | Search verified places & coordinates | No |
| `GET` | `/api/places/photo/*` | Photo proxy | No |
| `POST` | `/api/routes/calculate` | Compute driving duration & distance | No |

---

## 🛡️ Security Implementation

- **Centralized Error Handling**: Operational errors wrapped cleanly with sanitization in production.
- **Passwords**: Hashed with `bcryptjs` using 12 salt rounds.
- **Tokens**: JWT signed with configurable expiry (`30d`).
- **HTTP Security**: `helmet` headers applied.
- **Rate Limiting**: `express-rate-limit` prevents brute-force on auth, places, and AI endpoints.
- **Key Isolation**: Server-side Google API keys and OpenAI keys are never sent to the client browser.

---

## 📝 License
MIT License. Built for production grade AI travel planning.
