const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const colorSchema = new Schema({
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  minStock: { type: Number, required: true, min: 0 },
  colorImageUrl: { type: String }, // Store image URL or Data URL
}, { _id: false }); // Prevent Mongoose from creating _id for subdocuments

const sariSchema = new Schema({
  sariNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String }, // Main sari image URL
  colors: [colorSchema], // Array of colors with their details
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps automatically
});

const Sari = mongoose.model('Sari', sariSchema);

module.exports = Sari; 