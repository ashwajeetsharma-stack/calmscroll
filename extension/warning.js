/* warning.js — CalmScroll distraction blocker controller */
'use strict';

var COACHING = {
  stuck: 'That makes complete sense. Try the rubber-duck method: explain the problem out loud in simple words. Often the breakthrough appears mid-sentence without needing social media.',
  bored: 'Boredom is normal during deep cognitive work. Try the 5-minute rule: commit to just 5 more minutes of your task. The urge to scroll typically dissolves once your working memory re-engages.',
  check: '"Just checking" is the most insidious dopamine trap. There is almost certainly nothing urgent waiting for you. Your real goal is waiting.',
  skip:  'No judgement. Close this tab and return gently to your focus.'
};

/* ─── Quote photo slides ─── */
var QUOTE_SLIDES = [
  {
    image:  'images/quote1.svg',
    text:   '"Where your attention goes, your life goes."',
    attrib: ''
  },
  {
    image:  'images/quote2.svg',
    text:   '"Deep work is the superpower of the 21st century."',
    attrib: '— Cal Newport'
  },
  {
    image:  'images/quote3.svg',
    text:   '"Action precedes motivation, not the other way around."',
    attrib: ''
  },
  {
    image:  'images/quote4.svg',
    text:   '"The ability to resist a short-term impulse creates long-term freedom."',
    attrib: ''
  },
  {
    image:  'images/quote5.svg',
    text:   '"Focus is not about saying yes — it is about saying no to a thousand things."',
    attrib: '— Steve Jobs'
  }
];

var currentSlide    = 0;
var slideTimer      = null;
var SLIDE_INTERVAL  = 9000;

function setSlide(index) {
  currentSlide = (index + QUOTE_SLIDES.length) % QUOTE_SLIDES.length;
  var slide    = QUOTE_SLIDES[currentSlide];

  var bg     = document.getElementById('quoteBg');
  var qText  = document.getElementById('quoteText');
  var qAttrib= document.getElementById('quoteAttrib');
  var qContent = document.getElementById('quoteContent');
  var dots   = document.querySelectorAll('.qdot');

  // Fade out content, swap, fade in
  if (qContent) qContent.style.opacity = '0';
  if (bg)       bg.style.opacity = '0';

  setTimeout(function () {
    if (bg)      bg.style.backgroundImage = 'url(' + chrome.runtime.getURL(slide.image) + ')';
    if (qText)   qText.textContent = slide.text;
    if (qAttrib) qAttrib.textContent = slide.attrib;
    if (bg)      bg.style.opacity = '1';
    if (qContent){ qContent.style.opacity = '1'; }
  }, 400);

  dots.forEach(function (d, i) {
    d.classList.toggle('active', i === currentSlide);
  });
}

function buildDots() {
  var container = document.getElementById('quoteDots');
  if (!container) return;
  QUOTE_SLIDES.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'qdot' + (i === currentSlide ? ' active' : '');
    dot.setAttribute('aria-label', 'Quote ' + (i + 1));
    dot.addEventListener('click', function () {
      clearInterval(slideTimer);
      setSlide(i);
      startAutoSlide();
    });
    container.appendChild(dot);
  });
}

function startAutoSlide() {
  slideTimer = setInterval(function () {
    setSlide(currentSlide + 1);
  }, SLIDE_INTERVAL);
}

function initSlideshow() {
  currentSlide = Math.floor(Math.random() * QUOTE_SLIDES.length);
  buildDots();
  setSlide(currentSlide);
  startAutoSlide();
}

/* ─── Main init ─── */
function init() {
  var btnBack      = document.getElementById('btnBack');
  var btnReset     = document.getElementById('btnReset');
  var coaching     = document.getElementById('coaching');
  var goalBox      = document.getElementById('goalBox');
  var goalTxt      = document.getElementById('goalTxt');
  var passBox      = document.getElementById('passBox');
  var btnPass      = document.getElementById('btnPass');
  var wardenNote   = document.getElementById('wardenNote');
  var deflectBadge = document.getElementById('deflectBadge');

  // Kick off the background slideshow
  initSlideshow();

  // Increment deflection in stats
  chrome.runtime.sendMessage({ type: 'INCREMENT_DEFLECTION' });
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, function(resp) {
    if (resp && resp.stats && deflectBadge) {
      deflectBadge.textContent = '🛡️ Deflected ' + (resp.stats.todayDeflected || 1) + ' distraction' + (resp.stats.todayDeflected === 1 ? '' : 's') + ' today';
    }
  });

  if (btnBack) {
    btnBack.addEventListener('click', function() {
      history.back();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', function() {
      window.location.href = chrome.runtime.getURL('reset.html');
    });
  }

  // Check active session & warden status
  chrome.runtime.sendMessage({ type: 'GET_SESSION' }, function(resp) {
    var sess = resp && resp.session;
    if (sess) {
      if (sess.goal && goalBox && goalTxt) {
        goalBox.style.display = 'block';
        goalTxt.textContent = sess.goal;
      }

      if (passBox) {
        passBox.style.display = 'block';
        if (sess.mode === 'warden' || resp.wardenActive) {
          if (btnPass) btnPass.style.display = 'none';
          if (wardenNote) wardenNote.style.display = 'flex';
        } else {
          if (btnPass) {
            btnPass.style.display = 'block';
            btnPass.addEventListener('click', function() {
              btnPass.disabled = true;
              btnPass.textContent = 'Activating 5-Minute Study Pass…';
              chrome.runtime.sendMessage({ type: 'REQUEST_STUDY_PASS', payload: { minutes: 5 } }, function(passResp) {
                if (passResp && passResp.type === 'OK') {
                  history.back();
                } else {
                  alert('Could not start study pass.');
                  btnPass.disabled = false;
                }
              });
            });
          }
        }
      }
    }
  });

  // Coaching buttons
  var opts = ['stuck', 'bored', 'check', 'skip'];
  opts.forEach(function(key) {
    var btn = document.getElementById('opt-' + key);
    if (!btn) return;
    btn.addEventListener('click', function() {
      opts.forEach(function(k) {
        var b = document.getElementById('opt-' + k);
        if (b) b.classList.remove('sel');
      });
      btn.classList.add('sel');
      if (coaching) {
        coaching.textContent = COACHING[key] || '';
        coaching.style.display = 'block';
      }
      if (key === 'skip') {
        history.back();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
