import moment from "moment";
import mongoose, { Schema, SchemaTypes } from "mongoose";

const upvoteSchema = new Schema(
  {
    userId: {
      type: SchemaTypes.String,
      required: true,
    },
    createdAt: {
      type: SchemaTypes.Number,
      default: moment().unix(),
    },
  },
  { _id: false }
);

const commentSchema = new Schema({
  userId: {
    type: SchemaTypes.String,
    required: true,
  },
  auctionId: {
    type: SchemaTypes.String,
    required: true,
  },
  content: {
    type: SchemaTypes.String,
    required: true,
  },
  createdAt: {
    type: SchemaTypes.Number,
    default: moment().unix(),
  },
  upvotes: {
    type: [upvoteSchema],
    default: [],
  },
});

export default mongoose.model("Comment", commentSchema);
