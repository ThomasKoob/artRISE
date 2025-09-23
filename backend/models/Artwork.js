import mongoose from 'mongoose';


const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
});

const ArtworkSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auction",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
  },
  images: {
    type: String,
    required: true,
  },
  startPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  endPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["live", "draft", "ended", "canceled"],
    default: "live",
  },
  endDate: {
    type: Date,
    required: true,
  },
});

ArtworkSchema.index({ auctionId: 1, endDate : 1 });

ArtworkSchema.index({ status: 1, endDate: 1, });




export default mongoose.model("Artwork", ArtworkSchema);
 
   
