const express = require('express');
const session = require('express-session');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = 3000;

// 📦 MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

// 🧩 Modèles
const User = require('./models/Users');
const Bot = require('./models/Bot');

// 📂 Static files
app.use(express.static('public'));
app.use(express.json());

// 🔐 Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// 🏠 Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 🔐 Login Discord
app.get('/login', (req, res) => {
  const redirect_uri = process.env.DISCORD_REDIRECT_URI;
  const client_id = process.env.DISCORD_CLIENT_ID;
  const scope = 'identify email';
  res.redirect(`https://discord.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}`);
});

// 🔁 Callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Pas de code reçu.");

  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        scope: 'identify email'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const access_token = tokenRes.data.access_token;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const discordUser = userRes.data;

    // 🔥 Vérifie si l'utilisateur existe déjà
    let user = await User.findOne({ discordId: discordUser.id });

    if (!user) {
      // ✅ Si non, on le crée
      user = await User.create({
        discordId: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        email: discordUser.email,
        avatar: discordUser.avatar,
        isAdmin: false,
        bots: []
      });
      console.log('👤 Nouvel utilisateur enregistré :', user.username);
    } else {
      // 🔄 Si déjà existant, on met à jour ses infos si besoin
      user.username = discordUser.username;
      user.discriminator = discordUser.discriminator;
      user.email = discordUser.email;
      user.avatar = discordUser.avatar;
      await user.save();
    }

    req.session.user = {
      id: user.discordId,
      username: user.username,
      discriminator: user.discriminator,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin
    };

    res.redirect('/panel');
  } catch (err) {
    console.error(err);
    res.send("Erreur lors de l'auth.");
  }
});

// 📄 Panel page
app.get('/panel', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public/panel.html'));
});

// 🔓 Déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Erreur de déconnexion');
    res.redirect('/');
  });
});

// 🧑 API : infos utilisateur
app.get('/api/me', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

  const dbUser = await User.findOne({ discordId: req.session.user.id });
  res.json({ ...req.session.user, role: dbUser?.role || 'user' });
});

// 🧠 API : vérifier si admin
app.get('/api/check-admin', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ isAdmin: false });
  const dbUser = await User.findOne({ discordId: req.session.user.id });
  res.json({ isAdmin: dbUser?.isAdmin });
});

// 👥 API : récupérer tous les utilisateurs
app.get('/api/get-all-users', async (req, res) => {
  // Vérification de l'admin
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ error: "Accès interdit. Vous n'êtes pas admin." });
  }

  const users = await User.find({});
  res.json(users);
});

// 🤖 API : assigner un bot à un utilisateur
app.post('/api/assign-bot', async (req, res) => {
  const { userId, botName, duration } = req.body;

  if (!userId || !botName || !duration) {
    return res.status(400).send('Données manquantes.');
  }

  const purchaseDate = new Date();
  const expirationDate = new Date(purchaseDate.getTime() + duration * 24 * 60 * 60 * 1000);

  const bot = new Bot({
    userId,
    botName,
    purchaseDate,
    expirationDate
  });

  await bot.save();

  // Mise à jour de l'utilisateur
  const user = await User.findOne({ discordId: userId });
  if (user) {
    user.bots.push(bot);
    await user.save();
  }

  res.json({ message: 'Bot attribué avec succès' });
});

// 🤖 API : récupérer les bots de l'utilisateur connecté
app.get('/api/user-bots', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

  const bots = await Bot.find({ userId: req.session.user.id });
  res.json(bots);
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});


  