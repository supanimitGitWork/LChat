---
description: Steps to deploy the LChat application to production.
---

# LChat Deployment Guide

LChat requires a **Stateful Node.js environment** + **PostgreSQL Database**.

## Prerequisites
- Node.js 20+
- [Neon.tech](https://neon.tech/) account (for FREE PostgreSQL)
- [Render.com](https://render.com/) account (for FREE Hosting)
- Domain name (optional)

## Environment Variables
Ensure these are set in your production environment:
- `NEXTAUTH_URL`: Your production URL (e.g. `https://lchat-gate.onrender.com`)
- `NEXTAUTH_SECRET`: A long random string (generate with `openssl rand -base64 32`)
- `DATABASE_URL`: Connection string from Neon.tech.
- `PORT`: Usually `3000` or assigned by host.

---

## Simple Deployment Flow (Render + Neon) - RECOMMENDED

1. **Setup Database**:
   - Go to [Neon.tech](https://neon.tech/), create a project, and copy the **Connection String**.
2. **Setup Render**:
   - Create a **New Web Service**.
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
3. **Configure Environment**:
   - Paste the `DATABASE_URL` from Neon into Render's Environment Variables.
4. **Push to Production**:
   - Trigger a deploy via GitHub.

---

## Option 1: VPS (Ubuntu + PM2)
Detailed instructions can be found in the system logs or by asking the architect.

## Option 2: Docker
... (same as before)
