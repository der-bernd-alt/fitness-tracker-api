const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PushUpSet = sequelize.define('push_up_set', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  repetitions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'push_up_sets',
  timestamps: false
});

// Add a hook to update the sequence after model sync
PushUpSet.afterSync(async () => {
  try {
    // Update the sequence to the max id value
    await sequelize.query(`
      SELECT setval(pg_get_serial_sequence('push_up_sets', 'id'), 
        COALESCE((SELECT MAX(id) FROM push_up_sets), 0) + 1, false)
    `);
  } catch (error) {
    console.error('Error updating sequence:', error);
  }
});

module.exports = PushUpSet; 