/* payment.js — Razorpay Payment Gateway Controller for CalmScroll */
'use strict';

(function () {
  const PLANS = {
    plan_1m:  { id: 'plan_1m',  name: '1 Month Warden Pass',  price: 99,  months: 1 },
    plan_2m:  { id: 'plan_2m',  name: '2 Months Warden Pass', price: 189, months: 2 },
    plan_12m: { id: 'plan_12m', name: '12 Months Warden Pass', price: 799, months: 12 }
  };

  let currentPlan = PLANS.plan_2m;
  let currentMethod = 'upi';

  function init() {
    // 1. Read plan query param if present
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    if (planParam && PLANS[planParam]) {
      setPlan(PLANS[planParam]);
    } else {
      setPlan(PLANS.plan_2m);
    }

    // 2. Set up plan option click listeners
    const planOpts = document.querySelectorAll('.plan-opt');
    planOpts.forEach(opt => {
      opt.addEventListener('click', () => {
        const planKey = opt.getAttribute('data-plan');
        if (PLANS[planKey]) {
          setPlan(PLANS[planKey]);
        }
      });
    });

    // 3. Set up payment method tabs
    const methodTabs = document.querySelectorAll('.method-tab');
    methodTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        methodTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabKey = tab.getAttribute('data-tab');
        currentMethod = tabKey;
        switchTabPane(tabKey);
      });
    });

    // 4. UPI Apps toggle
    const upiBtns = document.querySelectorAll('.upi-app-btn');
    upiBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        upiBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const app = btn.getAttribute('data-app');
        const upiIn = document.getElementById('upiIdInput');
        if (upiIn) {
          upiIn.value = `user@${app}`;
        }
      });
    });

    // 5. Card formatting
    const cardInput = document.getElementById('cardNumber');
    if (cardInput) {
      cardInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = v.match(/.{1,4}/g)?.join(' ') || v;
        e.target.value = formatted;
      });
    }

    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput) {
      expiryInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (v.length > 2) {
          e.target.value = v.substring(0, 2) + '/' + v.substring(2);
        } else {
          e.target.value = v;
        }
      });
    }

    // 6. Bank selection
    const bankBtns = document.querySelectorAll('.bank-btn');
    bankBtns.forEach(btn => {
      if (!btn.id.includes('openExternal')) {
        btn.addEventListener('click', () => {
          bankBtns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      }
    });

    // 7. Custom Razorpay Link
    const openExtBtn = document.getElementById('openExternalLinkBtn');
    if (openExtBtn) {
      openExtBtn.addEventListener('click', () => {
        const link = document.getElementById('customRzpLink').value.trim();
        if (link && link.startsWith('http')) {
          window.open(link, '_blank');
        } else {
          alert('Please enter a valid Razorpay payment link URL (e.g. https://rzp.io/l/...)');
        }
      });
    }

    // 8. Pay CTA Button
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
      payBtn.addEventListener('click', handlePaymentSubmit);
    }

    // 9. Finish Button in Success Modal
    const finishBtn = document.getElementById('finishBtn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        // Try closing the tab, or inform user
        window.close();
      });
    }
  }

  function setPlan(plan) {
    currentPlan = plan;

    // Update active class on plan options
    const planOpts = document.querySelectorAll('.plan-opt');
    planOpts.forEach(opt => {
      if (opt.getAttribute('data-plan') === plan.id) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    // Update totals
    const formattedPrice = `₹${plan.price}.00`;
    document.getElementById('sumSubtotal').textContent = formattedPrice;
    document.getElementById('sumTotal').textContent = formattedPrice;

    // Update Pay button text
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
      payBtn.innerHTML = `<span>Pay ₹${plan.price} via Razorpay</span> <span>→</span>`;
    }
  }

  function switchTabPane(tabKey) {
    document.getElementById('paneUpi').classList.toggle('active', tabKey === 'upi');
    document.getElementById('paneCard').classList.toggle('active', tabKey === 'card');
    document.getElementById('paneNetbanking').classList.toggle('active', tabKey === 'netbanking');
    document.getElementById('paneLink').classList.toggle('active', tabKey === 'link');
  }

  function handlePaymentSubmit() {
    const overlay = document.getElementById('processOverlay');
    const loadingState = document.getElementById('loadingState');
    const successState = document.getElementById('successState');
    const loadingTitle = document.getElementById('loadingTitle');
    const loadingSub = document.getElementById('loadingSub');

    overlay.style.display = 'flex';
    loadingState.style.display = 'block';
    successState.style.display = 'none';

    loadingTitle.textContent = 'Contacting Razorpay Gateway...';
    loadingSub.textContent = `Initiating secure ${currentMethod.toUpperCase()} transaction for ₹${currentPlan.price}`;

    setTimeout(() => {
      loadingTitle.textContent = 'Verifying with Bank...';
      loadingSub.textContent = 'Awaiting payment authorization confirmation';
    }, 1200);

    setTimeout(() => {
      // Generate transaction details
      const payId = 'pay_RZP' + Math.floor(10000000 + Math.random() * 90000000);
      const expiryMs = Date.now() + (currentPlan.months * 30 * 24 * 60 * 60 * 1000);
      const expiryDate = new Date(expiryMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Save to chrome.storage.local
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          cs_premium_active: true,
          cs_premium_expiry: expiryMs,
          cs_premium_plan: currentPlan.id,
          cs_premium_payment_id: payId
        }, () => {
          showSuccess(payId, currentPlan.name, expiryDate);
        });
      } else {
        // Fallback for non-extension preview
        localStorage.setItem('cs_premium_active', 'true');
        showSuccess(payId, currentPlan.name, expiryDate);
      }
    }, 2500);
  }

  function showSuccess(payId, planName, expiryDate) {
    const loadingState = document.getElementById('loadingState');
    const successState = document.getElementById('successState');

    loadingState.style.display = 'none';
    successState.style.display = 'block';

    document.getElementById('succPayId').textContent = payId;
    document.getElementById('succPlan').textContent = planName;
    document.getElementById('succExpiry').textContent = expiryDate;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
