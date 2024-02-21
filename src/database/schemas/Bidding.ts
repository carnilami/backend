import moment from "moment";
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
    default: moment().unix(),
  },
});

export default mongoose.model("Bidding", biddingSchema);
