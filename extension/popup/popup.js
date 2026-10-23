/* popup/popup.js — CalmScroll popup controller */
'use strict';

var DURATIONS = [
  { label: '15 min', ms: 15 * 60 * 1000 },
  { label: '25 min', ms: 25 * 60 * 1000 },
  { label: '45 min', ms: 45 * 60 * 1000 },
  { label: '60 min', ms: 60 * 60 * 1000 },
  { label: '90 min', ms: 90 * 60 * 1000 },
  { label: '2 hrs',  ms: 120 * 60 * 1000 }
];

var WARDEN_DURATIONS = [
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { label: '4 hours', ms: 4 * 60 * 60 * 1000 }
];

var SITE_PRESETS = [
  { label: '+ Social Media', sites: ['reddit.com', 'instagram.com', 'x.com', 'tiktok.com', 'facebook.com'] },
  { label: '+ Video/Streams', sites: ['youtube.com/shorts', 'twitch.tv', 'netflix.com'] },
  { label: '+ News/Gossip', sites: ['buzzfeed.com', 'dailymail.co.uk', 'tmz.com'] }
];

var S = {
  activeTab:       'focus',
  session:         null,
  wardenActive:    false,
  wardenInterrupt: false,
  selectedDur:     DURATIONS[1].ms, // 25 min default
  selectedWDur:    WARDEN_DURATIONS[0].ms,
  mode:            'normal',
  isPomodoro:      false,
  sites:           [],
  shieldSettings:  { ragebait: true, insensitive: true, controversial: true, selectedTopics: ['politics', 'violence', 'celebrity'] },
  shieldEnabled:   true,
  stats:           { totalFocusMinutes: 0, sessionsCompleted: 0, distractionsDeflected: 0, postsShielded: 0, streakDays: 1, todayMinutes: 0 },
  ambientPlaying:  false,
  ambientVolume:   0.25,
  demoTiming:      false,
  ending:          false,
  endCount:        0,
  goalText:        '',
  isPremium:       false
};

var _tickInterval = null;
var _endInterval = null;

/* ─── Helpers ─── */
function q(id) { return document.getElementById(id); }
function el(tag, cls) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function fmt(ms) {
  if (ms <= 0) return '0:00';
  var tot = Math.floor(ms / 1000);
  var h = Math.floor(tot / 3600);
  var m = Math.floor((tot % 3600) / 60);
  var s = tot % 60;
  var mm = String(m).padStart(2, '0');
  var ss = String(s).padStart(2, '0');
  return h > 0 ? h + ':' + mm + ':' + ss : m + ':' + ss;
}
function msg(payload) {
  return new Promise(function(resolve) {
    chrome.runtime.sendMessage(payload, resolve);
  });
}

/* ─── Data Loading ─── */
async function load() {
  try {
    var sessResp = await msg({ type: 'GET_SESSION' });
    if (sessResp && sessResp.type === 'GET_SESSION_RESPONSE') {
      S.session         = sessResp.session || null;
      S.wardenActive    = sessResp.wardenActive || false;
      S.wardenInterrupt = sessResp.wardenInterrupted || false;
    }

    var sitesResp = await msg({ type: 'GET_SITES' });
    if (sitesResp && sitesResp.sites) {
      S.sites = sitesResp.sites;
    }

    var statsResp = await msg({ type: 'GET_STATS' });
    if (statsResp && statsResp.stats) {
      S.stats = statsResp.stats;
    }

    var stored = await chrome.storage.local.get(['calmscroll_settings', 'calmscroll_shield_enabled', 'cs_premium_active', 'cs_premium_expiry']);
    if (stored.calmscroll_settings) {
      S.shieldSettings = Object.assign(S.shieldSettings, stored.calmscroll_settings);
    }
    if (stored.calmscroll_shield_enabled !== undefined) {
      S.shieldEnabled = stored.calmscroll_shield_enabled;
    }

    var now = Date.now();
    S.isPremium = Boolean(stored.cs_premium_active && stored.cs_premium_expiry && stored.cs_premium_expiry > now);
  } catch (err) {
    console.warn('[CalmScroll] Error loading initial state:', err);
  }

  render();
}

/* ─── Render View ─── */
function render() {
  if (_tickInterval) { clearInterval(_tickInterval); _tickInterval = null; }
  var app = q('app');
  if (!app) return;
  app.innerHTML = '';

  renderHeader(app);
  renderTabBar(app);

  var content = el('div', 'tab-content');

  // Tab 1: Focus
  var focusPane = el('div', 'tab-pane' + (S.activeTab === 'focus' ? ' active' : ''));
  if (S.session) {
    renderActiveSession(focusPane);
  } else {
    renderFocusSetup(focusPane);
  }
  content.appendChild(focusPane);

  // Tab 2: Sites
  var sitesPane = el('div', 'tab-pane' + (S.activeTab === 'sites' ? ' active' : ''));
  renderSitesTab(sitesPane);
  content.appendChild(sitesPane);

  // Tab 3: Shield
  var shieldPane = el('div', 'tab-pane' + (S.activeTab === 'shield' ? ' active' : ''));
  renderShieldTab(shieldPane);
  content.appendChild(shieldPane);

  // Tab 4: Ambient Audio
  var ambientPane = el('div', 'tab-pane' + (S.activeTab === 'ambient' ? ' active' : ''));
  renderAmbientTab(ambientPane);
  content.appendChild(ambientPane);

  // Tab 5: Stats
  var statsPane = el('div', 'tab-pane' + (S.activeTab === 'stats' ? ' active' : ''));
  renderStatsTab(statsPane);
  content.appendChild(statsPane);

  app.appendChild(content);

  // Error Banner
  var err = el('div', 'err-msg');
  err.id = 'errMsg';
  app.appendChild(err);

  // Demo Footer
  renderDemoFooter(app);
}

/* ─── Header ─── */
function renderHeader(app) {
  var hdr = el('div', 'cs-header');
  var logo = el('span', 'cs-logo');
  logo.innerHTML = '🌿 CalmScroll';
  hdr.appendChild(logo);

  var badges = el('div', 'cs-badges');
  if (S.isPremium) {
    var prb = el('span', 'badge-status');
    prb.style.background = '#F3E8FF';
    prb.style.color = '#7C3AED';
    prb.style.borderColor = '#D8B4FE';
    prb.style.fontWeight = '700';
    prb.innerHTML = '👑 Pro';
    badges.appendChild(prb);
  }
  if (S.session) {
    if (S.wardenActive) {
      var wb = el('span', 'badge-status badge-warden');
      wb.innerHTML = '🔒 Warden';
      badges.appendChild(wb);
    } else if (S.session.isPomodoro) {
      var pb = el('span', 'badge-status badge-pomodoro');
      pb.textContent = S.session.pomodoroStage === 'break' ? '☕ Break' : '🍅 Focus ' + (S.session.pomodoroCycle || 1);
      badges.appendChild(pb);
    } else {
      var nb = el('span', 'badge-status');
      nb.textContent = 'Focusing';
      badges.appendChild(nb);
    }
  } else {
    var ib = el('span', 'badge-status');
    ib.textContent = 'Ready';
    badges.appendChild(ib);
  }
  hdr.appendChild(badges);
  app.appendChild(hdr);
}

/* ─── Tabs ─── */
function renderTabBar(app) {
  var bar = el('div', 'tab-bar');
  var tabs = [
    { id: 'focus',   icon: '🎯', label: 'Focus' },
    { id: 'sites',   icon: '🌐', label: 'Sites' },
    { id: 'shield',  icon: '🛡️', label: 'Shield' },
    { id: 'ambient', icon: '🎧', label: 'Sound' },
    { id: 'stats',   icon: '📊', label: 'Stats' }
  ];

  tabs.forEach(function(t) {
    var btn = el('button', 'tab-btn' + (S.activeTab === t.id ? ' active' : ''));
    btn.innerHTML = '<span>' + t.icon + '</span><span>' + t.label + '</span>';
    btn.addEventListener('click', function() {
      // Save current goal input text before switching
      var gIn = q('gIn');
      if (gIn) S.goalText = gIn.value;

      S.activeTab = t.id;
      render();
    });
    bar.appendChild(btn);
  });
  app.appendChild(bar);
}

/* ─── TAB 1: FOCUS SETUP ─── */
function renderFocusSetup(pane) {
  // Goal
  var gSec = el('div', 'sec');
  var gl = el('label', 'lbl');
  gl.textContent = 'Focus Goal';
  gl.setAttribute('for', 'gIn');
  gSec.appendChild(gl);

  var gIn = el('input', 'text-in');
  gIn.id = 'gIn';
  gIn.type = 'text';
  gIn.placeholder = 'e.g. Finish reading research paper';
  gIn.maxLength = 120;
  gIn.value = S.goalText;
  gIn.addEventListener('input', function() { S.goalText = gIn.value; });
  gSec.appendChild(gIn);
  pane.appendChild(gSec);

  // Duration
  var dSec = el('div', 'sec');
  var dl = el('span', 'lbl');
  dl.textContent = 'Duration';
  dSec.appendChild(dl);

  var dg = el('div', 'btn-grp');
  DURATIONS.forEach(function(d) {
    var b = el('button', 'pill' + (d.ms === S.selectedDur ? ' sel' : ''));
    b.textContent = d.label;
    b.addEventListener('click', function() {
      S.selectedDur = d.ms;
      dg.querySelectorAll('.pill').forEach(function(x) { x.classList.remove('sel'); });
      b.classList.add('sel');
    });
    dg.appendChild(b);
  });
  dSec.appendChild(dg);
  pane.appendChild(dSec);

  // Mode (Normal vs Warden)
  var mSec = el('div', 'sec');
  var ml = el('span', 'lbl');
  ml.textContent = 'Discipline Mode';
  mSec.appendChild(ml);

  var mr = el('div', 'mode-row');
  var nb = el('button', 'mode-btn' + (S.mode === 'normal' ? ' sel' : ''));
  nb.textContent = 'Normal';
  var wb = el('button', 'mode-btn' + (S.mode === 'warden' ? ' wsel' : ''));
  if (S.isPremium) {
    wb.innerHTML = '🔒 Warden <span style="font-size:9px;background:#10B981;color:#fff;padding:1px 5px;border-radius:4px;margin-left:3px;font-weight:700;">PRO</span>';
  } else {
    wb.innerHTML = '🔒 Warden <span style="font-size:9px;background:#7C3AED;color:#fff;padding:1px 5px;border-radius:4px;margin-left:3px;font-weight:700;">PRO</span>';
  }

  var wp = el('div', 'warden-panel');
  wp.style.display = S.mode === 'warden' ? '' : 'none';
  var wi = el('div', 'warden-info');
  wi.textContent = 'Strict focus lock: cannot end early, edit blocked sites, or shorten timer.';
  wp.appendChild(wi);

  var wg = el('div', 'btn-grp');
  WARDEN_DURATIONS.forEach(function(d) {
    var b = el('button', 'pill' + (d.ms === S.selectedWDur ? ' wsel' : ''));
    b.textContent = d.label;
    b.addEventListener('click', function() {
      S.selectedWDur = d.ms;
      wg.querySelectorAll('.pill').forEach(function(x) { x.classList.remove('wsel'); });
      b.classList.add('wsel');
    });
    wg.appendChild(b);
  });
  wp.appendChild(wg);

  nb.addEventListener('click', function() {
    S.mode = 'normal';
    nb.className = 'mode-btn sel';
    wb.className = 'mode-btn';
    wp.style.display = 'none';
  });
  wb.addEventListener('click', function() {
    // Check if user already has an active premium subscription
    chrome.storage.local.get(['cs_premium_active', 'cs_premium_expiry'], function(data) {
      var now = Date.now();
      var isPremium = data.cs_premium_active && data.cs_premium_expiry && data.cs_premium_expiry > now;
      if (isPremium) {
        // Already subscribed — enable warden directly
        S.mode = 'warden';
        wb.className = 'mode-btn wsel';
        nb.className = 'mode-btn';
        wp.style.display = '';
      } else {
        // Not subscribed — show premium paywall
        showPremiumModal();
      }
    });
  });

  mr.appendChild(nb);
  mr.appendChild(wb);
  mSec.appendChild(mr);
  mSec.appendChild(wp);
  pane.appendChild(mSec);

  // Pomodoro toggle
  var pSec = el('div', 'sec');
  var pRow = el('label', 'site-left');
  var pCb = el('input');
  pCb.type = 'checkbox';
  pCb.checked = S.isPomodoro;
  pCb.addEventListener('change', function() { S.isPomodoro = pCb.checked; });
  var pSpan = el('span');
  pSpan.style.fontSize = 'var(--text-xs)';
  pSpan.style.fontWeight = '500';
  pSpan.innerHTML = '🍅 <strong>Pomodoro Mode:</strong> 25 min Focus + 5 min Break cycles';
  pRow.appendChild(pCb);
  pRow.appendChild(pSpan);
  pSec.appendChild(pRow);
  pane.appendChild(pSec);

  // Start Button
  var sSec = el('div', 'sec');
  var btn = el('button', 'start-btn');
  btn.id = 'startBtn';
  btn.textContent = 'Start Focus Session';
  btn.addEventListener('click', doStart);
  sSec.appendChild(btn);
  pane.appendChild(sSec);
}

/* ─── TAB 1: ACTIVE SESSION ─── */
function renderActiveSession(pane) {
  var sess = S.session;
  var now = Date.now();
  var rem = Math.max(0, sess.endsAt - now);

  // Goal Box
  var gd = el('div', 'active-goal');
  var glbl = el('div', 'goal-lbl');
  glbl.textContent = 'Current Focus';
  var gtxt = el('div', 'goal-txt');
  gtxt.textContent = sess.goal;
  gd.appendChild(glbl);
  gd.appendChild(gtxt);
  pane.appendChild(gd);

  // Large Timer Block
  var tb = el('div', 'timer-block');
  var tl = el('div', 'timer-lbl');
  if (sess.isPomodoro && sess.pomodoroStage === 'break') {
    tl.textContent = '☕ Rest break remaining';
  } else {
    tl.textContent = 'Time remaining';
  }
  tb.appendChild(tl);

  var td = el('div', 'timer-big' + (S.wardenActive ? ' warden' : ''));
  td.id = 'timerBig';
  td.textContent = fmt(rem);
  tb.appendChild(td);

  if (S.wardenActive && sess.wardenState && sess.wardenState.lockedUntil) {
    var wrem = Math.max(0, sess.wardenState.lockedUntil - now);
    var wl = el('div', 'warden-timer-lbl');
    wl.style.fontSize = '11px';
    wl.style.color = 'var(--color-warden)';
    wl.style.marginTop = '4px';
    wl.textContent = '🔒 Warden Lock: ' + fmt(wrem);
    tb.appendChild(wl);
  }
  pane.appendChild(tb);

  // Blocked Sites Summary
  var asl = el('div', 'active-sites');
  var names = sess.sites.filter(function(s) { return s.enabled; }).map(function(s) { return s.label; }).join(', ');
  asl.innerHTML = '<strong>Guarding:</strong> ' + esc(names || 'Custom blocklist');
  pane.appendChild(asl);

  // Actions
  var ac = el('div', 'actions');
  if (S.wardenActive) {
    var ln = el('div', 'locked-note');
    ln.textContent = '🔒 Controls locked by Warden.';
    ac.appendChild(ln);

    var exBtn = el('button', 'ext-btn');
    exBtn.textContent = 'Extend Warden (+30 min)';
    exBtn.addEventListener('click', doExtend);
    ac.appendChild(exBtn);
  } else if (S.ending) {
    var cd = el('div', 'end-cd');
    cd.id = 'endCd';
    cd.textContent = 'Ending in ' + S.endCount + 's…';
    ac.appendChild(cd);

    var cx = el('button', 'cancel-btn');
    cx.textContent = 'Cancel End';
    cx.addEventListener('click', cancelEnd);
    ac.appendChild(cx);
  } else {
    var eb = el('button', 'end-btn');
    eb.textContent = 'End Session';
    eb.addEventListener('click', beginEnd);
    ac.appendChild(eb);
  }

  // Quick 2-Minute Reset Button
  var rstBtn = el('button', 'ext-btn');
  rstBtn.style.background = 'var(--color-surface)';
  rstBtn.style.color = 'var(--color-ink)';
  rstBtn.style.borderColor = 'var(--color-line)';
  rstBtn.textContent = '🧘 Take 2-Minute Reset';
  rstBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('reset.html') });
  });
  ac.appendChild(rstBtn);

  pane.appendChild(ac);

  // Timer Tick
  _tickInterval = setInterval(tick, 1000);
}

function tick() {
  if (!S.session) {
    clearInterval(_tickInterval);
    return;
  }
  var now = Date.now();
  var td = q('timerBig');
  if (td) td.textContent = fmt(Math.max(0, S.session.endsAt - now));

  var cd = q('endCd');
  if (cd) cd.textContent = 'Ending in ' + S.endCount + 's…';

  if (now >= S.session.endsAt) {
    clearInterval(_tickInterval);
    load();
  }
}

/* ─── TAB 2: SITES MANAGER ─── */
function renderSitesTab(pane) {
  var sec = el('div', 'sec');
  var lbl = el('span', 'lbl');
  lbl.innerHTML = '<span>Blocked Sites</span><span>' + S.sites.filter(function(s){return s.enabled;}).length + ' active</span>';
  sec.appendChild(lbl);

  // Presets
  var pRow = el('div', 'presets-row');
  SITE_PRESETS.forEach(function(preset) {
    var chip = el('button', 'preset-chip');
    chip.textContent = preset.label;
    chip.addEventListener('click', function() {
      preset.sites.forEach(function(domain) {
        var existing = S.sites.find(function(s) { return s.urlPattern.indexOf(domain) !== -1; });
        if (existing) {
          existing.enabled = true;
        } else {
          S.sites.push({
            id: 'site-' + Date.now() + '-' + Math.floor(Math.random()*100),
            label: domain,
            urlPattern: '*://' + domain + '/*',
            enabled: true,
            custom: true
          });
        }
      });
      saveSites();
      render();
    });
    pRow.appendChild(chip);
  });
  sec.appendChild(pRow);

  // Sites list
  var list = el('div', 'sites-list');
  S.sites.forEach(function(site, idx) {
    var row = el('div', 'site-item');
    var left = el('label', 'site-left');
    var cb = el('input');
    cb.type = 'checkbox';
    cb.checked = site.enabled;
    cb.addEventListener('change', function() {
      site.enabled = cb.checked;
      saveSites();
    });
    var name = el('span');
    name.textContent = site.label;
    left.appendChild(cb);
    left.appendChild(name);
    row.appendChild(left);

    // Delete button for custom sites
    if (site.custom) {
      var del = el('button', 'del-btn');
      del.innerHTML = '×';
      del.title = 'Remove site';
      del.addEventListener('click', function() {
        S.sites.splice(idx, 1);
        saveSites();
        render();
      });
      row.appendChild(del);
    }
    list.appendChild(row);
  });
  sec.appendChild(list);

  // Add custom domain row
  var addRow = el('div', 'add-site-row');
  var input = el('input', 'text-in');
  input.placeholder = 'Add domain (e.g. twitter.com)';
  var addBtn = el('button', 'add-btn');
  addBtn.textContent = '+ Add';

  addBtn.addEventListener('click', function() {
    var raw = input.value.trim().toLowerCase();
    if (!raw) return;
    var domain = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    var pattern = '*://' + domain + '/*';

    S.sites.push({
      id: 'custom-' + Date.now(),
      label: domain,
      urlPattern: pattern,
      enabled: true,
      custom: true
    });
    saveSites();
    input.value = '';
    render();
  });

  addRow.appendChild(input);
  addRow.appendChild(addBtn);
  sec.appendChild(addRow);

  pane.appendChild(sec);
}

async function saveSites() {
  await msg({ type: 'SAVE_SITES', payload: { sites: S.sites } });
}

/* ─── TAB 3: SHIELD (CONTENT FILTER) ─── */
function renderShieldTab(pane) {
  var sec = el('div', 'sec');
  var lbl = el('span', 'lbl');
  lbl.textContent = 'Post Shield Settings';
  sec.appendChild(lbl);

  // Master Toggle
  var master = el('div', 'switch-row');
  var mLeft = el('div');
  mLeft.innerHTML = '<span class="switch-label">Enable Feed Shield</span><span class="switch-sub">Softens ragebait on Reddit, Twitter, YouTube, etc.</span>';
  var mCb = el('input');
  mCb.type = 'checkbox';
  mCb.checked = S.shieldEnabled;
  mCb.addEventListener('change', function() {
    S.shieldEnabled = mCb.checked;
    chrome.storage.local.set({ calmscroll_shield_enabled: S.shieldEnabled });
  });
  master.appendChild(mLeft);
  master.appendChild(mCb);
  sec.appendChild(master);

  // Shield Categories
  var categories = [
    { key: 'ragebait', title: '🚨 Ragebait & Sensationalism', desc: 'Outrage triggers, all-caps hysteria, viral bait' },
    { key: 'insensitive', title: '⚠️ Hostile / Insensitive Language', desc: 'Dehumanizing slang, othering phrases, slurs' },
    { key: 'controversial', title: '💬 Heated & Polarizing Topics', desc: 'Politics, violence, celebrity drama, sports feuds' }
  ];

  categories.forEach(function(cat) {
    var row = el('div', 'switch-row');
    var left = el('div');
    left.innerHTML = '<span class="switch-label">' + cat.title + '</span><span class="switch-sub">' + cat.desc + '</span>';
    var cb = el('input');
    cb.type = 'checkbox';
    cb.checked = S.shieldSettings[cat.key] !== false;
    cb.addEventListener('change', function() {
      S.shieldSettings[cat.key] = cb.checked;
      chrome.storage.local.set({ calmscroll_settings: S.shieldSettings });
    });
    row.appendChild(left);
    row.appendChild(cb);
    sec.appendChild(row);
  });

  // Open demo feed button
  var demoBtn = el('button', 'ext-btn');
  demoBtn.style.width = '100%';
  demoBtn.style.marginTop = 'var(--sp-3)';
  demoBtn.textContent = '🌿 Test Shield in Demo Feed';
  demoBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('demo/feed.html') });
  });
  sec.appendChild(demoBtn);

  pane.appendChild(sec);
}

/* ─── TAB 4: AMBIENT FOCUS AUDIO ─── */
function renderAmbientTab(pane) {
  var sBox = el('div', 'sound-box');
  var ico = el('div', 'sound-icon');
  ico.textContent = '🌧️';
  var title = el('div', 'sound-title');
  title.textContent = 'Procedural Brown Noise';
  var desc = el('div', 'sound-desc');
  desc.textContent = 'Deep, warm acoustic noise synthesized locally via Web Audio API. Drowns out speech & distracting sounds.';

  sBox.appendChild(ico);
  sBox.appendChild(title);
  sBox.appendChild(desc);

  var sBtn = el('button', 'sound-btn' + (S.ambientPlaying ? ' playing' : ''));
  sBtn.textContent = S.ambientPlaying ? '⏹ Stop Rain Noise' : '▶ Play Focus Rain Noise';
  sBtn.addEventListener('click', function() {
    if (window.CalmSound) {
      if (S.ambientPlaying) {
        window.CalmSound.stopBrownNoise();
        S.ambientPlaying = false;
        sBtn.textContent = '▶ Play Focus Rain Noise';
        sBtn.className = 'sound-btn';
      } else {
        window.CalmSound.startBrownNoise(S.ambientVolume);
        S.ambientPlaying = true;
        sBtn.textContent = '⏹ Stop Rain Noise';
        sBtn.className = 'sound-btn playing';
      }
    }
  });
  sBox.appendChild(sBtn);

  // Volume slider
  var volRow = el('div', 'vol-row');
  var volLbl = el('span');
  volLbl.textContent = 'Volume';
  var volSlider = el('input');
  volSlider.type = 'range';
  volSlider.min = '0';
  volSlider.max = '1';
  volSlider.step = '0.05';
  volSlider.value = String(S.ambientVolume);
  volSlider.addEventListener('input', function() {
    S.ambientVolume = parseFloat(volSlider.value);
    if (window.CalmSound && S.ambientPlaying) {
      window.CalmSound.setNoiseVolume(S.ambientVolume);
    }
  });
  volRow.appendChild(volLbl);
  volRow.appendChild(volSlider);
  sBox.appendChild(volRow);

  // Chime test button
  var cBtn = el('button', 'chime-test-btn');
  cBtn.textContent = '🔔 Play Singing Bowl Chime';
  cBtn.addEventListener('click', function() {
    if (window.CalmSound) window.CalmSound.playChime(528);
  });
  sBox.appendChild(cBtn);

  pane.appendChild(sBox);
}

/* ─── TAB 5: STATS & ANALYTICS ─── */
function renderStatsTab(pane) {
  // Streak banner
  var streak = el('div', 'streak-banner');
  streak.innerHTML = '🔥 <span>' + (S.stats.streakDays || 1) + '-Day Focus Streak! Keep up the momentum.</span>';
  pane.appendChild(streak);

  var grid = el('div', 'stats-grid');

  var c1 = el('div', 'stat-card');
  var n1 = el('div', 'stat-num');
  n1.textContent = S.stats.todayMinutes || 0;
  var l1 = el('div', 'stat-lbl');
  l1.textContent = 'Today Focus (Min)';
  c1.appendChild(n1);
  c1.appendChild(l1);

  var c2 = el('div', 'stat-card');
  var n2 = el('div', 'stat-num');
  n2.textContent = S.stats.todayDeflected || 0;
  var l2 = el('div', 'stat-lbl');
  l2.textContent = 'Deflected Today';
  c2.appendChild(n2);
  c2.appendChild(l2);

  var c3 = el('div', 'stat-card');
  var n3 = el('div', 'stat-num');
  n3.textContent = S.stats.sessionsCompleted || 0;
  var l3 = el('div', 'stat-lbl');
  l3.textContent = 'Total Sessions';
  c3.appendChild(n3);
  c3.appendChild(l3);

  var c4 = el('div', 'stat-card');
  var n4 = el('div', 'stat-num');
  n4.textContent = S.stats.postsShielded || 0;
  var l4 = el('div', 'stat-lbl');
  l4.textContent = 'Posts Shielded';
  c4.appendChild(n4);
  c4.appendChild(l4);

  grid.appendChild(c1);
  grid.appendChild(c2);
  grid.appendChild(c3);
  grid.appendChild(c4);
  pane.appendChild(grid);
}

/* ─── Footer Controls ─── */
function renderDemoFooter(app) {
  var df = el('div', 'demo-footer');

  var tog = el('label', 'site-left');
  tog.style.fontSize = '11px';
  tog.style.color = 'var(--color-muted)';
  var dcb = el('input');
  dcb.type = 'checkbox';
  dcb.checked = S.demoTiming;
  dcb.addEventListener('change', function() { S.demoTiming = dcb.checked; });
  var dsp = el('span');
  dsp.textContent = 'Demo fast timer';
  tog.appendChild(dcb);
  tog.appendChild(dsp);
  df.appendChild(tog);

  var rst = el('button', 'demo-rst');
  rst.textContent = 'Reset Session';
  rst.addEventListener('click', doReset);
  df.appendChild(rst);

  app.appendChild(df);
}

/* ─── Actions & Handlers ─── */
async function doStart() {
  var gIn = q('gIn');
  var goal = gIn ? gIn.value.trim() : S.goalText;
  if (!goal) {
    showErr('Please enter a focus goal.');
    if (gIn) gIn.focus();
    return;
  }
  var activeSites = S.sites.filter(function(s) { return s.enabled; });
  if (!activeSites.length) {
    showErr('Enable at least one site to block in Sites tab.');
    return;
  }

  if (S.mode === 'warden') {
    var ok = await confirmWarden();
    if (!ok) return;
  }

  var btn = q('startBtn');
  if (btn) {
    btn.textContent = 'Starting…';
    btn.disabled = true;
  }

  var payload = {
    goal: goal,
    sites: S.sites,
    mode: S.mode,
    durationMs: S.demoTiming ? 30 * 1000 : S.selectedDur,
    demoTiming: S.demoTiming,
    isPomodoro: S.isPomodoro
  };
  if (S.mode === 'warden') {
    payload.wardenDurationMs = S.demoTiming ? 60 * 1000 : S.selectedWDur;
  }

  var resp = await msg({ type: 'START_SESSION', payload: payload });
  if (resp && resp.type === 'ERROR') {
    showErr(resp.message);
    if (btn) {
      btn.textContent = 'Start Focus Session';
      btn.disabled = false;
    }
    return;
  }

  // Play gentle focus start chime
  if (window.CalmSound) {
    window.CalmSound.playChime(528);
  }

  await load();
}

function confirmWarden() {
  return new Promise(function(resolve) {
    var ov = el('div', 'overlay');
    var card = el('div', 'confirm-card');
    card.innerHTML =
      '<h2>🔒 Enable Warden Mode?</h2>' +
      '<p>While active, you <strong>cannot</strong>:</p>' +
      '<ul><li>End the session early</li><li>Edit blocked sites</li><li>Shorten the timer</li><li>Use study passes</li></ul>' +
      '<p>You <strong>can</strong> extend the Warden timer.</p>' +
      '<div class="confirm-btns">' +
        '<button class="cancel-sm" id="wNo">Cancel</button>' +
        '<button class="confirm-sm" id="wYes">Enable Warden</button>' +
      '</div>';
    ov.appendChild(card);
    document.body.appendChild(ov);
    q('wNo').onclick = function() { ov.remove(); resolve(false); };
    q('wYes').onclick = function() { ov.remove(); resolve(true); };
  });
}

function beginEnd() {
  S.ending = true;
  S.endCount = 10;
  render();
  _endInterval = setInterval(function() {
    S.endCount--;
    var cd = q('endCd');
    if (cd) cd.textContent = 'Ending in ' + S.endCount + 's…';
    if (S.endCount <= 0) {
      clearInterval(_endInterval);
      doEnd();
    }
  }, 1000);
}

function cancelEnd() {
  clearInterval(_endInterval);
  S.ending = false;
  S.endCount = 0;
  render();
}

async function doEnd() {
  S.ending = false;
  var resp = await msg({ type: 'END_SESSION' });
  if (resp && resp.type === 'ERROR') {
    showErr(resp.message);
    return;
  }
  S.session = null;
  S.wardenActive = false;
  render();
}

async function doExtend() {
  var resp = await msg({ type: 'EXTEND_WARDEN', payload: { additionalMs: 30 * 60 * 1000 } });
  if (resp && resp.type === 'ERROR') {
    showErr(resp.message);
    return;
  }
  await load();
}

async function doReset() {
  await msg({ type: 'RESET_DEMO' });
  S.session = null;
  S.wardenActive = false;
  render();
}

function showErr(txt) {
  var e = q('errMsg');
  if (!e) {
    alert(txt);
    return;
  }
  e.textContent = txt;
  e.style.display = 'block';
  setTimeout(function() { e.style.display = 'none'; }, 4000);
}


/* ─── Premium Paywall Modal ─── */
var PREMIUM_PLANS = [
  {
    id:       'plan_1m',
    name:     '1 Month',
    desc:     'Great for trying it out',
    amount:   99,
    amountPaise: 9900,
    per:      '₹99 / month',
    months:   1,
    popular:  false
  },
  {
    id:       'plan_2m',
    name:     '2 Months',
    desc:     'Most popular pick',
    amount:   189,
    amountPaise: 18900,
    per:      '₹94.5 / month',
    months:   2,
    popular:  true
  },
  {
    id:       'plan_12m',
    name:     '12 Months',
    desc:     'Best value — save 33%',
    amount:   799,
    amountPaise: 79900,
    per:      '₹66.6 / month',
    months:   12,
    popular:  false
  }
];

// ──  IMPORTANT: Replace with your actual Razorpay Key ID ──
var RAZORPAY_KEY_ID = 'rzp_test_XXXXXXXXXXXXXXXX';

function showPremiumModal() {
  var selectedPlanIdx = 1; // default to 2-month (most popular)

  var overlay = el('div', 'premium-overlay');
  overlay.id = 'premiumOverlay';

  var modal = el('div', 'premium-modal');

  // ── Close button ──
  var closeBtn = el('button', 'pm-close');
  closeBtn.innerHTML = '&#x2715;';
  closeBtn.title = 'Close';
  closeBtn.addEventListener('click', function() { overlay.remove(); });
  modal.appendChild(closeBtn);

  // ── Badge ──
  var badge = el('div', 'pm-badge');
  badge.innerHTML = '&#11088; Premium Feature';
  modal.appendChild(badge);

  // ── Title ──
  var title = el('div', 'pm-title');
  title.textContent = 'Unlock Warden Mode';
  modal.appendChild(title);

  // ── Subtitle ──
  var sub = el('div', 'pm-sub');
  sub.textContent = 'The ultimate focus lock — blocks sites, disables early exit, and keeps you accountable until your session ends.';
  modal.appendChild(sub);

  // ── Feature list ──
  var features = [
    { icon: '🔒', text: 'Session cannot be ended early' },
    { icon: '🚫', text: 'Site list locked during session' },
    { icon: '⏱️', text: 'Extended session durations (up to 4h)' },
    { icon: '📊', text: 'Priority stats & streak tracking' }
  ];
  var featsDiv = el('div', 'pm-features');
  features.forEach(function(f) {
    var row = el('div', 'pm-feat');
    var icon = el('div', 'pm-feat-icon');
    icon.textContent = f.icon;
    var txt = el('span');
    txt.textContent = f.text;
    row.appendChild(icon);
    row.appendChild(txt);
    featsDiv.appendChild(row);
  });
  modal.appendChild(featsDiv);

  // ── Divider ──
  var div1 = el('hr', 'pm-divider');
  modal.appendChild(div1);

  // ── Plans label ──
  var plansLabel = el('div', 'pm-plans-label');
  plansLabel.textContent = 'Choose your plan';
  modal.appendChild(plansLabel);

  // ── Plan cards ──
  var plansDiv = el('div', 'pm-plans');
  var planEls = [];

  PREMIUM_PLANS.forEach(function(plan, idx) {
    var card = el('div', 'pm-plan' + (idx === selectedPlanIdx ? ' selected' : ''));
    card.id = 'pmPlan_' + idx;

    if (plan.popular) {
      var pop = el('div', 'pm-plan-popular');
      pop.textContent = '⭐ Most Popular';
      card.appendChild(pop);
    }

    var left = el('div', 'pm-plan-left');
    var radio = el('div', 'pm-plan-radio');
    var info = el('div');
    var pName = el('div', 'pm-plan-name');
    pName.textContent = plan.name;
    var pDesc = el('div', 'pm-plan-desc');
    pDesc.textContent = plan.desc;
    info.appendChild(pName);
    info.appendChild(pDesc);
    left.appendChild(radio);
    left.appendChild(info);

    var priceDiv = el('div', 'pm-plan-price');
    var amt = el('div', 'pm-plan-amount');
    amt.textContent = '₹' + plan.amount;
    var per = el('div', 'pm-plan-per');
    per.textContent = plan.per;
    priceDiv.appendChild(amt);
    priceDiv.appendChild(per);

    card.appendChild(left);
    card.appendChild(priceDiv);

    card.addEventListener('click', function() {
      selectedPlanIdx = idx;
      planEls.forEach(function(c, i) {
        c.classList.toggle('selected', i === idx);
      });
    });

    planEls.push(card);
    plansDiv.appendChild(card);
  });
  modal.appendChild(plansDiv);

  // ── CTA Button ──
  var cta = el('button', 'pm-cta');
  cta.id = 'pmCtaBtn';
  cta.textContent = 'Continue to Payment →';
  cta.addEventListener('click', function() {
    var plan = PREMIUM_PLANS[selectedPlanIdx];
    openRazorpay(plan, overlay);
  });
  modal.appendChild(cta);

  // ── Footer note ──
  var footerNote = el('div', 'pm-footer-note');
  footerNote.innerHTML = '🔒 Secure payment via Razorpay &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; <a id="pmRestoreLink">Restore purchase</a>';
  modal.appendChild(footerNote);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Restore purchase link — re-validates locally stored subscription
  setTimeout(function() {
    var restoreLink = document.getElementById('pmRestoreLink');
    if (restoreLink) {
      restoreLink.addEventListener('click', function() {
        chrome.storage.local.get(['cs_premium_active', 'cs_premium_expiry'], function(data) {
          var now = Date.now();
          if (data.cs_premium_active && data.cs_premium_expiry && data.cs_premium_expiry > now) {
            overlay.remove();
            alert('✅ Your CalmScroll Premium subscription is active!');
          } else {
            alert('No active subscription found. Please complete a purchase.');
          }
        });
      });
    }
  }, 50);
}

function openRazorpay(plan, overlay) {
  var ctaBtn = document.getElementById('pmCtaBtn');
  if (ctaBtn) {
    ctaBtn.textContent = 'Redirecting to Razorpay…';
    ctaBtn.disabled = true;
  }

  // Open the dedicated Razorpay payment gateway tab
  chrome.tabs.create({ url: chrome.runtime.getURL('payment.html?plan=' + plan.id) }, function() {
    if (overlay) overlay.remove();
  });
}

function showPaymentSuccess(plan) {
  var ov = el('div', 'overlay');
  var card = el('div', 'confirm-card');
  card.style.textAlign = 'center';
  card.innerHTML =
    '<div style="font-size:2.5rem;margin-bottom:8px;">🎉</div>' +
    '<h2 style="color:var(--color-accent);margin-bottom:8px;">You\'re now Premium!</h2>' +
    '<p style="margin-bottom:16px;">Warden Mode is unlocked for <strong>' + plan.name + '</strong>. ' +
    'Your deep focus sessions just got a serious upgrade.</p>' +
    '<div class="confirm-btns">' +
      '<button class="confirm-sm" id="psOkBtn">Start Warden Session &#x1F512;</button>' +
    '</div>';
  ov.appendChild(card);
  document.body.appendChild(ov);

  document.getElementById('psOkBtn').onclick = function() {
    ov.remove();
    // Trigger mode switch to warden
    S.mode = 'warden';
    render();
  };
}

// Listen for subscription activation from payment page
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === 'local' && (changes.cs_premium_active || changes.cs_premium_expiry)) {
      load();
    }
  });
}

document.addEventListener('DOMContentLoaded', load);
