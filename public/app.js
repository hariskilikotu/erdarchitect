(function () {
  const form = document.getElementById('contribution-form');
  const submitBtn = document.getElementById('submit-btn');
  const messageBox = document.getElementById('form-message');

  function clearErrors() {
    form.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
    form.querySelectorAll('input').forEach((el) => el.classList.remove('invalid'));
  }

  function showFieldErrors(errors) {
    Object.entries(errors).forEach(([field, text]) => {
      const holder = form.querySelector(`[data-error-for="${field}"]`);
      const input = form.elements[field];
      if (holder) holder.textContent = text;
      if (input) input.classList.add('invalid');
    });
  }

  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = type;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();
    showMessage('', '');

    const payload = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
      amount: form.elements.amount.value,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        form.reset();
        showMessage(data.message || 'Thank you for your contribution!', 'success');
      } else {
        if (data.errors) showFieldErrors(data.errors);
        showMessage(data.message || 'Could not submit. Please try again.', 'failure');
      }
    } catch (err) {
      showMessage('Network error. Please check your connection and try again.', 'failure');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit contribution';
    }
  });
})();
