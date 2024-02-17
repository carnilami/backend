import mongoose, { Schema, SchemaTypes } from "mongoose";
import { FuelType, TransmissionType } from "../../utils/enums";

const AuctionSchema = new Schema({
  title: {
    type: SchemaTypes.String,
    required: true,
    min: 3,
    max: 50,
  },
  description: {
    type: SchemaTypes.String,
    required: true,
    min: 3,
    max: 500,
  },
  images: {
    type: SchemaTypes.Array,
    required: true,
  },
  reserved: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  reservePrice: {
    type: SchemaTypes.Number,
    default: 0,
  },
  city: {
    type: SchemaTypes.String,
    required: true,
  },
  make: {
    type: SchemaTypes.String,
    required: true,
  },
  model: {
    type: SchemaTypes.String,
    required: true,
  },
  variant: {
    type: SchemaTypes.String,
    required: true,
  },
  year: {
    type: SchemaTypes.Number,
    required: true,
  },
  registered: {
    type: SchemaTypes.Boolean,
    required: true,
  },
  registeredProvince: {
    type: SchemaTypes.String,
    default: "",
  },
  engineCapacity: {
    type: SchemaTypes.Number,
    required: true,
  },
  transmissionType: {
    type: SchemaTypes.String,
    enum: Object.values(TransmissionType),
    required: true,
  },
  mileage: {
    type: SchemaTypes.Number,
    required: true,
  },
  fuelType: {
    type: SchemaTypes.String,
    enum: Object.values(FuelType),
    required: true,
  },
  flawed: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  modified: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  imported: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  auctionExpiry: {
    type: SchemaTypes.Number,
    required: true,
  },
  expired: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  sellerId: {
    type: SchemaTypes.String,
    required: true,
  },
  currentHighestBid: {
    type: SchemaTypes.Number,
    default: 0,
  },
});

export default mongoose.model("Auction", AuctionSchema);
