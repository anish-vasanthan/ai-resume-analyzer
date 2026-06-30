const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type:         DataTypes.UUID,
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type:      DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    unique:    true,
    validate:  { isEmail: true }
  },
  password: {
    type:      DataTypes.STRING(255),
    allowNull: true   // null for Google-only accounts
  },
  googleId: {
    type:      DataTypes.STRING(255),
    allowNull: true,
    unique:    true
  },
  avatar: {
    type:      DataTypes.TEXT,   // base64 images can be ~2.7MB of text
    allowNull: true
  },
  role: {
    type:         DataTypes.STRING(20),
    defaultValue: 'user'
  }
}, {
  tableName:  'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt   = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        const salt   = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Associations
User.associate = (models) => {
  User.hasMany(models.Resume,        { foreignKey: 'userId', onDelete: 'CASCADE' });
  User.hasMany(models.MockInterview, { foreignKey: 'userId', onDelete: 'CASCADE' });
};

module.exports = User;
