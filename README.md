# 🏛️ Grievance Redressal System (GRS)

A modern, full-stack platform designed for educational institutions to manage, track, and resolve grievances efficiently. Built with **Next.js 15+**, **React 19**, and **Supabase**.

---

## 🌟 Key Features

### 👨‍🎓 For Students
- **File Grievances**: Submit complaints with titles, descriptions, and categories.
- **Visibility Control**: Toggle between **Public** (visible to all) and **Private** (only visible to author and staff).
- **Anonymity**: Option to post grievances anonymously to encourage honest feedback.
- **Community Engagement**: Upvote public grievances and engage in discussions via comments.
- **Real-time Tracking**: Monitor the status of filed grievances (Open → In-Progress → Resolved).

### 👩‍🏫 For Teachers
- **Dedicated Dashboard**: Manage assigned grievances and provide official responses.
- **Status Updates**: Update grievance progress to keep students informed.
- **Automated Escalations**: Receive notifications for pending grievances based on category-priority policies.

### 👑 For Administrators
- **User Management**: Promote users to Teacher or Admin roles.
- **Category Control**: Create, edit, and delete grievance categories.
- **Escalation Policies**: Configure custom SLA thresholds (Warning, Escalate, Critical) per category.
- **System Analytics**: Overview of total, resolved, and pending grievances.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with Google OAuth 2.0
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Time Management**: Centralized UTC to Local Timezone utilities.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- A Supabase account
- A Google Cloud Console project (for OAuth)

### 1. Clone & Install
```bash
git clone <repository-url>
cd grs
npm install
```

### 2. Database Setup (Supabase)
1. Create a new project on [Supabase](https://app.supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `grs/schema.sql` and run it to create the necessary tables, indexes, and initial data.
4. **Important**: If you encounter permission issues during development, ensure Row-Level Security (RLS) policies are correctly applied as documented in `schema.sql`.

### 3. Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and set up the **OAuth consent screen**.
3. Create **OAuth 2.0 Client IDs** (Web application).
4. Add `http://localhost:3000` and `http://localhost:3000/login` to the **Authorized redirect URIs**.
5. Copy your **Client ID** and **Client Secret**.

### 4. Environment Configuration
Create a `.env.local` file in the `grs/` directory and populate it with your credentials:

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_random_secure_string_for_nextauth
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Development Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint for code quality checks |
| `npx tsc --noEmit` | Runs TypeScript compiler checks |

---

## 🗃️ Database Architecture

The system relies on a relational schema designed for scalability:
- **`users`**: Managed roles (student, teacher, admin) and profiles.
- **`grievances`**: Core data for all complaints including visibility and anonymity flags.
- **`categories`**: Grouping for grievances with associated escalation policies.
- **`escalation_policies`**: SLA settings (Warning/Escalate/Critical hours) per category.
- **`grievance_assignments`**: Maps grievances to specific teachers for resolution.
- **`teacher_responses`**: Official replies and resolution logs.

---

## ⚠️ Troubleshooting

### Row-Level Security (RLS) Errors
If you receive an empty object `{}` or a 403 error when fetching data, it is likely due to Supabase RLS. 
- Ensure policies in `schema.sql` are applied.
- For local testing, you can temporarily disable RLS on specific tables:
  ```sql
  ALTER TABLE grievances DISABLE ROW LEVEL SECURITY;
  ```

### Authentication Issues
- Ensure your `NEXTAUTH_URL` exactly matches the URL in your browser.
- Verify that the redirect URIs in Google Cloud Console match your environment.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
