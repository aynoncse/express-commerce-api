require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON request bodies


app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce API is running!' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});



const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});