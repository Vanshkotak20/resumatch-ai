require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50kb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const keySet = apiKey && apiKey !== 'your_openai_api_key_here';
  res.json({ status: 'ok', apiKeyConfigured: !!keySet, demoMode: !keySet });
});

// ─── Demo result generator ──────────────────────────────────────
function generateDemoResult(resume, jobDescription) {
  const jdWords = jobDescription.toLowerCase().split(/\W+/);
  const resumeWords = resume.toLowerCase().split(/\W+/);
  const techKeywords = ['python','javascript','java','react','node','sql','html','css',
    'git','docker','aws','excel','communication','management','analysis','design',
    'testing','agile','scrum','api','typescript','php','mongodb','mysql','linux'];

  const jdKeywords = techKeywords.filter(k => jdWords.includes(k));
  const matched = jdKeywords.filter(k => resumeWords.includes(k));
  const missing = jdKeywords.filter(k => !resumeWords.includes(k));

  const baseScore = jdKeywords.length > 0
    ? Math.round((matched.length / jdKeywords.length) * 100)
    : 55;
  const score = Math.min(92, Math.max(28, baseScore + Math.floor(Math.random() * 10) - 5));

  let scoreLabel = 'Low Match';
  if (score >= 75) scoreLabel = 'Excellent Match';
  else if (score >= 60) scoreLabel = 'Good Match';
  else if (score >= 40) scoreLabel = 'Moderate Match';

  const matchedSkills = matched.length > 0
    ? matched.map(s => s.charAt(0).toUpperCase() + s.slice(1))
    : ['Communication', 'Teamwork', 'Problem Solving'];

  const missingSkills = missing.length > 0
    ? missing.map(s => s.charAt(0).toUpperCase() + s.slice(1))
    : ['Python', 'SQL', 'Data Analysis', 'Agile/Scrum'];

  return {
    matchScore: score,
    scoreLabel,
    summary: `Your resume shows a ${scoreLabel.toLowerCase()} for this role. ${score >= 60
      ? 'You have a solid foundation of relevant skills. Focus on highlighting the missing keywords more prominently to improve your ATS score.'
      : 'Several key skills from the job description are missing or not highlighted. Adding the missing keywords and quantifying your achievements can significantly improve your chances.'
    } Tailoring your resume specifically to this job description is strongly recommended.`,
    matchedSkills,
    missingSkills,
    weakAreas: [
      'Quantified achievements not present — add numbers/percentages to your bullet points',
      'Professional summary missing or too generic',
      'Missing ATS-friendly keywords from the job description'
    ],
    improvements: [
      {
        title: 'Add missing technical skills',
        detail: `The job requires ${missingSkills.slice(0,3).join(', ')}. Even if you learned these in college or through self-study, add them to your skills section with a brief example project.`
      },
      {
        title: 'Quantify your achievements',
        detail: 'Replace vague statements like "worked on projects" with specific results: "Built a REST API that reduced response time by 30%". Numbers make your resume 3x more impactful.'
      },
      {
        title: 'Mirror the job description language',
        detail: 'Copy exact phrases from the job posting into your resume. ATS systems match keywords literally. If the JD says "cross-functional collaboration", use those exact words.'
      },
      {
        title: 'Add a strong professional summary',
        detail: 'Write a 2-3 line summary at the very top that mentions the job title and your top 3 relevant skills. This is what recruiters read first and what ATS scores highest.'
      }
    ],
    atsKeywords: [...missingSkills.slice(0,4), 'Cross-functional', 'Stakeholder management', 'KPI-driven', 'Detail-oriented'],
    strengthHighlights: [
      'Foundation in: ' + matchedSkills.slice(0,3).join(', '),
      'Educational background is relevant to the role',
      'Resume structure is clear and readable',
      'Demonstrated ability to work in team environments'
    ]
  };
}

// ─── Main Analyze Endpoint ──────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { resume, jobDescription } = req.body;

  if (!resume || resume.trim().length < 50) {
    return res.status(400).json({ error: 'Resume text is too short. Please paste your full resume.' });
  }
  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ error: 'Job description is too short. Please paste the full job description.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const demoMode = !apiKey || apiKey === 'your_openai_api_key_here';

  // ── DEMO MODE — works without any API key ────────────────────
  if (demoMode) {
    console.log('[Demo Mode] Returning smart sample analysis...');
    await new Promise(r => setTimeout(r, 1800));
    const result = generateDemoResult(resume, jobDescription);
    return res.json({ success: true, result, demoMode: true });
  }

  // ── LIVE MODE — uses real OpenAI API ────────────────────────
  const prompt = `You are an expert ATS (Applicant Tracking System) and career coach. Analyze the resume against the job description below and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

RESUME:
${resume.substring(0, 3000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

Return this exact JSON structure:
{
  "matchScore": <integer 0-100>,
  "scoreLabel": "<one of: Excellent Match, Good Match, Moderate Match, Low Match>",
  "summary": "<2-3 sentence overall assessment>",
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "weakAreas": ["area1", "area2"],
  "improvements": [
    { "title": "short title", "detail": "actionable advice" }
  ],
  "atsKeywords": ["keyword1", "keyword2"],
  "strengthHighlights": ["strength1", "strength2"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      const msg = errData?.error?.message || 'OpenAI API error';
      return res.status(502).json({ error: `OpenAI error: ${msg}` });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      return res.status(502).json({ error: 'Empty response from OpenAI. Please try again.' });
    }

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Could not parse AI response. Please try again.' });
    }

    return res.json({ success: true, result });

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: 'Server error. Make sure you are connected to the internet.' });
  }
});

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const demoMode = !apiKey || apiKey === 'your_openai_api_key_here';
  console.log('');
  console.log('  =============================================');
  console.log('         ResuMatch AI is running!');
  console.log('  =============================================');
  console.log('');
  console.log('  Open in browser:  http://localhost:' + PORT);
  console.log('  Mode:  ' + (demoMode ? 'DEMO MODE (no API key needed)' : 'LIVE MODE (OpenAI connected)'));
  console.log('');
  if (demoMode) {
    console.log('  The app works fully in demo mode!');
    console.log('  To enable real AI: add your key in backend/.env');
    console.log('');
  }
});
