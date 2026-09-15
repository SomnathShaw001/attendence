# Smart Attendance Management & Analytics System

A next-generation, full-stack Student Attendance application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**.

## ✨ Features

- **Role-Based Portals**: Tailored dashboards for Students, Faculty, and Administrators.
- **Smart "What-If" Simulator**: Students can interactively calculate how many classes they need to attend to reach their target percentage (e.g., 75%), or how many they can safely miss.
- **Debarment Risk Detection**: Automatic warnings for students falling below the minimum required attendance threshold.
- **Modern UI**: Built with Tailwind CSS and designed for a premium user experience.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database ORM**: [Prisma v5](https://www.prisma.io/)
- **Local DB**: SQLite (Easily swappable to Vercel Postgres/PostgreSQL for production)

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup the Database
For local development, we are using SQLite. Push the Prisma schema to generate the local `.db` file:
```bash
npx prisma db push
npx prisma generate
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🚢 Deployment to Vercel

1. Push your code to GitHub.
2. Go to [Vercel](https://vercel.com/) and import your GitHub repository.
3. In the Vercel dashboard, go to the **Storage** tab and create a **Vercel Postgres** database.
4. Link the database to your project. This will automatically inject `DATABASE_URL` into your Vercel Environment Variables.
5. In `prisma/schema.prisma`, change the provider from `"sqlite"` to `"postgresql"`.
6. Deploy your project!

## 🤝 Project Structure
- `src/app/` - Next.js App Router pages (Landing, Login, Student, Faculty, Admin).
- `src/components/` - Reusable React components (e.g., `WhatIfSimulator.tsx`).
- `src/lib/` - Utility functions and singletons (e.g., `prisma.ts`).
- `prisma/` - Database schema and migration files.
