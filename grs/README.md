# 🏛️ Grievance Redressal System (GRS)

A modern, full-stack platform designed for educational institutions to manage, track, and resolve grievances efficiently.

---

## 🌟 Key Features

### 👨‍🎓 For Students
- **File Grievances**: Submit complaints with titles, descriptions, and categories.
- **Visibility Control**: Toggle between **Public** and **Private**.
- **Anonymity**: Option to post grievances anonymously.
- **Community Engagement**: Upvote public grievances and engage in discussions.

### 👩‍🏫 For Teachers
- **Dedicated Dashboard**: Manage assigned grievances and provide official responses.
- **Status Updates**: Update grievance progress.
- **Automated Escalations**: Receive notifications for pending grievances based on category-priority policies.

### 👑 For Administrators
- **User Management**: Promote users to Teacher or Admin roles.
- **Category Control**: Create, edit, and delete grievance categories.
- **Escalation Policies**: Configure custom SLA thresholds.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd grs
npm install
```

### 2. Database Setup (Supabase)
Run the contents of `schema.sql` in the Supabase SQL Editor.

### 3. Environment Configuration
Create a `.env.local` in this directory:

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

### 4. Run the Application
```bash
npm run dev
```

---

## 🔧 Development Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the application |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs code quality checks |
| `npx tsc --noEmit` | Runs TypeScript compiler checks |

---

## 📄 License
MIT License.
