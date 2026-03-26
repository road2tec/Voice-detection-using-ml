const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      enum: ['Fire', 'Gunshot', 'Vehicle', 'Unknown'],
      required: true,
    },
    danger: {
      type: Boolean,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Alert', alertSchema);
