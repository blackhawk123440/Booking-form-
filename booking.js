/* Snout Booking JS - v1.0.1 with dynamic height messaging */
(() => {
  const root = document.getElementById('snout-booking');
  if (!root) return;

  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const postSize = () => {
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      root.offsetHeight + 24
    );
    window.parent?.postMessage({ type: 'snout-size', height }, '*');
  };
  const postSizeDebounced = (() => { let t; return () => { clearTimeout(t); t = setTimeout(postSize, 60); }; })();
  const ro = new ResizeObserver(postSizeDebounced); ro.observe(root);

  const steps = qsa('.sb-step', root);
  const stepDots = qsa('.sb-steps li', root);
  qsa('.sb-next', root).forEach(btn => btn.addEventListener('click', () => goto(btn.dataset.next)));
  qsa('.sb-prev', root).forEach(btn => btn.addEventListener('click', () => goto(btn.dataset.prev)));

  function goto(stepNum) {
    steps.forEach(s => s.classList.remove('is-active'));
    stepDots.forEach(d => d.classList.remove('is-active'));
    qs(`#step-${stepNum}`, root).classList.add('is-active');
    qs(`.sb-steps li[data-step="${stepNum}"]`, root).classList.add('is-active');
    postSizeDebounced();
  }

  let service = null;
  root.addEventListener('change', (e) => {
    if (e.target.name === 'service') {
      service = e.target.value;
      enforceServiceRules();
    }
  });

  function enforceServiceRules() { renderSelectedList(); renderTimesRecap(); postSizeDebounced(); }

  const daysGrid = qs('#sb-days', root);
  const monthLabel = qs('#sb-month-label', root);
  const selectedList = qs('#sb-selected-list', root);
  const toTimesBtn = qs('#to-times', root);
  const toContactBtn = qs('#to-contact', root);

  let viewDate = new Date(); viewDate.setDate(1);
  let selectedDates = [];
  const timesByDate = {};

  const pad = n => String(n).padStart(2,'0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const pretty = d => d.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });

  function buildCalendar() {
    daysGrid.innerHTML = '';
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    monthLabel.textContent = viewDate.toLocaleDateString(undefined, { month:'long', year:'numeric' });

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay();
    const totalCells = startWeekday + last.getDate();

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'sb-day';
      cell.setAttribute('role','gridcell');

      if (i < startWeekday) {
        cell.classList.add('is-out'); cell.disabled = true;
      } else {
        const day = i - startWeekday + 1;
        const dateObj = new Date(year, month, day);
        const id = iso(dateObj);
        cell.textContent = String(day);
        cell.setAttribute('aria-label', pretty(dateObj));
        if (selectedDates.includes(id)) { cell.classList.add('is-selected'); cell.setAttribute('aria-pressed','true'); }
        else { cell.setAttribute('aria-pressed','false'); }
        cell.addEventListener('click', () => toggleDate(id, dateObj, cell));
        cell.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); cell.click(); } });
      }
      daysGrid.appendChild(cell);
    }
    postSizeDebounced();
  }

  qs('.sb-nav.prev', root).addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth()-1); buildCalendar(); });
  qs('.sb-nav.next', root).addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth()+1); buildCalendar(); });

  function toggleDate(id, dateObj, cell) {
    const idx = selectedDates.indexOf(id);
    if (idx >= 0) selectedDates.splice(idx, 1);
    else selectedDates.push(id);

    if (!timesByDate[id]) timesByDate[id] = { attached: true, duration: 30, times: [] };

    cell.classList.toggle('is-selected');
    cell.setAttribute('aria-pressed', cell.classList.contains('is-selected') ? 'true' : 'false');

    renderSelectedList();
    toTimesBtn.disabled = selectedDates.length === 0;
    postSizeDebounced();
  }

  function renderSelectedList() {
    selectedList.innerHTML = '';
    const showDates = [...selectedDates].sort();
    showDates.forEach(id => {
      if (service === 'house-sitting') {
        const first = showDates[0]; const last = showDates[showDates.length - 1];
        if (id !== first && id !== last) return;
      }
      const li = document.createElement('li');
      li.className = 'sb-chip';
      const dateObj = new Date(id);
      li.innerHTML = `<span>${pretty(dateObj)}</span><button type="button" aria-label="Remove ${pretty(dateObj)}">&times;</button>`;
      li.querySelector('button').addEventListener('click', () => {
        selectedDates = selectedDates.filter(d => d !== id);
        renderSelectedList(); buildCalendar();
        toTimesBtn.disabled = selectedDates.length === 0;
        postSizeDebounced();
      });
      selectedList.appendChild(li);
    });
  }

  const modal = qs('#time-modal');
  const modalContent = qs('.sb-modal-content', modal);
  const timegrid = qs('#timegrid', modal);
  const modalDateEl = qs('#modalDateDisplay', modal);
  const saveTimesBtn = qs('#save-times', modal);
  const applyAll = qs('#apply-all', root);
  let activeDate = null;
  let openerButton = null;

  function generateSlots(duration) {
    const slots = [];
    const start = 8 * 60, end = 20 * 60, step = 30;
    for (let m = start; m <= end; m += step) {
      const hh = Math.floor(m / 60), mm = m % 60;
      slots.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    }
    return slots;
  }

  function openTimes(id, opener) {
    activeDate = id; openerButton = opener || null;
    const d = new Date(id);
    modalDateEl.textContent = pretty(d);

    const state = timesByDate[id] || { attached: true, duration: 30, times: [] };
    qsa('.sb-toggle-btn', modal).forEach(btn => {
      const isActive = Number(btn.dataset.duration) === Number(state.duration);
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    timegrid.innerHTML = '';
    const slots = generateSlots(state.duration);
    slots.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sb-time'; b.textContent = t;
      b.setAttribute('aria-pressed', state.times.includes(t) ? 'true' : 'false');
      if (state.times.includes(t)) b.classList.add('is-selected');
      b.addEventListener('click', () => {
        if (b.classList.contains('is-selected')) { b.classList.remove('is-selected'); b.setAttribute('aria-pressed','false'); state.times = state.times.filter(x => x !== t); }
        else { b.classList.add('is-selected'); b.setAttribute('aria-pressed','true'); state.times.push(t); }
      });
      timegrid.appendChild(b);
    });

    modal.hidden = false;
    root.setAttribute('aria-hidden', 'true');
    modalContent.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.hidden = true;
    root.removeAttribute('aria-hidden');
    document.body.style.overflow = '';
    if (openerButton && typeof openerButton.focus === 'function') openerButton.focus();
    postSizeDebounced();
  }

  qsa('.sb-toggle-btn', modal).forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.sb-toggle-btn', modal).forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('is-active'); btn.setAttribute('aria-pressed','true');
      const state = timesByDate[activeDate] || { attached:true, duration:30, times:[] };
      state.duration = Number(btn.dataset.duration);
      timesByDate[activeDate] = state;
      openTimes(activeDate);
    });
  });

  saveTimesBtn.addEventListener('click', () => {
    const selected = qsa('.sb-time.is-selected', modal).map(b => b.textContent);
    const durationBtn = qs('.sb-toggle-btn.is-active', modal);
    const duration = durationBtn ? Number(durationBtn.dataset.duration) : 30;
    timesByDate[activeDate] = timesByDate[activeDate] || { attached:true, duration, times:[] };
    timesByDate[activeDate].times = [...selected];
    timesByDate[activeDate].duration = duration;
    if (applyAll.checked) {
      const canonical = { duration, times: [...selected] };
      selectedDates.forEach(id => {
        timesByDate[id] = timesByDate[id] || { attached:true, duration, times:[] };
        if (id !== activeDate) {
          timesByDate[id].attached = true;
          timesByDate[id].duration = canonical.duration;
          timesByDate[id].times = [...canonical.times];
        }
      });
    } else {
      if (timesByDate[activeDate]) timesByDate[activeDate].attached = false;
    }
    renderTimesRecap();
    toContactBtn.disabled = !canContinueToContact();
    closeModal();
  });

  modal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (!modal.hidden && e.key === 'Escape') closeModal(); });

  modalContent.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modalContent).filter(el => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const first = focusables[0]; const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  qs('#to-times', root).addEventListener('click', () => { renderTimesRecap(); goto(3); toContactBtn.disabled = !canContinueToContact(); });

  function canContinueToContact() {
    if (selectedDates.length === 0) return false;
    if (service === 'house-sitting') { return selectedDates.length >= 2; }
    const first = [...selectedDates].sort()[0];
    return Boolean(timesByDate[first] && timesByDate[first].times.length);
  }

  function pill(text) { const el = document.createElement('span'); el.className = 'sb-pill'; el.textContent = text; return el; }

  function renderTimesRecap() {
    const wrap = qs('#times-recap', root);
    wrap.innerHTML = '';
    const sorted = [...selectedDates].sort();
    sorted.forEach(id => {
      if (service === 'house-sitting') {
        const first = sorted[0], last = sorted[sorted.length - 1];
        if (id !== first && id !== last) return;
      }
      const card = document.createElement('div');
      card.className = 'sb-date-card';
      const header = document.createElement('div'); header.className = 'sb-date-title';
      const title = document.createElement('span'); title.textContent = pretty(new Date(id));
      const edit = document.createElement('button'); edit.className = 'sb-btn'; edit.type = 'button'; edit.textContent = 'Edit times';
      edit.addEventListener('click', () => openTimes(id, edit));
      header.append(title, edit);

      const pills = document.createElement('div');
      const state = timesByDate[id] || { duration:30, times:[] };
      if (service === 'house-sitting') { pills.appendChild(pill('Overnight')); }
      else if (state.times.length) { state.times.forEach(t => pills.appendChild(pill(`${t} • ${state.duration}m`))); }
      else { pills.appendChild(pill('No times yet')); }

      card.append(header, pills);
      wrap.appendChild(card);
    });
    postSizeDebounced();
  }

  qs('#sb-form', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      service,
      dates: [...selectedDates].sort(),
      times: Object.fromEntries(Object.entries(timesByDate).map(([k,v]) => [k, { duration: v.duration, times: v.times }])),
      contact: {
        fullName: qs('#full-name', root).value.trim(),
        email: qs('#email', root).value.trim(),
        phone: qs('#phone', root).value.trim(),
        notes: qs('#notes', root).value.trim(),
      }
    };
    console.log('Booking payload', payload);
    alert('Submitted. Open devtools to see payload.');
  });

  buildCalendar();
  window.addEventListener('load', postSizeDebounced);
  window.addEventListener('resize', postSizeDebounced);
  setTimeout(postSizeDebounced, 120);
})();