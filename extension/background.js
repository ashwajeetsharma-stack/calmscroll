/**
 * CalmScroll background service worker (MV3)
 * Handles:
 * - Dynamic DeclarativeNetRequest site blocking & redirects
 * - Warden lock enforcement & session recovery
 * - Pomodoro focus & break cycling
 * - Live toolbar action badge countdown
 * - Focus statistics, streak tracking, & deflection counters
 * - 5-minute study / reference passes
 * - Notifications on session completion
 * - Ragebait & content classification engine
 */

// ─── CLASSIFICATION ENGINE RULES ──────────────────────────────────────────

const ALLCAPS_MIN_WORDS = 4;

const OUTRAGE_PATTERNS = [
  { pattern: /\bcan'?t believe\b/i, reason: "outrage framing opener" },
  { pattern: /\bWAKE UP\b/, reason: "all-caps alarm imperative" },
  { pattern: /\bthey (don'?t|do not|won'?t) want you to know\b/i, reason: "conspiratorial withholding phrase" },
  { pattern: /\bmainstream media\b/i, reason: "adversarial media framing" },
  { pattern: /\b(sheeple|clown world)\b/i, reason: "dehumanising crowd epithet" },
  { pattern: /\bhow dare\b/i, reason: "accusatory moral-outrage opener" },
  { pattern: /\b(BOMBSHELL|EXPOSED|SHOCKING|OUTRAGEOUS|EXPLOSIVE)\b/, reason: "sensationalist all-caps label" },
  { pattern: /\b(this makes (me|us) sick|i'?m done|we'?re done)\b/i, reason: "peak-outrage sign-off phrase" },
  { pattern: /\b(destroy|destroyed|obliterate|slammed|ripped apart)\b/i, reason: "adversarial conflict framing" }
];

const ENGAGEMENT_BAIT_PATTERNS = [
  { pattern: /\bshare if you agree\b/i, reason: "viral share call to action" },
  { pattern: /\blike if you\b/i, reason: "like-gate call to action" },
  { pattern: /\bcomment (yes|no|amen|agree|disagree)\b/i, reason: "forced binary comment prompt" },
  { pattern: /\b(repost this|tag (a friend|someone who))\b/i, reason: "repost/tag call to action" },
  { pattern: /\b(what (the )?media won'?t (tell|show)|they'?re hiding)\b/i, reason: "claimed media suppression bait" },
  { pattern: /\bthe truth (is|about)\b/i, reason: "truth-reveal clickbait phrase" }
];

const INSENSITIVE_PATTERNS = [
  { pattern: /\b(triggered|snowflakes?|libtards?|cucks?|soyboys?|NPCs?|sheep)\b/i, reason: "dismissive or dehumanising slang" },
  { pattern: /\bgo back to\b/i, reason: "potentially exclusionary directive" },
  { pattern: /\byour (kind|people)\b/i, reason: "othering generalisation" },
  { pattern: /\bthey all\b/i, reason: "sweeping group generalisation" },
  { pattern: /\b(had it coming|asked for it|brought it on themselves)\b/i, reason: "victim-blaming phrasing" },
  { pattern: /\bdeserve[ds]?\s+(to|what|it)\b/i, reason: "victim-blaming phrasing" },
  { pattern: /\b(not from here|doesn'?t belong here)\b/i, reason: "exclusionary belonging claim" }
];

const TOPIC_PATTERNS = {
  politics: [
    /\b(democrat|republican|labour|tory|BJP|congress party)\b/i,
    /\b(senate|parliament|election|ballot|referendum|constituency)\b/i,
    /\b(partisan|left[-\s]?wing|right[-\s]?wing|progressive|conservative)\b/i,
    /\b(politician|lawmaker|legislation|policy|government|minister|MP|senator)\b/i
  ],
  religion: [
    /\b(god|allah|jesus|christ|buddha|krishna|vishnu|shiva|guru nanak)\b/i,
    /\b(bible|quran|torah|gita|vedas|scripture|gospel|hadith)\b/i,
    /\b(muslim|christian|hindu|buddhist|sikh|jewish|atheist|agnostic)\b/i,
    /\b(mosque|church|temple|synagogue|gurudwara|prayer|worship|blasphemy)\b/i
  ],
  violence: [
    /\b(attack|shooting|stabbing|bombing|explosion)\b/i,
    /\b(murder|homicide|kill(ed|ing|s)?|assault|riot)\b/i,
    /\b(war|conflict|armed forces|missile|weapon|gun|knife|explosive)\b/i,
    /\b(casualt(y|ies)|death toll|injured|wounded|hostage)\b/i
  ],
  celebrity: [
    /\b(celebrity|celeb|influencer|kardashian|reality (TV|star))\b/i,
    /\b(drama|beef|feud|cancelled|cancel culture|stan|fandom|fan war)\b/i,
    /\b(gossip|rumour|rumor|leaked|exposed|caught on camera)\b/i,
    /\b(breakup|divorce|affair|cheating|relationship drama)\b/i
  ],
  sports: [
    /\b(football|soccer|cricket|basketball|tennis|baseball|rugby|hockey)\b/i,
    /\b(NBA|NFL|IPL|Premier League|Champions League|World Cup|Olympics)\b/i,
    /\b(transfer|signing|trade|draft|roster|squad|lineup)\b/i,
    /\b(match|game|fixture|tournament|championship|league|playoffs)\b/i
  ]
};

function hasAllCapsRun(text) {
  const words = text.split(/\s+/);
  let run = 0;
  for (const word of words) {
    const alpha = word.replace(/[^a-zA-Z]/g, "");
    if (alpha.length >= 3 && alpha === alpha.toUpperCase()) {
      run++;
      if (run >= ALLCAPS_MIN_WORDS) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

function checkRagebait(text) {
  const reasons = [];
  const seen = new Set();
  if (hasAllCapsRun(text)) {
    reasons.push("all-caps outrage phrasing");
  }
  for (const { pattern, reason } of OUTRAGE_PATTERNS) {
    if (!seen.has(reason) && pattern.test(text)) {
      reasons.push(reason);
      seen.add(reason);
    }
  }
  for (const { pattern, reason } of ENGAGEMENT_BAIT_PATTERNS) {
    if (!seen.has(reason) && pattern.test(text)) {
      reasons.push(reason);
      seen.add(reason);
    }
  }
  if (reasons.length === 0) return null;
  return { label: "ragebait", reasons };
}

function checkInsensitive(text) {
  const reasons = [];
  const seen = new Set();
  for (const { pattern, reason } of INSENSITIVE_PATTERNS) {
    if (!seen.has(reason) && pattern.test(text)) {
      reasons.push(reason);
      seen.add(reason);
    }
  }
  if (reasons.length === 0) return null;
  return { label: "insensitive", reasons };
}

function checkControversial(text, selectedTopics) {
  if (!selectedTopics || selectedTopics.length === 0) return null;
  const reasons = [];
  for (const topic of selectedTopics) {
    const patterns = TOPIC_PATTERNS[topic];
    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          reasons.push(`contains ${topic}-related content`);
          break;
        }
      }
    }
  }
  if (reasons.length === 0) return null;
  return { label: "controversial", reasons };
}

async function classify(text, settings) {
  const trimmed = text.trim();
  const ragebait = checkRagebait(trimmed);
  if (ragebait) return { ...ragebait, source: "rules" };

  const insensitive = checkInsensitive(trimmed);
  if (insensitive) return { ...insensitive, source: "rules" };

  const controversial = checkControversial(trimmed, settings.selectedTopics ?? []);
  if (controversial) return { ...controversial, source: "rules" };

  return { label: "clean", reasons: [], source: "rules" };
}

// ─── CONSTANTS & STORAGE KEYS ─────────────────────────────────────────────

const STORAGE_KEY_SESSION = "calmscroll_session";
const STORAGE_KEY_SETTINGS = "calmscroll_settings";
const STORAGE_KEY_STATS = "calmscroll_stats";
const STORAGE_KEY_CUSTOM_SITES = "calmscroll_custom_sites";

const ALARM_SESSION_END = "calmscroll-session-end";
const ALARM_WARDEN_END = "calmscroll-warden-end";
const ALARM_BADGE_TICK = "calmscroll-badge-tick";
const ALARM_STUDY_PASS_END = "calmscroll-study-pass-end";
const ALARM_POMODORO_CYCLE = "calmscroll-pomodoro-cycle";

const DNR_RULE_ID_BASE = 1000;
const WARDEN_MAX_MS = 12 * 60 * 60 * 1000;

const DEFAULT_SITES = [
  { id: "reddit", label: "Reddit", urlPattern: "*://reddit.com/*", enabled: true },
  { id: "instagram", label: "Instagram", urlPattern: "*://instagram.com/*", enabled: true },
  { id: "youtube-shorts", label: "YouTube Shorts", urlPattern: "*://www.youtube.com/shorts/*", enabled: true },
  { id: "twitter", label: "Twitter / X", urlPattern: "*://x.com/*", enabled: true },
  { id: "tiktok", label: "TikTok", urlPattern: "*://tiktok.com/*", enabled: false },
  { id: "facebook", label: "Facebook", urlPattern: "*://facebook.com/*", enabled: false },
  { id: "twitch", label: "Twitch", urlPattern: "*://twitch.tv/*", enabled: false }
];

// ─── URL & DNR UTILITIES ──────────────────────────────────────────────────

function matchPatternToDnrFilter(pattern) {
  if (!pattern) return null;
  if (pattern.startsWith("||")) return pattern;

  // Handle *://domain.com/* or *://domain.com/path/*
  const m = pattern.match(/^\*:\/\/([^/]+)(\/.*)?$/);
  if (m) {
    const domain = m[1].replace(/^\*\./, "");
    let path = m[2] ? m[2].replace(/\*+$/, "") : "/";
    if (!path.startsWith("/")) path = "/" + path;
    return `||${domain}${path}`;
  }

  // Fallback for simple domain strings
  const clean = pattern.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  if (clean) return `||${clean}/`;
  return null;
}

function buildDnrRule(site, ruleId) {
  if (!site.enabled) return null;
  const urlFilter = matchPatternToDnrFilter(site.urlPattern);
  if (!urlFilter) {
    console.warn(`[CalmScroll] Unrecognised URL pattern skipped: ${site.urlPattern}`);
    return null;
  }
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { extensionPath: "/warning.html" }
    },
    condition: {
      urlFilter,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
    }
  };
}

async function applyDnrRules(sites) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  const addRules = [];
  let ruleId = DNR_RULE_ID_BASE;

  for (const site of sites) {
    const rule = buildDnrRule(site, ruleId);
    if (rule) {
      addRules.push(rule);
      ruleId++;
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  console.log(`[CalmScroll] DNR: applied ${addRules.length} rule(s), removed ${removeRuleIds.length}.`);
}

async function removeDnrRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length === 0) return;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: []
  });
  console.log(`[CalmScroll] DNR: removed ${existing.length} rule(s).`);
}

// ─── ACTION BADGE ─────────────────────────────────────────────────────────

async function updateBadge(session) {
  try {
    if (!session) {
      await chrome.action.setBadgeText({ text: "" });
      return;
    }

    const now = Date.now();

    // 1. Study Pass active
    if (session.studyPassUntil && now < session.studyPassUntil) {
      const passMins = Math.max(1, Math.ceil((session.studyPassUntil - now) / 60000));
      await chrome.action.setBadgeText({ text: `${passMins}p` });
      await chrome.action.setBadgeBackgroundColor({ color: "#D97706" }); // Amber
      return;
    }

    // 2. Pomodoro Break active
    if (session.isPomodoro && session.pomodoroStage === "break") {
      const breakMins = Math.max(1, Math.ceil((session.endsAt - now) / 60000));
      await chrome.action.setBadgeText({ text: `${breakMins}b` });
      await chrome.action.setBadgeBackgroundColor({ color: "#2563EB" }); // Blue
      return;
    }

    // 3. Regular active session
    if (now >= session.endsAt) {
      await chrome.action.setBadgeText({ text: "✓" });
      await chrome.action.setBadgeBackgroundColor({ color: "#1F6F6B" });
      return;
    }

    const remMs = session.endsAt - now;
    const remMins = Math.max(1, Math.ceil(remMs / 60000));
    const badgeText = remMins > 99 ? "99+" : `${remMins}m`;

    await chrome.action.setBadgeText({ text: badgeText });

    if (session.mode === "warden") {
      await chrome.action.setBadgeBackgroundColor({ color: "#2F3E5C" }); // Deep Slate Navy
    } else {
      await chrome.action.setBadgeBackgroundColor({ color: "#1F6F6B" }); // Calm Sage Green
    }
  } catch (err) {
    console.warn("[CalmScroll] Badge update error:", err);
  }
}

// ─── STATS & ANALYTICS ────────────────────────────────────────────────────

async function getStats() {
  const data = await chrome.storage.local.get(STORAGE_KEY_STATS);
  const today = new Date().toISOString().slice(0, 10);
  let stats = data[STORAGE_KEY_STATS] || {
    totalFocusMinutes: 0,
    sessionsCompleted: 0,
    distractionsDeflected: 0,
    postsShielded: 0,
    streakDays: 1,
    todayMinutes: 0,
    todayDeflected: 0,
    todaySessions: 0,
    lastActiveDate: today
  };

  if (stats.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (stats.lastActiveDate === yesterday && stats.todayMinutes > 0) {
      stats.streakDays = (stats.streakDays || 1) + 1;
    } else if (stats.lastActiveDate && stats.lastActiveDate !== yesterday && (!stats.todayMinutes || stats.todayMinutes === 0)) {
      stats.streakDays = 1;
    }
    stats.todayMinutes = 0;
    stats.todayDeflected = 0;
    stats.todaySessions = 0;
    stats.lastActiveDate = today;
    await chrome.storage.local.set({ [STORAGE_KEY_STATS]: stats });
  }

  return stats;
}

async function recordSessionCompleted(session) {
  try {
    const stats = await getStats();
    const durationMins = Math.round((session.endsAt - session.startedAt) / 60000);
    const addedMins = Math.max(1, durationMins);

    stats.totalFocusMinutes += addedMins;
    stats.todayMinutes += addedMins;
    stats.sessionsCompleted += 1;
    stats.todaySessions += 1;
    stats.lastActiveDate = new Date().toISOString().slice(0, 10);

    await chrome.storage.local.set({ [STORAGE_KEY_STATS]: stats });

    // Send Chrome system notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "CalmScroll — Focus Complete! 🌿",
      message: `Great job focusing on: "${session.goal}". Take a well-deserved mindful break.`,
      priority: 2
    });
  } catch (err) {
    console.warn("[CalmScroll] Error recording session stats:", err);
  }
}

async function incrementDeflection() {
  try {
    const stats = await getStats();
    stats.distractionsDeflected = (stats.distractionsDeflected || 0) + 1;
    stats.todayDeflected = (stats.todayDeflected || 0) + 1;
    await chrome.storage.local.set({ [STORAGE_KEY_STATS]: stats });
  } catch (err) {}
}

async function incrementPostShielded() {
  try {
    const stats = await getStats();
    stats.postsShielded = (stats.postsShielded || 0) + 1;
    await chrome.storage.local.set({ [STORAGE_KEY_STATS]: stats });
  } catch (err) {}
}

// ─── SESSION MANAGEMENT ───────────────────────────────────────────────────

async function getSession() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY_SESSION);
    return data[STORAGE_KEY_SESSION] ?? null;
  } catch (err) {
    logError("STORAGE_FAILURE", "Failed to read session from storage", err);
    return null;
  }
}

async function setSession(session) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_SESSION]: session });
    await updateBadge(session);
  } catch (err) {
    logError("STORAGE_FAILURE", "Failed to write session to storage", err);
    throw makeError("STORAGE_FAILURE", "Storage write failed.");
  }
}

async function clearSession() {
  try {
    await chrome.storage.local.remove(STORAGE_KEY_SESSION);
    await updateBadge(null);
  } catch (err) {
    logError("STORAGE_FAILURE", "Failed to clear session from storage", err);
  }
}

async function startSession(payload) {
  const now = Date.now();
  if (payload.mode === "warden" && payload.wardenDurationMs !== void 0 && payload.wardenDurationMs > WARDEN_MAX_MS) {
    throw makeError("WARDEN_DURATION_EXCEEDED", "Warden mode maximum is 12 hours.");
  }

  const durationMs = payload.durationMs || 25 * 60 * 1000;
  const endsAt = now + durationMs;
  const sites = payload.sites && payload.sites.length > 0 ? payload.sites : DEFAULT_SITES;

  const session = {
    goal: payload.goal || "Deep Focus",
    sites,
    mode: payload.mode || "normal",
    startedAt: now,
    endsAt,
    demoTiming: payload.demoTiming ?? false,
    isPomodoro: payload.isPomodoro ?? false,
    pomodoroStage: payload.isPomodoro ? "focus" : undefined,
    pomodoroCycle: payload.isPomodoro ? 1 : undefined
  };

  if (payload.mode === "warden" && payload.wardenDurationMs) {
    session.wardenState = { lockedUntil: now + payload.wardenDurationMs };
    await chrome.alarms.create(ALARM_WARDEN_END, { when: session.wardenState.lockedUntil });
  }

  await setSession(session);
  await applyDnrRules(sites);

  // Alarms
  await chrome.alarms.clear(ALARM_SESSION_END);
  await chrome.alarms.create(ALARM_SESSION_END, { when: endsAt });

  // Recurring badge update alarm every 1 minute
  await chrome.alarms.clear(ALARM_BADGE_TICK);
  await chrome.alarms.create(ALARM_BADGE_TICK, { periodInMinutes: 1 });

  await updateBadge(session);
  console.log("[CalmScroll] Session started successfully:", session.goal);
}

async function endSession(wasNaturalCompletion = false) {
  const session = await getSession();
  if (session && wasNaturalCompletion) {
    await recordSessionCompleted(session);
  }

  await clearSession();
  await removeDnrRules();
  await chrome.alarms.clear(ALARM_SESSION_END);
  await chrome.alarms.clear(ALARM_WARDEN_END);
  await chrome.alarms.clear(ALARM_BADGE_TICK);
  await chrome.alarms.clear(ALARM_STUDY_PASS_END);
  await chrome.alarms.clear(ALARM_POMODORO_CYCLE);
  await updateBadge(null);
  console.log("[CalmScroll] Session ended and cleaned up.");
}

async function recoverSession() {
  const session = await getSession();
  if (!session) {
    await updateBadge(null);
    return;
  }

  const now = Date.now();
  if (now >= session.endsAt) {
    console.log("[CalmScroll] Recovered an expired session — finishing.");
    await endSession(true);
    return;
  }

  console.log(`[CalmScroll] Recovering active session: ${Math.round((session.endsAt - now) / 1000)}s remaining.`);

  // If in study pass or pomodoro break, don't apply DNR rules yet
  const inStudyPass = session.studyPassUntil && now < session.studyPassUntil;
  const inBreak = session.isPomodoro && session.pomodoroStage === "break";

  if (!inStudyPass && !inBreak) {
    await applyDnrRules(session.sites);
  }

  await chrome.alarms.create(ALARM_SESSION_END, { when: session.endsAt });
  await chrome.alarms.create(ALARM_BADGE_TICK, { periodInMinutes: 1 });

  if (session.wardenState) {
    const { lockedUntil } = session.wardenState;
    if (now < lockedUntil) {
      session.wardenState.interruptedAt = now;
      session.wardenState.remainingMsAtInterrupt = lockedUntil - now;
      await setSession(session);
      await chrome.alarms.create(ALARM_WARDEN_END, { when: lockedUntil });
    } else {
      session.wardenState = undefined;
      session.mode = "normal";
      await setSession(session);
    }
  }

  await updateBadge(session);
}

// ─── 5-MINUTE STUDY PASS ──────────────────────────────────────────────────

async function requestStudyPass(minutes = 5) {
  const session = await getSession();
  if (!session) throw makeError("NO_ACTIVE_SESSION", "No active session.");
  if (session.mode === "warden") {
    throw makeError("WARDEN_LOCKED", "Study passes are disabled in Warden mode.");
  }

  const passMs = minutes * 60 * 1000;
  session.studyPassUntil = Date.now() + passMs;
  await setSession(session);

  // Temporarily lift DNR rules
  await removeDnrRules();
  await chrome.alarms.create(ALARM_STUDY_PASS_END, { when: session.studyPassUntil });
  await updateBadge(session);

  return { endsAt: session.studyPassUntil };
}

// ─── POMODORO STAGE TRANSITIONS ───────────────────────────────────────────

async function handlePomodoroCycle() {
  const session = await getSession();
  if (!session || !session.isPomodoro) return;

  const now = Date.now();

  if (session.pomodoroStage === "focus") {
    // Transition to 5-min break
    session.pomodoroStage = "break";
    session.startedAt = now;
    session.endsAt = now + 5 * 60 * 1000;

    await setSession(session);
    await removeDnrRules(); // unblock during break!
    await chrome.alarms.create(ALARM_SESSION_END, { when: session.endsAt });
    await updateBadge(session);

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "CalmScroll — 5-Minute Break! ☕",
      message: `Cycle ${session.pomodoroCycle || 1} focus complete. Rest your eyes and stretch.`,
      priority: 2
    });
  } else {
    // Transition back to 25-min focus
    session.pomodoroStage = "focus";
    session.pomodoroCycle = (session.pomodoroCycle || 1) + 1;
    session.startedAt = now;
    session.endsAt = now + 25 * 60 * 1000;

    await setSession(session);
    await applyDnrRules(session.sites);
    await chrome.alarms.create(ALARM_SESSION_END, { when: session.endsAt });
    await updateBadge(session);

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: `CalmScroll — Starting Focus Cycle ${session.pomodoroCycle} 🎯`,
      message: `Break finished! Re-engaging focus on: "${session.goal}"`,
      priority: 2
    });
  }
}

// ─── ALARMS LISTENER ──────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_SESSION_END) {
    const session = await getSession();
    if (session && session.isPomodoro) {
      await handlePomodoroCycle();
    } else {
      console.log("[CalmScroll] Session-end alarm fired.");
      await endSession(true);
    }
  } else if (alarm.name === ALARM_WARDEN_END) {
    console.log("[CalmScroll] Warden-end alarm fired.");
    const session = await getSession();
    if (session?.wardenState) {
      session.wardenState = undefined;
      session.mode = "normal";
      await setSession(session);
    }
  } else if (alarm.name === ALARM_BADGE_TICK) {
    const session = await getSession();
    if (session) {
      await updateBadge(session);
    } else {
      await chrome.alarms.clear(ALARM_BADGE_TICK);
      await updateBadge(null);
    }
  } else if (alarm.name === ALARM_STUDY_PASS_END) {
    console.log("[CalmScroll] Study pass ended — re-engaging block.");
    const session = await getSession();
    if (session) {
      delete session.studyPassUntil;
      await setSession(session);
      await applyDnrRules(session.sites);
      await updateBadge(session);

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "CalmScroll — Study Pass Ended 🛑",
        message: "Distraction shield re-enabled. Back to your focus goal!",
        priority: 2
      });
    }
  }
});

// ─── RUNTIME MESSAGE HANDLER ──────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((err) => {
      const code = (err instanceof Error && "code" in err ? err.code : undefined) ?? "SERVICE_WORKER_ERROR";
      const msg = err instanceof Error ? err.message : "Unknown background error";
      sendResponse(makeErrorResponse(code, msg));
    });
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case "PING":
      return { type: "OK" };

    case "START_SESSION":
      await startSession(message.payload);
      return { type: "OK" };

    case "END_SESSION": {
      const session = await getSession();
      if (!session) {
        return makeErrorResponse("NO_ACTIVE_SESSION", "No session is running.");
      }
      if (session.mode === "warden" && session.wardenState) {
        const now = Date.now();
        if (now < session.wardenState.lockedUntil) {
          return makeErrorResponse("WARDEN_LOCKED", "Warden mode is active. You cannot end the session early.");
        }
      }
      await endSession(false);
      return { type: "OK" };
    }

    case "GET_SESSION": {
      const session = await getSession();
      const now = Date.now();
      const wardenActive = !!session?.wardenState && now < session.wardenState.lockedUntil;
      const wardenInterrupted = !!session?.wardenState?.interruptedAt;
      return {
        type: "GET_SESSION_RESPONSE",
        session,
        wardenActive,
        wardenInterrupted
      };
    }

    case "ACTIVATE_WARDEN": {
      const session = await getSession();
      if (!session) return makeErrorResponse("NO_ACTIVE_SESSION", "Start a session first.");
      if (message.payload.durationMs > WARDEN_MAX_MS) {
        return makeErrorResponse("WARDEN_DURATION_EXCEEDED", "Warden mode maximum is 12 hours.");
      }
      const now = Date.now();
      session.wardenState = { lockedUntil: now + message.payload.durationMs };
      session.mode = "warden";
      await setSession(session);
      await chrome.alarms.create(ALARM_WARDEN_END, { when: session.wardenState.lockedUntil });
      return { type: "OK" };
    }

    case "EXTEND_WARDEN": {
      const session = await getSession();
      if (!session?.wardenState) {
        return makeErrorResponse("NO_ACTIVE_SESSION", "No warden session found.");
      }
      const newLockedUntil = session.wardenState.lockedUntil + message.payload.additionalMs;
      session.wardenState.lockedUntil = newLockedUntil;
      session.endsAt = Math.max(session.endsAt, newLockedUntil);
      await setSession(session);
      await chrome.alarms.create(ALARM_WARDEN_END, { when: newLockedUntil });
      await chrome.alarms.create(ALARM_SESSION_END, { when: session.endsAt });
      return { type: "OK" };
    }

    case "REQUEST_STUDY_PASS": {
      const result = await requestStudyPass(message.payload?.minutes || 5);
      return { type: "OK", endsAt: result.endsAt };
    }

    case "GET_STATS": {
      const stats = await getStats();
      return { type: "GET_STATS_RESPONSE", stats };
    }

    case "INCREMENT_DEFLECTION": {
      await incrementDeflection();
      return { type: "OK" };
    }

    case "INCREMENT_POST_SHIELDED": {
      await incrementPostShielded();
      return { type: "OK" };
    }

    case "RESET_DEMO": {
      await endSession(false);
      await chrome.storage.local.remove(STORAGE_KEY_SETTINGS);
      console.log("[CalmScroll] Demo reset complete.");
      return { type: "OK" };
    }

    case "CLASSIFY": {
      const data = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
      const settings = data[STORAGE_KEY_SETTINGS] ?? {
        classifierMode: "rules",
        selectedTopics: ["politics", "violence", "celebrity"]
      };
      const result = await classify(message.payload.text, settings);
      return { type: "CLASSIFY_RESPONSE", result };
    }

    case "GET_SITES": {
      const data = await chrome.storage.local.get(STORAGE_KEY_CUSTOM_SITES);
      const sites = data[STORAGE_KEY_CUSTOM_SITES] || DEFAULT_SITES;
      return { type: "GET_SITES_RESPONSE", sites };
    }

    case "SAVE_SITES": {
      if (Array.isArray(message.payload?.sites)) {
        await chrome.storage.local.set({ [STORAGE_KEY_CUSTOM_SITES]: message.payload.sites });
        // If an active session is running and not in warden, update dynamic rules
        const session = await getSession();
        if (session && session.mode !== "warden") {
          session.sites = message.payload.sites;
          await setSession(session);
          await applyDnrRules(session.sites);
        }
      }
      return { type: "OK" };
    }

    default:
      return makeErrorResponse("UNKNOWN_MESSAGE", "Unknown message type.");
  }
}

// ─── LIFECYCLE LISTENERS ──────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log(`[CalmScroll] onInstalled (reason: ${reason})`);
  recoverSession().catch((e) => logError("SERVICE_WORKER_RESTART", "Recovery failed on install", e));
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[CalmScroll] onStartup");
  recoverSession().catch((e) => logError("SERVICE_WORKER_RESTART", "Recovery failed on startup", e));
});

recoverSession().catch((e) => logError("SERVICE_WORKER_RESTART", "Recovery failed on SW wake", e));

// ─── ERROR HELPERS ────────────────────────────────────────────────────────

function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function makeErrorResponse(code, message) {
  return { type: "ERROR", code, message };
}

function logError(code, context, err) {
  console.error(`[CalmScroll] ${code} — ${context}:`, err);
}
