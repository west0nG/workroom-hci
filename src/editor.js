import { Editor } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export function mountDocumentEditor({ element, content, onChange, sourceHighlight = null }) {
  let sourceSeen = false;
  const toolbar = document.querySelector('#editor-toolbar');
  const blockSelect = document.querySelector('#block-type');
  const menu = document.querySelector('#slash-menu');
  const count = document.querySelector('#word-count');
  const controller = new AbortController();
  const listener = { signal: controller.signal };
  let slashRange = null;
  let options = [];
  let selected = 0;
  let dismissed = null;
  const blocks = [
    { id: 'paragraph', name: 'Text', hint: 'Start writing with plain text', icon: 'T' },
    { id: 'h1', name: 'Heading 1', hint: 'A large section heading', icon: 'H₁' },
    { id: 'h2', name: 'Heading 2', hint: 'A medium section heading', icon: 'H₂' },
    { id: 'bulletList', name: 'Bullet list', hint: 'A simple list of ideas', icon: '•' },
    { id: 'orderedList', name: 'Numbered list', hint: 'Keep your steps in order', icon: '1.' },
    { id: 'blockquote', name: 'Quote', hint: 'Highlight a useful thought', icon: '❝' },
    { id: 'codeBlock', name: 'Code block', hint: 'Write a code snippet', icon: '</>' },
    { id: 'horizontalRule', name: 'Divider', hint: 'Separate sections', icon: '—' }
  ];
  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
      Placeholder.configure({ placeholder: 'Write something, or type / for blocks…' })
    ],
    content,
    editorProps: {
      decorations(state) {
        if (!sourceHighlight) return DecorationSet.empty;
        const marks = [];
        state.doc.forEach((node, position, index) => {
          if (index >= sourceHighlight.start) marks.push(Decoration.node(position, position + node.nodeSize, {
            class: sourceSeen ? '' : 'source-highlight', tabindex: sourceSeen ? '-1' : '0',
            title: `Added by ${sourceHighlight.author} (Agent). Hover, focus, or tap to dismiss. This does not approve the content.`
          }));
        });
        return DecorationSet.create(state.doc, marks);
      },
      handleDOMEvents: {
        pointerover: acknowledgeSource,
        focusin: acknowledgeSource,
        click: acknowledgeSource
      },
      attributes: { class: 'document-content', role: 'textbox', 'aria-label': 'Document body', 'aria-multiline': 'true', spellcheck: 'true' },
      handleKeyDown(_view, event) {
        if (menu.hidden) return false;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
          paintMenu(); return true;
        }
        if (event.key === 'Enter') { event.preventDefault(); applyBlock(options[selected].id, true); return true; }
        if (event.key === 'Escape') { dismissed = editor.state.selection.from; hideMenu(); return true; }
        return false;
      }
    },
    onUpdate({ editor }) { onChange(editor.getHTML()); refresh(); },
    onSelectionUpdate() { refresh(); }
  });
  function acknowledgeSource(view, event) {
    if (sourceHighlight && !sourceSeen && event.target.closest('.source-highlight')) {
      sourceSeen = true; sourceHighlight.onSeen(); view.dispatch(view.state.tr);
    }
    return false;
  }
  function hideMenu() { menu.hidden = true; slashRange = null; }
  function paintMenu() {
    menu.innerHTML = '<div class="slash-label">INSERT A BLOCK</div>' + options.map((b, i) => `<button type="button" data-block="${b.id}" class="slash-option ${i === selected ? 'selected' : ''}" role="option" aria-selected="${i === selected}"><span class="block-symbol">${b.icon === '</>' ? '&lt;/&gt;' : b.icon}</span><span><strong>${b.name}</strong><small>${b.hint}</small></span></button>`).join('');
  }
  function updateSlash() {
    const { $from, empty, from } = editor.state.selection;
    if (!empty || $from.parent.type.name !== 'paragraph') { hideMenu(); return; }
    const before = $from.parent.textBetween(0, $from.parentOffset, '', '');
    const match = before.match(/^\/([a-z0-9 ]*)$/i);
    if (!match || dismissed === from) { hideMenu(); return; }
    dismissed = null;
    options = blocks.filter(b => b.name.toLowerCase().includes(match[1].toLowerCase()));
    if (!options.length) { hideMenu(); return; }
    slashRange = { from: from - before.length, to: from };
    selected = Math.min(selected, options.length - 1);
    paintMenu(); menu.hidden = false;
    const coords = editor.view.coordsAtPos(from);
    const width = Math.min(280, window.innerWidth - 32);
    menu.style.width = width + 'px';
    menu.style.left = Math.max(16, Math.min(coords.left, window.innerWidth - width - 16)) + 'px';
    const height = Math.min(menu.scrollHeight, 310);
    menu.style.top = Math.max(8, Math.min(coords.bottom + 8, window.innerHeight - height - 12)) + 'px';
  }
  function applyBlock(type, removeSlash = false) {
    let chain = editor.chain().focus();
    if (removeSlash && slashRange) chain = chain.deleteRange(slashRange);
    hideMenu();
    if (type === 'paragraph') chain.setParagraph().run();
    else if (/^h[123]$/.test(type)) chain.setHeading({ level: Number(type[1]) }).run();
    else if (type === 'bulletList') chain.toggleBulletList().run();
    else if (type === 'orderedList') chain.toggleOrderedList().run();
    else if (type === 'blockquote') chain.toggleBlockquote().run();
    else if (type === 'codeBlock') chain.toggleCodeBlock().run();
    else if (type === 'horizontalRule') chain.setHorizontalRule().run();
    refresh();
  }
  function refresh() {
    const text = editor.getText().trim();
    const words = text ? text.split(/\s+/).length : 0;
    count.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    blockSelect.value = [1, 2, 3].find(level => editor.isActive('heading', { level })) ? 'h' + [1, 2, 3].find(level => editor.isActive('heading', { level })) : 'paragraph';
    toolbar.querySelectorAll('[data-format]').forEach(button => {
      const type = button.dataset.format;
      button.setAttribute('aria-pressed', String(editor.isActive(type)));
    });
    toolbar.querySelector('[data-history="undo"]').disabled = !editor.can().undo();
    toolbar.querySelector('[data-history="redo"]').disabled = !editor.can().redo();
    updateSlash();
  }
  toolbar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); }, listener);
  toolbar.addEventListener('click', e => {
    const format = e.target.closest('[data-format]');
    if (format) {
      const type = format.dataset.format;
      if (['bulletList', 'orderedList', 'blockquote', 'codeBlock'].includes(type)) applyBlock(type);
      else editor.chain().focus().toggleMark(type).run();
    }
    const history = e.target.closest('[data-history]');
    if (history) editor.chain().focus()[history.dataset.history]().run();
    refresh();
  }, listener);
  blockSelect.addEventListener('change', () => applyBlock(blockSelect.value), listener);
  menu.addEventListener('mousedown', e => e.preventDefault(), listener);
  menu.addEventListener('click', e => { const option = e.target.closest('[data-block]'); if (option) applyBlock(option.dataset.block, true); }, listener);
  document.addEventListener('pointerdown', e => { if (!element.contains(e.target) && !menu.contains(e.target)) hideMenu(); }, listener);
  document.querySelector('#knowledge').addEventListener('scroll', hideMenu, listener);
  window.addEventListener('resize', hideMenu, listener);
  refresh();
  return {
    focus: () => editor.commands.focus('start'),
    destroy() { controller.abort(); editor.destroy(); menu.hidden = true; }
  };
}
