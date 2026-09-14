import { mountDocumentEditor } from './editor.js';

const icons = {
  chat: '<path d="M20 11a8 8 0 0 1-8 8H5l-3 2v-9a9 9 0 0 1 18-1Z"/><path d="M7 10h8M7 14h5"/>',
  book: '<path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3Z"/><path d="M12 6v15"/>',
  send: '<path d="m3 3 18 9-18 9 4-9Z"/><path d="M7 12h14"/>'
};
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[el.dataset.icon]}</svg>`;
});
const rooms = [
  { id: 'product', name: 'product-design', desc: 'Turning good ideas into useful products.', people: '6 members', channel: true },
  { id: 'general', name: 'team-lounge', desc: 'Updates, ideas, and everyday conversations.', people: '12 members', channel: true },
  { id: 'launch', name: 'next-launch', desc: 'Getting ready for our next release.', people: '8 members', channel: true },
  { id: 'dev', name: 'Dev', desc: 'Engineering · implementation plans and technical docs', agent: true, color: 'dev', initial: '⌘' },
  { id: 'design', name: 'Design', desc: 'Product design · user flows and requirements', agent: true, color: 'design', initial: '◈' },
  { id: 'research', name: 'Research', desc: 'User research · insights and team knowledge', agent: true, color: 'research', initial: '✳' },
  { id: 'lin', name: 'Summer Lin', desc: 'Product designer', initial: 'SL', color: 'mint' },
  { id: 'chen', name: 'Alex Chen', desc: 'Frontend engineer', initial: 'AC', color: 'peach' }
];
const agents = rooms.filter(r => r.agent);
const base = {
  product: [
    { who: 'lin', text: 'Morning! The interview notes are ready. The biggest pain point: finding old messages takes too long.', time: '10:24', doc: 'interviews' },
    { who: 'chen', text: 'Makes sense. Let’s make search easier to find and add a project filter.', time: '10:26' },
    { who: 'lin', text: 'Agreed. Let’s focus on those two things for v1 and review the designs on Friday.', time: '10:28', reaction: true },
    { who: 'me', text: '@Research What did we learn from the interviews?', time: '10:30' },
    { who: 'research', text: 'Two recurring themes: people miss the search entry point, and results from different projects get mixed together. A more visible search field and project filters address both.', time: '10:30' }
  ],
  general: [
    { who: 'lin', text: 'Our team share is Thursday at 3 PM. This week’s topic: making collaboration simpler.', time: '14:00' },
    { who: 'chen', text: 'I’ll bring a few examples of small frontend interactions that make a difference.', time: '14:03' }
  ],
  launch: [
    { who: 'chen', text: 'The beta is scheduled for next Wednesday. We need launch copy and onboarding screens this week.', time: '09:20' },
    { who: 'lin', text: 'I’ll take the onboarding screens. Let’s review the copy together tomorrow afternoon.', time: '09:25' }
  ],
  dev: [{ who: 'dev', text: 'Hi Weston. I’m Dev, your engineering teammate.\n\nAsk me to turn the product discussion into an implementation plan or find technical requirements.', time: '09:00' }],
  design: [{ who: 'design', text: 'Hi Weston. I’m Design. I help turn team decisions into clear product experiences.\n\nI can outline a user flow or update the search requirements from the product discussion.', time: '09:00' }],
  research: [{ who: 'research', text: 'Hi Weston. I’m Research. I help your team find and make sense of what it knows.\n\nAsk me to find interview notes, summarize a discussion, or pull out user insights.', time: '09:00' }],
  lin: [{ who: 'lin', text: 'Hi Weston! Yesterday’s interview notes are in #product-design whenever you have a moment.', time: '10:25' }],
  chen: [{ who: 'chen', text: 'Send me the search flow whenever it’s ready. Happy to talk through the implementation.', time: '10:35' }]
};
const originalDocs = {
  interviews: { name: 'User interviews · Round 03', author: 'Summer Lin', body: '<h2>Research question</h2><p>How do teammates find past messages and project information?</p><h2>Key findings</h2><ul><li>The search entry point is easy to miss.</li><li>Results from different projects make old discussions hard to find.</li><li>People want to filter results by project.</li></ul>' },
  requirements: { name: 'Search experience · Product requirements', author: 'Summer Lin', body: '<h2>Goal</h2><p>Reduce the time it takes to find past messages.</p><h2>Initial scope</h2><ul><li>Improve visibility of the search entry point.</li><li>Support filtering search results by project.</li></ul>' },
  onboarding: { name: 'Welcome to Workroom', author: 'Summer Lin', body: '<h2>Your first week</h2><ul><li>Introduce yourself in #team-lounge.</li><li>Confirm this week’s goals with your project lead.</li><li>Explore the knowledge base or ask one of your team’s agents.</li></ul>' }
};
let chats = structuredClone(base);
const documentStorageKey = 'workroom.documents.v1';
let storageAvailable = true;
let docs = loadDocuments();
let documentEditor = null;
function loadDocuments() {
  const initial = structuredClone(originalDocs);
  try {
    const saved = JSON.parse(localStorage.getItem(documentStorageKey) || 'null');
    if (saved?.version === 1 && saved.docs && typeof saved.docs === 'object') {
      for (const [key, doc] of Object.entries(saved.docs)) {
        if (/^[a-z0-9-]+$/.test(key) && !['constructor', 'prototype'].includes(key) && doc && typeof doc.name === 'string' && typeof doc.body === 'string') {
          initial[key] = { name: doc.name, body: doc.body, author: typeof doc.author === 'string' ? doc.author : 'Weston Guo', updated: !!doc.updated, updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null };
        }
      }
    }
  } catch { storageAvailable = false; }
  return initial;
}
function persistDocuments() {
  try { localStorage.setItem(documentStorageKey, JSON.stringify({ version: 1, docs })); storageAvailable = true; }
  catch { storageAvailable = false; }
  const status = document.querySelector('#save-status');
  if (status) { status.textContent = storageAvailable ? '✓ Saved in this browser' : 'Not saved · browser storage unavailable'; status.classList.toggle('save-error', !storageAvailable); }
}
function updateDocument(key, changes) {
  docs[key] = { ...docs[key], ...changes, author: 'Weston Guo', updated: true, updatedAt: new Date().toISOString() };
  persistDocuments();
}
function appendAgentDocument(key, nextDoc) {
  if (docs[key]) {
    if (!docs[key].body.includes(nextDoc.body)) docs[key] = { ...docs[key], body: docs[key].body + '<hr>' + nextDoc.body, author: nextDoc.author, updated: true, updatedAt: new Date().toISOString() };
  } else docs[key] = { ...nextDoc, updatedAt: new Date().toISOString() };
}
let active = 'product';
let view = 'chat';
let selectedDoc = null;
const drafts = {};
const $ = s => document.querySelector(s);
const person = id => rooms.find(r => r.id === id);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const avatar = (id, small = false) => {
  const p = person(id);
  return `<span class="avatar ${small ? 'small ' : ''}${p?.agent ? 'agent ' : ''}${id === 'me' ? 'me' : p?.color || ''}">${id === 'me' ? 'W' : p?.initial || 'W'}</span>`;
};
const docCard = key => `<button class="doc-card" data-doc="${key}"><span class="doc-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icons.book}</svg></span><span><strong>${escapeHTML(docs[key].name || 'Untitled')}</strong><small>Team knowledge · ${docs[key].updatedAt ? new Date(docs[key].updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Sep 14'}</small></span></button>`;
function saveDraft() {
  if (view === 'chat' && !selectedDoc) drafts[active] = $('#input').value;
}
function renderNav() {
  const groups = { channels: r => r.channel, agents: r => r.agent, direct: r => !r.channel && !r.agent };
  Object.entries(groups).forEach(([id, filter]) => {
    $('#' + id).innerHTML = rooms.filter(filter).map(r => `<button class="conversation ${r.id === active && view === 'chat' ? 'selected' : ''}" data-room="${r.id}" aria-current="${r.id === active && view === 'chat' ? 'page' : 'false'}">${r.channel ? '<span class="hash">#</span>' : avatar(r.id, true)}<span>${r.name}</span>${r.agent ? '<span class="badge">AI</span>' : ''}</button>`).join('');
  });
  document.querySelectorAll('.rail-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
}
function renderSuggestions() {
  const suggestions = active === 'dev' ? [
    ['Create implementation plan', 'Create an implementation plan for the search improvements', 'dev'],
    ['Find requirements', 'Find the search requirements', 'dev']
  ] : active === 'design' ? [
    ['Update requirements', 'Update the search requirements from the product discussion', 'design'],
    ['Outline user flow', 'Outline the search user flow', 'design']
  ] : active === 'research' ? [
    ['Find interviews', 'Find user interview notes', 'research'],
    ['Summarize discussion', 'Summarize the product discussion', 'research']
  ] : [
    ['Summarize discussion', 'Summarize this channel', 'research'],
    ['Create dev plan', 'Create an implementation plan', 'dev'],
    ['Update requirements', 'Update requirements from this discussion', 'design']
  ];
  $('.suggestions').innerHTML = '<span>Try asking</span>' + suggestions.map(([label, prompt, target]) => `<button data-prompt="${prompt}" data-target="${target}">${!person(active).agent ? `<span class="prompt-agent ${target}">${person(target).name}</span>` : ''}${label}</button>`).join('');
}
function render() {
  documentEditor?.destroy(); documentEditor = null;
  renderNav();
  const r = person(active), kb = view === 'knowledge';
  $('#header').innerHTML = `<div class="header-main">${kb ? '<span class="channel-symbol">▤</span>' : r.channel ? '<span class="channel-symbol">#</span>' : avatar(r.id)}<div><div class="header-title">${kb ? 'Knowledge' : r.name}${r.agent && !kb ? ' <span class="ai-tag">AI AGENT</span>' : ''}</div><div class="header-sub">${kb ? 'A shared home for your team’s knowledge.' : r.channel ? r.people + ' · ' + r.desc : r.desc}</div></div></div>${!kb && r.channel ? '<div class="member-stack">' + avatar('lin', true) + avatar('chen', true) + avatar('me', true) + '<span>' + r.people + '</span></div>' : ''}`;
  $('#tabs').innerHTML = kb ? '' : `<button class="tab ${!selectedDoc ? 'active' : ''}" data-tab="chat">Messages</button><button class="tab ${selectedDoc ? 'active' : ''}" data-tab="docs">Shared docs</button>`;
  $('#tabs').hidden = kb;
  $('#messages').hidden = kb || !!selectedDoc;
  $('#compose-area').hidden = kb || !!selectedDoc;
  $('#knowledge').hidden = !kb && !selectedDoc;
  $('#mention-menu').hidden = true;
  if (kb || selectedDoc) { renderDocs(); return; }
  $('#messages').innerHTML = `${r.channel ? `<div class="channel-intro"><h1># ${r.name}</h1><p>${r.desc}</p></div>` : ''}<div class="date-divider">Today · September 14</div>` + chats[active].map((m, i) => `<article class="message" data-author="${m.who}">${avatar(m.who)}<div class="message-content"><div class="message-meta"><strong>${m.who === 'me' ? 'Weston Guo' : person(m.who)?.name}</strong>${person(m.who)?.agent ? '<span class="ai-tag">AI</span>' : ''}<time>${m.time}</time></div><div class="message-text">${escapeHTML(m.text).replace(/@(Dev|Design|Research)\b/gi, '<span class="mention-text">@$1</span>')}</div>${m.doc ? docCard(m.doc) : ''}${m.reaction ? `<button class="reaction ${m.liked ? 'on' : ''}" data-reaction="${i}" aria-label="Agree" aria-pressed="${!!m.liked}">👍 ${m.liked ? 3 : 2}</button>` : ''}</div></article>`).join('');
  $('#input').placeholder = r.agent ? `Message ${r.name}…` : `Message ${r.channel ? '#' : ''}${r.name}. Type @ to mention an agent.`;
  $('#input').value = drafts[active] || '';
  $('#send').disabled = !$('#input').value.trim();
  renderSuggestions();
}
function renderDocs() {
  documentEditor?.destroy(); documentEditor = null;
  const editing = selectedDoc && selectedDoc !== 'list' && docs[selectedDoc];
  $('#knowledge').classList.toggle('editor-view', !!editing);
  if (editing) {
    const key = selectedDoc, doc = docs[key];
    $('#knowledge').innerHTML = `<div class="document-topbar"><button class="doc-breadcrumb" data-back>‹ <span>Team documents</span></button><span class="breadcrumb-separator">/</span><span class="breadcrumb-title">${escapeHTML(doc.name || 'Untitled')}</span><span id="save-status" role="status">${storageAvailable ? '✓ Saved in this browser' : 'Browser storage unavailable'}</span></div>
      <div class="document-toolbar" id="editor-toolbar" role="toolbar" aria-label="Document formatting">
        <select id="block-type" aria-label="Text style"><option value="paragraph">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select><span class="toolbar-divider"></span>
        <button data-format="bold" aria-label="Bold" title="Bold (⌘/Ctrl+B)"><b>B</b></button><button data-format="italic" aria-label="Italic" title="Italic (⌘/Ctrl+I)"><i>I</i></button><button data-format="underline" aria-label="Underline" title="Underline (⌘/Ctrl+U)"><u>U</u></button><button data-format="strike" aria-label="Strikethrough" title="Strikethrough"><s>S</s></button><span class="toolbar-divider"></span>
        <button data-format="bulletList" aria-label="Bullet list" title="Bullet list">≡<small>•</small></button><button data-format="orderedList" aria-label="Numbered list" title="Numbered list">≡<small>1</small></button><button data-format="blockquote" aria-label="Quote" title="Quote">❝</button><button data-format="codeBlock" aria-label="Code block" title="Code block">&lt;/&gt;</button><span class="toolbar-divider"></span>
        <button data-history="undo" aria-label="Undo" title="Undo (⌘/Ctrl+Z)">↶</button><button data-history="redo" aria-label="Redo" title="Redo (⌘/Ctrl+Shift+Z)">↷</button>
      </div>
      <article class="document-page"><div class="document-page-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icons.book}</svg></div><textarea id="document-title" aria-label="Document title" placeholder="Untitled" rows="1" spellcheck="true">${escapeHTML(doc.name)}</textarea><div class="document-properties"><span class="property-label">Edited by</span><span id="document-author-avatar">${avatar(rooms.find(r => r.name === doc.author)?.id || 'me', true)}</span><span id="document-author">${escapeHTML(doc.author)}</span><span class="property-dot">·</span><span id="document-date">${doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Sep 14'}</span></div><div class="document-rule"></div><div id="document-body"></div><div class="document-bottom"><span>Type <kbd>/</kbd> for blocks</span><span id="word-count"></span></div></article><div id="slash-menu" class="slash-menu" role="listbox" aria-label="Insert a block" hidden></div>`;
    documentEditor = mountDocumentEditor({ element: $('#document-body'), content: doc.body, onChange(body) { updateDocument(key, { body }); $('#document-author').textContent = 'Weston Guo'; $('#document-author-avatar').innerHTML = avatar('me', true); $('#document-date').textContent = 'Just now'; } });
    const title = $('#document-title');
    const resizeTitle = () => { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; };
    resizeTitle();
    title.addEventListener('input', () => { resizeTitle(); updateDocument(key, { name: title.value.replace(/\n/g, ' ') }); $('.breadcrumb-title').textContent = title.value || 'Untitled'; $('#document-author').textContent = 'Weston Guo'; $('#document-author-avatar').innerHTML = avatar('me', true); $('#document-date').textContent = 'Just now'; });
    title.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); documentEditor.focus(); } });
  } else {
    $('#knowledge').innerHTML = `<div class="documents-list"><div class="documents-heading"><div><div class="eyebrow">WORKSPACE</div><h1>Team documents</h1><p>A place for ideas, context, and work in progress.</p></div><button class="new-document" data-new-document>+ New document</button></div><div class="documents-table-heading"><span>Name</span><span>Edited by</span></div>${Object.keys(docs).map(key => `<div class="document-row">${docCard(key)}<span class="document-row-author">${escapeHTML(docs[key].author)}</span></div>`).join('')}<p class="documents-local-note">Edits are saved automatically in this browser.</p></div>`;
  }
}
function switchRoom(id) {
  if (!person(id)) throw Error('Unknown conversation');
  saveDraft(); active = id; view = 'chat'; selectedDoc = null; render();
}
function summarize(scope) {
  if (scope === 'general') return 'Here’s the discussion summary:\n1. Team share: Thursday at 3 PM, on making collaboration simpler.\n2. Alex will share examples of frontend interactions.';
  if (scope === 'launch') return 'Here’s the discussion summary:\n1. The beta is scheduled for next Wednesday.\n2. Launch copy and onboarding screens are needed this week.\n3. Summer owns onboarding; copy review is tomorrow afternoon.';
  return 'Here’s the product discussion summary:\n1. Finding old messages takes too long.\n2. V1 will focus on a more visible search entry point and project filters.\n3. The team will review designs on Friday.';
}
function replyFor(agent, text, scope) {
  const prompt = text.replace(/@(Dev|Design|Research)\b/gi, '').trim();
  if (/summari[sz]e|summary|recap/i.test(prompt)) return { text: summarize(scope) };
  if (agent.id === 'dev' && /plan|implement|build|code|develop|task/i.test(prompt)) {
    const launch = scope === 'launch';
    const key = launch ? 'launch-plan' : 'dev-plan';
    const tasks = launch ? ['Implement the onboarding screens with Summer’s designs.', 'Add a feature flag for the beta release.', 'Check the onboarding flow before next Wednesday.'] : ['Add a persistent search entry point to the channel header.', 'Add a project filter and apply it to the search query.', 'Handle empty results and verify keyboard navigation.'];
    appendAgentDocument(key, { name: launch ? 'Beta launch · Implementation plan' : 'Search improvements · Implementation plan', author: 'Dev', updated: true, body: '<h2>Implementation tasks</h2><ul>' + tasks.map(t => '<li>' + t + '</li>').join('') + '</ul><h2>Acceptance criteria</h2><p>' + (launch ? 'A teammate can complete onboarding and enter the beta workspace.' : 'A teammate can open search, choose a project, and find matching messages using the keyboard.') + '</p>' });
    return { text: 'I created an implementation plan in the knowledge base.\n\n' + tasks.map((t, i) => (i + 1) + '. ' + t).join('\n'), doc: key };
  }
  if (agent.id === 'design' && /update|requirements|revise/i.test(prompt)) {
    if (scope === 'launch') {
      appendAgentDocument('launch-design', { name: 'Beta onboarding · Design brief', author: 'Design', updated: true, body: '<h2>Scope</h2><p>Prepare onboarding screens for next Wednesday’s beta.</p><h2>Owner and review</h2><p>Summer owns the screens. Review launch copy together tomorrow afternoon.</p>' });
      return { text: 'I created an onboarding design brief from this channel’s decisions. It covers the beta timeline, Summer’s ownership, and tomorrow’s copy review.', doc: 'launch-design' };
    }
    appendAgentDocument('requirements', { name: docs.requirements.name, author: 'Design', updated: true, body: '<h2>Team decisions</h2><p>V1 focuses on the search entry point and project filters. Review the interaction design on Friday.</p><h2>User flow</h2><p>Open search → enter a query → filter by project → open the original message.</p>' });
    return { text: 'I updated the search requirements with the team’s decisions: a visible search entry point, project filtering, and a Friday design review.', doc: 'requirements' };
  }
  if (agent.id === 'design' && /flow|screen|experience|design/i.test(prompt)) return { text: 'Here’s a simple search flow:\n\nOpen search → enter a query → filter by project → open the original message.\n\nKeep the query visible when changing filters, and show a clear empty state when nothing matches.' };
  if (/requirements|technical/i.test(prompt)) return { text: 'Here are the search requirements. V1 focuses on a visible search entry point and filtering results by project.', doc: 'requirements' };
  if (/find|interview|research|insight|learn|knowledge|notes/i.test(prompt)) return { text: 'The interview notes point to two main problems: search is easy to miss, and results from different projects get mixed together. People want a clearer entry point and a project filter.', doc: 'interviews' };
  return { text: agent.id === 'dev' ? 'In this prototype, I can create an implementation plan or find the search requirements. Try “Create an implementation plan”.' : agent.id === 'design' ? 'In this prototype, I can update the search requirements or outline a user flow. Try “Update requirements”.' : 'In this prototype, I can find interview notes or summarize a channel. Try “Find user interview notes”.' };
}
function send(text) {
  text = text.trim(); if (!text) return;
  const room = active;
  chats[room].push({ who: 'me', text, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) });
  drafts[room] = '';
  const mentioned = agents.filter(a => new RegExp('@' + a.name + '\\b', 'i').test(text));
  const recipients = mentioned.length ? mentioned : person(room).agent ? [person(room)] : [];
  recipients.forEach(agent => {
    const scope = person(room).channel ? room : 'product';
    chats[room].push({ who: agent.id, ...replyFor(agent, text, scope), time: 'Just now' });
  });
  persistDocuments();
  render(); $('#messages').scrollTop = $('#messages').scrollHeight; $('#input').focus();
  return { conversation: room, messages: chats[room].length, respondingAgents: recipients.map(a => a.id) };
}
function showMentions(query = '') {
  const matches = agents.filter(a => a.name.toLowerCase().startsWith(query.toLowerCase()));
  $('#mention-menu').innerHTML = matches.map(a => `<button type="button" class="pick-agent" data-mention="${a.id}">${avatar(a.id, true)}<span><strong>${a.name}</strong><small>${a.desc.split(' · ')[0]}</small></span><span class="badge">AI</span></button>`).join('');
  $('#mention-menu').hidden = !matches.length;
}
function setInput(value) {
  $('#input').value = value; drafts[active] = value; $('#send').disabled = !value.trim(); $('#input').focus();
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-new-document]')) {
    const key = 'doc-' + crypto.randomUUID();
    docs[key] = { name: '', body: '<p></p>', author: 'Weston Guo', updated: true, updatedAt: new Date().toISOString() };
    persistDocuments(); selectedDoc = key; renderDocs(); $('#document-title').focus();
  }
  const room = e.target.closest('[data-room]'); if (room) switchRoom(room.dataset.room);
  const v = e.target.closest('[data-view]'); if (v) { saveDraft(); view = v.dataset.view; selectedDoc = null; render(); }
  const p = e.target.closest('[data-prompt]');
  if (p) setInput((person(active).agent ? '' : '@' + person(p.dataset.target).name + ' ') + p.dataset.prompt);
  const doc = e.target.closest('[data-doc]'); if (doc) { saveDraft(); selectedDoc = doc.dataset.doc; render(); }
  const tab = e.target.closest('[data-tab]'); if (tab) { saveDraft(); selectedDoc = tab.dataset.tab === 'docs' ? 'list' : null; render(); }
  if (e.target.closest('[data-back]')) { selectedDoc = 'list'; renderDocs(); }
  const reaction = e.target.closest('[data-reaction]'); if (reaction) { saveDraft(); const m = chats[active][Number(reaction.dataset.reaction)]; m.liked = !m.liked; render(); }
  const mention = e.target.closest('[data-mention]');
  if (mention) { setInput($('#input').value.replace(/@[a-z]*$/i, '') + '@' + person(mention.dataset.mention).name + ' '); $('#mention-menu').hidden = true; }
  if (!e.target.closest('#composer')) $('#mention-menu').hidden = true;
});
$('#composer').addEventListener('submit', e => { e.preventDefault(); send($('#input').value); });
$('#input').addEventListener('input', () => {
  drafts[active] = $('#input').value; $('#send').disabled = !$('#input').value.trim();
  const match = $('#input').value.match(/@([a-z]*)$/i);
  if (match) showMentions(match[1]); else $('#mention-menu').hidden = true;
});
$('#input').addEventListener('keydown', e => {
  if (e.key === 'Escape') $('#mention-menu').hidden = true;
  if (e.key === 'ArrowDown' && !$('#mention-menu').hidden) { e.preventDefault(); $('#mention-menu button')?.focus(); }
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    const match = $('#input').value.match(/@([a-z]*)$/i);
    if (!$('#mention-menu').hidden && match && !agents.some(a => a.name.toLowerCase() === match[1].toLowerCase())) $('#mention-menu button')?.click();
    else send($('#input').value);
  }
});
$('#mention').onclick = () => { if ($('#mention-menu').hidden) showMentions(); else $('#mention-menu').hidden = true; };
$('#reset').onclick = () => {
  chats = structuredClone(base);
  Object.keys(drafts).forEach(k => delete drafts[k]); active = 'product'; view = 'chat'; selectedDoc = null; render();
};
render();
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'send_demo_message',
      description: 'Send a message to a prototype conversation. Mention @Dev, @Design, or @Research in channels, or message an agent directly. Uses simulated responses and sample documents.',
      inputSchema: { type: 'object', properties: { conversation: { type: 'string', enum: rooms.map(r => r.id) }, message: { type: 'string', minLength: 1 } }, required: ['conversation', 'message'], additionalProperties: false },
      annotations: { readOnlyHint: false },
      execute(input) {
        if (!input || typeof input.message !== 'string' || !input.message.trim() || !person(input.conversation)) throw Error('Valid conversation and nonempty message required');
        switchRoom(input.conversation); return send(input.message);
      }
    })).catch(() => {});
  } catch {}
}
