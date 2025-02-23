import * as mongoose from 'mongoose';

export const SettingSchema = new mongoose.Schema(
  {
    readOnly: {
      type: Boolean,
      required: false,
    },
    cashOnDelivery: {
        type: Boolean,
        required: false
    },
    onlinePayment: {
        type: Boolean,
        required: false
    }
  },
  {
    versionKey: false,
    timestamps: true,
  },
);