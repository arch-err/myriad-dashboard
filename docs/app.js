// Myriad Dashboard - Frontend Application

let data = null;

async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to load data');
    data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatNumber(num) {
  return num.toLocaleString();
}

function getRankClass(rank) {
  if (rank <= 10) return 'rank-top10';
  if (rank <= 50) return 'rank-top50';
  return 'rank-other';
}

function getTeamIdFromName(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// Dashboard Page
function renderDashboard() {
  const teamsGrid = document.getElementById('teams-grid');
  const recentResults = document.getElementById('recent-results');

  if (!teamsGrid) return; // Not on dashboard page

  const teams = Object.values(data.teams);
  teams.sort((a, b) => a.bestRank - b.bestRank);

  // Update stats
  document.getElementById('total-teams').textContent = teams.length;
  document.getElementById('total-ctfs').textContent = data.ctfs.length;
  const totalPoints = teams.reduce((sum, t) => sum + t.totalPoints, 0);
  document.getElementById('total-points').textContent = formatNumber(totalPoints);

  // Render team cards
  teamsGrid.innerHTML = teams.map(team => {
    const recentResult = team.results[0];
    return `
      <a href="team.html?team=${encodeURIComponent(team.id)}" class="team-card">
        <h3>${team.name}</h3>
        <div class="team-stats">
          <div class="team-stat">
            <span class="team-stat-value">${team.ctfCount}</span>
            <span class="team-stat-label">CTFs</span>
          </div>
          <div class="team-stat">
            <span class="team-stat-value">#${team.bestRank}</span>
            <span class="team-stat-label">Best</span>
          </div>
          <div class="team-stat">
            <span class="team-stat-value">${formatNumber(team.totalPoints)}</span>
            <span class="team-stat-label">Points</span>
          </div>
        </div>
        ${recentResult ? `
          <div class="recent-result">
            Latest: <strong>${recentResult.ctfName}</strong> - #${recentResult.rank}
          </div>
        ` : ''}
      </a>
    `;
  }).join('');

  // Render recent results (last 5 CTFs)
  const recentCtfs = data.ctfs.slice(0, 5);
  recentResults.innerHTML = recentCtfs.map(ctf => {
    const teamResults = ctf.results
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3);

    return `
      <div class="result-item">
        <div class="result-ctf">
          <div class="result-ctf-name">
            ${ctf.url ? `<a href="${ctf.url}" target="_blank">${ctf.name}</a>` : ctf.name}
          </div>
          <div class="result-ctf-date">${formatDate(ctf.date)}</div>
        </div>
        <div class="result-teams">
          ${teamResults.map(r => `
            <div class="result-team">
              <div class="result-team-name">${r.team}</div>
              <div class="result-team-rank">#${r.rank}</div>
              <div class="result-team-points">${formatNumber(r.points)} pts</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Update last updated
  document.getElementById('last-updated').textContent = formatDate(data.lastUpdated);
}

// Team Detail Page
function renderTeamDetail() {
  const teamName = document.getElementById('team-name');
  if (!teamName) return; // Not on team page

  const params = new URLSearchParams(window.location.search);
  const teamId = params.get('team');

  if (!teamId) {
    document.querySelector('main').innerHTML = '<div class="error">No team specified</div>';
    return;
  }

  // Find team by ID
  const team = Object.values(data.teams).find(t => t.id === teamId);

  if (!team) {
    document.querySelector('main').innerHTML = '<div class="error">Team not found</div>';
    return;
  }

  // Update page title
  document.title = `${team.name} - Myriad Dashboard`;

  // Update header
  teamName.textContent = team.name;
  const membersEl = document.getElementById('team-members');
  if (team.members && team.members.length > 0) {
    membersEl.textContent = `Members: ${team.members.join(', ')}`;
  } else {
    membersEl.textContent = '';
  }

  // Update stats
  document.getElementById('stat-ctfs').textContent = team.ctfCount;
  document.getElementById('stat-best-rank').textContent = `#${team.bestRank}`;
  document.getElementById('stat-avg-rank').textContent = `#${team.avgRank}`;
  document.getElementById('stat-total-points').textContent = formatNumber(team.totalPoints);

  // Render history table
  const historyBody = document.getElementById('history-body');
  historyBody.innerHTML = team.results.map(result => `
    <tr>
      <td>
        ${result.url ? `<a href="${result.url}" target="_blank">${result.ctfName}</a>` : result.ctfName}
      </td>
      <td>${formatDate(result.date)}</td>
      <td>
        <span class="rank-badge ${getRankClass(result.rank)}">#${result.rank}</span>
      </td>
      <td>${formatNumber(result.points)}</td>
    </tr>
  `).join('');

  // Update last updated
  document.getElementById('last-updated').textContent = formatDate(data.lastUpdated);
}

// Initialize
async function init() {
  try {
    await loadData();

    // Determine which page we're on and render accordingly
    if (document.getElementById('teams-grid')) {
      renderDashboard();
    } else if (document.getElementById('team-name')) {
      renderTeamDetail();
    }
  } catch (error) {
    const main = document.querySelector('main');
    main.innerHTML = `<div class="error">Failed to load data: ${error.message}</div>`;
  }
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
