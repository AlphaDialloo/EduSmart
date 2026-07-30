const mongoose = require("mongoose");

const { Schema } = mongoose;

const courseEnrollmentSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    paymentId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    accessPlanId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    planType: {
      type: String,
      enum: ["STANDARD", "PREMIUM"],
      required: true,
    },

    durationMonths: {
      type: Number,
      enum: [1, 3, 6, 12],
      required: true,
    },

    features: {
      courseContent: {
        type: Boolean,
        default: true,
      },

      forumAccess: {
        type: Boolean,
        default: false,
      },

      instructorMessaging: {
        type: Boolean,
        default: false,
      },

      personalizedFollowUp: {
        type: Boolean,
        default: false,
      },

      assignmentCorrection: {
        type: Boolean,
        default: false,
      },

      certificateAccess: {
        type: Boolean,
        default: true,
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "REVOKED"],
      default: "ACTIVE",
      index: true,
    },

    grantedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

courseEnrollmentSchema.index(
  {
    courseId: 1,
    studentId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("CourseEnrollment", courseEnrollmentSchema);
