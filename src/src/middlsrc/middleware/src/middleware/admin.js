function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Chave de desenvolvedor inválida.' });
  }
  next();
}

module.exports = { requireAdmin };
