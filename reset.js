/* reset.js — CalmScroll 2-Minute Guided Reset */
'use strict';

var TOTAL_SECONDS = 120;
var secondsLeft = TOTAL_SECONDS;
var timerInterval = null;
var breathInterval = null;
var rainActive = false;

// Box Breathing cycle (4s Inhale, 4s Hold, 4s Exhale, 4s Rest)
var BREATH_PHASES = [
  { name: 'Inhale', duration: 4, cls: 'inhale', hint: 'Inhale gently through your nose' },
  { name: 'Hold',   duration: 4, cls: 'hold',   hint: 'Gently hold your breath' },
  { name: 'Exhale', duration: 4, cls: 'exhale', hint: 'Exhale slowly through your mouth' },
  { name: 'Rest',   duration: 4, cls: 'rest',   hint: 'Pause and rest in the stillness' }
];
var currentPhaseIdx = 0;
var phaseElapsed = 0;

function init() {
  var ringFg = document.getElementById('ringFg');
  var ringTxt = document.getElementById('ringTxt');
  var nextStep = document.getElementById('nextStep');
  var doneMsg = document.getElementById('doneMsg');
  var stepEcho = document.getElementById('stepEcho');
  var btnBack = document.getElementById('btnBack');
  var breathCircle = document.getElementById('breathCircle');
  var breathLabel = document.getElementById('breathLabel');
  var breathHint = document.getElementById('breathHint');
  var audioToggle = document.getElementById('audioToggle');
  var nextWrap = document.getElementById('nextWrap');

  // SVG circumference: 2 * PI * 75 ≈ 471.24
  var radius = 75;
  var circumference = 2 * Math.PI * radius;
  if (ringFg) {
    ringFg.style.strokeDasharray = circumference;
    ringFg.style.strokeDashoffset = 0;
  }

  // Audio Toggle
  if (audioToggle && window.CalmSound) {
    audioToggle.addEventListener('click', function() {
      rainActive = !rainActive;
      if (rainActive) {
        window.CalmSound.startBrownNoise(0.2);
        audioToggle.textContent = '🌧️ Rain Noise: On';
        audioToggle.style.borderColor = 'var(--color-accent)';
        audioToggle.style.color = 'var(--color-accent)';
      } else {
        window.CalmSound.stopBrownNoise();
        audioToggle.textContent = '🌧️ Rain Noise: Off';
        audioToggle.style.borderColor = '';
        audioToggle.style.color = '';
      }
    });
  }

  // Set initial breath state
  updateBreathState();

  // Run Breath Cycle (1-second tick)
  breathInterval = setInterval(function() {
    phaseElapsed++;
    var cur = BREATH_PHASES[currentPhaseIdx];
    if (phaseElapsed >= cur.duration) {
      phaseElapsed = 0;
      currentPhaseIdx = (currentPhaseIdx + 1) % BREATH_PHASES.length;
      updateBreathState();
    }
  }, 1000);

  function updateBreathState() {
    var phase = BREATH_PHASES[currentPhaseIdx];
    if (breathCircle) {
      breathCircle.className = 'breath-circle ' + phase.cls;
    }
    if (breathLabel) {
      breathLabel.textContent = phase.name;
    }
    if (breathHint) {
      breathHint.textContent = phase.hint;
    }
    if (window.CalmSound) {
      window.CalmSound.playBreathCue(phase.cls);
    }
  }

  // Run Main Countdown Timer (1-second tick)
  timerInterval = setInterval(function() {
    secondsLeft--;
    if (secondsLeft < 0) secondsLeft = 0;

    // Update digital text
    var m = Math.floor(secondsLeft / 60);
    var s = secondsLeft % 60;
    if (ringTxt) {
      ringTxt.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }

    // Update ring stroke offset
    if (ringFg) {
      var progress = (TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS;
      ringFg.style.strokeDashoffset = circumference * progress;
    }

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(breathInterval);

      // Play completion chime!
      if (window.CalmSound) {
        window.CalmSound.playChime(528);
      }

      if (doneMsg) doneMsg.style.display = 'block';
      if (nextWrap) nextWrap.style.display = 'none';

      var userText = nextStep && nextStep.value.trim();
      if (stepEcho) {
        stepEcho.textContent = userText || 'Return to task with fresh presence';
      }
    }
  }, 1000);

  if (btnBack) {
    btnBack.addEventListener('click', function() {
      if (window.CalmSound && rainActive) {
        window.CalmSound.stopBrownNoise();
      }
      history.back();
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
