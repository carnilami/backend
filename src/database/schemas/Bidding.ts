import mongoose, { Schema, SchemaTypes } from "mongoose";

const biddingSchema = new Schema({
  auctionId: {
    type: SchemaTypes.String,
    required: true,
  },
  userId: {
    type: SchemaTypes.String,
    required: true,
  },
  bid: {
    type: SchemaTypes.Number,
    required: true,
  },
  createdAt: {
    type: SchemaTypes.Number,
    default: Date.now(),
  },
});

export default mongoose.model("Bidding", biddingSchema);
