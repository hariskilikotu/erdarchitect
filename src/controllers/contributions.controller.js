const service = require('../services/contributions.service');

exports.create = async (req, res, next) => {
  try {
    const contribution = await service.createContribution(req.validated);
    res.status(201).json({
      message: 'Thank you! Your contribution has been recorded.',
      contribution,
    });
  } catch (err) {
    next(err);
  }
};

exports.summary = async (req, res, next) => {
  try {
    res.json(await service.getSummary());
  } catch (err) {
    next(err);
  }
};
