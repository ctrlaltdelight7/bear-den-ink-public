(() => {
  const dialog = document.querySelector('#consultation');
  const successDialog = document.querySelector('#booking-success');
  const form = document.querySelector('#consultation-form');
  const steps = [...document.querySelectorAll('.step')];
  const progressBar = document.querySelector('#progress-bar');
  const progressLabel = document.querySelector('#progress-label');
  const stepNumber = document.querySelector('#step-number');
  const backBtn = document.querySelector('#back-btn');
  const nextBtn = document.querySelector('#next-btn');
  const error = document.querySelector('#form-error');
  const summary = document.querySelector('#summary');
  const idea = document.querySelector('#idea');
  const appointmentDate = document.querySelector('[name="appointment_date"]');
  const appointmentTime = document.querySelector('[name="appointment_time"]');
  const availabilityStatus = document.querySelector('#availability-status');
  const calendarGrid = document.querySelector('#calendar-grid');
  const calendarLabel = document.querySelector('#calendar-label');
  const calendarPrev = document.querySelector('#calendar-prev');
  const calendarNext = document.querySelector('#calendar-next');
  const timeDialog = document.querySelector('#time-picker');
  const timeDialogClose = document.querySelector('#time-picker-close');
  const timeDialogDate = document.querySelector('#time-picker-date');
  const timeOptions = document.querySelector('#time-options');
  const timeDialogStatus = document.querySelector('#time-picker-status');
  const total = steps.length;
  const UNSAFE_TEXT_RE = /[<>\u0000-\u001f\u007f]/;
  const SIZE_RE = /^(?:i['’]m open|open|(?:\d+(?:\.\d{1,2})?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:in|inch|inches))$/i;
  let current = 1;
  let submitting = false;
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const apiBase = (window.BEAR_DEN_BOOKING_API || '/api').replace(/\/$/, '');
  const open = () => {
    current = 1;
    submitting = false;
    form.reset();
    const today = new Date();
    appointmentDate.min = localDateValue(today);
    calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCalendar();
    appointmentTime.innerHTML = '<option value="">Choose a date first</option>';
    appointmentTime.disabled = true;
    timeOptions.replaceChildren();
    timeDialogStatus.textContent = '';
    availabilityStatus.textContent = 'Choose a date to see available appointment times.';
    nextBtn.disabled = false;
    error.textContent = '';
    nextBtn.innerHTML = 'Continue <span>→</span>';
    render();
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
  };
  const close = () => {
    dialog.close();
    dialog.removeAttribute('open');
    document.body.classList.remove('modal-open');
  };
  const showSuccess = () => {
    close();
    window.scrollTo(0, 0);
    if (!successDialog.open) successDialog.showModal();
    document.body.classList.add('modal-open');
  };
  const closeSuccess = () => {
    successDialog.close();
    successDialog.removeAttribute('open');
    document.body.classList.remove('modal-open');
  };
  document.querySelectorAll('[data-open-consultation]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); open(); }));
  document.querySelector('[data-close-consultation]').addEventListener('click', e => { e.preventDefault(); close(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
  successDialog.addEventListener('click', e => { if (e.target === successDialog) closeSuccess(); });
  successDialog.querySelector('[data-close-success]').addEventListener('click', closeSuccess);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && timeDialog.open) return; if (e.key === 'Escape' && dialog.open && !submitting) close(); });
  timeDialogClose.addEventListener('click', () => timeDialog.close());
  timeDialog.addEventListener('click', e => { if (e.target === timeDialog) timeDialog.close(); });

  function value(name) { return form.querySelector(`[name="${name}"]:checked`)?.value || ''; }
  function field(name) { return form.querySelector(`[name="${name}"]`)?.value.trim() || ''; }
  function selected(name) { return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(x => x.value); }
  function valid() {
    error.textContent = '';
    if (current === 1 && !value('stage')) return 'Choose the place that feels closest.';
    if (current === 2 && !value('timeframe')) return 'Choose a timeframe to continue.';
    if (current === 3 && !value('style')) return 'Choose a visual direction — or choose “Not sure yet.”';
    if (current === 4 && !selected('elements').length) return 'Choose at least one subject, or choose “Something else.”';
    if (current === 5 && field('idea').length < 3) return 'Give us a few words to start the conversation.';
    if (current === 5 && field('idea').length > 400) return 'Keep the idea to 400 characters or fewer.';
    if (current === 5 && UNSAFE_TEXT_RE.test(field('idea'))) return 'Remove HTML characters or control characters from the idea.';
    if (current === 6 && (UNSAFE_TEXT_RE.test(field('placement')) || UNSAFE_TEXT_RE.test(field('size')))) return 'Remove HTML characters or control characters from the placement and size.';
    if (current === 6 && field('size') && !SIZE_RE.test(field('size'))) return 'Use a size like “6 inches” or “I’m open.”';
    if (current === 7 && (UNSAFE_TEXT_RE.test(field('name')) || UNSAFE_TEXT_RE.test(field('contact')))) return 'Remove HTML characters or control characters from your contact details.';
    if (current === 7 && !field('name')) return 'Add your name so the studio knows who is reaching out.';
    if (current === 7 && field('name').length > 100) return 'Keep your name to 100 characters or fewer.';
    if (current === 7 && !field('contact')) return 'Add an email or phone number for the reply.';
    if (current === 8 && !field('appointment_date')) return 'Choose a date for the appointment.';
    if (current === 8 && !field('appointment_time')) return 'Choose an available appointment time.';
    return '';
  }
  function render() {
    steps.forEach(step => step.classList.toggle('active', Number(step.dataset.step) === current));
    progressBar.style.width = `${(current / total) * 100}%`;
    progressLabel.textContent = `Step ${current} of ${total}`;
    stepNumber.textContent = String(current).padStart(2, '0');
    backBtn.style.visibility = current === 1 ? 'hidden' : 'visible';
    nextBtn.innerHTML = current === total ? 'Add to test calendar <span>↗</span>' : 'Continue <span>→</span>';
    if (current >= 7) buildSummary();
    if (current === 8) renderCalendar();
  }
  function localDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function renderCalendar() {
    if (!calendarGrid || !calendarLabel) return;
    const today = new Date();
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const firstWeekday = firstDay.getDay();
    const monthName = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    calendarLabel.textContent = monthName;
    calendarPrev.disabled = calendarMonth <= new Date(today.getFullYear(), today.getMonth(), 1);
    calendarGrid.replaceChildren();
    for (let i = 0; i < firstWeekday; i += 1) calendarGrid.append(document.createElement('span'));
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.textContent = String(day);
      button.dataset.date = localDateValue(date);
      button.setAttribute('aria-label', date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
      if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) button.disabled = true;
      if (date.getDay() === 0) {
        button.disabled = true;
        button.classList.add('sunday');
        button.title = 'Closed on Sundays';
        button.setAttribute('aria-label', `${button.getAttribute('aria-label')} — closed`);
      }
      if (button.dataset.date === appointmentDate.value) button.classList.add('selected');
      calendarGrid.append(button);
    }
  }
  function chooseCalendarDate(dateValue) {
    appointmentDate.value = dateValue;
    appointmentTime.innerHTML = '<option value="">Loading available times…</option>';
    appointmentTime.disabled = true;
    const selectedDate = new Date(`${dateValue}T12:00:00`);
    timeDialogDate.textContent = selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    timeOptions.replaceChildren();
    timeDialogStatus.textContent = 'Checking the studio calendar…';
    if (!timeDialog.open) timeDialog.showModal();
    renderCalendar();
    updateAvailability();
  }
  function renderTimeOptions(slots) {
    timeOptions.replaceChildren();
    slots.forEach(slot => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'time-option';
      button.dataset.time = slot.value;
      button.textContent = slot.label;
      timeOptions.append(button);
    });
  }
  function buildSummary() {
    const labels = { exact:'exact idea', rough:'rough idea', explore:'exploring', soon:'as soon as possible', season:'this season', future:'planning ahead', fine:'fine line', bold:'bold / traditional', organic:'organic / illustrative', unsure:'still finding the direction' };
    const parts = [labels[value('stage')], labels[value('timeframe')], labels[value('style')], selected('elements').join(', ')].filter(Boolean);
    summary.textContent = '';
    const title = document.createElement('strong');
    title.textContent = 'Your starting point';
    summary.append(title, document.createElement('br'), document.createTextNode(parts.join(' · ')));
    if (field('idea')) summary.append(document.createElement('br'), document.createElement('br'), document.createTextNode(`“${field('idea')}”`));
  }
  function payload() {
    const localDate = `${field('appointment_date')}T${field('appointment_time')}`;
    return {
      name: field('name'), contact: field('contact'), stage: value('stage'), timeframe: value('timeframe'), style: value('style'),
      elements: selected('elements'), idea: field('idea'), placement: field('placement'), size: field('size'),
      appointment_start: localDate, website: field('website')
    };
  }
  async function updateAvailability() {
    const day = field('appointment_date');
    appointmentTime.innerHTML = '<option value="">Loading available times…</option>';
    appointmentTime.disabled = true;
    availabilityStatus.textContent = 'Checking the studio calendar…';
    if (!day) {
      appointmentTime.innerHTML = '<option value="">Choose a date first</option>';
      availabilityStatus.textContent = 'Choose a date to see available appointment times.';
      return;
    }
    try {
      const response = await fetch(`${apiBase}/availability?date=${encodeURIComponent(day)}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Availability could not be loaded.');
      appointmentTime.innerHTML = '';
      if (!result.slots?.length) {
        appointmentTime.innerHTML = '<option value="">No times available</option>';
        availabilityStatus.textContent = 'That day is closed or fully booked. Choose another date.';
        timeDialogStatus.textContent = 'No appointment times are available for this day.';
        return;
      }
      appointmentTime.append(new Option('Choose a time', ''));
      result.slots.forEach(slot => appointmentTime.append(new Option(slot.label, slot.value)));
      appointmentTime.disabled = false;
      renderTimeOptions(result.slots);
      timeDialogStatus.textContent = 'Select a time to continue.';
      availabilityStatus.textContent = `${result.slots.length} appointment times available.`;
    } catch (requestError) {
      appointmentTime.innerHTML = '<option value="">Availability unavailable</option>';
      availabilityStatus.textContent = requestError.message || 'Availability could not be loaded. Try again.';
      timeDialogStatus.textContent = requestError.message || 'Availability could not be loaded. Try again.';
    }
  }
  async function submitBooking() {
    submitting = true;
    nextBtn.disabled = true;
    backBtn.disabled = true;
    nextBtn.textContent = 'Adding to calendar…';
    try {
      const response = await fetch(`${apiBase}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The booking could not be added.');
      showSuccess();
    } catch (requestError) {
      submitting = false;
      nextBtn.disabled = false;
      backBtn.disabled = false;
      nextBtn.innerHTML = 'Try again <span>↗</span>';
      error.textContent = requestError.message || 'The booking service is unavailable. Please try again.';
    }
  }
  nextBtn.addEventListener('click', () => {
    const problem = valid();
    if (problem) { error.textContent = problem; return; }
    if (current < total) { current++; render(); } else if (!submitting) { submitBooking(); }
  });
  backBtn.addEventListener('click', () => { if (!submitting && current > 1) { current--; render(); } });
  idea.addEventListener('input', () => { document.querySelector('#char-count').textContent = idea.value.length; });
  appointmentDate.addEventListener('change', updateAvailability);
  calendarGrid.addEventListener('click', event => {
    const day = event.target.closest('.calendar-day');
    if (day && !day.disabled) chooseCalendarDate(day.dataset.date);
  });
  timeOptions.addEventListener('click', event => {
    const option = event.target.closest('.time-option');
    if (!option) return;
    appointmentTime.value = option.dataset.time;
    timeOptions.querySelectorAll('.time-option').forEach(button => button.classList.toggle('selected', button === option));
    availabilityStatus.textContent = `Selected ${option.textContent} on ${timeDialogDate.textContent}.`;
    timeDialog.close();
  });
  calendarPrev.addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  calendarNext.addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  form.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    const target = event.target;
    if (target.matches('textarea, button, [type="radio"], [type="checkbox"]')) {
      if (target.matches('[type="radio"], [type="checkbox"]')) {
        event.preventDefault();
        nextBtn.click();
      }
      return;
    }
    const step = target.closest('.step');
    if (!step || Number(step.dataset.step) !== current) return;
    event.preventDefault();
    if (current === 6 && target.name === 'placement' && field('placement')) {
      form.elements.size.focus();
      return;
    }
    if (current === 7 && target.name === 'name' && field('name')) {
      form.elements.contact.focus();
      return;
    }
    nextBtn.click();
  });
  form.addEventListener('submit', e => e.preventDefault());
})();
