const express = require('express');
const router = express.Router();

// SECURITY: Disable sensitive debug endpoints. Keep file for potential future safe utilities.
router.all('*', (_req, res) => {
  return res.status(404).json({ message: 'Not found' });
});

module.exports = router;
