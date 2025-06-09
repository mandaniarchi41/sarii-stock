const router = require('express').Router();
let Sari = require('../models/sari.model');

// GET all saris
router.route('/').get(async (req, res) => {
  try {
    const saris = await Sari.find();
    res.json(saris);
  } catch (err) {
    console.error('Error fetching saris:', err);
    res.status(400).json({ error: 'Failed to fetch saris', details: err.message });
  }
});

// GET a specific sari by ID
router.route('/:id').get(async (req, res) => {
  try {
    const sari = await Sari.findById(req.params.id);
    if (!sari) {
      return res.status(404).json({ error: 'Sari not found' });
    }
    res.json(sari);
  } catch (err) {
    console.error('Error fetching sari:', err);
    res.status(400).json({ error: 'Failed to fetch sari', details: err.message });
  }
});

// POST a new sari
router.route('/add').post(async (req, res) => {
  const { sariNumber, name, price, imageUrl, colors } = req.body;

  if (!sariNumber || !name || !price || !colors || colors.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newSari = new Sari({
    sariNumber,
    name,
    price,
    imageUrl,
    colors,
    lastUpdated: new Date(),
  });

  try {
    const savedSari = await newSari.save();
    res.status(201).json(savedSari);
  } catch (err) {
    console.error('Error adding sari:', err);
    res.status(400).json({ error: 'Failed to add sari', details: err.message });
  }
});

// PUT (update) a sari by ID
router.route('/update/:id').put(async (req, res) => {
  try {
    const sari = await Sari.findById(req.params.id);
    if (!sari) {
      return res.status(404).json({ error: 'Sari not found' });
    }

    // Update sari properties
    sari.sariNumber = req.body.sariNumber;
    sari.name = req.body.name;
    sari.price = req.body.price;
    sari.imageUrl = req.body.imageUrl;
    sari.colors = req.body.colors;

    const updatedSari = await sari.save();
    res.json(updatedSari);
  } catch (err) {
    console.error('Error updating sari:', err);
    res.status(400).json({ error: 'Failed to update sari', details: err.message });
  }
});

// DELETE a sari by ID
router.route('/:id').delete(async (req, res) => {
  try {
    const result = await Sari.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Sari not found' });
    }
    res.json({ message: 'Sari deleted successfully', deletedSari: result });
  } catch (err) {
    console.error('Error deleting sari:', err);
    res.status(400).json({ error: 'Failed to delete sari', details: err.message });
  }
});

module.exports = router; 