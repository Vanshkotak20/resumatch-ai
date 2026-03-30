# ⚡ ResuMatch AI — Resume & Job Match Analyzer

AI-powered web app that analyzes your resume against a job description
and gives you a match score, missing skills, and improvement tips.

---

## 🚀 How to Run (Step by Step)

### Step 1 — Install Node.js
Download and install from: https://nodejs.org  
(Download the LTS version)

### Step 2 — Get an OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with "sk-...")

### Step 3 — Add your API Key
1. Open the file: `backend/.env`
2. Replace `your_openai_api_key_here` with your actual key
3. Save the file

Example:
```
OPENAI_API_KEY=sk-proj-abc123yourrealkeyhere
```

### Step 4 — Install dependencies
Open a terminal/command prompt in the `backend` folder and run:
```
npm install
```

### Step 5 — Start the server
In the same terminal, run:
```
npm start
```

You will see:
```
  ResuMatch AI is running!
  Open in browser: http://localhost:3000
```

### Step 6 — Use the app
Open your browser and go to: http://localhost:3000

---

## 📁 Project Structure

```
resumatch/
├── backend/
│   ├── server.js       ← Node.js + Express backend
│   ├── .env            ← Your API key goes here
│   └── package.json    ← Dependencies
└── frontend/
    ├── index.html      ← Main app page
    ├── css/
    │   └── style.css   ← All styles
    └── js/
        └── app.js      ← Frontend logic
```

---

## ❓ Troubleshooting

**"Cannot connect to server"**
→ Make sure you ran `npm start` in the backend folder and it's still running.

**"OpenAI API key not configured"**
→ Open `backend/.env` and add your real API key, then restart the server.

**"OpenAI error: insufficient_quota"**
→ Your OpenAI account needs credits. Add a small amount at https://platform.openai.com/settings/billing

---

## 💡 Tech Stack
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-4o-mini API
- **No-code concept**: Designed using software engineering principles
