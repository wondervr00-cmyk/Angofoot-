const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { club: true, coachesTeam: true },
  });
  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const { passwordHash, ...rest } = user;
  res.json(rest);
});

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { club: true },
  });
  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const { passwordHash, ...rest } = user;
  res.json(rest);
});

// PATCH /api/users/me — update player profile: club, positions, dominant foot, skills, bio
router.patch('/me', requireAuth, async (req, res) => {
  const { positions, dominantFoot, skills, bio, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      positions: positions ? JSON.stringify(positions.slice(0, 2)) : undefined,
      dominantFoot,
      skills: skills ? JSON.stringify(skills) : undefined,
      bio,
      avatarUrl,
    },
  });
  const { passwordHash, ...rest } = user;
  res.json(rest);
});

// POST /api/users/me/join-request — jogador pede entrada num clube
router.post('/me/join-request', requireAuth, async (req, res) => {
  const { teamId } = req.body;
  if (!teamId) return res.status(400).json({ error: 'teamId é obrigatório.' });
  const request = await prisma.joinRequest.create({
    data: { userId: req.userId, teamId, status: 'PENDENTE' },
  });
  res.status(201).json(request);
});

module.exports = router;
