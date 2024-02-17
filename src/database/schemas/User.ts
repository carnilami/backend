import moment from "moment";
import mongoose, { Schema, SchemaTypes } from "mongoose";
import User from "../../entities/User";

const Notifications = new Schema(
  {
    sellerNewBid: {
      type: SchemaTypes.Boolean,
    },
    sellerNewComment: {
      type: SchemaTypes.Boolean,
    },
  },
  { _id: false }
);

const userSchema = new Schema<User>({
  accessToken: {
    type: SchemaTypes.String,
    required: true,
  },
  refreshToken: {
    type: SchemaTypes.String,
  },
  email: {
    type: SchemaTypes.String,
    required: true,
  },
  name: {
    type: SchemaTypes.String,
    required: true,
  },
  bio: {
    type: SchemaTypes.String,
    default: "",
    maxlength: 255,
  },
  tokens: {
    type: SchemaTypes.Number,
    default: 5,
  },
  profilePicture: {
    type: SchemaTypes.String,
    default: "",
  },
  createdAt: {
    type: SchemaTypes.Number,
    default: moment().unix(),
  },
  notifications: {
    type: Notifications,
    default: {
      sellerNewBid: true,
      sellerNewComment: true,
    },
  },
});

export default mongoose.model("User", userSchema);
