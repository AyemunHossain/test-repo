import * as mongoose from 'mongoose';

export const NewsSchema = new mongoose.Schema(
  {
    readOnly: { type: Boolean, required: false },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    content: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    }, // Foreign key reference
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NewsSources',
      required: false,
    }, // Foreign key reference
    url: { type: String, required: true, unique: true, trim: true },
    author: { type: String, required: false, default: 'Unknown' },
    publishedAt: { type: Date, required: false },
    fetchedAt: { type: Date, required: true, default: Date.now },
    tags: { type: [String], required: false },
    isTrending: { type: Boolean, required: false, default: false },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
