import * as mongoose from 'mongoose';

export const NewsCategorySchema = new mongoose.Schema(
  {
    readOnly: { type: Boolean, required: false },
    title: { type: String, required: true },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
