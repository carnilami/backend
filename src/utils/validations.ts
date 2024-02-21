import { z } from "zod";
import { FuelType, TransmissionType } from "./enums";

export const AuctionValidation = z.object({
  title: z
    .string()
    .min(3, "Auction title too small.")
    .max(50, "Auction title too big."),
  description: z
    .string()
    .min(3, "Auction description too small.")
    .max(1000, "Auction description too big."),
  images: z.array(z.any()),
  isReserved: z.enum(["no", "yes"]),
  reservePrice: z.number().default(0),
  city: z.string().min(1, "Please provide the city name."),
  make: z.string().min(1, "Please provide the make."),
  model: z.string().min(1, "Please provide the model."),
  variant: z.string().min(1, "Please provide the variant."),
  year: z
    .number()
    .min(1947, "Vehicle year cannot be lower than 1947.")
    .max(new Date().getFullYear(), "Invalid Year."),
  registered: z.string(),
  sellerId: z.string(),
  engineCapacity: z.number(),
  transmission: z.nativeEnum(TransmissionType, {
    required_error: "Please provide a transmission type.",
    invalid_type_error: "Please provide a valid transmission type.",
  }),
  mileage: z.number(),
  fuelType: z.nativeEnum(FuelType, {
    required_error: "Please provide a fuel type.",
    invalid_type_error: "Please provide a valid fuel type.",
  }),
  auctionExpiry: z.string().optional(),
});

export const AuctionUpdateValidation = z.object({
  title: z
    .string()
    .min(3, "Auction title too small.")
    .max(50, "Auction title too big."),
  city: z.string().min(1, "Please provide the city name."),
});

export const BiddingValidation = z.object({
  auctionId: z.string().min(1, "Please provide the auction id."),
  userId: z.string().min(1, "Please provide the user id."),
  bid: z
    .number()
    .positive("Bid amount cannot be negative.")
    .min(1000, "Bid amount too small."),
});

export const UserNotificationsValidation = z.object({
  sellerNewBid: z.boolean({
    required_error: "Please provide a value for sellerNewBid.",
  }),
  sellerNewComment: z.boolean({
    required_error: "Please provide a value for sellerNewComment.",
  }),
});

export const UserProfileValidation = z.object({
  name: z.string().min(3, "Name too small.").max(56, "Name too big."),
  bio: z.string().max(255, "Bio too big."),
});

export const CommentValidation = z.object({
  auctionId: z.string().min(1, "Please provide the auction id."),
  userId: z.string().min(1, "Please provide the user id."),
  content: z
    .string()
    .min(1, "Please provide a comment.")
    .max(1024, "Comment too big."),
});

export const CommentUpvoteValidation = z.object({
  userId: z.string().min(1, "Please provide the user id."),
});
