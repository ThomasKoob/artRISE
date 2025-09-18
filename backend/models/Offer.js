import mongoose from "mongoose";

const offerSchema = new Schema(
  {
    artworkId: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },

  { timestamps: { createdAt: true, updatedAt: false } }
);

offerSchema.index({ artworkId: 1, userId: 1 }, { unique: true });
offerSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Offer", offerSchema);
