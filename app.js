const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');
const PushUpSet = require('./models/PushUpSet');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Get all push-up sets
app.get('/api/push-up-sets', async (req, res) => {
  try {
    const pushUpSets = await PushUpSet.findAll({
      order: [['time', 'DESC']] // Order by time descending
    });
    res.json(pushUpSets);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Create a new push-up set
app.post('/api/push-up-sets', async (req, res) => {
  try {
    // First, get the maximum ID
    const maxResult = await PushUpSet.findOne({
      attributes: [[sequelize.fn('max', sequelize.col('id')), 'maxId']],
    });
    
    const maxId = maxResult.get('maxId') || 0;
    
    // Create new push-up set with explicit ID
    const { repetitions } = req.body;
    const pushUpSet = await PushUpSet.create({ 
      id: maxId + 1,
      repetitions 
    });
    
    res.status(201).json(pushUpSet);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await sequelize.sync();
    console.log('Database synchronized');
    
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}

startServer(); 