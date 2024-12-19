const express = require('express');
const cors = require('cors');
const { Sequelize, Op } = require('sequelize');

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// Database connection
let sequelize;
let PushUpSet;

async function initDatabase() {
  if (!sequelize) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    // Define PushUpSet model
    PushUpSet = sequelize.define('push_up_set', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      repetitions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    }, {
      tableName: 'push_up_sets',
      timestamps: false
    });

    await sequelize.sync();
  }
  return { sequelize, PushUpSet };
}

// API Routes
app.get('/api/push-up-sets', async (req, res) => {
  try {
    await initDatabase();
    const returnAll = req.query.return_all === 'true';
    
    let whereClause = {};
    if (!returnAll) {
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
    
    res.json(pushUpSets);
  } catch (error) {
    console.error('Error fetching push-up sets:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/push-up-sets', async (req, res) => {
  try {
    await initDatabase();
    const { repetitions } = req.body;
    
    const maxResult = await PushUpSet.findOne({
      attributes: [[sequelize.fn('max', sequelize.col('id')), 'maxId']],
    });
    
    const maxId = maxResult.get('maxId') || 0;
    
    const pushUpSet = await PushUpSet.create({ 
      id: maxId + 1,
      repetitions 
    });
    
    res.status(201).json(pushUpSet);
  } catch (error) {
    console.error('Error creating push-up set:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Export for Vercel
module.exports = app; 