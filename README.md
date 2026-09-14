# Workroom

A minimal, Feishu-inspired enterprise messenger prototype for an HCI project.

## Demo

- English interface with channels, direct messages, and a shared knowledge base.
- Three specialist agents: **Dev**, **Design**, and **Research**.
- Mention one or more agents in a channel, or send an agent a direct message.
- Dev creates implementation plans; Design updates requirements and outlines user flows; Research finds interview notes and summarizes discussions.
- Generated sample documents appear in the knowledge base.
- Edit document titles and rich text directly, with headings, lists, quotes, code blocks, undo/redo, and a `/` block menu.
- Create documents from the knowledge base. Edits save automatically in the current browser and survive a reload.
- Reset demo restores the original conversations and preserves edited documents.

All agent responses are simulated locally. No model API, external knowledge base, or real enterprise data is connected. Messages live in browser memory and reset on reload. Documents are stored in localStorage on the current browser; they are not synced across devices or users. Execution progress, result-review workflows, and permission controls are outside the current prototype scope.

## Run locally

Requires Node.js, npm, and Python 3.

Canonical local checkout: `/Users/weston/dev/aacad325`.

```sh
npm ci
npm run dev
```

Open http://localhost:5173.

## Files

- `dist/index.html` — app shell
- `dist/style.css` — responsive interface styles
- `dist/app.js` — conversations, agent routing, document persistence, and document views
- `src/editor.js` — Tiptap rich-text editor and formatting controls
- `dist/editor.js` — generated editor bundle (`npm run build`)
- `vercel.json` — static hosting configuration

## Deploy

Vercel runs `npm run build` and serves the `dist` directory as a static site. The project is connected to this repository for deployment on push.
