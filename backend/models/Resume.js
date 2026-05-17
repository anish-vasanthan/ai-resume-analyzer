const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resume = sequelize.define('Resume', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  userId: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  fileName: {
    type:      DataTypes.STRING(255),
    allowNull: false
  },
  filePath: {
    type:      DataTypes.STRING(500),
    allowNull: false
  },
  fileType: {
    type:      DataTypes.STRING(10),   // 'pdf' or 'docx' — avoid ENUM for portability
    allowNull: false
  },
  extractedText: {
    type:      DataTypes.TEXT,         // PostgreSQL TEXT is unlimited
    allowNull: false
  },
  parsedName:           { type: DataTypes.STRING(100) },
  parsedEmail:          { type: DataTypes.STRING(150) },
  parsedPhone:          { type: DataTypes.STRING(30) },
  parsedEducation:      { type: DataTypes.JSONB },   // JSONB = indexed JSON in Postgres
  parsedSkills:         { type: DataTypes.JSONB },
  parsedCertifications: { type: DataTypes.JSONB },
  parsedProjects:       { type: DataTypes.JSONB },
  parsedExperience:     { type: DataTypes.JSONB },
  atsScore:             { type: DataTypes.INTEGER, defaultValue: 0 },
  strengths:            { type: DataTypes.JSONB },
  weaknesses:           { type: DataTypes.JSONB },
  missingKeywords:      { type: DataTypes.JSONB },
  suggestions:          { type: DataTypes.JSONB },
  grammarIssues:        { type: DataTypes.JSONB },
  formattingIssues:     { type: DataTypes.JSONB },
  detectedRole:         { type: DataTypes.STRING(100) },
  selfIntroduction:     { type: DataTypes.TEXT },
  enhancedResume:       { type: DataTypes.JSONB },
  enhancedAt:           { type: DataTypes.DATE },
  scoreBreakdown:       { type: DataTypes.JSONB }
}, {
  tableName:  'resumes',
  timestamps: true,
  indexes: [
    {
      name: 'idx_resumes_userId',
      fields: ['userId']
    },
    {
      name: 'idx_resumes_createdAt',
      fields: ['createdAt']
    },
    {
      name: 'idx_resumes_detectedRole',
      fields: ['detectedRole']
    }
  ]
});

module.exports = Resume;
