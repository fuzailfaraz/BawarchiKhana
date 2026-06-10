BawarchiKhana — AI-Powered Cooking Assistant
 Table of Contents
• About the Project
• Features
• Tech Stack
• Architecture
• Getting Started
• API Documentation
• Environment Variables
• Deployment
• Roadmap
• Contributing
About the Project
BawarchiKhana (Urdu: خانہ باورچی — literally "kitchen") is an intelligent cooking assistant 
platform built specifically for Pakistan and the broader South Asian market. It bridges the gap 
between everyday Pakistani cooking and modern AI technology.
The platform helps users:
• Discover halal recipes tailored to ingredients they already have
• Reduce food waste through intelligent pantry management
• Get interactive step-by-step cooking guidance with Urdu voice support
• Plan weekly meals powered by Google Gemini AI
• Export meal plans and recipes to Google Sheets and Google Drive
Features
 AI-Powered Capabilities
Feature Description
Recipe Suggestions Get recipe ideas based on your pantry ingredients
Meal Planning AI-generated weekly meal plans tailored to preferences
AI Vision Upload food photos to identify ingredients and get recipes
Cooking Copilot Interactive step-by-step cooking guidance with AI
Ingredient Substitute Instantly find halal substitutes for any ingredient
 User Management
• OTP-based phone authentication via Twilio
• Google OAuth2 sign-in
• JWT-secured sessions with configurable expiry
• User profile and cooking history tracking
• Pantry management (add/update/remove ingredients)
 Google Integrations
• Export weekly meal plans to Google Sheets
• Save recipes to Google Drive
• Import ingredient lists from Drive
• OAuth2-secured Google account linking
 Payments (Premium)
• JazzCash payment gateway integration
• EasyPaisa payment gateway integration
• Webhook support for payment confirmation
• Freemium model with premium recipe unlock
Tech Stack
Backend
Technology Version Purpose
NestJS v11 Main backend framework
TypeScript v5.7 Language
Prisma ORM v5.22 Database access layer
PostgreSQL v18 Primary database
Google Gemini AI v0.24 AI/ML capabilities
Passport.js v0.7 Authentication middleware
JWT v11 Token-based auth
ioredis v5.10 Redis client (caching)
PDFKit v0.18 PDF report generation
Twilio SDK OTP delivery
Frontend
TechnologyPurpose
Next.js React framework
TypeScript Language
Vercel Deployment & edge CDN
Infrastructure & DevOps
Technology Purpose
Google Cloud Run Serverless container hosting (asia-south1)
Google Cloud SQL Managed PostgreSQL database
Google Artifact RegistryDocker image registry
Google Cloud Build CI/CD pipeline
Docker Containerization (node:22-alpine)
Architecture
┌─────────────────────────────────────────────────────────┐
│ CLIENT LAYER │
│ Next.js Frontend (Vercel — Global CDN) │
└─────────────────────────┬───────────────────────────────┘
 │ HTTPS
┌─────────────────────────▼───────────────────────────────┐
│ API LAYER │
│ NestJS Backend (Google Cloud Run) │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Auth │ │ AI │ │ Recipes │ │ Payments │ │
│ │ Module │ │ Module │ │ Module │ │ Module │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│ ┌──────────┐ ┌──────────┐ │
│ │ Users │ │ Google │ │
│ │ Module │ │ Drive │ │
│ └──────────┘ └──────────┘ │
└──────────────────────────┬──────────────────────────────┘
 │
 ┌──────────────────┼──────────────────┐
 │ │ │
┌───────▼───────┐ ┌───────▼───────┐ ┌──────▼──────────┐
│ Cloud SQL │ │ Google │ │ External APIs │
│ PostgreSQL │ │ Gemini AI │ │ Twilio/Jazz │
│ (Prisma ORM) │ │ │ │ Cash/EasyPaisa │
└───────────────┘ └───────────────┘ └─────────────────┘
API Endpoints Summary
Module Endpoints
Auth POST /auth/request-otp, POST /auth/verify-otp, GET /auth/google/callback
AI
POST /ai/suggest, POST /ai/meal-plan, POST /ai/vision, POST /ai/copilot, POST 
/ai/substitute
Recipes
POST /recipes/session, GET /recipes/session/:id, PATCH 
/recipes/session/:id/complete
Users GET /users/profile, PATCH /users/pantry, GET /users/history
Payments POST /payments/checkout, POST /payments/webhook
Google 
Drive
GET /google-drive/connect, GET /google-drive/files, POST /google-drive/export￾recipe, POST /google-drive/export-weekly-plan, POST /google-drive/export-sheet, 
POST /google-drive/import
Getting Started
Prerequisites
• Node.js >= 22.x
• npm >= 10.x
• PostgreSQL database (local or Cloud SQL)
• Google Cloud project (for deployment)
Local Development
1. Clone the repository
git clone https://github.com/fuzailfaraz/BawarchiKhana.git
cd BawarchiKhana/backend
2. Install dependencies
npm install
3. Set up environment variables
cp .env.example .env
# Fill in your values (see Environment Variables section)
4. Run database migrations
npx prisma migrate dev
npx prisma generate
5. Start development server
npm run start:dev
The API will be available at http://localhost:3001
Frontend Setup
cd ../frontend
npm install
npm run dev
Frontend available at http://localhost:3000
Environment Variables
Create a .env file in the backend/ directory:
# Database
DATABASE_URL
# Redis
REDIS_URL
# Authentication
JWT_SECRET
JWT_EXPIRY
# AI
GeminiAI_API_KEY
# JazzCash
# EasyPaisa
# Google OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
# App
FRONTEND_URL
PORT=3001
NODE_ENV=development
Deployment
Docker Build
cd backend
docker build -t bawarchikhana-backend:latest .
Deploy to Google Cloud Run
Build and push image:
gcloud builds submit --config cloudbuild.yaml --region=asia-south1 .
Deploy:
gcloud run deploy bawarchikhana-backend \
 --image "asia-south1-docker.pkg.dev/PROJECT_ID/bawarchikhana-repo/bawarchikhana￾backend:latest" \
 --platform managed \
 --region asia-south1 \
 --allow-unauthenticated \
 --add-cloudsql-instances PROJECT_ID:asia-south1:bawarchikhanadb \
 --set-env-vars "DATABASE_
Live URLs:
• Frontend: https://bawarchi-khana-pi.vercel.app
• Backend API: https://bawarchikhana-backend-248619180591.asia-south1.run.app
Database Schema
Key entities in the Prisma schema:
Users ──────┬──── CookingSession
 ├──── PantryItem
 └──── Payment
Recipe ─────┬──── CookingSession
 └──── Ingredient
MealPlan ───└──── MealPlanItem → Recipe
Roadmap
• [x] User authentication (OTP + Google OAuth)
• [x] AI recipe suggestions (Gemini)
• [x] AI meal planning
• [x] AI vision (food photo recognition)
• [x] AI cooking copilot
• [x] Ingredient substitutes
• [x] Cooking sessions
• [x] Pantry management
• [x] Google Drive integration
• [x] Payment integration (JazzCash + EasyPaisa)
• [x] Cloud Run deployment
• [ ] Urdu voice support (TTS)
• [ ] Mobile app (React Native)
• [ ] Community recipe sharing
• [ ] Receipt scanning for pantry auto-update
• [ ] Redis caching layer
• [ ] Nutritional information per recipe
Contributing
1. Fork the repository
2. Create your feature branch: git checkout -b feature/AmazingFeature
3. Commit your changes: git commit -m 'Add AmazingFeature'
4. Push to the branch: git push origin feature/AmazingFeature
5. Open a Pull Request
Contact
Fuzail Faraz — @fuzailfaraz — fuzailfaraz10@gmail.com
Project Link: https://github.com/fuzailfaraz/BawarchiKhana
