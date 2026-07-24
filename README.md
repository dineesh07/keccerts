# KEC Student Certificate Portal 🎓

A modern, full-stack web application for generating, managing, and verifying student event certificates. Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**.

---

## 📌 Repository Description (for GitHub About section)

> A modern, full-stack web platform built with Next.js 16, TypeScript, and Supabase for generating, issuing, and verifying student event certificates with dynamic template design and bulk CSV processing.

---

## ✨ Features

### 🎓 For Students
- **Certificate Search**: Easily search certificates using Roll Number, Register Number, or Name.
- **Instant Preview & Download**: High-resolution certificate preview with direct download option.
- **Verification**: Secure certificate lookup and verification.
- **Event Discovery**: Browse upcoming and completed events.

### 🛡️ For Admins
- **Admin Dashboard**: Overview of total events, generated certificates, and quick actions.
- **Event Management**: Create, edit, publish, and delete events with date ranges and descriptions.
- **Visual Template Editor**: Interactive canvas editor to design certificate templates, drag & position placeholder fields (Student Name, Event Name, Roll No, Date, etc.).
- **Bulk CSV Upload**: Batch generate certificates by uploading student roster CSV files.
- **Automated Generation**: High-quality dynamic rendering using server-side SVG/PNG conversion.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Rendering**: `@resvg/resvg-js` for high-quality SVG to PNG rasterization
- **Fonts**: `@fontsource-variable/plus-jakarta-sans`

---

## 📂 Project Structure

```text
certificate-portal/
├── app/
│   ├── admin/                # Admin Panel (Dashboard, Events, Templates, Upload)
│   ├── api/                  # API Routes (Certificates, Events, Generation, CSV Upload)
│   ├── globals.css           # Global Styles & Tailwind Config
│   ├── layout.tsx            # Root Layout
│   └── page.tsx              # Student Search Portal Home
├── components/
│   ├── admin/                # Admin Components (Template Editor, Event Form, Shell)
│   ├── CertificateCard.tsx   # Certificate preview component
│   ├── EventCard.tsx         # Event listing card
│   ├── SearchForm.tsx        # Student certificate search bar
│   └── Navbar.tsx / Footer.tsx
├── lib/                      # Helper utilities and Supabase client
├── services/                 # Business logic and database API wrappers
├── types/                    # TypeScript interfaces
└── supabase/                 # Database migrations / schemas
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)

### 1. Clone the Repository

```bash
git clone https://github.com/dineesh07/keccertiportal.git
cd keccertiportal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and configure your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the portal.

---

## 📦 Build & Production

To build the application for production:

```bash
npm run build
npm run start
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## 📜 License

This project is licensed under the MIT License.
