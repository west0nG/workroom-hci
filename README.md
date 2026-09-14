# Workroom

A minimal, Feishu-inspired enterprise messenger prototype for an HCI project.

## Demo

- English interface with channels, direct messages, and a shared knowledge base.
- Three specialist agents: **Dev**, **Design**, and **Research**.
- Mention one or more agents in a channel, or send an agent a direct message.
- Dev creates implementation plans; Design updates requirements and outlines user flows; Research finds interview notes and summarizes discussions.
- Generated sample documents appear in the knowledge base.
- Reset demo restores the original messages and documents.

All agent responses are simulated locally. No model API, external knowledge base, or real enterprise data is connected. Messages and document updates live in browser memory and reset on reload. Execution progress, result-review workflows, and permission controls are outside the current prototype scope.

## Run locally

Requires Python 3. No package installation or build step is needed.

```sh
python3 -m http.server 5173 --directory dist
```

Open http://localhost:5173.

## Files

- `dist/index.html` — app shell
- `dist/style.css` — responsive interface styles
- `dist/app.js` — conversations, agent routing, and simulated knowledge base
- `vercel.json` — static hosting configuration

## Deploy

Vercel serves the `dist` directory as a static site. The project is connected to this repository for deployment on push.
