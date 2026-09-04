const mongoose = require('mongoose');

const REGION_TYPES = [
  'STATE',
  'DISTRICT',
  'PARLIAMENT',
  'ASSEMBLY_CONSTITUENCY',
  'MANDAL',
  'AREA',
  'WARD',
  'STREET'
];

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Geographic region name is required'],
      trim: true
    },
    displayName: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Geographic code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: REGION_TYPES,
      default: 'AREA',
      index: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      default: null,
      index: true
    },
    ancestorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area'
      }
    ],

    // Contextual Administrative Metadata
    state: { type: String, default: 'Andhra Pradesh' },
    district: { type: String, default: '' },
    parliament: { type: String, default: '' },
    assemblyConstituency: { type: String, default: '' },
    mandal: { type: String, default: '' },
    zone: { type: String, default: '' },
    city: { type: String, default: '' },

    // Centroid Coordinates for Map Placement
    coordinates: {
      lat: { type: Number, required: true, default: 16.5062 },
      lng: { type: Number, required: true, default: 80.6480 }
    },

    // GeoJSON Boundary (Polygon / MultiPolygon)
    boundary: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon', 'Point'],
        default: 'Point'
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        default: [80.6480, 16.5062]
      }
    },

    // Configurable Alert Thresholds for this region
    alertThresholds: {
      normalMax: { type: Number, default: 4 },     // 0-4: NORMAL (Green)
      watchMax: { type: Number, default: 9 },      // 5-9: WATCH (Yellow)
      highAlertMax: { type: Number, default: 19 }, // 10-19: HIGH ALERT (Orange)
      criticalMin: { type: Number, default: 20 }   // 20+: CRITICAL (Red)
    },

    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    assignedOfficers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    active: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

areaSchema.index({ name: 1, type: 1 });
areaSchema.index({ parentId: 1, type: 1 });
areaSchema.index({ ancestorIds: 1 });

module.exports = mongoose.model('Area', areaSchema);
