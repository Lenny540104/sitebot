const User = require('../models/Users'); // Assure-toi que ce chemin est bon

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'discordId username discriminator');
    res.json(users);
  } catch (err) {
    console.error('Erreur récupération utilisateurs :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
