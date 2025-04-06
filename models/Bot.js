const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  userId: String,
  botName: String,
  purchaseDate: Date,
  expirationDate: Date
});

module.exports = mongoose.model('Bot', botSchema);
