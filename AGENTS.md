# 📘 GRS - Comprehensive AI Development Guide

**Last Updated**: March 3, 2026  
**Project**: Grievance Redressal System (GRS)  
**Framework**: Next.js 16 + React 19 + TypeScript + Supabase  
**Documentation**: AGENTS.md (Root)

---

## 🎯 Quick Navigation

- [Emergency Procedures](#-emergency-procedures)
- [Project Overview](#-project-overview)
- [Quick Start (5 minutes)](#-quick-start-5-minutes)
- [Complete Setup Guide](#-complete-setup-guide)
- [Project Structure](#-project-structure)
- [Development Commands](#-development-commands)
- [Code Standards & Guidelines](#-code-standards--guidelines)
- [Configuration & Deployment](#-configuration--deployment)
- [Recent Changes & Fixes](#-recent-changes--fixes)
- [Feature Status](#-feature-status)
- [Database Schema](#-database-schema)
- [Common Issues & Solutions](#-common-issues--solutions)
- [Performance Optimization](#-performance-optimization)

---

## 🚨 Emergency Procedures

### Application Won't Start

```bash
# 1. Clear everything and reinstall
rm -r node_modules
rm package-lock.json
npm install

# 2. Check environment variables
# Verify .env.local exists and has all required variables:
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# 3. Rebuild from scratch
npm run build

# 4. Start dev server
npm run dev
```

### Supabase Connection Issues

```bash
# 1. Verify credentials in .env.local
# 2. Check Supabase project is running (3+ minutes after creation)
# 3. Test connection:
npx tsc --noEmit
# Look for type errors related to Supabase

# 4. Clear browser cache and localStorage
# Dev Tools → Application → Clear Site Data
```

### Supabase RLS Blocking Access (Error: {})

This error means Row-Level Security (RLS) policies aren't allowing your request:

```sql
-- In Supabase Dashboard → SQL Editor → New Query
-- Fix permissions on all tables

DROP POLICY IF EXISTS "Allow public read categories" ON categories;
DROP POLICY IF EXISTS "Allow public read grievances" ON grievances;
DROP POLICY IF EXISTS "Allow public read upvotes" ON upvotes;
DROP POLICY IF EXISTS "Allow public read comments" ON comments;

CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read grievances" ON grievances FOR SELECT USING (true);
CREATE POLICY "Allow public read upvotes" ON upvotes FOR SELECT USING (true);
CREATE POLICY "Allow public read comments" ON comments FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
```

**Or disable RLS temporarily for testing:**
```sql
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE grievances DISABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
```

### Google OAuth Not Working

```bash
# 1. Verify authorized redirect URIs in Google Cloud Console:
# - http://localhost:3000
# - http://localhost:3000/login
# - https://yourdomain.com (production)

# 2. Ensure .env.local has:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000

# 3. Restart dev server after changing .env.local
```

### Database Schema Reset

```bash
# 1. In Supabase Dashboard → SQL Editor
# 2. Create new query with this script:
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS upvotes CASCADE;
DROP TABLE IF EXISTS grievances CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

# 3. Copy entire schema.sql content and run
# 4. Verify all tables exist (confirm in Supabase dashboard)
```

### Build Compilation Errors

```bash
# Run these checks in order:
npm run lint              # Check ESLint issues
npx tsc --noEmit         # Check TypeScript errors
npm run build            # Full production build

# If tsc fails:
# - Check for unused imports
# - Verify type annotations
# - Ensure all imports resolve correctly

# If lint fails:
# - Review .eslintrc.mjs
# - Check ignored files list
```

---

## 📋 Project Overview

### What is GRS?

A complete **Grievance Redressal System** for institutions to manage student/staff grievances efficiently.

### Core Features Implemented ✅

| Feature | Status | Details |
|---------|--------|---------|
| Google OAuth Auth | ✅ Complete | @ssn.edu.in domain support |
| File Grievances | ✅ Complete | With anonymous option |
| Dashboard View | ✅ Complete | Real-time listing of grievances |
| Upvote System | ✅ Complete | No duplicate votes, real-time count |
| Comments Section | ✅ Complete | Anonymous comments supported |
| Category Management | ✅ Complete | Admin panel to add/delete categories |
| Filtering | ✅ Complete | By category and status |
| Timezone Handling | ✅ Complete | All times in user's local timezone |
| Error Logging | ✅ Complete | Detailed error messages for debugging |

### Tech Stack

```
Frontend:  Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4
Backend:   Supabase (PostgreSQL)
Auth:      Google OAuth 2.0 + localStorage
Deployment: Ready for Vercel/AWS
```

---

## ⚡ Quick Start (5 minutes)

### Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Supabase account created (free)
- [ ] Google Cloud project created
- [ ] Git installed (optional)

### Step-by-Step Setup

#### 1. **Create Supabase Project** (2 min)
```
1. Go to https://supabase.com
2. Click "New project"
3. Set database password and select region
4. Wait ~2 minutes for setup
5. Go to Settings → API and copy:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_ROLE_KEY
```

#### 2. **Setup Database Schema** (1 min)
```
1. In Supabase: SQL Editor → New Query
2. Copy ALL content from grs/schema.sql
3. Paste into editor and click Run
4. Fix RLS policies using SQL above if getting error {}
5. ✅ Done - tables created automatically
```

#### 3. **Get Google OAuth Credentials** (1 min)
```
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Credentials → Create OAuth 2.0 Client ID
5. Authorized redirect URIs:
   - http://localhost:3000
   - http://localhost:3000/login
6. Copy Client ID and Secret
```

#### 4. **Configure Environment** (30 sec)
```bash
# Create grs/.env.local with:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_string
```

#### 5. **Run Application** (1 min)
```bash
cd grs
npm install
npm run dev

# Visit http://localhost:3000
# Login with Google and use the system!
```

---

## 📚 Complete Setup Guide

### Prerequisites

1. **Node.js & npm**
   - Required: Node.js v18 or higher
   - Download from https://nodejs.org

2. **Supabase Account**
   - Free tier available at https://supabase.com
   - No credit card required

3. **Google Cloud Account**
   - Free until quota exceeded
   - Go to https://console.cloud.google.com

### Detailed Installation

#### Phase 1: Supabase Setup

**Create Project**
```
1. supabase.com → Sign up or login
2. Create new project
3. Enter database password (save it!)
4. Select region closest to users
5. Click "Create new project"
6. Wait 2-3 minutes for initialization
```

**Get API Credentials**
```
Dashboard → Settings (bottom left) → API
Copy:
- Project URL (Format: https://xxxxx.supabase.co)
- anon public key (long string starting with eyJ)
- service_role key (long string starting with eyJ)
```

**Setup Database Schema**
```
SQL Editor → New Query → Paste schema.sql → Run
Wait for complete execution (usually 5-10 seconds)
Verify tables in Dashboard → Tables
Fix RLS policies if getting error {} on data fetch
```

#### Phase 2: Google OAuth Setup

**Create OAuth Credentials**
```
console.cloud.google.com → Select Project → Create Project
APIs & Services → Enable Google+ API
Credentials → Create Credentials → OAuth 2.0 Client ID
```

**Configure OAuth Consent Screen**
```
User type: External
Add required info:
- App name: Grievance Redressal System
- User support email: your_email@gmail.com
- Developer contact: your_email@gmail.com
Scopes: email, profile, openid
Test users: Add your email
```

**Create OAuth Client**
```
Application type: Web application
Authorized redirect URIs:
  - http://localhost:3000
  - http://localhost:3000/login
  - https://yourproduction.com (when ready)
Copy Client ID and Secret
```

#### Phase 3: Local Setup

**Environment Variables**
```bash
# Create grs/.env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=client_id_from_google
GOOGLE_CLIENT_SECRET=client_secret_from_google
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...from_supabase
SUPABASE_SERVICE_ROLE_KEY=eyJ...from_supabase
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-can-be-anything
```

**Install & Run**
```bash
cd grs
npm install              # Install dependencies
npm run dev            # Start development server
# Open browser: http://localhost:3000
```

---

## 📁 Project Structure

```
d:\Link_from_C\GRS
├── grs/                              # Main project directory
│   ├── app/
│   │   ├── components/
│   │   │   ├── CommentsSection.tsx   # Comment management
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── Filters.tsx           # Filter sidebar
│   │   │   ├── GrievanceCard.tsx     # Card component
│   │   │   ├── GrievanceDetail.tsx   # Detail page
│   │   │   ├── GrievanceForm.tsx     # Create form
│   │   │   └── index.ts              # Component exports
│   │   ├── admin/
│   │   │   └── categories/page.tsx   # Category management
│   │   ├── auth/
│   │   │   └── [...nextauth]/        # NextAuth setup
│   │   ├── dashboard/page.tsx
│   │   ├── grievance/[id]/page.tsx
│   │   ├── login/page.tsx
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home/redirect
│   ├── lib/
│   │   ├── dateUtils.ts              # Timezone utilities
│   │   └── supabase/
│   │       ├── client.ts             # Supabase client
│   │       ├── db.ts                 # Database operations
│   │       └── types.ts              # TypeScript interfaces
│   ├── public/                       # Static assets
│   ├── schema.sql                    # Database schema
│   ├── .env.local                    # Environment (git-ignored)
│   ├── README.md                     # Project readme
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   └── postcss.config.mjs
├── AGENTS.md                         # Comprehensive dev guide (this file)
└── README.md                         # Project overview
```

---

## 🔧 Development Commands

### Core Commands

```bash
# Development
npm run dev                 # Start dev server on localhost:3000

# Production
npm run build              # Build optimized production bundle
npm run start              # Start production server

# Code Quality
npm run lint              # Run ESLint checks
npx tsc --noEmit         # TypeScript type checking (no output files)

# Combined checks (recommended before commit)
npm run lint && npx tsc --noEmit && npm run build
```

### Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. In another terminal, watch for type errors
npx tsc --noEmit --watch

# 3. In another terminal, check linting
npm run lint

# 4. Before committing
npm run lint && npx tsc --noEmit && npm run build
```

### Troubleshooting Commands

```bash
# Clear cache and rebuild
rm -r node_modules .next
npm install
npm run build

# Check if ports are in use
netstat -ano | findstr :3000    # Windows
lsof -i :3000                   # Mac/Linux

# Kill process on port 3000
# Windows: taskkill /PID <PID> /F
# Mac/Linux: kill -9 <PID>
```

---

## 📐 Code Standards & Guidelines

### TypeScript Configuration

```json
{
  "strict": true,
  "target": "ES2017",
  "jsx": "react-jsx",
  "paths": {
    "@/*": ["./*"]
  }
}
```

### Import Conventions

```typescript
// ✅ CORRECT ORDER
import React from 'react';
import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dateUtils';

// ❌ AVOID
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
```

### Component Style

```typescript
// ✅ CORRECT
interface Props {
  readonly title: string;
  readonly onClick: () => void;
}

export const MyComponent: React.FC<Props> = ({ title, onClick }) => {
  return <button onClick={onClick}>{title}</button>;
};

export default MyComponent;

// ❌ AVOID
export default function MyComponent(props) {
  return <button onClick={props.onClick}>{props.title}</button>;
}
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `GrievanceCard.tsx` |
| Utilities | camelCase | `dateUtils.ts` |
| Variables | camelCase | `grievanceId`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_LENGTH = 500` |
| Functions | camelCase, verb-first | `formatDate()`, `handleClick()` |
| Types | PascalCase | `Grievance`, `UserProps` |
| Interfaces | PascalCase | `IGrievance`, `IUser` |

### CSS & Styling

```tsx
// ✅ Use Tailwind utilities
<div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow">

// ❌ Avoid custom CSS
<div style={{ backgroundColor: 'white', borderRadius: '8px' }}>

// ✅ Dark mode support
<div className="text-gray-900 dark:text-white">

// ✅ Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Error Handling

```typescript
// ✅ Try-catch with meaningful errors
try {
  const data = await fetchGrievances();
} catch (error) {
  console.error('Failed to fetch grievances:', error);
  // If error is empty object {}, likely RLS permission issue
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  }
  setError('Unable to load grievances. Please try again.');
}

// ✅ TypeScript for compile-time safety
const handleSubmit = (data: GrievanceFormData): void => {
  // Type-safe code
};

// ✅ Proper async handling
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  fetchData().finally(() => setLoading(false));
}, []);
```

### Performance Guidelines

```typescript
// ✅ Memoize expensive components
const GrievanceCard = React.memo(({ id, title }: Props) => {
  return <div>{title}</div>;
});

// ✅ Dynamic imports for large components
const GrievanceForm = dynamic(() => import('@/components/GrievanceForm'));

// ✅ Optimize images with Next.js Image
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />

// ✅ Proper loading states
{loading ? <Skeleton /> : <Content />}
```

---

## ⚙️ Configuration & Deployment

### Environment Variables Checklist

```env
# ✅ Required for Development
NEXT_PUBLIC_GOOGLE_CLIENT_ID=              # From Google Cloud Console
GOOGLE_CLIENT_SECRET=                      # From Google Cloud Console
NEXT_PUBLIC_SUPABASE_URL=                  # From Supabase Dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=             # From Supabase Settings
SUPABASE_SERVICE_ROLE_KEY=                 # From Supabase Settings
NEXTAUTH_URL=http://localhost:3000        # For development
NEXTAUTH_SECRET=your-secret-key            # Any random string

# ✅ For Production
NEXTAUTH_URL=https://yourdomain.com        # Change to production URL
NODE_ENV=production                        # Set by hosting provider
```

### Deployment Checklist

Before deploying to production:

```bash
# 1. Run all checks
npm run lint          # ✅ No lint errors
npx tsc --noEmit     # ✅ No type errors
npm run build        # ✅ Build succeeds

# 2. Test on production build locally
npm run build
npm run start
# Visit http://localhost:3000 and test thoroughly

# 3. Set production environment variables
# On Vercel/AWS/your hosting platform:
# - Update NEXTAUTH_URL to production domain
# - Update all URLs to production endpoints
# - Set NODE_ENV=production

# 4. Deploy
# Commit and push to main branch
# (if using Vercel, auto-deploys on push)

# 5. Verify in production
# Visit https://yourdomain.com
# Test login, create grievance, etc.
```

### Vercel Deployment

```bash
# 1. Initialize Git
git init
git add .
git commit -m "Initial commit"

# 2. Create repository on GitHub
# Push code to repository

# 3. Connect to Vercel
# vercel.com → Import Project → Select GitHub repo

# 4. Set environment variables in Vercel dashboard
# Add all .env.local variables

# 5. Deploy (automatic on push to main)
```

---

## 🔄 Recent Changes & Fixes

### Latest Fix: Error Logging & RLS Issues (March 3, 2026)

**Problem**: Error object showing as empty `{}`, unable to debug Supabase issues

**Solution**: 
- Improved error logging in Dashboard.tsx and db.ts
- Added detailed error messages to console
- Documented RLS permission fixes
- Consolidated all documentation into AGENTS.md

**Files Changed**:
- ✅ Updated: `app/components/Dashboard.tsx` - Better error handling
- ✅ Updated: `lib/supabase/db.ts` - Detailed error messages
- ✅ Created: `AGENTS.md` - Master documentation
- ✅ Deleted: Redundant documentation files

**Testing**:
```bash
npm run lint          # ✅ Passes
npx tsc --noEmit     # ✅ Passes
npm run build        # ✅ Passes
npm run dev          # ✅ Runs successfully
```

### Previous Fix: Timezone System

**Problem**: Times displayed in UTC, not user's local timezone

**Solution**: Created centralized timezone utilities

**Files Changed**:
- ✅ Created: `lib/dateUtils.ts`
- ✅ Updated: All date display components

---

## ✨ Feature Status

### Completed Features ✅

| Feature | Component | Status | Date |
|---------|-----------|--------|------|
| Google OAuth | login/page.tsx | ✅ Complete | Initial |
| File Grievance | GrievanceForm.tsx | ✅ Complete | Initial |
| Dashboard | Dashboard.tsx | ✅ Complete | Initial |
| Upvote System | GrievanceCard.tsx | ✅ Complete | Initial |
| Comments | CommentsSection.tsx | ✅ Complete | Initial |
| Categories | admin/categories/page.tsx | ✅ Complete | Initial |
| Filtering | Filters.tsx | ✅ Complete | Initial |
| Timezone Handling | dateUtils.ts | ✅ Complete | Mar 3, 2026 |
| Error Logging | db.ts, Dashboard.tsx | ✅ Complete | Mar 3, 2026 |

### Potential Future Features 🚀

- [ ] Email notifications on status changes
- [ ] File/image attachments
- [ ] Advanced analytics dashboard
- [ ] User profile & grievance history
- [ ] Department assignment
- [ ] SMS notifications
- [ ] Export to PDF/CSV
- [ ] Automated follow-up reminders
- [ ] User reputation system
- [ ] Grievance templates

---

## 🗄️ Database Schema

### Tables Overview

```sql
-- Categories: Types of grievances
CREATE TABLE categories (
  id UUID PRIMARY KEY
  name TEXT NOT NULL UNIQUE
  created_at TIMESTAMP DEFAULT NOW()
)

-- Grievances: Main complaint records
CREATE TABLE grievances (
  id UUID PRIMARY KEY
  title TEXT NOT NULL
  description TEXT NOT NULL
  category TEXT NOT NULL (FOREIGN KEY)
  status TEXT: 'open' | 'in-progress' | 'resolved'
  author_email TEXT (optional, NULL if anonymous)
  is_anonymous BOOLEAN
  created_at TIMESTAMP (UTC)
  updated_at TIMESTAMP (UTC)
)

-- Upvotes: Support tracking
CREATE TABLE upvotes (
  id UUID PRIMARY KEY
  grievance_id UUID (FOREIGN KEY)
  user_email TEXT NOT NULL
  created_at TIMESTAMP (UTC)
  UNIQUE(grievance_id, user_email)  -- Prevents double-voting
)

-- Comments: Discussion on grievances
CREATE TABLE comments (
  id UUID PRIMARY KEY
  grievance_id UUID (FOREIGN KEY)
  author_email TEXT (optional for anonymous)
  content TEXT NOT NULL
  is_anonymous BOOLEAN
  created_at TIMESTAMP (UTC)
  updated_at TIMESTAMP (UTC)
)
```

### Key Database Features

- **Row-Level Security (RLS)**: Everyone can read; only authors can modify their data
- **Cascading Deletes**: Deleting a grievance removes related upvotes/comments
- **Timestamps in UTC**: All times stored in ISO 8601 format
- **Unique Constraints**: Prevents duplicate upvotes by same user per grievance
- **Foreign Keys**: Maintains referential integrity

### RLS Policy Status

⚠️ **IMPORTANT**: If you see error `{}` when fetching data:
- RLS is enabled but policies may not be set correctly
- See "Emergency Procedures" section for SQL to fix
- Can disable RLS temporarily for testing

---

## ⚠️ Common Issues & Solutions

### Issue: "Module not found" errors

```
Error: Cannot find module '@/lib/dateUtils'

Solution:
1. Check file exists at: grs/lib/dateUtils.ts
2. Verify import path matches file location
3. Check tsconfig.json has path alias: "@/*": ["./*"]
4. Restart dev server: npm run dev
5. Clear cache: rm -r .next
```

### Issue: Error {} - Empty Object (RLS Blocking)

```
Error: Supabase getCategories error: {}

Solution:
1. This is usually a Row-Level Security permission issue
2. Run the RLS fix SQL (see Emergency Procedures section)
3. Verify policies exist in Supabase Dashboard
4. Check browser console for detailed error messages
5. Try disabling RLS temporarily to test
```

### Issue: Google OAuth returns 400 error

```
Error: redirect_uri_mismatch

Solution:
1. Go to Google Cloud Console
2. Verify redirect URIs match exactly:
   - http://localhost:3000 (for dev)
   - https://yourdomain.com (for production)
3. No trailing slashes!
4. Restart dev server
5. Clear browser cache
```

### Issue: Supabase connection timeout

```
Error: Failed to fetch data from Supabase

Solution:
1. Check internet connection
2. Verify Supabase project is running
3. Check credentials in .env.local
4. Test Supabase directly:
   - Login to Supabase dashboard
   - Check if tables exist
5. Verify network firewall allows connections
```

### Issue: Times showing wrong timezone

```
Problem: Grievance shows wrong time

Solution:
1. Verify using formatLocalDateTime from dateUtils.ts
2. All date functions imported from dateUtils
3. Check browser timezone settings
4. Restart dev server
5. Check browser console for date parsing errors
```

### Issue: Build fails with TypeScript errors

```bash
# Run type check to see specific errors
npx tsc --noEmit

# Common fixes:
# 1. Import types correctly: import type { Type } from 'module'
# 2. Ensure all variables have types
# 3. Check for unused imports
# 4. Verify interface implementations
# 5. Check for circular imports
```

---

## 🚀 Performance Optimization

### Current Optimizations

```typescript
// 1. Component memoization (can be enhanced)
// const GrievanceCard = React.memo(({ ...props }) => {...});

// 2. UseCallback for prevented re-renders
// const handleUpdate = useCallback(() => {...}, []);

// 3. Lazy loading support (can add)
// const GrievanceForm = dynamic(() => import('...'));

// 4. Image optimization (using Next.js Image component)
// <Image src="/logo.png" alt="Logo" width={100} height={100} />
```

### Database Query Optimization

```sql
-- Already implemented:
-- 1. Indexes on frequently queried columns
-- 2. Efficient joins with COUNT aggregates
-- 3. Foreign key relationships for integrity
-- 4. Unique constraints for data validity

-- Can be added:
-- CREATE INDEX idx_grievances_category ON grievances(category);
-- CREATE INDEX idx_grievances_status ON grievances(status);
-- CREATE INDEX idx_upvotes_email ON upvotes(user_email);
```

### Bundle Size Monitoring

```bash
# Check bundle size
npm run build

# Look for large packages:
# Run: npm ls --depth=0

# Reduce unused dependencies:
# npm prune
```

---

## 📞 Support & Resources

### Useful Links

| Resource | URL | Use Case |
|----------|-----|----------|
| Supabase Docs | https://supabase.com/docs | Database queries, RLS policies |
| Google OAuth | https://developers.google.com/identity | OAuth setup & troubleshooting |
| Next.js Docs | https://nextjs.org/docs | Framework features & APIs |
| Tailwind CSS | https://tailwindcss.com/docs | Styling & responsive design |
| TypeScript | https://www.typescriptlang.org/docs | Type definitions & features |
| React Docs | https://react.dev | Component patterns & hooks |

### Getting Help

1. **Check Browser Console**
   - Dev Tools → Console tab (F12)
   - Look for error messages
   - Check network requests (Network tab)

2. **Check This File**
   - Search for your error message
   - See Common Issues section
   - Check Emergency Procedures

3. **Clear Cache & Restart**
   ```bash
   rm -r node_modules .next
   npm install
   npm run build
   npm run dev
   ```

4. **Verify Environment**
   - Check .env.local has all variables
   - Verify .env.local is in grs/ folder
   - Restart dev server after changes

---

## 🎯 Update Log

### March 3, 2026
- ✅ Improved error logging for better debugging
- ✅ Added RLS permission fixes to emergency procedures
- ✅ Moved all documentation to AGENTS.md
- ✅ Deleted redundant documentation files
- ✅ Comprehensive test passed (lint + tsc + build)

### March 3, 2026 (Earlier)
- ✅ Created `lib/dateUtils.ts` for timezone handling
- ✅ Updated all components to use timezone utilities
- ✅ Fixed times displaying in user's local timezone

### Initial Release
- ✅ Implemented core grievance system
- ✅ Google OAuth authentication
- ✅ Dashboard with filtering
- ✅ Comment system
- ✅ Admin category management
- ✅ Upvote system

---

## 💾 File Maintenance

**This file should be updated whenever:**
- ✅ New features are implemented
- ✅ Bugs are fixed with lasting impact
- ✅ New commands/procedures are created
- ✅ Dependencies are upgraded
- ✅ Deployment procedures change
- ✅ Environment variables are added/modified

**Update Format:**
1. Update relevant section
2. Add entry to "🎯 Update Log" with date
3. Note what changed and where
4. Commit with message: "docs: update AGENTS.md - [feature/fix]"

---

## 📝 Notes for AI Assistants

**When making changes to the codebase:**
1. Always run `npm run lint && npx tsc --noEmit && npm run build` before finishing
2. If changes affect database: update schema.sql documentation
3. If new utilities created: add to this guide's Project Structure
4. If new environment variables needed: add to Configuration section
5. Update "Recent Changes & Fixes" section with what was done

**Priority order when debugging:**
1. Check error messages in browser console (F12)
2. Verify environment variables in .env.local
3. Check TypeScript types match
4. Review recent changes in this guide
5. Clear all caches: `rm -r .next node_modules && npm install`

---

**Last Maintained By**: AI Assistant  
**Last Updated**: March 3, 2026  
**Status**: ✅ Active Development  
**Documentation Location**: AGENTS.md (Root)  
**Next Review**: When next feature is added or issue occurs
