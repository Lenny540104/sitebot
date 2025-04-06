const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  name: String,
  status: { type: String, default: 'Actif' },
  expireAt: Date
});

const userSchema = new mongoose.Schema({
  discordId: String,
  username: String,
  discriminator: String,
  avatar: String,
  email: String,
  bots: [botSchema]
});

module.exports = mongoose.model('User', userSchema);


