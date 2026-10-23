const Contribution = require('../models/contributions.model');

/**
 * Business logic for contributions.
 * Input is already validated and normalised by the validate middleware.
 */
exports.createContribution = async (data) => {
  const saved = await Contribution.create(data);
  return {
    id: saved.id,
    name: saved.name,
    email: saved.email,
    phone: saved.phone,
    amount: Number(saved.amount),
    createdAt: saved.created_at,
  };
};

exports.getSummary = async () => {
  const { count, total } = await Contribution.getSummary();
  return { count, total: Number(total) };
};
