/* Navigation: one slide per wheel step with throttle */
(function initNavigation() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dotNav = document.querySelector('.dot-nav');
  let currentIndex = 0;
  let isScrolling = false;

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, slides.length - 1));
    slides[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateDots();
  }

  function updateDots() {
    dotNav.innerHTML = '';
    slides.forEach((s, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === currentIndex ? ' active' : '');
      dot.title = s.dataset.title || `Slide ${i + 1}`;
      dot.addEventListener('click', () => goTo(i));
      dotNav.appendChild(dot);
    });
  }

  updateDots();

  window.addEventListener('wheel', (e) => {
    if (isScrolling) return;
    isScrolling = true;
    const delta = e.deltaY;
    if (delta > 0) goTo(currentIndex + 1); else if (delta < 0) goTo(currentIndex - 1);
    setTimeout(() => { isScrolling = false; }, 800);
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') goTo(currentIndex + 1);
    if (e.key === 'ArrowUp' || e.key === 'PageUp') goTo(currentIndex - 1);
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End') goTo(slides.length - 1);
  });

  // Keep the current index in sync on manual scroll (e.g., touch devices)
  let observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = slides.indexOf(entry.target);
        if (idx !== -1) { currentIndex = idx; updateDots(); }
      }
    });
  }, { threshold: 0.6 });

  slides.forEach((s) => observer.observe(s));
})();

/* Charts */
(function initCharts() {
  // Slide 6: Calibration data (matched to provided graph)
  const calibPoints = [
    { x: 0, y: 0.00 },
    { x: 0.5, y: 0.07 },
    { x: 1, y: 0.12 },
    { x: 2, y: 0.26 },
    { x: 5, y: 0.62 },
    { x: 10, y: 1.18 },
    { x: 15, y: 1.64 },
  ];

  const slope = 0.10944;
  const intercept = 0.03158;

  const calibCanvas = document.getElementById('calibrationChart');
  if (calibCanvas) {
    const ctx = calibCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Absorbance',
            data: calibPoints,
            backgroundColor: '#ffffff',
            borderColor: '#ffffff',
            pointStyle: 'rect',
            pointRadius: 5,
          },
          {
            label: 'Linear fit',
            type: 'line',
            data: Array.from({ length: 181 }, (_, i) => {
              const x = -2 + i * 0.1; return { x, y: slope * x + intercept };
            }),
            borderColor: 'rgba(200,0,0,0.9)',
            backgroundColor: 'rgba(0,0,0,0)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'linear',
            min: -2,
            max: 16,
            title: { display: true, text: 'Concentration (ppm)' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { stepSize: 2 }
          },
          y: {
            min: -0.2,
            max: 1.8,
            title: { display: true, text: 'Absorbance' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { stepSize: 0.2 }
          },
        },
        plugins: {
          legend: { labels: { color: '#e8eef4' } },
          title: { display: true, text: 'y = 0.10944x + 0.03158 • R² = 0.9964 • y is absorbance and x is concentration', color: '#e8eef4' },
        },
      },
    });
  }

  // Slide 6: 15 ppm Methylene Blue spectrum (line curve)
  const specCanvas = document.getElementById('spectrum15ppmChart');
  if (specCanvas) {
    const sctx = specCanvas.getContext('2d');
    // Match the provided plot more closely: 400–800 nm, two peaks (≈615 nm and ≈671 nm), sharp drop after ~695–700 nm
    const wl = Array.from({ length: 401 }, (_, i) => 400 + i); // 400–800 nm
    function gaussian(x, mu, sigma, amp) { return amp * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2)); }
    function logistic(x, x0, k, amp) { return amp / (1 + Math.exp(-(x - x0) / k)); }
    const data = wl.map((x) => {
      // low baseline rising slightly with wavelength (very small)
      const base = 0.02 + 0.05 / (1 + Math.exp(-(x - 520) / 40));
      // first smaller peak around ~615 nm
      const p1 = gaussian(x, 615, 14, 1.05);
      // main peak around 671 nm (highest)
      const p2 = gaussian(x, 671, 18, 1.55);
      // slight dip between peaks to form the valley around ~640 nm
      const valley = gaussian(x, 640, 10, 0.22);
      // sharp fall after ~697 nm
      const drop = logistic(x, 697, 2.6, 0.40);
      const y = base + p1 + p2 - valley - drop;
      // keep tail visible up to 800 nm, do not go below baseline
      return Math.max(0, y);
    });

    new Chart(sctx, {
      type: 'line',
      data: { labels: wl, datasets: [{ label: '15 ppm Methylene Blue', data, borderColor: 'rgba(255,255,255,0.65)', borderWidth: 1.6, pointRadius: 0, tension: 0.25 }] },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Wavelength (nm)' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 400, max: 800 },
          y: { title: { display: true, text: 'Absorbance' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: -0.2, max: 1.8 },
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: '15 ppm Methylene Blue', color: '#e8eef4' },
          annotation: {
            annotations: {
              peak671: {
                type: 'line', xMin: 671, xMax: 671, borderColor: 'rgba(255,255,255,0.35)', borderWidth: 1,
                label: { display: true, content: '671 nm', color: '#e8eef4', backgroundColor: 'rgba(0,0,0,0.5)' }
              }
            }
          }
        }
      }
    });
  }

  // Slide 7: Spectra (synthetic multi-peak curves) and Concentration vs Time
  const spectraCanvas = document.getElementById('spectraChart');
  if (spectraCanvas) {
    const ctx = spectraCanvas.getContext('2d');
    // Generate synthetic spectra lines with decreasing peak heights
    const wavelengths = Array.from({ length: 121 }, (_, i) => 500 + i); // 500–620 nm
    function gaussian(x, mu, sigma) { return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2)); }
    const times = [0, 30, 60, 90, 120];
    const colors = ['#63b3ed', '#4fd1c5', '#f6ad55', '#f56565', '#9f7aea'];
    const datasets = times.map((t, idx) => {
      const amp = 1.0 - idx * 0.15; // decreasing peaks
      const mu = 671; // peak wavelength
      const sigma = 10 + idx * 2;
      const data = wavelengths.map((wl) => amp * gaussian(wl, mu, sigma));
      return {
        label: `${t} min`,
        data,
        borderColor: colors[idx % colors.length],
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      };
    });

    new Chart(ctx, {
      type: 'line',
      data: { labels: wavelengths, datasets },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Wavelength (nm)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Absorbance (a.u.)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
        plugins: {
          legend: { labels: { color: '#e8eef4' } },
          annotation: {
            annotations: {
              peakLine: {
                type: 'line', xMin: 671, xMax: 671, borderColor: 'rgba(0,119,200,0.7)', borderWidth: 2,
                label: { display: true, content: '671 nm', color: '#e8eef4', backgroundColor: 'rgba(0,0,0,0.5)', position: 'start' }
              }
            }
          }
        },
      },
    });
  }

  // Slide 7: Concentration vs Time (new)
  const concCanvas7 = document.getElementById('concTimeChartSlide7');
  if (concCanvas7) {
    const ctx = concCanvas7.getContext('2d');
    const timesMin = [0, 15, 45, 75, 105, 135];
    const concs = [8.92, 8.79, 6.96, 5.17, 4.07, 3.27];
    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'MB Concentration',
          data: timesMin.map((t, i) => ({ x: t, y: concs[i] })),
          backgroundColor: '#ffffff',
          borderColor: '#ffffff',
          pointStyle: 'rect',
          pointRadius: 5,
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { type: 'linear', min: -20, max: 165, title: { display: true, text: 'Time (min)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { min: 2.5, max: 9.5, title: { display: true, text: 'Methylene Blue Concentration (mg/L)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Methylene Blue (15 mg/L, 6mL) + AuNPs (4 mL) with LED (525nm)', color: '#e8eef4' },
          tooltip: { enabled: false },
          datalabels: { align: 'top', anchor: 'end', color: '#e8eef4', formatter: (v) => v.y.toFixed(2).replace('.', ','), offset: 6 }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // Slide 8: Kinetics ln(C) vs time and fit
  const kinCanvas = document.getElementById('kineticsChart');
  if (kinCanvas) {
    const ctx = kinCanvas.getContext('2d');
    const t = [0, 15, 45, 75, 105, 135];
    const C = [8.92, 8.79, 6.96, 5.17, 4.07, 3.27];
    const lnC = C.map((v) => Math.log(v));

    // Least squares fit for y = a + b x
    function linreg(x, y) {
      const n = x.length;
      const sx = x.reduce((s, v) => s + v, 0);
      const sy = y.reduce((s, v) => s + v, 0);
      const sxx = x.reduce((s, v) => s + v * v, 0);
      const sxy = x.reduce((s, v, i) => s + v * y[i], 0);
      const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const a = (sy - b * sx) / n;
      // R^2
      const yhat = x.map((xi) => a + b * xi);
      const ybar = sy / n;
      const ssTot = y.reduce((s, yi) => s + Math.pow(yi - ybar, 2), 0);
      const ssRes = y.reduce((s, yi, i) => s + Math.pow(yi - yhat[i], 2), 0);
      const r2 = 1 - ssRes / ssTot;
      return { a, b, r2 };
    }

    const fit = linreg(t, lnC);
    const fitLine = Array.from({ length: 136 }, (_, i) => ({ x: i, y: fit.a + fit.b * i }));

    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'ln(C) data', data: t.map((ti, i) => ({ x: ti, y: lnC[i] })), backgroundColor: 'rgba(99,179,237,0.9)', borderColor: '#63b3ed', pointRadius: 4 },
          { label: 'Linear fit', type: 'line', data: fitLine, borderColor: '#63b3ed', backgroundColor: 'rgba(99,179,237,0.15)', borderWidth: 2, fill: false, pointRadius: 0 }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Time (min)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'ln(C)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
        plugins: {
          legend: { labels: { color: '#e8eef4' } },
          title: { display: true, text: `Fit slope = ${fit.b.toFixed(5)} → k ≈ ${(-fit.b).toFixed(5)} min⁻¹`, color: '#e8eef4' }
        },
      },
    });

    // Update displayed k and R²
    const kVal = document.getElementById('kVal');
    const r2Val = document.getElementById('r2Val');
    if (kVal) kVal.textContent = `${(-fit.b).toFixed(5)} min⁻¹`;
    if (r2Val) r2Val.textContent = fit.r2.toFixed(4);

    // removed small concChart2 per request
  }
})();

/* Hero animated particle network */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let width = 0, height = 0, particles = [];
  const NUM = 70;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initParticles() {
    particles = Array.from({ length: NUM }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
      r: rand(1.2, 2.2),
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    // draw links
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        const maxD2 = 150 * 150;
        if (d2 < maxD2) {
          const a = 1 - d2 / maxD2;
          ctx.strokeStyle = `rgba(0,119,200,${0.25 * a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    // draw particles
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(step);
  }

  resize(); initParticles(); step();
  window.addEventListener('resize', () => { resize(); initParticles(); });
})();

/* AQY calculator ties to slide 8 and dashboard */
(function initAQY() {
  const el = (id) => document.getElementById(id);
  const mbMol = el('mbMol');
  const timeSec = el('timeSec');
  const powerW = el('powerW');
  const lambdaNm = el('lambdaNm');
  const aqyVal = el('aqyVal');
  const aqyVal2 = document.getElementById('aqyVal2');
  const aqyBarFill = document.getElementById('aqyBarFill');
  const kGaugeVal = document.getElementById('kGaugeVal');
  const kGaugeNeedle = document.getElementById('kGaugeNeedle');
  const mbMolDisp = el('mbMolDisp');
  const timeSecDisp = el('timeSecDisp');
  const powerWDisp = el('powerWDisp');
  const lambdaNmDisp = el('lambdaNmDisp');
  if (!mbMol || !timeSec || !powerW || !lambdaNm) return;

  function computeAQY() {
    const nMB = parseFloat(mbMol.value || '0'); // mol
    const t = parseFloat(timeSec.value || '0'); // s
    const P = parseFloat(powerW.value || '0'); // W
    const lambda = parseFloat(lambdaNm.value || '0'); // nm

    const h = 6.62607015e-34; // J s
    const c = 2.99792458e8; // m/s
    const E = (h * c) / (lambda * 1e-9); // J/photon
    const photonsPerSec = P / E; // photons/s
    const photonsTotal = photonsPerSec * t; // photons
    const moleculesDegraded = nMB * 6.02214076e23; // mol → molecules
    const aqy = (moleculesDegraded / photonsTotal) * 100; // % (no absorption factor)

    const display = isFinite(aqy) && aqy > 0 ? `${aqy.toExponential(2)} %` : '—';
    aqyVal.textContent = display;
    if (aqyVal2) aqyVal2.textContent = display;

    // update parameter table live
    if (mbMolDisp) mbMolDisp.textContent = isFinite(nMB) ? `${nMB.toExponential(2)}` : '—';
    if (timeSecDisp) timeSecDisp.textContent = isFinite(t) ? `${t}` : '—';
    if (powerWDisp) powerWDisp.textContent = isFinite(P) ? `${P}` : '—';
    if (lambdaNmDisp) lambdaNmDisp.textContent = isFinite(lambda) ? `${(lambda * 1e-9).toExponential(2)}` : '—';

    // AQY bar fill (cap at 100%) – scale exponential small values for visibility
    if (aqyBarFill) {
      const percent = Math.min(100, Math.max(0, aqy * 5e4)); // heuristic scaling for small AQY
      aqyBarFill.style.width = `${percent}%`;
    }
  }

  ['input', 'change'].forEach((ev) => {
    mbMol.addEventListener(ev, computeAQY);
    timeSec.addEventListener(ev, computeAQY);
    powerW.addEventListener(ev, computeAQY);
    lambdaNm.addEventListener(ev, computeAQY);
  });

  computeAQY();

  // Initialize k gauge from kinetics chart results if available
  const kText = document.getElementById('kVal');
  if (kText && kGaugeVal && kGaugeNeedle) {
    const k = parseFloat(kText.textContent); // min^-1
    if (!isNaN(k)) {
      kGaugeVal.textContent = k.toFixed(5);
      // Map k to angle range [-80deg, 80deg] for a dial
      const kMin = 0.0, kMax = 0.02;
      const angle = -80 + Math.max(0, Math.min(1, (k - kMin) / (kMax - kMin))) * 160;
      kGaugeNeedle.style.setProperty('--angle', `${angle}deg`);
    }
  }
})();


