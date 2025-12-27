# 🐛 BugTrack - Advanced Bug Tracking System

A modern, full-featured bug tracking application built with **React**, **Vite**, and **Supabase**. BugTrack helps development teams efficiently manage software defects with a beautiful, intuitive interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🔐 Authentication
- **Secure Login/Signup** with Supabase Auth
- **Password Reset** functionality
- **Profile Management** with avatar uploads
- **Protected Routes** with automatic redirects

### 🐞 Bug Management
- **Full CRUD Operations** for bugs
- **Rich Bug Details**: title, description, steps to reproduce, expected/actual results
- **Priority Levels**: Low, Medium, High, Critical
- **Status Tracking**: Open, In Progress, Closed
- **Multi-file Attachments** (images, videos, PDFs, documents)
- **Paste Support** for screenshots (Ctrl+V)
- **Module & Environment** tracking
- **Assignee & Reporter** assignments

### 📊 Project Management
- **Create Projects** with unique keys
- **Filter Bugs** by project, module, or assignee
- **Project Overview** cards

### 👥 Team Collaboration
- **Team Member Management**
- **Role Assignment**: Admin, Manager, Developer, QA, Guest  
- **User Avatars** and profiles
- **Search Team Members**

### 📈 Dashboard
- **Real-time Statistics**: Total bugs, open issues, in-progress, resolved
- **Quick Actions** for common tasks
- **Visual Status Cards**

### ⚙️ Settings
- **Theme Switcher** (Dark/Light mode with persistence)
- **Notification Preferences** (Email, Push, Updates)
- **Password Management**
- **Account Information Display**

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- A Supabase account ([database.new](https://database.new))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bug-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [database.new](https://database.new)
   - Go to **SQL Editor** and run the script from `SUPABASE_SETUP.md`
   - Run additional SQL scripts for features:
     - `ADD_ROLES_COLUMN.sql` - Enable role management
     - `SETUP_ATTACHMENTS.sql` - Set up file storage and RLS policies

4. **Configure Environment Variables**
   
   Create a `.env` file in the project root:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   
   Find these credentials in **Supabase Dashboard → Project Settings → API**

5. **Set up Storage Buckets**
   
   In Supabase Dashboard → Storage:
   - Create a public bucket named `attachments`
   - Create a public bucket named `avatars`
   - Run the RLS policies from `SETUP_ATTACHMENTS.sql`

6. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
bug-tracker/
├── src/
│   ├── pages/
│   │   ├── auth/          # Login, Signup, ForgotPassword
│   │   ├── Dashboard.jsx  # Overview with statistics
│   │   ├── BugList.jsx    # Bug CRUD with filters
│   │   ├── Projects.jsx   # Project management
│   │   ├── Team.jsx       # Team member management
│   │   ├── Profile.jsx    # User profile editor
│   │   └── Settings.jsx   # App settings
│   ├── context/
│   │   └── AuthContext.jsx # Authentication state
│   ├── lib/
│   │   └── supabase.js    # Supabase client configuration
│   ├── App.jsx            # Routes and layout
│   ├── index.css          # Global styles
│   └── main.jsx           # React entry point
├── scripts/               # Utility scripts
├── *.sql                  # Database migration scripts
├── SUPABASE_SETUP.md      # Database setup guide
└── README.md
```

## 🗄️ Database Schema

### Tables
- **`users`** - User profiles (name, email, avatar, role)
- **`projects`** - Projects with unique keys
- **`bugs`** - Bug reports with all details
- **`attachments`** - File attachments linked to bugs

### Storage Buckets
- **`attachments`** - Bug screenshots, videos, documents
- **`avatars`** - User profile pictures

## 🎨 Features in Detail

### Bug Filtering
Filter bugs by:
- **Project** - View bugs for specific projects
- **Module** - Filter by module/component
- **Assignee** - See bugs assigned to specific team members

### File Attachments
- **Drag & Drop** or browse to upload
- **Paste** from clipboard (Ctrl+V)
- **Multiple files** per bug
- **Preview** images and videos
- **Download** any file type
- **Delete** attachments with visual feedback

### Responsive Design
- **Glassmorphism** UI with modern aesthetics
- **Dark theme** optimized (light mode available)
- **Mobile-friendly** layouts
- **Smooth animations** and transitions

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with CSS Variables

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## 🔐 Security Features

- **Row Level Security (RLS)** on all tables
- **Authenticated Storage** access
- **Password strength** requirements (min 6 chars)
- **Protected routes** with auth guards
- **Secure file uploads** with validation

## 🐛 Troubleshooting

### "Role column is missing"
Run `ADD_ROLES_COLUMN.sql` in Supabase SQL Editor.

### "Storage permission error"
Run `SETUP_ATTACHMENTS.sql` to configure RLS policies.

### "Invalid UUID" errors
Run `FIX_BUGS_SCHEMA.sql` to fix ID type mismatches.

### App won't load
1. Check `.env` file exists with correct credentials
2. Verify Supabase project is active
3. Run database setup scripts

## 📚 Additional Documentation

- `SUPABASE_SETUP.md` - Complete database setup guide
- `DATABASE_SEARCH_GUIDE.md` - Query examples and tips
- `SQL_SEARCH_EXAMPLES.sql` - Sample queries
- `SEARCH_CHEATSHEET.md` - Quick reference

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Lucide](https://lucide.dev) - Beautiful icons
- [Vite](https://vitejs.dev) - Lightning-fast build tool

---

**Built with ❤️ by Your Team**

For support or questions, please open an issue on GitHub.
