/* Snout Booking JS - scoped to #snout-booking */
(() => {
  const root = document.getElementById('snout-booking');
  if (!root) return;

  // Auto resize support for an iframe parent like Webflow
  function postHeight(){
    try{
      const h = document.getElementById('snout-booking').scrollHeight + 20;
      if (window.parent) window.parent.postMessage({type:'snout-size', height:h}, '*');
    }catch(e){}
  }
  const __snoutRO = new ResizeObserver(postHeight);
  __snoutRO.observe(root);
  postHeight();

  const qs = (sel, el = root) => el.querySelector(sel);
  const qsa = (sel, el = root) => Array.from(el.querySelectorAll(sel));

  const steps = qsa('.sb-step');
  const stepDots = qsa('.sb-steps li');
  qsa('.sb-next').forEach(btn => btn.addEventListener('click', () => goto(btn.dataset.next)));
  qsa('.sb-prev').forEach(btn => btn.addEventListener('click', () => goto(btn.dataset.prev)));

  function goto(stepNum) {
    steps.forEach(s => s.classList.remove('is-active'));
    stepDots.forEach(d => d.classList.remove('is-active'));
    qs(`#step-${stepNum}`).classList.add('is-active');
    qs(`.sb-steps li[data-step="${stepNum}"]`).classList.add('is-active');
    postHeight();
  }

  let service = null;
  root.addEventListener('change', (e) => {
    if (e.target.name === 'service') {
      service = e.target.value;
      enforceServiceRules();
    }
  });

  function enforceServiceRules() {
    renderSelectedList();
    renderTimesRecap();
  }

  const daysGrid = qs('#sb-days');
  const monthLabel = qs('#sb-month-label');
  const selectedList = qs('#sb-selected-list');
  const toTimesBtn = qs('#to-times');
  const toContactBtn = qs('#to-contact');

  let viewDate = new Date();
  viewDate.setDate(1);
  let selectedDates = [];
  const timesByDate = {};

  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function pretty(d){ return d.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' }); }

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
        cell.classList.add('is-out');
        cell.disabled = true;
      } else {
        const day = i - startWeekday + 1;
        const dateObj = new Date(year, month, day);
        const id = iso(dateObj);
        cell.textContent = String(day);
        cell.setAttribute('aria-label', pretty(dateObj));
        if (selectedDates.includes(id)) {
          cell.classList.add('is-selected');
          cell.setAttribute('aria-pressed','true');
        } else {
          cell.setAttribute('aria-pressed','false');
        }
        cell.addEventListener('click', () => toggleDate(id, dateObj, cell));
        cell.addEventListener('keydown', (ev) => {
          if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); cell.click(); }
        });
      }
      daysGrid.appendChild(cell);
    }
    postHeight();
  }

  qs('.sb-nav.prev').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth()-1); buildCalendar(); });
  qs('.sb-nav.next').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth()+1); buildCalendar(); });

  function toggleDate(id, dateObj, cell) {
    const idx = selectedDates.indexOf(id);
    if (idx >= 0) selectedDates.splice(idx, 1);
    else selectedDates.push(id);

    if (!timesByDate[id]) {
      timesByDate[id] = { attached: true, duration: 30, times: [] };
    }

    cell.classList.toggle('is-selected');
    cell.setAttribute('aria-pressed', cell.classList.contains('is-selected') ? 'true' : 'false');

    renderSelectedList();
    toTimesBtn.disabled = selectedDates.length === 0;
  }

  function renderSelectedList() {
    selectedList.innerHTML = '';
    const showDates = [...selectedDates].sort();
    showDates.forEach(id => {
      if (service === 'house-sitting') {
        const first = showDates[0];
        const last = showDates[showDates.length - 1];
        if (id !== first && id !== last) return;
      }
      const li = document.createElement('li');
      li.className = 'sb-chip';
      const dateObj = new Date(id);
      li.innerHTML = `<span>${pretty(dateObj)}</span><button type="button" aria-label="Remove ${pretty(dateObj)}">&times;</button>`;
      li.querySelector('button').addEventListener('click', () => {
        selectedDates = selectedDates.filter(d => d !== id);
        renderSelectedList();
        buildCalendar();
        toTimesBtn.disabled = selectedDates.length === 0;
      });
      selectedList.appendChild(li);
    });
    postHeight();
  }

  const modal = document.getElementById('time-modal');
  const modalContent = modal.querySelector('.sb-modal-content');
  const timegrid = modal.querySelector('#timegrid');
  const modalDateEl = modal.querySelector('#modalDateDisplay');
  const saveTimesBtn = modal.querySelector('#save-times');
  const applyAll = document.getElementById('apply-all');
  let activeDate = null;
  let openerButton = null;

  function generateSlots(duration) {
    const slots = [];
    const start = 8 * 60;
    const end = 20 * 60;
    const step = 30;
    for (let m = start; m <= end; m += step) {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      slots.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    }
    return slots;
  }

  function openTimes(id, opener) {
    activeDate = id;
    openerButton = opener || null;
    const d = new Date(id);
    modalDateEl.textContent = pretty(d);

    const state = timesByDate[id] || { attached: true, duration: 30, times: [] };
    modal.querySelectorAll('.sb-toggle-btn').forEach(btn => {
      const isActive = Number(btn.dataset.duration) === Number(state.duration);
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    timegrid.innerHTML = '';
    const slots = generateSlots(state.duration);
    slots.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sb-time';
      b.textContent = t;
      b.setAttribute('aria-pressed', state.times.includes(t) ? 'true' : 'false');
      if (state.times.includes(t)) b.classList.add('is-selected');
      b.addEventListener('click', () => {
        if (b.classList.contains('is-selected')) {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed','false');
          state.times = state.times.filter(x => x !== t);
        } else {
          b.classList.add('is-selected');
          b.setAttribute('aria-pressed','true');
          state.times.push(t);
        }
      });
      timegrid.appendChild(b);
    });

    modal.hidden = false;
    const prevActive = document.activeElement;
    root.setAttribute('aria-hidden', 'true');
    modalContent.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.hidden = true;
    root.removeAttribute('aria-hidden');
    document.body.style.overflow = '';
    if (openerButton && typeof openerButton.focus === 'function') openerButton.focus();
  }

  modal.querySelectorAll('.sb-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.sb-toggle-btn').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed','true');
      const state = timesByDate[activeDate] || { attached:true, duration:30, times:[] };
      state.duration = Number(btn.dataset.duration);
      timesByDate[activeDate] = state;
      openTimes(activeDate);
    });
  });

  saveTimesBtn.addEventListener('click', () => {
    const selected = Array.from(modal.querySelectorAll('.sb-time.is-selected')).map(b => b.textContent);
    const durationBtn = modal.querySelector('.sb-toggle-btn.is-active');
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
    const focusables = Array.from(modalContent.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.getElementById('to-times').addEventListener('click', () => {
    renderTimesRecap();
    goto(3);
    toContactBtn.disabled = !canContinueToContact();
  });

  function canContinueToContact() {
    if (selectedDates.length === 0) return false;
    if (service === 'house-sitting') {
      if (selectedDates.length < 2) return false;
      return true;
    }
    const first = [...selectedDates].sort()[0];
    return Boolean(timesByDate[first] && timesByDate[first].times.length);
  }

  function pill(text) {
    const el = document.createElement('span');
    el.className = 'sb-pill';
    el.textContent = text;
    return el;
  }

  function renderTimesRecap() {
    const wrap = document.getElementById('times-recap');
    wrap.innerHTML = '';
    const sorted = [...selectedDates].sort();
    sorted.forEach(id => {
      if (service === 'house-sitting') {
        const first = sorted[0], last = sorted[sorted.length - 1];
        if (id !== first && id !== last) return;
      }
      const card = document.createElement('div');
      card.className = 'sb-date-card';
      const header = document.createElement('div');
      header.className = 'sb-date-title';
      const title = document.createElement('span');
      title.textContent = pretty(new Date(id));
      const edit = document.createElement('button');
      edit.className = 'sb-btn';
      edit.type = 'button';
      edit.textContent = 'Edit times';
      edit.addEventListener('click', () => openTimes(id, edit));
      header.append(title, edit);

      const pills = document.createElement('div');
      const state = timesByDate[id] || { duration:30, times:[] };
      if (service === 'house-sitting') {
        pills.appendChild(pill('Overnight'));
      } else if (state.times.length) {
        state.times.forEach(t => pills.appendChild(pill(`${t} • ${state.duration}m`)));
      } else {
        pills.appendChild(pill('No times yet'));
      }

      card.append(header, pills);
      wrap.appendChild(card);
    });
    postHeight();
  }

  document.getElementById('sb-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      service,
      dates: [...selectedDates].sort(),
      times: Object.fromEntries(Object.entries(timesByDate).map(([k,v]) => [k, { duration: v.duration, times: v.times }])),
      contact: {
        fullName: document.getElementById('full-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        notes: document.getElementById('notes').value.trim(),
      }
    };
    console.log('Booking payload', payload);
    alert('Submitted. Open devtools to see payload.');
  });

  buildCalendar();
})();