const isAdmin = (req) => {
    const adminIds = ['857699987168296990']; // Remplace par ton ID Discord
    return req.session.user && adminIds.includes(req.session.user.id);
  };
  
  app.post('/api/admin/add-bot', express.json(), async (req, res) => {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
  
    const { discordId, botName, duration } = req.body;
  
    try {
      const user = await User.findOne({ discordId });
      if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
  
      const now = new Date();
      const expireAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
  
      user.bots.push({ name: botName, status: 'Actif', expireAt });
      await user.save();
  
      res.json({ success: true });
    } catch (err) {
      console.error('Erreur ajout bot :', err);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  });
  