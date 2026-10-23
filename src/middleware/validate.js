const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AMOUNT = 9999999999.99; // fits NUMERIC(12,2)

/**
 * Validates and normalises the contribution payload.
 * On success the cleaned values are attached to req.validated.
 */
exports.validateContribution = (req, res, next) => {
  const body = req.body || {};
  const errors = {};

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const amountRaw = String(body.amount ?? '').trim();

  if (!name) errors.name = 'Name is required.';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

  if (!email) errors.email = 'Email is required.';
  else if (email.length > 255 || !EMAIL_RE.test(email))
    errors.email = 'Please enter a valid email address.';

  // Allow digits, spaces, dashes, brackets and a leading +; need 7-15 digits.
  const phoneDigits = phone.replace(/\D/g, '');
  if (!phone) errors.phone = 'Phone number is required.';
  else if (!/^\+?[\d\s\-()]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15)
    errors.phone = 'Please enter a valid phone number (7-15 digits).';

  const amount = Number(amountRaw);
  if (!amountRaw) errors.amount = 'Contribution amount is required.';
  else if (!Number.isFinite(amount)) errors.amount = 'Amount must be a number.';
  else if (amount <= 0) errors.amount = 'Amount must be greater than zero.';
  else if (amount > MAX_AMOUNT) errors.amount = 'Amount is too large.';
  else if (!/^\d+(\.\d{1,2})?$/.test(amountRaw))
    errors.amount = 'Amount can have at most 2 decimal places.';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Please correct the highlighted fields.', errors });
  }

  req.validated = { name, email, phone, amount: amountRaw };
  next();
};
