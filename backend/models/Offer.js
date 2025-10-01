import mongoose from "mongoose";

const { Schema } = mongoose;

// Option 1: Behalte unique index, speichere Historie im Dokument
const offerSchemaWithHistory = new Schema(
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
    // NEU: Gebots-Historie
    bidHistory: [
      {
        amount: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Behalte den unique index
offerSchemaWithHistory.index({ artworkId: 1, userId: 1 }, { unique: true });
offerSchemaWithHistory.index({ userId: 1, createdAt: -1 });

// Middleware: Füge altes Gebot zur Historie hinzu bevor Update
offerSchemaWithHistory.pre("save", function (next) {
  if (this.isModified("amount") && !this.isNew) {
    // Füge das vorherige Gebot zur Historie hinzu
    this.bidHistory.push({
      amount: this.amount,
      timestamp: new Date(),
    });
  }
  next();
});

export default mongoose.model("Offer", offerSchemaWithHistory);
