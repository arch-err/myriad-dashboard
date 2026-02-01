# Myriad Dashboard

Git-powered CTF scoreboard tracking team performance across multiple CTFs, hosted on GitHub Pages.

## Overview

- **Data**: YAML files, one per CTF event
- **Input**: PRs to add scores, or Issues for admin to log
- **Build**: GitHub Action compiles YAML → JSON → static site
- **Frontend**: Plain HTML/CSS/JS, team-centric view

## Adding Scores

### Option 1: Pull Request (Recommended)

1. Create or edit a YAML file in `ctfs/` directory
2. Follow the schema below
3. Submit a PR

**CTF File Schema** (`ctfs/<ctf-slug>.yaml`):

```yaml
name: picoCTF 2024
date: 2024-03-15
url: https://picoctf.org    # optional
results:
  - team: Myriad Alpha
    rank: 15
    points: 4500
  - team: Myriad Beta
    rank: 42
    points: 3200
```

### Option 2: Issue Request

Use the [Score Request](../../issues/new?template=score-request.yaml) issue template to request an admin add a score.

## Local Development

### Build the dashboard locally:

```bash
npm install js-yaml
node scripts/build.js
```

### Preview:

Open `docs/index.html` in your browser.

## Repository Structure

```
myriad-dashboard/
├── ctfs/                    # Score data (one YAML per CTF)
├── teams/                   # Team metadata
│   └── teams.yaml
├── src/                     # Frontend source
│   ├── index.html
│   ├── team.html
│   ├── style.css
│   └── app.js
├── scripts/
│   └── build.js             # Build script
├── docs/                    # Built output (GitHub Pages)
└── .github/
    ├── workflows/
    │   └── build.yaml
    └── ISSUE_TEMPLATE/
        └── score-request.yaml
```

## Teams

Team definitions are in `teams/teams.yaml`. To add a new team, edit that file:

```yaml
teams:
  - id: alpha
    name: Myriad Alpha
    members:
      - alice
      - bob
```

## Deployment

The dashboard automatically deploys to GitHub Pages on push to `main`. The workflow:

1. Compiles all `ctfs/*.yaml` into `data.json`
2. Copies `src/` to `docs/`
3. Commits changes
4. Deploys `docs/` to GitHub Pages

## License

MIT
