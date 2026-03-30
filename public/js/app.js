const API_BASE = window.location.origin;

// ─── DOM references ──────────────────────────────────────────
const resumeInput = document.getElementById('resume');
const jobInput = document.getElementById('job');
const resumeCounter = document.getElementById('resume-counter');
const jobCounter = document.getElementById('job-counter');
const analyzeBtn = document.getElementById('analyze-btn');
const alertBox = document.getElementById('alert');
const resultsSection = document.getElementById('results');
const apiWarning = document.getElementById('api-warning');

// ─── Character counters ───────────────────────────────────────
function updateCounter(textarea, counter) {
  const len = textarea.value.length;
  counter.textContent = `${len} characters`;
  counter.classList.toggle('warn', len > 4000);
}

resumeInput.addEventListener('input', () => updateCounter(resumeInput, resumeCounter));
jobInput.addEventListener('input', () => updateCounter(jobInput, jobCounter));

// ─── Check API key on load ────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    if (data.demoMode) {
      apiWarning.classList.add('show');
    }
  } catch {
    // server might not be running — ignore silently
  }
}
checkHealth();

// ─── Show / hide alert ────────────────────────────────────────
function showAlert(msg, type = 'error') {
  alertBox.className = `alert show alert-${type}`;
  alertBox.querySelector('.alert-msg').textContent = msg;
  alertBox.querySelector('.alert-icon').textContent = type === 'error' ? '⚠️' : '✅';
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  alertBox.classList.remove('show');
}

// ─── Animate score circle ─────────────────────────────────────
function animateScore(score) {
  const circumference = 2 * Math.PI * 52;
  const progress = document.querySelector('.score-circle .progress');
  const scoreNum = document.querySelector('.score-number');

  // Color based on score
  let color = '#EF4444'; // red
  if (score >= 70) color = '#22C55E';
  else if (score >= 40) color = '#F59E0B';

  progress.style.stroke = color;
  progress.style.strokeDasharray = circumference;

  // Animate to 0 first then to target
  progress.style.strokeDashoffset = circumference;
  scoreNum.style.color = color;

  setTimeout(() => {
    const offset = circumference - (score / 100) * circumference;
    progress.style.strokeDashoffset = offset;
  }, 100);

  // Count up number
  let current = 0;
  const step = score / 60;
  const interval = setInterval(() => {
    current = Math.min(current + step, score);
    scoreNum.textContent = Math.round(current);
    if (current >= score) clearInterval(interval);
  }, 16);
}

// ─── Render tags ──────────────────────────────────────────────
function renderTags(containerId, items, tagClass) {
  const el = document.getElementById(containerId);
  if (!items || items.length === 0) {
    el.innerHTML = '<span class="empty-tags">None found</span>';
    return;
  }
  el.innerHTML = items.map(i => `<span class="tag ${tagClass}">${i}</span>`).join('');
}

// ─── Render improvements ──────────────────────────────────────
function renderImprovements(improvements) {
  const el = document.getElementById('improvements-list');
  if (!improvements || improvements.length === 0) {
    el.innerHTML = '<p style="color:var(--gray-400);font-size:13px">No specific suggestions.</p>';
    return;
  }
  el.innerHTML = improvements.map((imp, i) => `
    <div class="improvement-item">
      <div class="improvement-num">${i + 1}</div>
      <div class="improvement-body">
        <strong>${imp.title || 'Suggestion'}</strong>
        <p>${imp.detail || imp}</p>
      </div>
    </div>
  `).join('');
}

// ─── Render strengths ─────────────────────────────────────────
function renderStrengths(strengths) {
  const el = document.getElementById('strengths-list');
  if (!strengths || strengths.length === 0) {
    el.innerHTML = '<span class="empty-tags">None found</span>';
    return;
  }
  el.innerHTML = `<div class="strengths-list">${strengths.map(s => `
    <div class="strength-item">${s}</div>
  `).join('')}</div>`;
}

// ─── Render results ───────────────────────────────────────────
function renderResults(result) {
  const score = result.matchScore || 0;

  // Score label + colors
  document.querySelector('.score-label').textContent = result.scoreLabel || 'Analysis Complete';
  document.querySelector('.score-label').style.color =
    score >= 70 ? 'var(--green-700)' : score >= 40 ? 'var(--amber-700)' : 'var(--red-700)';

  document.querySelector('.score-summary').textContent = result.summary || '';

  // Meta chips
  document.getElementById('matched-count').textContent = (result.matchedSkills || []).length + ' matched';
  document.getElementById('missing-count').textContent = (result.missingSkills || []).length + ' missing';
  document.getElementById('weak-count').textContent = (result.weakAreas || []).length + ' weak areas';

  // Animate score
  animateScore(score);

  // Tags
  renderTags('matched-skills', result.matchedSkills, 'tag-green');
  renderTags('missing-skills', result.missingSkills, 'tag-red');
  renderTags('weak-areas', result.weakAreas, 'tag-amber');
  renderTags('ats-keywords', result.atsKeywords, 'tag-blue');

  // Improvements & Strengths
  renderImprovements(result.improvements);
  renderStrengths(result.strengthHighlights);

  // Show results
  resultsSection.classList.add('show');
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ─── Main analyze function ────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  hideAlert();

  const resume = resumeInput.value.trim();
  const job = jobInput.value.trim();

  if (resume.length < 50) {
    showAlert('Please paste your resume text (at least 50 characters).');
    resumeInput.focus();
    return;
  }
  if (job.length < 50) {
    showAlert('Please paste the job description (at least 50 characters).');
    jobInput.focus();
    return;
  }

  // Loading state
  analyzeBtn.disabled = true;
  analyzeBtn.classList.add('loading');
  analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';
  resultsSection.classList.remove('show');

  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDescription: job })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      showAlert(data.error || 'Something went wrong. Please try again.');
      return;
    }

    renderResults(data.result);

  } catch (err) {
    showAlert('Cannot connect to the server. Make sure you have started the backend (run: npm start in the backend folder).');
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove('loading');
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyze My Resume';
  }
});
