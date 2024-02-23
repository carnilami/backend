import moment from "moment";
import mongoose, { Schema, SchemaTypes } from "mongoose";
import User from "../../entities/User";
import { AuthType } from "../../utils/enums";

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
  },
  refreshToken: {
    type: SchemaTypes.String,
  },
  email: {
    type: SchemaTypes.String,
    default: null
  },
  name: {
    type: SchemaTypes.String,
    required: true,
  },
  phone: {
    type: SchemaTypes.String,
    default: null,
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
  authType: {
    type: SchemaTypes.String,
    enum: Object.values(AuthType),
    default: "google",
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
