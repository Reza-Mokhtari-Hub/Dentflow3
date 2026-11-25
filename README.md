# DentFlow — Dental Clinic Web Platform & Management System

A full-stack web application built for modern dental clinics, featuring a Persian (RTL) public website, online appointment booking with a Jalali calendar, a patient portal with OTP authentication, and a multi-module clinic admin dashboard.

Developed and maintained by **[Reza Mokhtari](https://github.com/Reza-Mokhtari-Hub)**.

---

## Overview

DentFlow combines a clinic landing experience with day-to-day operational tools in a single codebase. Patients can browse treatments, inspect before-and-after smile cases, read dental care articles, book appointments by shift capacity, and log into their personal portal to track treatment plans and prescriptions. Clinic staff get an integrated dashboard covering appointments, 32-tooth dental charting, billing, content publishing, and analytics.

---

## Features

### Public Website & Booking
- **RTL Persian Interface**: Responsive layout with light/dark theme toggle and custom Persian typography.
- **Services & Smile Gallery**: Dynamic treatment catalog with pricing estimates and an interactive before/after gallery.
- **Jalali Online Booking**: Custom Persian calendar picker with configurable morning/afternoon shift capacities and booking tracking by ID.
- **Blog & SEO**: Article reader with clean URLs, `sitemap.xml`, `robots.txt`, and Schema.org JSON-LD structured data.
- **Online Consultation Widget**: Built-in clinic Q&A chat widget for common treatment, pricing, installment, and location inquiries.

### Patient Portal
- **Email OTP Authentication**: Passwordless login flow via one-time verification codes sent over SMTP.
- **Medical & Dental Records**: Read-only access to personal treatment plans, dental status, and prescriptions.
- **Direct Clinic Messaging**: Asynchronous chat thread between the patient and clinic staff.
- **Review Submission**: Verified patients can submit treatment reviews for moderation.

### Admin Dashboard
- **Appointments & Shift Control**: Approve, reschedule, comment on, or cancel bookings and adjust daily shift capacities.
- **Patient Records & Odontogram**: Manage patient profiles, interactive 32-tooth dental charts, prescriptions, and direct messages.
- **Financial Ledger**: Track clinic income, material/operational expenses, and patient payment history.
- **Dual-Mode Article Editor**: Rich-text HTML editor (`react-quill-new`) alongside a block-based editor, complete with live preview and draft autosave.
- **Clinic CMS & Analytics**: Edit services, gallery items, contact details, patient reviews, and view booking/revenue charts (`Recharts`).

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Recharts, Lucide Icons, React Quill, DOMPurify
- **Backend**: Node.js, Express, TypeScript (`tsx` in development, `esbuild` bundle for production)
- **Database**: MongoDB (with automatic local JSON fallback in `data/clinic-data.json` when no database URI is configured)
- **Email**: Nodemailer (Gmail SMTP)

---

## Project Structure

```text
├── api/
│   └── index.ts            # Serverless entry point (Vercel)
├── data/                   # Local JSON state fallback
├── public/                 # Static assets, SVG illustrations, uploads
├── src/
│   ├── components/         # UI sections, Admin tabs, Patient portal, RichTextEditor
│   ├── lib/                # Client utilities & toast notifications
│   ├── App.tsx             # Main application & routing state
│   ├── data.ts             # Initial clinic seed data & types
│   ├── index.css           # Tailwind setup & custom editor/theme styles
│   └── main.tsx            # React entry point
├── server.ts               # Express API server & Vite middleware
├── index.html              # HTML shell & Schema.org metadata
├── vercel.json             # Vercel routing config
├── netlify.toml            # Netlify build config
└── package.json
```

---

## Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm**
- Optional: a **MongoDB** instance (Atlas or local) and a **Gmail** account with an App Password for OTP emails

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Reza-Mokhtari-Hub/dentflow.git
   cd dentflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Configure `.env` as needed:

   | Variable | Required | Description |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | No | MongoDB connection string. If omitted, data is stored locally in `data/clinic-data.json`. |
   | `GMAIL_USER` | No | Gmail address used by Nodemailer to send patient OTP codes and notifications. |
   | `GMAIL_PASS` | No | Gmail App Password corresponding to `GMAIL_USER`. |
   | `GEMINI_API_KEY` | No | Optional API key for automated consultation responses and article draft helpers. |

4. Run the development server:
   ```bash
   npm run dev
   ```
   The app and API will be available at `http://localhost:3000`.

---

## Scripts

- `npm run dev` — Starts Express with Vite middleware on port `3000`
- `npm run build` — Builds the client into `dist/` and bundles `server.ts` into `dist/server.cjs`
- `npm start` — Runs the compiled production server (`node dist/server.cjs`)
- `npm run lint` — Runs TypeScript type checking (`tsc --noEmit`)

---

## Deployment

### Node.js Server
```bash
npm run build
npm start
```

### Vercel
This repository includes `vercel.json` and `api/index.ts`. Push the project to GitHub under your account, import it in Vercel, add your environment variables in project settings, and deploy.

---

## Author

**Reza Mokhtari**  
GitHub: [@Reza-Mokhtari-Hub](https://github.com/Reza-Mokhtari-Hub)

## License

This project is licensed under the Apache-2.0 License.
