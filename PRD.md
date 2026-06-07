# Product Requirements Document (PRD): Bawarchi Khana AI Cooking Assistant

## 1. Project Overview
Bawarchi Khana is an intelligent, localized cooking assistant platform tailored to provide recipe suggestions, culinary guidance, and premium cooking experiences. Leveraging cutting-edge AI and specifically designed for the region, it helps users optimize their pantry items, discover halal recipes, reduce food waste, and receive interactive cooking instructions in Urdu.

## 2. Tech Stack
- **Frontend**: Next.js (React), deployed on Vercel.
- **Backend**: NestJS, deployed on Google Cloud Run.
- **Database**: PostgreSQL (Google Cloud SQL).
- **ORM**: Prisma.
- **AI Integration**: Google Gemini API.

## 3. Features Implemented
- **User Authentication**: Secure OTP-based login via Twilio/Google Auth.
- **Interactive Dashboard**: A personalized user hub to manage recipes and preferences.
- **Intelligent Recipe Suggestions**: AI-driven recommendations based on available ingredients.
- **Urdu Voice Support**: Native voice integration for accessible recipe instructions in Urdu.
- **Halal Recipe Focus**: Strict adherence to halal dietary guidelines.
- **Zero-Waste Cooking**: Ingredient optimization to reduce household food waste.

## 4. Deployment Details
- **Frontend Hosting**: Vercel handles the Next.js application, ensuring global edge caching and fast delivery.
- **Backend Hosting**: Google Cloud Run (containerized deployment), providing scalable, serverless execution of the NestJS API.
- **CI/CD Pipeline**: GitHub integrations with Vercel and Google Cloud Build for automated deployments.

## 5. Database Setup
- **Provider**: Google Cloud SQL (Postgres).
- **Connection**: Managed securely via Cloud SQL Connector for Cloud Run, and direct connection for local development.

## 6. Environment Variables and Secrets
The application relies on several critical secrets configured securely in the respective deployment environments:
- `DATABASE_URL`: Cloud SQL connection string.
- `JWT_SECRET`: Used for authenticating API requests.
- `GeminiAI_API_KEY`: Authentication for Google Gemini AI features.
- `NEXT_PUBLIC_API_URL`: Frontend mapping to the Cloud Run backend URL.

## 7. Future Roadmap
- **Premium Subscriptions**: Unlock advanced AI cooking masterclasses and premium content.
- **Local Payment Gateways**: Integration with JazzCash and EasyPaisa for seamless premium access.
- **Social Sharing**: Enhanced community features allowing users to share custom recipes.
- **Pantry Tracking**: Auto-updating inventory tracking via receipt scanning.
