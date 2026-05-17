const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MockInterview = sequelize.define('MockInterview', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  userId: {
    type:      DataTypes.INTEGER,
    allowNull: false
  },
  resumeId: {
    type:      DataTypes.INTEGER,
    allowNull: true
  },
  role: {
    type:      DataTypes.STRING(100),
    allowNull: false
  },
  questions: {
    type:         DataTypes.JSONB,
    defaultValue: []
  },
  overallScore: {
    type:         DataTypes.INTEGER,
    defaultValue: 0
  },
  overallFeedback: {
    type: DataTypes.TEXT
  },
  status: {
    type:         DataTypes.STRING(20),
    defaultValue: 'in-progress'
  },
  completedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName:  'mock_interviews',
  timestamps: true
});

module.exports = MockInterview;
