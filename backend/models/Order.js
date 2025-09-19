import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    artworkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: true,
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
    
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
    },

    sessionId: {
        type: String,
    },
    paymentId: {
        type: String,
    },
    paidAt: {
        type: Date,
        default: Date.now,
    },
});

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ artworkId: 1, });
OrderSchema.index({ sellerId: 1, });

export default mongoose.model('Order', OrderSchema);