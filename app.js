const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');
const PushUpSet = require('./models/PushUpSet');
const { Op } = require('sequelize');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Get all push-up sets
app.get('/api/push-up-sets', async (req, res) => {
  try {
    const returnAll = req.query.return_all === 'true';
    
    let whereClause = {};
    if (!returnAll) {
      // Get date 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      whereClause = {
        time: {
          [Op.gte]: ninetyDaysAgo
        }
      };
    }

    const pushUpSets = await PushUpSet.findAll({
      where: whereClause,
      order: [['time', 'DESC']]
    });

    // Log info about the response
    console.log(`📊 Returning ${pushUpSets.length} sets (${returnAll ? 'all time' : 'past 90 days'})`);
    
    res.json(pushUpSets);
  } catch (error) {
    console.error('Error fetching push-up sets:', error);
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