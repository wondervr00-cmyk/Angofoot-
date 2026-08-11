const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const ACCOUNT_TYPES = [
  'JOGADOR', 'GUARDA_REDES', 'EQUIPA', 'EQUIPA_TECNICA', 'ARBITRO',
  'TREINADOR', 'PRESIDENTE', 'ADEPTO', 'CAMPEONATO', 'LIGA', 'TORNEIO', 'MISTO'
];

const registerSchema = z.object({
  name: z.string().min(2, 'Nome demasiado curto'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'A palavra-passe precisa de pelo menos 6 caracteres'),
  accountType: z.enum(ACCOUNT_TYPES),
  avatarUrl: z.string().optional(),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, phone, password, accountType, avatarUrl } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Este email já está registado.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, accountType, avatarUrl },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: sanitize(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email ou palavra-passe em falta.' });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: sanitize(user) });
});

function sanitize(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = router;
