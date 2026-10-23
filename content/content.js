/**
 * content/content.js — CalmScroll Post-Shield Content Script
 *
 * Scans social feeds (Reddit, Twitter/X, Instagram, YouTube, etc.) for ragebait,
 * dehumanizing hostility, and controversial provocative posts. Softens high-stimulation
 * content with a mindful shield card and gives the user back conscious agency.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__calmscroll_injected) return;
  window.__calmscroll_injected = true;

  var shieldedCount = 0;
  var scannedElements = new WeakSet();
  var floatingPill = null;
  var observer = null;
  var debounceTimer = null;

  var settings = {
    enabled: true,
    ragebait: true,
    insensitive: true,
    controversial: true,
    selectedTopics: ['politics', 'violence', 'celebrity']
  };

  /* ─── Classification Rules Engine ─── */
  var ALLCAPS_MIN_WORDS = 4;

  function hasAllCapsRun(text) {
    var words = text.split(/\s+/);
    var run = 0;
    for (var i = 0; i < words.length; i++) {
      var alpha = words[i].replace(/[^a-zA-Z]/g, '');
      if (alpha.length >= 3 && alpha === alpha.toUpperCase()) {
        run++;
        if (run >= ALLCAPS_MIN_WORDS) return true;
      } else {
        run = 0;
      }
    }
    return false;
  }

  var OUTRAGE_PATTERNS = [
    { pattern: /\bcan'?t believe\b/i, reason: 'outrage framing opener' },
    { pattern: /\bWAKE UP\b/, reason: 'alarm imperative phrase' },
    { pattern: /\bthey (don'?t|do not|won'?t) want you to know\b/i, reason: 'conspiratorial withholding claim' },
    { pattern: /\bmainstream media\b/i, reason: 'adversarial media framing' },
    { pattern: /\b(sheeple|clown world)\b/i, reason: 'dehumanising crowd epithet' },
    { pattern: /\bhow dare\b/i, reason: 'accusatory moral outrage' },
    { pattern: /\b(BOMBSHELL|EXPOSED|SHOCKING|OUTRAGEOUS|EXPLOSIVE)\b/, reason: 'sensationalist all-caps label' },
    { pattern: /\b(this makes (me|us) sick|i'?m done|we'?re done)\b/i, reason: 'peak-outrage sign-off' },
    { pattern: /\b(destroy|destroyed|obliterate|slammed|ripped apart)\b/i, reason: 'adversarial conflict framing' }
  ];

  var ENGAGEMENT_BAIT_PATTERNS = [
    { pattern: /\bshare if you agree\b/i, reason: 'viral share call to action' },
    { pattern: /\blike if you\b/i, reason: 'like-gate prompt' },
    { pattern: /\bcomment (yes|no|amen|agree|disagree)\b/i, reason: 'forced binary engagement bait' },
    { pattern: /\b(repost this|tag (a friend|someone who))\b/i, reason: 'tag/repost call to action' },
    { pattern: /\b(what (the )?media won'?t (tell|show)|they'?re hiding)\b/i, reason: 'claimed media suppression bait' },
    { pattern: /\bthe truth (is|about)\b/i, reason: 'truth-reveal clickbait phrase' }
  ];

  var INSENSITIVE_PATTERNS = [
    { pattern: /\b(triggered|snowflakes?|libtards?|cucks?|soyboys?|NPCs?|sheep)\b/i, reason: 'dismissive or dehumanising slang' },
    { pattern: /\bgo back to\b/i, reason: 'potentially exclusionary directive' },
    { pattern: /\byour (kind|people)\b/i, reason: 'othering generalisation' },
    { pattern: /\bthey all\b/i, reason: 'sweeping group generalisation' },
    { pattern: /\b(had it coming|asked for it|brought it on themselves)\b/i, reason: 'victim-blaming phrasing' },
    { pattern: /\bdeserve[ds]?\s+(to|what|it)\b/i, reason: 'victim-blaming phrasing' },
    { pattern: /\b(not from here|doesn'?t belong here)\b/i, reason: 'exclusionary claim' }
  ];

  var TOPIC_PATTERNS = {
    politics: [
      /\b(democrat|republican|labour|tory|BJP|congress party|senate|parliament|election|ballot|referendum)\b/i,
      /\b(partisan|left[-\s]?wing|right[-\s]?wing|progressive|conservative|politician|legislation)\b/i
    ],
    religion: [
      /\b(god|allah|jesus|christ|buddha|krishna|bible|quran|torah|gita|scripture|blasphemy)\b/i
    ],
    violence: [
      /\b(attack|shooting|stabbing|bombing|murder|homicide|massacre|riot|war|casualt(y|ies)|hostage)\b/i
    ],
    celebrity: [
      /\b(celebrity|celeb|kardashian|reality TV|drama|feud|beef|cancelled|cancel culture|gossip|cheating scandal)\b/i
    ],
    sports: [
      /\b(football|soccer|cricket|basketball|NBA|NFL|IPL|Premier League|Champions League|Super Bowl)\b/i
    ]
  };

  function classifyText(text) {
    if (!text || text.length < 15) return null;
    var trimmed = text.trim();

    // 1. Ragebait
    if (settings.ragebait !== false) {
      var reasons = [];
      if (hasAllCapsRun(trimmed)) {
        reasons.push('all-caps outrage phrasing');
      }
      for (var i = 0; i < OUTRAGE_PATTERNS.length; i++) {
        if (OUTRAGE_PATTERNS[i].pattern.test(trimmed)) {
          reasons.push(OUTRAGE_PATTERNS[i].reason);
        }
      }
      for (var j = 0; j < ENGAGEMENT_BAIT_PATTERNS.length; j++) {
        if (ENGAGEMENT_BAIT_PATTERNS[j].pattern.test(trimmed)) {
          reasons.push(ENGAGEMENT_BAIT_PATTERNS[j].reason);
        }
      }
      if (reasons.length > 0) {
        return { label: 'ragebait', badgeClass: 'calmscroll-badge-ragebait', title: 'Ragebait Detected', reason: reasons[0] };
      }
    }

    // 2. Hostility & Insensitive language
    if (settings.insensitive !== false) {
      for (var k = 0; k < INSENSITIVE_PATTERNS.length; k++) {
        if (INSENSITIVE_PATTERNS[k].pattern.test(trimmed)) {
          return { label: 'insensitive', badgeClass: 'calmscroll-badge-insensitive', title: 'Hostile / Insensitive', reason: INSENSITIVE_PATTERNS[k].reason };
        }
      }
    }

    // 3. Controversial Topics
    if (settings.controversial !== false && settings.selectedTopics && settings.selectedTopics.length) {
      for (var t = 0; t < settings.selectedTopics.length; t++) {
        var topic = settings.selectedTopics[t];
        var patterns = TOPIC_PATTERNS[topic];
        if (patterns) {
          for (var p = 0; p < patterns.length; p++) {
            if (patterns[p].test(trimmed)) {
              return { label: 'controversial', badgeClass: 'calmscroll-badge-controversial', title: 'Filtered Topic: ' + topic, reason: 'Contains discussion about ' + topic };
            }
          }
        }
      }
    }

    return null;
  }

  /* ─── DOM Post Selectors ─── */
  var POST_SELECTORS = [
    // Reddit
    'shreddit-post',
    'div[data-testid="post-container"]',
    '.Post',
    'div.thing.link',
    // Twitter / X
    'article[data-testid="tweet"]',
    // YouTube
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    // Instagram
    'article',
    // Threads
    'div[data-pressable-container="true"]',
    // General fallback
    '[role="article"]'
  ];

  function shieldElement(element, result) {
    if (scannedElements.has(element)) return;
    scannedElements.add(element);

    // Create CalmScroll Shield UI
    var shieldWrap = document.createElement('div');
    shieldWrap.className = 'calmscroll-shield-container';

    var card = document.createElement('div');
    card.className = 'calmscroll-shield-card';

    var header = document.createElement('div');
    header.className = 'calmscroll-shield-header';

    var brand = document.createElement('div');
    brand.className = 'calmscroll-shield-brand';
    brand.innerHTML = '🌿 CalmScroll Shield';

    var badge = document.createElement('span');
    badge.className = 'calmscroll-badge ' + result.badgeClass;
    badge.textContent = result.title;

    header.appendChild(brand);
    header.appendChild(badge);

    var reasonText = document.createElement('div');
    reasonText.className = 'calmscroll-shield-reason';
    reasonText.innerHTML = '<strong>Guarded:</strong> ' + escapeHtml(result.reason);

    var prompt = document.createElement('div');
    prompt.className = 'calmscroll-shield-prompt';
    prompt.textContent = 'Take a mindful pause before engaging. Is this worthy of your focus?';

    var actions = document.createElement('div');
    actions.className = 'calmscroll-shield-actions';

    var btnReveal = document.createElement('button');
    btnReveal.className = 'calmscroll-btn-reveal';
    btnReveal.textContent = 'Show Post';

    var btnHide = document.createElement('button');
    btnHide.className = 'calmscroll-btn-hide';
    btnHide.textContent = 'Keep Hidden';

    actions.appendChild(btnReveal);
    actions.appendChild(btnHide);

    card.appendChild(header);
    card.appendChild(reasonText);
    card.appendChild(prompt);
    card.appendChild(actions);
    shieldWrap.appendChild(card);

    // Find main content container to soften
    var contentHolder = element.querySelector('[data-testid="tweetText"], .post-body, .entry, [slot="text-body"], #video-title, #title') || element;

    // Save previous display state
    var prevDisplay = contentHolder.style.display;
    contentHolder.classList.add('calmscroll-hidden-content');

    // Prepend shield card before content or inside element
    element.insertBefore(shieldWrap, element.firstChild);

    btnReveal.addEventListener('click', function (e) {
      e.stopPropagation();
      if (contentHolder.classList.contains('calmscroll-hidden-content')) {
        contentHolder.classList.remove('calmscroll-hidden-content');
        btnReveal.textContent = 'Re-Shield Post';
        card.style.opacity = '0.7';
      } else {
        contentHolder.classList.add('calmscroll-hidden-content');
        btnReveal.textContent = 'Show Post';
        card.style.opacity = '1';
      }
    });

    btnHide.addEventListener('click', function (e) {
      e.stopPropagation();
      shieldWrap.style.display = 'none';
      element.style.display = 'none';
    });

    shieldedCount++;
    updateFloatingPill();

    // Increment global stats in background
    try {
      chrome.runtime.sendMessage({ type: 'INCREMENT_POST_SHIELDED' });
    } catch (e) {}
  }

  function scanFeed() {
    if (!settings.enabled) return;

    var selector = POST_SELECTORS.join(', ');
    var posts = document.querySelectorAll(selector);

    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      if (scannedElements.has(post)) continue;

      // Avoid shielding our own UI or parent if child already shielded
      if (post.closest('.calmscroll-shield-container')) continue;

      var text = post.innerText || post.textContent || '';
      var result = classifyText(text);

      if (result) {
        shieldElement(post, result);
      } else {
        scannedElements.add(post);
      }
    }
  }

  function updateFloatingPill() {
    if (shieldedCount === 0) return;
    if (!floatingPill) {
      floatingPill = document.createElement('div');
      floatingPill.className = 'calmscroll-floating-pill';
      floatingPill.title = 'CalmScroll Post Shield: click to minimize';
      floatingPill.addEventListener('click', function () {
        floatingPill.classList.toggle('minimized');
        if (floatingPill.classList.contains('minimized')) {
          floatingPill.innerHTML = '🌿';
        } else {
          floatingPill.innerHTML = '🌿 ' + shieldedCount + ' shielded';
        }
      });
      document.body.appendChild(floatingPill);
    }
    if (!floatingPill.classList.contains('minimized')) {
      floatingPill.innerHTML = '🌿 ' + shieldedCount + ' shielded';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(function () {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(scanFeed, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    // Load settings from storage
    chrome.storage.local.get(['calmscroll_settings', 'calmscroll_shield_enabled'], function (data) {
      var storedSettings = data.calmscroll_settings;
      if (storedSettings) {
        if (storedSettings.selectedTopics) settings.selectedTopics = storedSettings.selectedTopics;
        if (storedSettings.ragebait !== undefined) settings.ragebait = storedSettings.ragebait;
        if (storedSettings.insensitive !== undefined) settings.insensitive = storedSettings.insensitive;
        if (storedSettings.controversial !== undefined) settings.controversial = storedSettings.controversial;
      }
      if (data.calmscroll_shield_enabled !== undefined) {
        settings.enabled = data.calmscroll_shield_enabled;
      }

      if (settings.enabled) {
        scanFeed();
        startObserver();
      }
    });

    // Listen for setting changes
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== 'local') return;
      if (changes.calmscroll_settings) {
        var newVal = changes.calmscroll_settings.newValue || {};
        if (newVal.selectedTopics) settings.selectedTopics = newVal.selectedTopics;
        if (newVal.ragebait !== undefined) settings.ragebait = newVal.ragebait;
        if (newVal.insensitive !== undefined) settings.insensitive = newVal.insensitive;
        if (newVal.controversial !== undefined) settings.controversial = newVal.controversial;
      }
      if (changes.calmscroll_shield_enabled) {
        settings.enabled = changes.calmscroll_shield_enabled.newValue !== false;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
