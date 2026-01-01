import { Schema, model, Document, Types, Model } from "mongoose"

export interface ISetting extends Document {
  maintenanceMessage?: string
  isMaintenance?: boolean

  // Timestamps
  lastModifiedBy?: Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

const settingSchema = new Schema<ISetting>(
  {
    maintenanceMessage: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    isMaintenance: {
      type: Boolean,
      default: false,
    },

    // Admin tracking
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
)

export const Setting = model<ISetting>("Setting", settingSchema)
