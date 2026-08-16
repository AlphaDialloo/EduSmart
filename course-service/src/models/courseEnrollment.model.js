const mongoose = require("mongoose");
const {
  Schema
} = mongoose;
const courseEnrollmentSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true
  },
  studentId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  paymentId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    default: undefined
  },
  accessPlanId: {
    type: Schema.Types.ObjectId,
    default: null
  },
  planType: {
    type: String,
    enum: ["FREE", "STANDARD", "PREMIUM"],
    required: true
  },
  durationMonths: {
    type: Number,
    enum: [1, 3, 6, 12, null],
    default: null
  },
  features: {
    courseContent: {
      type: Boolean,
      default: true
    },
    forumAccess: {
      type: Boolean,
      default: false
    },
    instructorMessaging: {
      type: Boolean,
      default: false
    },
    personalizedFollowUp: {
      type: Boolean,
      default: false
    },
    assignmentCorrection: {
      type: Boolean,
      default: false
    },
    certificateAccess: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ["ACTIVE", "EXPIRED", "REVOKED"],
    default: "ACTIVE",
    index: true
  },
  grantedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  revokedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});
courseEnrollmentSchema.index({
  courseId: 1,
  studentId: 1
}, {
  unique: true
});
module.exports = mongoose.model("CourseEnrollment", courseEnrollmentSchema);
