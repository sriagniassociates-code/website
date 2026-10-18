/* ============================================================
   SRI AGNI ASSOCIATES — admin.js
   Dashboard logic: auth guard, data rendering, CSV export,
   modal, toast, settings, real-time clock
   ============================================================ */

(function () {
  'use strict';

  /* ── Auth Guard ── */
  if (sessionStorage.getItem('sriagni_admin') !== 'true') {
    window.location.href = 'admin-login.html';
    return;
  }

  /* ── State ── */
  const STORAGE_KEYS = {
    enquiries:  'sriagni_enquiries',
    newsletter: 'sriagni_newsletter',
    password:   'sriagni_admin_pass'
  };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS[key]) || '[]'); }
    catch { return []; }
  }
  function save(key, data) {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();          // ← restore saved theme first
    populateAdminInfo();
    startClock();
    setWelcomeDate();
    updateBadges();
    renderDashboard();
    renderEnquiries();
    renderNewsletter();
    populateSettings();
  });

  /* ── Theme Toggle ── */
  function applyTheme() {
    const saved = localStorage.getItem('sriagni_admin_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = saved === 'light' ? '☀️' : '🌙';
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sriagni_admin_theme', next);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = next === 'light' ? '☀️' : '🌙';
    showToast(next === 'light' ? '☀️ Light theme' : '🌙 Dark theme', 'success');
  };

  /* ── Real-time sync: auto-refresh when index.html saves new data ── */
  window.addEventListener('storage', (e) => {
    if (e.key === 'sriagni_enquiries' || e.key === 'sriagni_newsletter') {
      updateBadges();
      renderDashboard();
      renderEnquiries();
      renderNewsletter();
      populateSettings();
      showToast('New enquiry received! 🔔', 'success');
    }
  });

  /* ── Manual refresh (for same-tab or same-window use) ── */
  window.refreshAllData = function () {
    updateBadges();
    renderDashboard();
    renderEnquiries();
    renderNewsletter();
    populateSettings();
    showToast('Data refreshed ✓', 'success');
    const btn = document.getElementById('topbar-refresh-btn');
    if (btn) {
      btn.style.opacity = '0.5';
      setTimeout(() => { btn.style.opacity = '1'; }, 600);
    }
  };

  /* ── Admin info ── */
  function populateAdminInfo() {
    const user = sessionStorage.getItem('sriagni_admin_user') || 'admin';
    const nameEl = document.getElementById('admin-name-chip');
    const welcomeEl = document.getElementById('welcome-name');
    if (nameEl) nameEl.textContent = user;
    if (welcomeEl) welcomeEl.textContent = user.charAt(0).toUpperCase() + user.slice(1);
  }

  /* ── Clock ── */
  function startClock() {
    const el = document.getElementById('topbar-time');
    if (!el) return;
    function tick() {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ── Welcome date ── */
  function setWelcomeDate() {
    const el = document.getElementById('welcome-date');
    if (!el) return;
    const now = new Date();
    el.innerHTML = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ── Badges ── */
  function updateBadges() {
    const enquiries  = load('enquiries');
    const newsletter = load('newsletter');
    const enqB = document.getElementById('enq-badge');
    const nlB  = document.getElementById('nl-badge');
    if (enqB) { enqB.textContent = enquiries.length; enqB.classList.toggle('zero', enquiries.length === 0); }
    if (nlB)  { nlB.textContent  = newsletter.length; nlB.classList.toggle('zero', newsletter.length === 0); }
  }

  /* ── Dashboard ── */
  function renderDashboard() {
    const enquiries  = load('enquiries');
    const newsletter = load('newsletter');
    const today      = new Date().toDateString();
    const todayCount = enquiries.filter(e => new Date(e.date).toDateString() === today).length;

    setText('dc-enq-count',   enquiries.length);
    setText('dc-nl-count',    newsletter.length);
    setText('dc-today-count', todayCount);

    // Recent 5 enquiries mini-table
    const wrap = document.getElementById('recent-table-wrap');
    if (!wrap) return;
    if (enquiries.length === 0) {
      wrap.innerHTML = emptyState('No enquiries yet. Submit the contact form to see data here.');
      return;
    }
    const recent = [...enquiries].reverse().slice(0, 5);
    wrap.innerHTML = buildTable(
      ['Name', 'Phone', 'Project', 'Date'],
      recent.map(e => [
        `<strong>${esc(e.name)}</strong>`,
        esc(e.phone),
        projTag(e.interest),
        fmtDate(e.date)
      ])
    );
  }

  /* ── Enquiries Tab ── */
  window.renderEnquiries = function () {
    const wrap    = document.getElementById('enquiries-table-wrap');
    const search  = (document.getElementById('enq-search')?.value  || '').toLowerCase();
    const filter  = (document.getElementById('enq-filter')?.value  || '');
    if (!wrap) return;

    let data = load('enquiries').reverse();

    if (search) {
      data = data.filter(e =>
        (e.name   || '').toLowerCase().includes(search) ||
        (e.email  || '').toLowerCase().includes(search) ||
        (e.phone  || '').toLowerCase().includes(search) ||
        (e.message|| '').toLowerCase().includes(search)
      );
    }
    if (filter) {
      data = data.filter(e => e.interest === filter);
    }

    if (data.length === 0) {
      wrap.innerHTML = emptyState('No matching enquiries found.');
      return;
    }

    const rows = data.map((e, i) => [
      `<strong>${esc(e.name)}</strong>`,
      `<a href="tel:${esc(e.phone)}" style="color:var(--gold);text-decoration:none">${esc(e.phone)}</a>`,
      esc(e.email) || '<span style="color:var(--muted)">—</span>',
      projTag(e.interest),
      `<span class="mono">${fmtDate(e.date)}</span>`,
      `<button class="action-btn" title="View Details" onclick="openModal(${e.id})">
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
       </button>
       <button class="action-btn del" title="Delete" onclick="deleteEntry('enquiries',${e.id})">
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
       </button>`
    ]);

    wrap.innerHTML = buildTable(
      ['Name', 'Phone', 'Email', 'Project', 'Date', 'Actions'],
      rows
    );
  };

  /* ── Newsletter Tab ── */
  window.renderNewsletter = function () {
    const wrap   = document.getElementById('newsletter-table-wrap');
    const search = (document.getElementById('nl-search')?.value || '').toLowerCase();
    if (!wrap) return;

    let data = load('newsletter').reverse();
    if (search) data = data.filter(e => (e.email || '').toLowerCase().includes(search));

    if (data.length === 0) {
      wrap.innerHTML = emptyState('No newsletter subscribers yet.');
      return;
    }

    const rows = data.map(e => [
      esc(e.email),
      `<span class="mono">${fmtDate(e.date)}</span>`,
      `<button class="action-btn del" title="Delete" onclick="deleteEntry('newsletter',${e.id})">
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
       </button>`
    ]);

    wrap.innerHTML = buildTable(['Email', 'Subscribed On', 'Actions'], rows);
  };

  /* ── Modal ── */
  window.openModal = function (id) {
    const entry = load('enquiries').find(e => e.id === id);
    if (!entry) return;
    const body = document.getElementById('modal-body');
    const overlay = document.getElementById('modal-overlay');
    body.innerHTML = `
      <div class="modal-row"><span class="ml">Name</span>     <span class="mv">${esc(entry.name)}</span></div>
      <div class="modal-row"><span class="ml">Phone</span>    <span class="mv"><a href="tel:${esc(entry.phone)}" style="color:var(--gold)">${esc(entry.phone)}</a></span></div>
      <div class="modal-row"><span class="ml">Email</span>    <span class="mv">${esc(entry.email) || '—'}</span></div>
      <div class="modal-row"><span class="ml">Project</span>  <span class="mv">${projTag(entry.interest)}</span></div>
      <div class="modal-row"><span class="ml">Date</span>     <span class="mv">${fmtDate(entry.date)}</span></div>
      <div class="modal-row"><span class="ml">Message</span>  <span class="mv" style="white-space:pre-wrap">${esc(entry.message) || '—'}</span></div>
      <div style="display:flex;gap:8px;margin-top:1.2rem">
        <a href="tel:${esc(entry.phone)}" class="btn-gold-sm" style="text-decoration:none">📞 Call</a>
        <a href="https://wa.me/91${entry.phone.replace(/\D/g,'')}" target="_blank" class="btn-ghost" style="text-decoration:none">💬 WhatsApp</a>
      </div>
    `;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function (e) {
    if (e.target === document.getElementById('modal-overlay')) closeModalBtn();
  };
  window.closeModalBtn = function () {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeModalBtn(); });

  /* ── Delete entry ── */
  window.deleteEntry = function (type, id) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    let data = load(type).filter(e => e.id !== id);
    save(type, data);
    showToast('Entry deleted.', 'success');
    updateBadges();
    renderDashboard();
    if (type === 'enquiries') renderEnquiries();
    else renderNewsletter();
    populateSettings();
  };

  /* ── Clear All ── */
  window.clearData = function (type) {
    if (!confirm(`Clear ALL ${type} data? This cannot be undone.`)) return;
    save(type, []);
    showToast(`All ${type} cleared.`, 'success');
    updateBadges();
    renderDashboard();
    if (type === 'enquiries') renderEnquiries();
    else renderNewsletter();
    populateSettings();
  };

  /* ── CSV Export ── */
  window.exportCSV = function (type) {
    const data = load(type);
    if (data.length === 0) { showToast('No data to export.', 'error'); return; }

    let csv = '';
    if (type === 'enquiries') {
      csv = 'Name,Phone,Email,Project,Date,Message\n';
      csv += data.map(e =>
        [e.name, e.phone, e.email, e.interest, fmtDate(e.date), (e.message || '').replace(/\n/g,' ')]
          .map(v => `"${(v||'').replace(/"/g,'""')}"`)
          .join(',')
      ).join('\n');
    } else {
      csv = 'Email,Subscribed On\n';
      csv += data.map(e =>
        [e.email, fmtDate(e.date)]
          .map(v => `"${(v||'').replace(/"/g,'""')}"`)
          .join(',')
      ).join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `sri-agni-${type}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`${type} exported as CSV!`, 'success');
  };

  /* ── Tab switching ── */
  window.switchTab = function (tab, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.add('active');
    if (btn) btn.classList.add('active');
    const titles = { dashboard:'Dashboard', enquiries:'Enquiries', newsletter:'Newsletter', settings:'Settings' };
    setText('page-title', titles[tab] || tab);
    // Re-render on switch
    if (tab === 'enquiries') renderEnquiries();
    if (tab === 'newsletter') renderNewsletter();
    if (tab === 'settings') populateSettings();
    if (window.innerWidth < 768) toggleSidebar();
  };

  /* ── Sidebar toggle ── */
  window.toggleSidebar = function () {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  };

  /* ── Settings ── */
  function populateSettings() {
    const enq = load('enquiries').length;
    const nl  = load('newsletter').length;
    const user = sessionStorage.getItem('sriagni_admin_user') || 'admin';
    const loginTime = sessionStorage.getItem('sriagni_login_time');
    setText('s-user-name',  user);
    setText('s-enq-total',  enq);
    setText('s-nl-total',   nl);
    if (loginTime) {
      const d = new Date(loginTime);
      const el = document.getElementById('s-login-time');
      if (el) el.textContent = d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    }
  }

  window.changePassword = function (e) {
    e.preventDefault();
    const curr   = document.getElementById('s-current-pass').value;
    const newP   = document.getElementById('s-new-pass').value;
    const conf   = document.getElementById('s-confirm-pass').value;
    const msgEl  = document.getElementById('s-msg');
    const stored = localStorage.getItem(STORAGE_KEYS.password) || 'sriagni@2025';

    function showMsg(text, type) {
      msgEl.textContent = text;
      msgEl.className = 's-msg ' + type;
      msgEl.style.display = 'block';
      setTimeout(() => { msgEl.style.display = 'none'; }, 3500);
    }

    if (curr !== stored) { showMsg('Current password is incorrect.', 'err'); return; }
    if (newP.length < 8) { showMsg('New password must be at least 8 characters.', 'err'); return; }
    if (newP !== conf)   { showMsg('Passwords do not match.', 'err'); return; }

    localStorage.setItem(STORAGE_KEYS.password, newP);
    showMsg('Password updated successfully!', 'ok');
    e.target.reset();
    showToast('Password changed.', 'success');
  };

  /* ── Logout ── */
  window.logout = function () {
    sessionStorage.removeItem('sriagni_admin');
    sessionStorage.removeItem('sriagni_admin_user');
    sessionStorage.removeItem('sriagni_login_time');
    window.location.href = 'admin-login.html';
  };

  /* ── Toast ── */
  let toastTimer;
  window.showToast = function (msg, type = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  };

  /* ── Helpers ── */
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      + ' ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  }

  function projTag(val) {
    const labels = { aerocity1:'Aerocity I', aerocity2:'Aerocity II', railcity:'Railcity', other:'General' };
    const cls    = val || 'other';
    return `<span class="proj-tag ${esc(cls)}">${esc(labels[cls] || cls)}</span>`;
  }

  function buildTable(headers, rows) {
    const ths = headers.map(h => `<th>${h}</th>`).join('');
    const trs = rows.map(cols =>
      '<tr>' + cols.map(c => `<td>${c}</td>`).join('') + '</tr>'
    ).join('');
    return `<table class="data-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  }

  function emptyState(msg) {
    return `<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7"/><path d="M4 13h16l-3 7H7l-3-7z"/></svg>
      <p>${msg}</p>
    </div>`;
  }

})();
