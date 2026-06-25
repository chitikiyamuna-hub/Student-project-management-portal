# Student Mini Project Management Portal

A premium, responsive, full-stack project management portal engineered for academic evaluation. Built using React, Vite, Tailwind CSS, Express, Axios, and Joi. It features a unique **Unified Database Router with Automatic In-Memory Fallback** supporting MongoDB, PostgreSQL, and MySQL.

---

## 🚀 Key Features Built

1. **Dashboard Analytics & Statistics**: Real-time indicators monitoring total projects, pending, active development, and completed tasks.
2. **Dynamic Task Management (CRUD)**: Complete task registration, modification, deletion, and toggle cycles.
3. **Advanced Filters**: Instant search matching titles and descriptions, filter by status, and sort by created date (newest/oldest first).
4. **Automatic Database Fallback**: Sequentially checks configurations for **MongoDB, PostgreSQL, or MySQL**. If none are provided or connections fail, it automatically boots into an **In-Memory fallback database** backed by a local JSON file (`server/data/tasks.json`), preserving data between restarts.
5. **Centralized Error System**: Axios interceptors capture API failures or validation errors and pipe them directly into an interactive toast notification center.
6. **Dark Mode & Preference Persistence**: High-contrast, custom slate dark mode theme syncing to browser `localStorage` and system defaults.
7. **Robust Input Validation**: Strict client-side checks and server-side Joi validation (handling length constraints, data types, and formatting).
8. **Loading & Empty States**: Beautiful custom SVG empty screens and shimmer loaders providing feedback during network requests.
9. **Responsive Design**: Mobile-friendly mobile-first UI with premium micro-animations and glassmorphism styling.

---

## 📂 Project Structure

```
student-project-portal/
├── client/                     # Frontend Client (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api.js              # Axios centralized networking with interceptors
│   │   ├── App.jsx             # React SPA container, modals, toast stacks
│   │   ├── index.css           # Tailwind v4 configuration and animations
│   │   └── main.jsx            # Entry point
│   ├── index.html              # HTML document template
│   ├── package.json            # Client dependencies
│   ├── tailwind.config.js      # Core layout settings
│   └── vite.config.js          # Vite config
├── server/                     # Backend API (Express.js + Node)
│   ├── data/
│   │   └── tasks.json          # Fallback JSON store (auto-generated)
│   ├── .env                    # Configured environment keys
│   ├── db.js                   # Unified DB Router (Mongo, PG, MySQL, Fallback)
│   ├── memoryDb.js             # Local JSON file DB engine
│   ├── routes.js               # API Endpoints (GET, POST, PUT, DELETE)
│   ├── server.js               # Express server entry point and CORS
│   └── validator.js            # Joi validation schemas
└── README.md                   # This instruction manual
```

---

## 🛠️ Step-by-Step Local Setup

Follow these commands to boot both services:

### 1. Prerequisite
Ensure [Node.js](https://nodejs.org/) (v16+) is installed on your system.

### 2. Start the Backend API Server
Navigate to the server directory, install its packages, and boot the server in development mode.
```bash
cd server
npm install
npm run dev
```
- By default, the server runs on **port 5000**.
- **Database Fallback**: Since no databases are configured in `.env`, the console will report: `No valid DB environment variables matched or connection failed. Initializing file-persisted In-Memory DB...`. Tasks will save to `server/data/tasks.json`.
- *(Optional)*: If you want to connect to MongoDB, MySQL, or Postgres, edit `server/.env` and paste your URI (e.g. `MONGODB_URI=mongodb://localhost:27017/my_db`). Restart the server and it will connect automatically.

### 3. Start the Frontend Client
Open a second terminal, navigate to the client directory, install packages, and boot the development server.
```bash
cd client
npm install
npm run dev
```
- The frontend will boot on `http://localhost:5173`.
- Open that link in your browser to view the portal.

---

## 📝 Submitting Your Solution (Klenty Drive Requirements)

To fulfill the requirements and submit before **Friday at 9:00 PM**, execute the following steps to upload your project to GitHub and share it with the examiner.

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com/).
2. Click **New** to create a repository.
3. Name it: `student-project-portal` or similar.
4. Set the visibility to **Public** (so the evaluator can view your code). Do **NOT** initialize it with a README, `.gitignore`, or License.
5. Click **Create repository** and copy the repository URL (e.g., `https://github.com/<your-username>/student-project-portal.git`).

### Step 2: Initialize Git and Commit Code Locally
Create a `.gitignore` at the root of the project to prevent pushing `node_modules` and custom DB JSON data:

1. Create a file named `.gitignore` in the root folder (`student-project-portal/`) and write:
   ```text
   node_modules/
   client/node_modules/
   server/node_modules/
   server/data/
   client/dist/
   .env
   .DS_Store
   ```
2. Initialize and commit your files:
   ```bash
   git init
   git add .
   git commit -m "feat: complete student mini project management portal"
   ```

### Step 3: Link and Push to GitHub
Run the following commands inside the root folder, replacing `<YOUR_REPO_URL>` with your copied GitHub URL:
```bash
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

### Step 4: Email the Evaluator
Compose an email to **manojs@veltech.edu.in** before **Friday 9:00 PM** using the template below:

- **To**: `manojs@veltech.edu.in`
- **Subject**: `Klenty Drive Mini Project Solution - [Your Name]`
- **Body Template**:
  ```text
  Respected Sir,

  I have successfully completed the assignment for the "Student Mini Project Management Portal" with all the specified features, including responsive visual statistics, sorting/filtering mechanisms, centralized error handling via Axios interceptors, Joi server-side schemas, and a database adapter with automatic in-memory fallback.

  GitHub Repository Link:
  https://github.com/<your-username>/student-project-portal

  The project contains setup guidelines in the README.md to help build and test both the client and server locally.

  Thank you for this opportunity. I hope my design and implementation demonstrate my eligibility and skills for selection at Klenty.

  Sincerely,
  [Your Name]
  [Your Register/Roll Number]
  [Your College Name]
  ```

---

## 🎨 Technology Design Choices

- **Tailwind CSS v4**: Theme extensions are implemented cleanly inside the CSS layer using `@theme` syntax. This provides extremely fast performance and zero layout shift.
- **Glassmorphism**: Layout panels use `backdrop-filter: blur` to overlap background gradients gracefully, providing a highly premium look in both light and dark settings.
- **Unified DB adapter**: Built with a facade pattern in `db.js` so that the router interface (`getAll`, `create`, `delete`) remains identical, making database swap-ins transparent to the REST controller.
