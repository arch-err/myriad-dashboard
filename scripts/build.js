#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const CTFS_DIR = path.join(ROOT, 'ctfs');
const TEAMS_FILE = path.join(ROOT, 'teams', 'teams.yaml');
const SRC_DIR = path.join(ROOT, 'src');
const DOCS_DIR = path.join(ROOT, 'docs');

function loadCtfs() {
  const ctfs = [];
  const files = fs.readdirSync(CTFS_DIR).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(CTFS_DIR, file), 'utf8');
    const data = yaml.load(content);
    ctfs.push({
      slug: file.replace('.yaml', ''),
      ...data
    });
  }

  // Sort by date descending
  ctfs.sort((a, b) => new Date(b.date) - new Date(a.date));
  return ctfs;
}

function loadTeams() {
  if (!fs.existsSync(TEAMS_FILE)) {
    return {};
  }
  const content = fs.readFileSync(TEAMS_FILE, 'utf8');
  const data = yaml.load(content);

  // Convert to lookup by name
  const lookup = {};
  for (const team of data.teams || []) {
    lookup[team.name] = team;
  }
  return lookup;
}

function buildTeamStats(ctfs, teamsMetadata) {
  const teams = {};

  for (const ctf of ctfs) {
    for (const result of ctf.results || []) {
      const teamName = result.team;
      if (!teams[teamName]) {
        const meta = teamsMetadata[teamName] || {};
        teams[teamName] = {
          id: meta.id || teamName.toLowerCase().replace(/\s+/g, '-'),
          name: teamName,
          members: meta.members || [],
          results: [],
          totalPoints: 0,
          bestRank: Infinity,
          ctfCount: 0
        };
      }

      teams[teamName].results.push({
        ctfSlug: ctf.slug,
        ctfName: ctf.name,
        date: ctf.date,
        url: ctf.url,
        rank: result.rank,
        points: result.points
      });

      teams[teamName].totalPoints += result.points;
      teams[teamName].ctfCount++;
      if (result.rank < teams[teamName].bestRank) {
        teams[teamName].bestRank = result.rank;
      }
    }
  }

  // Sort each team's results by date descending
  for (const team of Object.values(teams)) {
    team.results.sort((a, b) => new Date(b.date) - new Date(a.date));
    team.avgRank = team.results.reduce((sum, r) => sum + r.rank, 0) / team.results.length;
    team.avgRank = Math.round(team.avgRank * 10) / 10;
  }

  return teams;
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function build() {
  console.log('Building myriad-dashboard...');

  // Load data
  const ctfs = loadCtfs();
  console.log(`Loaded ${ctfs.length} CTFs`);

  const teamsMetadata = loadTeams();
  console.log(`Loaded ${Object.keys(teamsMetadata).length} team definitions`);

  const teams = buildTeamStats(ctfs, teamsMetadata);
  console.log(`Found ${Object.keys(teams).length} teams with results`);

  // Build output data
  const data = {
    ctfs,
    teams,
    lastUpdated: new Date().toISOString()
  };

  // Ensure docs dir exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // Copy src to docs
  copyDir(SRC_DIR, DOCS_DIR);
  console.log('Copied src/ to docs/');

  // Write data.json
  const dataPath = path.join(DOCS_DIR, 'data.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Generated data.json');

  console.log('Build complete!');
}

build();
