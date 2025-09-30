import mongoose from "mongoose";

const { Schema } = mongoose;

const auctionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
    bannerImageUrl: {
      type: String,
      required: false,
    },

    minIncrementDefault: {
      type: Number,
      min: 1,
      default: 5,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

auctionSchema.index({ artistId: 1 }, { unique: true });

export default mongoose.model("Auction", auctionSchema);
