export const FILES_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Files</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(156,163,175,.5); border-radius: 9px; }
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen font-sans">
  <div class="flex flex-col h-screen">
    <header class="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-2">
        <button id="btnBack" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" title="Назад">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button id="btnHome" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" title="В начало">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 00-1-1h-2z"/></svg>
        </button>
        <span id="breadcrumb" class="text-sm font-medium text-slate-600 dark:text-slate-300 ml-2">/</span>
      </div>
      <div class="flex items-center gap-2">
        <button id="btnMkdir" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" title="Новая папка">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </button>
        <button id="btnUpload" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" title="Загрузить файл">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
        </button>
        <button id="btnDownload" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30" title="Скачать выбранное" disabled>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        </button>
        <button id="btnDelete" class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500 disabled:opacity-30" title="Удалить выбранное" disabled>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-y-auto p-4">
      <div id="fileList" class="space-y-1"></div>
      <div id="emptyState" class="hidden text-center py-20 text-slate-400">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>
        <p class="text-sm">Папка пуста</p>
      </div>
    </main>
  </div>

  <!-- Upload input -->
  <input type="file" id="fileInput" class="hidden" multiple />

  <!-- Mkdir modal -->
  <div id="mkdirModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <h3 class="font-semibold mb-4">Новая папка</h3>
      <input id="mkdirName" type="text" placeholder="Имя папки" class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 mb-4" />
      <div class="flex gap-2 justify-end">
        <button id="mkdirCancel" class="px-4 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Отмена</button>
        <button id="mkdirConfirm" class="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Создать</button>
      </div>
    </div>
  </div>

  <!-- Preview modal -->
  <div id="previewModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h3 id="previewTitle" class="font-semibold truncate flex-1"></h3>
        <button id="previewDownload" class="ml-3 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Скачать
        </button>
        <button id="previewClose" class="p-1.5 ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <pre id="previewBody" class="text-xs font-mono bg-slate-50 dark:bg-slate-800 p-4 rounded-xl overflow-auto flex-1 whitespace-pre-wrap"></pre>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="fixed bottom-4 right-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-sm shadow-xl hidden transition-all duration-200 z-50"></div>

  <script>
    let currentPath = '/';
    let entries = [];
    let selected = new Set();
    const $ = id => document.getElementById(id);

    async function load() {
      try {
        const res = await fetch(\`/files/api/list?path=\${encodeURIComponent(currentPath)}\`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        entries = data.entries;
        selected.clear();
        render();
        updateBreadcrumb();
        updateToolbar();
      } catch (e) {
        toast('Ошибка загрузки');
      }
    }

    function render() {
      const list = $('fileList');
      list.innerHTML = '';
      $('emptyState').classList.toggle('hidden', entries.length > 0);

      for (const e of entries) {
        const isSelected = selected.has(e.name);
        const row = document.createElement('div');
        row.className = \`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors \${
          isSelected
            ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
        }\`;
        row.innerHTML = \`
          <input type="checkbox" \${isSelected ? 'checked' : ''} class="w-4 h-4 rounded accent-indigo-600" data-name="\${e.name}" />
          <span class="flex-shrink-0">\${e.isDir ? folderIcon() : fileIcon(e.name)}</span>
          <span class="text-sm font-medium truncate flex-1" data-name="\${e.name}" data-isdir="\${e.isDir}">\${esc(e.name)}</span>
          <span class="text-xs text-slate-400 w-16 text-right">\${e.isDir ? '—' : fmtSize(e.size)}</span>
          <span class="text-xs text-slate-400 w-32 text-right hidden sm:block">\${fmtDate(e.modified)}</span>
        \`;

        row.querySelector('[type=checkbox]').onchange = function(ev) {
          ev.stopPropagation();
          if (this.checked) selected.add(e.name); else selected.delete(e.name);
          row.classList.toggle('bg-indigo-50', this.checked);
          row.classList.toggle('dark:bg-indigo-950/40', this.checked);
          updateToolbar();
        };

        row.querySelector('[data-name]:not([type=checkbox])').onclick = () => {
          if (e.isDir) { currentPath = join(currentPath, e.name); load(); }
          else preview(e.name);
        };

        row.oncontextmenu = (ev) => { ev.preventDefault(); if (e.isDir) return; downloadSingle(e.name); };
        list.appendChild(row);
      }
    }

    function updateToolbar() {
      const has = selected.size > 0;
      $('btnDownload').disabled = !has;
      $('btnDelete').disabled = !has;
    }

    function updateBreadcrumb() {
      $('breadcrumb').textContent = currentPath;
    }

    function downloadSingle(name) {
      const url = '/files/api/download?path=' + encodeURIComponent(join(currentPath, name));
      triggerDownloadInParent(url, name);
    }

    function triggerDownloadInParent(href, filename) {
      const doc = window.top.document;
      const a = doc.createElement('a');
      a.href = href;
      a.download = filename;
      doc.body.appendChild(a);
      a.click();
      a.remove();
    }

    async function downloadSelected() {
      // Single file → direct download link
      if (selected.size === 1) {
        const name = [...selected][0];
        const entry = entries.find(e => e.name === name);
        if (entry && !entry.isDir) {
          const url = '/files/api/download?path=' + encodeURIComponent(join(currentPath, name));
          triggerDownloadInParent(url, name);
          return;
        }
      }
      // Multiple files or directories → archive then download
      toast('Создаю архив...');
      const paths = [...selected].map(n => join(currentPath, n));
      const res = await fetch('/files/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths, name: 'archive' })
      });
      if (!res.ok) { toast('Ошибка архивирования: ' + res.status); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      triggerDownloadInParent(url, 'archive.tar.gz');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }

    async function uploadFiles(files) {
      for (const file of files) {
        const target = join(currentPath, file.name);
        const res = await fetch(\`/files/api/upload?path=\${encodeURIComponent(target)}\`, {
          method: 'PUT', body: file
        });
        if (!res.ok) { toast(\`Ошибка загрузки: \${file.name}\`); return; }
      }
      toast('Загружено');
      load();
    }

    async function mkdir(name) {
      const res = await fetch('/files/api/mkdir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: join(currentPath, name) })
      });
      if (res.ok) { toast('Папка создана'); load(); }
      else toast('Ошибка');
    }

    async function deleteSelected() {
      const paths = [...selected].map(n => join(currentPath, n));
      const res = await fetch('/files/api/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths })
      });
      if (res.ok) { toast('Удалено'); load(); }
      else toast('Ошибка удаления');
    }

    async function preview(name) {
      try {
        const ext = name.split('.').pop().toLowerCase();
        const isImage = ['png','jpg','jpeg','gif','webp','svg','bmp','ico'].includes(ext);
        const downloadUrl = \`/files/api/download?path=\${encodeURIComponent(join(currentPath, name))}\`;
        $('previewDownload').onclick = () => {
          const a = window.top.document.createElement('a');
          a.href = downloadUrl;
          a.download = name;
          window.top.document.body.appendChild(a);
          a.click();
          a.remove();
        };
        if (isImage) {
          $('previewTitle').textContent = name;
          const body = $('previewBody');
          body.style.display = 'none';
          let img = document.getElementById('previewImg');
          if (!img) {
            img = document.createElement('div');
            img.id = 'previewImg';
            body.parentNode.insertBefore(img, body);
          }
          img.innerHTML = \`<img src="\${downloadUrl}" alt="\${esc(name)}" class="max-w-full max-h-[60vh] object-contain rounded-lg mx-auto" />\`;
          img.style.display = 'block';
          $('previewModal').classList.remove('hidden');
          return;
        }
        const res = await fetch(\`/files/api/preview?path=\${encodeURIComponent(join(currentPath, name))}\`);
        if (!res.ok) { toast('Не удалось открыть'); return; }
        const data = await res.json();
        $('previewTitle').textContent = name;
        const img = document.getElementById('previewImg');
        if (img) { img.style.display = 'none'; }
        $('previewBody').style.display = 'block';
        $('previewBody').textContent = data.content;
        $('previewModal').classList.remove('hidden');
      } catch { toast('Ошибка'); }
    }

    function join(base, name) {
      return base.endsWith('/') ? base + name : base + '/' + name;
    }
    function parent(p) {
      if (p === '/') return p;
      const parts = p.replace(/\\/$/, '').split('/');
      parts.pop();
      return parts.join('/') || '/';
    }
    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function fmtSize(b) {
      if (b < 1024) return b + ' B';
      if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
      if (b < 1024*1024*1024) return (b/1024/1024).toFixed(1) + ' MB';
      return (b/1024/1024/1024).toFixed(1) + ' GB';
    }
    function fmtDate(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleString('ru', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    }
    function folderIcon() {
      return '<svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>';
    }
    function fileIcon(name) {
      const ext = name.split('.').pop().toLowerCase();
      const colors = { md:'text-blue-400', txt:'text-slate-400', json:'text-yellow-400', js:'text-yellow-500', ts:'text-blue-500', png:'text-green-400', jpg:'text-green-400' };
      const c = colors[ext] || 'text-slate-400';
      return \`<svg class="w-5 h-5 \${c}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>\`;
    }
    function toast(msg) {
      const el = $('toast');
      el.textContent = msg;
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 2500);
    }

    $('btnBack').onclick = () => { currentPath = parent(currentPath); load(); };
    $('btnHome').onclick = () => { currentPath = '/'; load(); };
    $('btnDownload').onclick = downloadSelected;
    $('btnDelete').onclick = deleteSelected;
    $('btnMkdir').onclick = () => { $('mkdirModal').classList.remove('hidden'); $('mkdirName').focus(); };
    $('mkdirCancel').onclick = () => $('mkdirModal').classList.add('hidden');
    $('mkdirConfirm').onclick = () => { const v = $('mkdirName').value.trim(); if (v) { mkdir(v); $('mkdirModal').classList.add('hidden'); $('mkdirName').value = ''; } };
    $('mkdirName').onkeydown = e => { if (e.key === 'Enter') $('mkdirConfirm').click(); };
    $('btnUpload').onclick = () => $('fileInput').click();
    $('fileInput').onchange = function() { if (this.files?.length) uploadFiles(this.files); this.value = ''; };
    $('previewClose').onclick = () => $('previewModal').classList.add('hidden');

    load();
  </script>
</body>
</html>
`;
