# Grievance Redressal System - Setup Guide

## Overview
This is a complete grievance redressal system built with Next.js, Supabase, and Tailwind CSS. The system allows users to file, view, upvote, and comment on grievances with support for anonymous submissions.

## Features
- 🔐 **Google OAuth Authentication** - Users log in with SSN email (@ssn.edu.in)
- 📝 **File Grievances** - Submit grievances with title, description, category, and optional anonymous mode
- 👁️ **View All Grievances** - See all grievances on an interactive dashboard
- 👍 **Upvote System** - Vote on grievances to show support
- 💬 **Comments Section** - Add comments and context to grievances
- 🏷️ **Category Management** - Admin panel to manage grievance categories
- 🔍 **Filter & Search** - Filter by category and status (Open, In Progress, Resolved)
- 📊 **Real-time Updates** - Live upvote and comment counts

## Prerequisites
1. **Node.js** (v18+) and npm
2. **Supabase Account** (free at https://supabase.com)
3. **Google OAuth Credentials**
4. **Git** (for version control)

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project:
   - Click "New project"
   - Set database password
   - Select region closest to you
   - Click "Create new project"
3. Wait for project to initialize (~2 minutes)

### Step 2: Setup Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content of `schema.sql` file from this project
4. Paste it in the SQL editor
5. Click **Run** button
6. Wait for the query to complete successfully

**Tables Created:**
- `categories` - Available grievance categories
- `grievances` - Main grievance records
- `upvotes` - Upvote tracking
- `comments` - Comments on grievances

### Step 3: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your credentials:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - Add required info (app name, user support email, etc.)
   - Add scopes: `email`, `profile`, `openid`
6. Create credentials:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000`
     - `http://localhost:3000/login`
     - `https://yourdomain.com` (production)
7. Copy **Client ID** → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
8. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

### Step 5: Configure Environment Variables

1. Create `.env.local` file in the `/grs` directory
2. Add the following variables:

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth (optional for future use)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key
```

3. Replace all `your_*` values with actual credentials

### Step 6: Install Dependencies

```bash
cd grs
npm install
```

### Step 7: Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
grs/
├── app/
│   ├── components/
│   │   ├── Dashboard.tsx              # Main dashboard
│   │   ├── GrievanceCard.tsx          # Grievance list item
│   │   ├── GrievanceDetail.tsx        # Single grievance view
│   │   ├── GrievanceForm.tsx          # Create grievance modal
│   │   ├── CommentsSection.tsx        # Comments component
│   │   └── Filters.tsx                # Filter sidebar
│   ├── admin/
│   │   └── categories/
│   │       └── page.tsx               # Admin category management
│   ├── dashboard/
│   │   └── page.tsx                   # Dashboard page
│   ├── grievance/
│   │   └── [id]/
│   │       └── page.tsx               # Grievance detail page
│   ├── login/
│   │   └── page.tsx                   # Login page with Google OAuth
│   ├── layout.tsx                     # Root layout
│   ├── globals.css                    # Global styles
│   └── page.tsx                       # Home (redirects to dashboard)
├── lib/
│   └── supabase/
│       ├── client.ts                  # Supabase client initialization
│       ├── db.ts                      # Database operations
│       └── types.ts                   # TypeScript types
├── schema.sql                         # Database schema
├── .env.local                         # Environment variables
└── package.json                       # Dependencies
```

## Usage Guide

### For Users

1. **Login**
   - Click "Sign in with Google"
   - Use your @ssn.edu.in email
   - You'll be redirected to the dashboard

2. **File a Grievance**
   - Click "New Grievance" button
   - Fill in title, description, and select category
   - Optionally check "Submit as anonymous"
   - Click "Create Grievance"

3. **View Grievances**
   - All grievances are visible on the dashboard
   - Use filters to sort by category or status
   - Click any grievance to view details

4. **Upvote**
   - Click the thumbs-up icon on any grievance
   - Vote count updates instantly

5. **Add Comments**
   - Open a grievance detail page
   - Type your comment in the comment field
   - Optionally check "Anonymous comment"
   - Click "Post Comment"

### For Admins

1. **Access Admin Panel**
   - You need to be authenticated
   - Click the settings icon in the header
   - Go to "Manage Categories"

2. **Add New Category**
   - Enter category name and optional description
   - Click "Add Category"

3. **Delete Category**
   - Click trash icon next to any category
   - Confirm deletion

4. **Update Status** (Coming Soon)
   - From admin panel, change grievance status
   - Notify users of status updates

## Database Schema

### categories
```sql
- id (UUID): Primary key
- name (TEXT): Unique category name
- description (TEXT): Optional description
- created_at (TIMESTAMP): Creation date
```

### grievances
```sql
- id (UUID): Primary key
- title (TEXT): Grievance title
- description (TEXT): Full description
- category (TEXT): Foreign key to categories.name
- status (TEXT): 'open' | 'in-progress' | 'resolved'
- author_id (TEXT): User ID (optional)
- author_email (TEXT): User email (optional, null if anonymous)
- is_anonymous (BOOLEAN): Anonymous flag
- created_at (TIMESTAMP): Creation date
- updated_at (TIMESTAMP): Last update date
```

### upvotes
```sql
- id (UUID): Primary key
- grievance_id (UUID): Foreign key to grievances
- user_id (TEXT): User ID (optional)
- user_email (TEXT): User email (unique per grievance)
- created_at (TIMESTAMP): Upvote date
```

### comments
```sql
- id (UUID): Primary key
- grievance_id (UUID): Foreign key to grievances
- author_id (TEXT): User ID (optional)
- author_email (TEXT): User email (null if anonymous)
- content (TEXT): Comment text
- is_anonymous (BOOLEAN): Anonymous flag
- created_at (TIMESTAMP): Creation date
- updated_at (TIMESTAMP): Last update date
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Import from GitHub
4. Add environment variables in Vercel dashboard
5. Deploy

### Deploy to Other Platforms

- **Netlify**: Connect GitHub repo, add env vars, deploy
- **Railway**: Connect GitHub repo, add PostgreSQL + env vars
- **Heroku**: Using Buildpack for Next.js

## Common Issues & Solutions

### Issue: "No registered origin" Google OAuth error
**Solution:** Add your domain to Google Cloud Console authorized redirect URIs

### Issue: "Missing Supabase environment variables"
**Solution:** Ensure all variables in `.env.local` are correctly copied from Supabase

### Issue: Grievances not showing
**Solution:** Check if database schema was created successfully by running the SQL script

### Issue: Login redirects to login page again
**Solution:** Clear localStorage and cookies, try logging in again

## Future Enhancements

- [ ] Email notifications for status updates
- [ ] File attachments support
- [ ] Admin dashboard with analytics
- [ ] User profile and grievance history
- [ ] Assign grievances to departments
- [ ] SMS notifications
- [ ] Export to CSV/PDF
- [ ] Automated reminders for open grievances

## Support & Contact

For issues or questions:
1. Check this setup guide thoroughly
2. Review Supabase documentation: https://supabase.com/docs
3. Check Google OAuth setup: https://developers.google.com/identity
4. Review Next.js docs: https://nextjs.org/docs

## License

This project is built for the SSN College of Engineering grievance redressal system.

---

**Last Updated:** February 2026
**Version:** 1.0.0
