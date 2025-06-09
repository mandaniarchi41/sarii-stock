const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });
console.log('MONGODB_URI:', process.env.MONGODB_URI); // Debug log

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: ['https://sari-stock.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

// Middleware - apply CORS first
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase limit for JSON body

app.use("/", (req, res) => {
  res.status(200).json({message:"Welcome to sari stock api"});
});

// MongoDB Connection URL from environment variables
const uri = process.env.MONGODB_URI;

mongoose.connect(process.env.MONGODB_URI, {
  ssl: true,
  tls: true
});

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log('MongoDB database connection established successfully');
});

connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Import routes
const sarisRouter = require('./routes/saris');

// Use routes
app.use('/api/saris', sarisRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// You will need to create a .env file in the backend directory with:
// MONGODB_URI=your_mongodb_connection_string 
