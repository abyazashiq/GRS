# Quick Start - Grievance Redressal System

## 🚀 Get Started in 5 Minutes

### 1. **Create Supabase Account** (2 min)
- Go to https://supabase.com and create free account
- Create new project
- Note your **Project URL** and **anon public key**

### 2. **Setup Database** (1 min)
- Go to Supabase → SQL Editor
- Create new query
- Copy-paste content from `schema.sql`
- Click Run

### 3. **Get Google Credentials** (1 min)
- Go to https://console.cloud.google.com
- Create OAuth 2.0 credentials
- Note your **Client ID** and **Client Secret**

### 4. **Add Environment Variables** (30 sec)
Create `.env.local` in `/grs` folder:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_secret
```

### 5. **Run Project** (30 sec)
```bash
cd grs
npm install
npm run dev
```
Visit http://localhost:3000 → Click dashboard → Login with Google

## 📚 Full Setup Guide
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

## 🎯 Features
- ✅ File grievances (anonymous or identified)
- ✅ Upvote grievances
- ✅ Add comments
- ✅ Filter by category and status
- ✅ Admin panel to manage categories

## 🔧 Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Google OAuth + localStorage

## 🐛 Troubleshooting
- **Google error**: Add domain to Google Console authorized URIs
- **DB not working**: Run schema.sql again
- **Won't load**: Clear browser cache and localStorage
- **Env vars not picked up**: Restart `npm run dev`

## 📞 Need Help?
1. Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) thoroughly
2. Check Supabase docs: supabase.com/docs
3. Check Google OAuth docs: developers.google.com/identity

---
**Ready to go live? Let's get this system running!** 🚀
