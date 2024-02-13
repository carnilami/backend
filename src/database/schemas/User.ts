import mongoose, { Schema, SchemaTypes } from "mongoose";
import User from "../../entities/User";

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
});

export default mongoose.model("User", userSchema);
