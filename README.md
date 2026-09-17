# Workroom

A minimal, Feishu-inspired enterprise messenger prototype for an HCI project.

## Demo

- English interface with channels, direct messages, and a shared knowledge base.
- People and agents share one coworker list and one mention picker by default. The comparison panel also offers an experimental split-list variant.
- Three specialist coworkers: **Dev**, **Design**, and **Research**.
- Mention one or more agents in a channel, or send an agent a direct message.
- Dev creates implementation plans; Design updates requirements and outlines user flows; Research finds interview notes and summarizes discussions.
- Generated sample documents appear in the knowledge base.
- Edit document titles and rich text directly, with headings, lists, quotes, code blocks, undo/redo, and a `/` block menu.
- Create documents from the knowledge base. Edits save automatically in the current browser and survive a reload.
- Reset demo restores the original conversations and preserves edited documents.

All agent responses are simulated locally. No model API, external knowledge base, or real enterprise data is connected. Messages live in browser memory and reset on reload. Documents are stored in localStorage on the current browser; they are not synced across devices or users. Execution progress and permission controls are outside the current prototype scope.

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

## Assignment 2 interaction study

Open **Compare interactions** above the workspace. Seven variants are available across three dimensions:

- Organization: one coworker list (default) or experimental People / Agents grouping. The mention picker stays shared.
- Initiation: manual mentions/direct requests or proactive responses to supported discussion topics, with no pre-execution confirmation.
- Review: a proposed addition requiring acceptance (with revision and discard), a subtle source highlight that dismisses on hover/focus/tap, or no special cue. Highlight dismissal never means content approval.

Use **Prepare example**, send the prepared request, and open the resulting document. A new example document preserves prior edits. Modes apply to new additions; existing review states persist. URL parameters `organization`, `trigger`, and `review` share the comparison settings, not local document content. Reset demo resets chats and keeps documents.

[Study notes](https://workroom-hci.vercel.app/study.html) include the original Assignment 1 problem statement, seven annotated screenshots and three-step flows, design rationale, possible consequences, references, and an AI use statement. The notes are a draft: verify the W3D2 need statement and class concept selection before submission.
