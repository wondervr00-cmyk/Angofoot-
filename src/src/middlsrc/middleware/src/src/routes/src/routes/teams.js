const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/teams — criar equipa
router.post('/', requireAuth, async (req, res) => {
  const { name, crestUrl, sportMode, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome da equipa é obrigatório.' });
  const team = await prisma.team.create({
    data: { name, crestUrl, sportMode, description },
  });
  res.status(201).json(team);
});

// GET /api/teams
router.get('/', async (req, res) => {
  const teams = await prisma.team.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });
  res.json(teams);
});

// GET /api/teams/:id — perfil da equipa com separadores
router.get('/:id', async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: {
      players: true,
      coaches: true,
      teamStats: true,
    },
  });
  if (!team) return res.status(404).json({ error: 'Equipa não encontrada.' });
  res.json(team);
});

// POST /api/teams/:id/join-requests/:requestId/accept — clube aceita jogador
router.post('/:id/join-requests/:requestId/accept', requireAuth, async (req, res) => {
  const request = await prisma.joinRequest.update({
    where: { id: req.params.requestId },
    data: { status: 'ACEITE' },
  });
  await prisma.user.update({
    where: { id: request.userId },
    data: { clubId: request.teamId },
  });
  res.json({ ok: true });
});

// POST /api/teams/:id/players — clube adiciona jogador diretamente (sem pedido)
router.post('/:id/players', requireAuth, async (req, res) => {
  const { userId } = req.body;
  await prisma.user.update({ where: { id: userId }, data: { clubId: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
