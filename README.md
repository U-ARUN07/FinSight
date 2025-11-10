# 💰 FinSight — Smart Personal Finance & Productivity Tracker

FinSight is an **intelligent personal finance and productivity web app** designed to simplify expense tracking, income management, and task organization — all in one dashboard.
It combines **real-time analytics**, **interactive charts**, and **secure cloud storage** on GitHub, with a **modern responsive UI** that adapts to any device.

Developed by [**U ARUN**](https://github.com/U-ARUN07) — a Computer Science & Engineering student passionate about building smart, data-driven applications that solve real-world problems.

---

## 🌐 Live Demo

| Platform | Link |
|-----------|------|
| 🖥️ **Frontend (GitHub Pages)** | [https://u-arun07.github.io/FinSight/](https://u-arun07.github.io/FinSight/) |
| ☁️ **Backend API (Vercel)** | [https://fin-sight-api.vercel.app/api/update](https://fin-sight-api.vercel.app/api/update) |

---

## 🧠 Overview

FinSight empowers users to manage both their **finances** and **tasks** in a clean, intuitive interface.
Each registered user gets a private workspace where they can:

- Log incomes and expenses
- Track balance dynamically
- Visualize financial trends
- Create and manage personal tasks
- Automatically sync data to GitHub (via backend API)

---

## ✨ Key Features

| Category | Details |
|-----------|----------|
| 👤 **User System** | Login/Register using simple usernames — no passwords required. Each username has a unique data file. |
| 💵 **Income & Expense Tracking** | Add, edit, and delete transactions. See real-time total balance. |
| 📊 **Data Visualization** | Dynamic Pie and Bar charts powered by Chart.js with category insights. |
| 📝 **Task Manager** | Add daily tasks with due dates, mark complete, and delete anytime. |
| 🕒 **History Log** | Every transaction or task update is timestamped for transparency. |
| 🌗 **Theme Switcher** | Toggle light/dark themes instantly — persisted with local storage. |
| ☁️ **Cloud Sync (GitHub)** | Secure data storage inside your GitHub repository. |
| 🔐 **Persistent Login** | User session remembered between visits. |
| 🎀 **Animated GitHub Ribbon** | A top-corner ribbon linking to your GitHub profile with animation. |
| 🧠 **Smart Local Caching** | Uses browser LocalStorage for fast reloads. |

---

## 🧩 Architecture

Frontend (GitHub Pages)
├── index.html
├── style.css
├── script.js
└── .github/workflows/update-data.yml
│
▼
GitHub Actions → Writes user data files:
data/users/<username>.json
▲
│
Backend (Vercel Serverless Function)
└── api/update.js → Triggers GitHub Action (repository_dispatch)

yaml
Copy code

---

## ⚙️ Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6), Chart.js |
| **Backend** | Node.js (Vercel Serverless Functions), GitHub REST API |
| **Data Storage** | JSON files in GitHub repository (`data/users/`) |
| **Hosting** | GitHub Pages (Frontend), Vercel (Backend) |
| **Automation** | GitHub Actions |

---

## 🗂️ Folder Structure

FinSight/
│
├── index.html
├── style.css
├── script.js
│
├── .github/
│ └── workflows/
│ └── update-data.yml
│
└── data/
└── users/
└── (auto-generated user JSON files)

yaml
Copy code

---

## 🧰 Step-by-Step Implementation Guide

### 🪜 1. Clone or Create Project

```bash
git clone https://github.com/U-ARUN07/FinSight.git
cd FinSight
If you’re starting fresh:

bash
Copy code
mkdir FinSight && cd FinSight
Add files:

index.html

style.css

script.js

.github/workflows/update-data.yml

🌐 2. Push to GitHub (Frontend)
Create a new repo on GitHub called FinSight

Push from VS Code:

bash
Copy code
git init
git add .
git commit -m "Initial FinSight frontend"
git branch -M main
git remote add origin https://github.com/U-ARUN07/FinSight.git
git push -u origin main
Enable GitHub Pages →
Settings → Pages → Source = main → Save

✅ Live site: https://u-arun07.github.io/FinSight/

⚙️ 3. Backend Setup (Vercel)
Create a new folder FinSight-API

Inside, add:

api/update.js

package.json

Push it to GitHub as a new repo FinSight-API:

bash
Copy code
git init
git add .
git commit -m "FinSight backend setup"
git branch -M main
git remote add origin https://github.com/U-ARUN07/FinSight-API.git
git push -u origin main
Go to Vercel → Import FinSight-API project.

Add environment variable:

ini
Copy code
GITHUB_TOKEN = <your_personal_access_token>
Deploy → You’ll get a URL like
https://fin-sight-api.vercel.app/api/update

🔑 4. Generate GitHub Personal Access Token
Go to GitHub → Settings → Developer Settings → Fine-grained Tokens → Generate New Token

Repository Access → Only FinSight

Permissions:

✅ Contents: Read and Write

✅ Workflows: Read and Write

Copy the token → Add it in Vercel → Project → Environment Variables as GITHUB_TOKEN.

🔗 5. Connect Frontend with Backend
In your script.js, update this line:

js
Copy code
const API_URL = "https://fin-sight-api.vercel.app/api/update";
Then push changes:

bash
Copy code
git add script.js
git commit -m "Connected frontend to live backend"
git push
🧪 6. Test Functionality
Visit → https://u-arun07.github.io/FinSight/

Register/Login with username (e.g. arun)

Add incomes, expenses, and tasks

Refresh GitHub →
data/users/arun.json → ✅ Your data appears!

🧾 Example Data (auto-generated)
json
Copy code
{
  "transactions": [
    {"type": "income", "amount": 5000, "category": "Salary"},
    {"type": "expense", "amount": 1500, "category": "Rent"}
  ],
  "tasks": [
    {"text": "Submit project report", "due": "2025-11-15", "done": false}
  ],
  "history": [
    {"when": "2025-11-11T21:45:00", "action": "txn-income"}
  ]
}
🧮 Data Flow
pgsql
Copy code
User Action → JS Fetch (Frontend)
     ↓
Vercel API (Backend)
     ↓
GitHub Dispatch Event
     ↓
GitHub Action Workflow
     ↓
Writes/Updates JSON file in `data/users/`
📊 Visual Preview
Dashboard	Tasks	Charts

💡 Future Enhancements
🔐 Password-based authentication (Firebase)

📆 Monthly spending & filter analytics

📤 Export PDF report summaries

🔔 Email/SMS task reminders

🪙 Multi-currency support

🌍 Multi-language interface

🧑‍💻 Author
U ARUN
📧 u.arunbabya1234@gmail.com
🌐 GitHub → U-ARUN07
💬 "Transforming ideas into impactful, data-driven digital experiences."

📜 License
Released under the MIT License © 2025 U ARUN
You are free to use, modify, and distribute this project with proper credit.

🌟 Support
If FinSight inspired you:
⭐ Star the repo → U-ARUN07 / FinSight

“Dream it. Code it. Deploy it.” — U ARUN

❓ FAQ
Q1: Why is my data not saving?
→ Ensure your backend (FinSight-API) is deployed and GITHUB_TOKEN is configured properly.

Q2: Can I reset my account?
→ Yes. Each username file can be manually deleted from data/users/ on GitHub.

Q3: Can I host this somewhere else?
→ Yes! Frontend works on GitHub Pages, Netlify, or Vercel. Backend can stay on Vercel for simplicity.

🧩 Add This File
In VS Code:

bash
Copy code
echo "# FinSight" > README.md
# Paste this full content
git add README.md
git commit -m "Added professional detailed README"
git push
✅ Your GitHub project will now look professional and complete.

yaml
Copy code

---

That’s it ✅
After adding this to your project and pushing it, your GitHub repository will look like a **real open-source, production-grade app**.

Would you like me to now generate your **LICENSE (MIT 2025 – U ARUN)** file so that your repository looks fully professional with license and author details?






