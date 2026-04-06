require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const sequelize = require('./src/config/database');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON request bodies


app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce API is running!' });
});

const User = require('./src/models/User');

app.post('/test/user', async (req, res) => {
  try {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password@123',
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected...');
    // Sync all models with the database (create tables if they don't exist)
    return sequelize.sync({ alter: true }); // alter: true updates tables to match model (safe for development)
  })
  .then(() => {
    app.listen(3000, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
