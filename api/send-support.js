const express = require('express');
const axios = require('axios');
const router = express.Router();

// Remplacez par votre URL de webhook Discord
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1358463593661858123/UXbqA39Imsip2Yq4hnmXaEPi_EgZjWSXJz0DM3cUU6LpTIkbDNrbqF-b6WEDjRTkOZja';

router.post('/send-support', (req, res) => {
  const { subject, message, userId, userName, userAvatar, userEmail } = req.body;

  // Construire le message embed pour Discord
  const embed = {
    title: 'Nouvelle Demande de Support',
    description: `**Objet**: ${subject}\n**Message**: ${message}`,
    fields: [
      { name: 'Utilisateur', value: `${userName} (${userId})` },
      { name: 'Email', value: userEmail },
      { name: 'Avatar', value: `[Voir Avatar](https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png)` }
    ],
    color: 3447003, // Couleur du message (bleu)
    timestamp: new Date(),
    footer: {
      text: 'SX Bot Support'
    }
  };

  // Envoi du webhook Discord
  axios.post(DISCORD_WEBHOOK_URL, {
    content: `Nouvelle demande de support de ${userName}`,
    embeds: [embed]
  })
  .then(() => {
    res.json({ success: true });
  })
  .catch(err => {
    console.error('Erreur lors de l\'envoi du webhook:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la demande' });
  });
});

module.exports = router;
