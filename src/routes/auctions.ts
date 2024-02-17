import axios, { AxiosRequestConfig } from "axios";
import { dataUriToBuffer } from "data-uri-to-buffer";
import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { Resend } from "resend";
import Auction from "../database/schemas/Auction";
import Bidding from "../database/schemas/Bidding";
import User from "../entities/User";
import { email } from "../utils/emails";
import {
  AuctionUpdateValidation,
  AuctionValidation,
  BiddingValidation,
} from "../utils/validations";
import auth from "./auth";

const router = Router();

const resend = new Resend("re_A9qWzEBW_DYMKAUhsxNxTRC2yV2he4i28");
const apiKey = "ac05a30e-11a9-4e12-8243967912f8-bac3-42ef";

router.get("/", async (req: Request, res: Response) => {
  const auctions = await Auction.find();
  res.status(200).send(auctions);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid id.");
  }

  const auction = await Auction.findById(id);
  if (auction === null) {
    return res.status(404).send("Auction not found.");
  }

  res.status(200).send(auction);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid id.");
  }

  const auction = await Auction.findById(id);
  if (auction === null) {
    return res.status(404).send("Auction not found.");
  }

  const validation = AuctionUpdateValidation.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).send(validation.error.issues[0].message);
  }

  const updatedAuction = await Auction.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  return res.status(200).send(updatedAuction);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid id.");
  }
  const auction = await Auction.findById(id);
  if (auction === null) {
    return res.status(404).send("Auction not found.");
  }
  await Auction.findByIdAndDelete(id);
  return res.send(200);
});

router.post("/", auth, async (req: Request, res: Response) => {
  const body = req.body;
  const user = req.user as User;
  const validation = AuctionValidation.safeParse(body);
  if (!validation.success) {
    console.log(validation.error.issues);
    return res.status(400).send(validation.error.issues[0].message);
  }

  const objectId = new mongoose.Types.ObjectId();
  const uploadPromises = body.images.map(
    async (fileUrl: string, index: number) => {
      const parsed = dataUriToBuffer(fileUrl);
      const options: AxiosRequestConfig = {
        method: "PUT",
        url: `https://storage.bunnycdn.com/carnilami/${objectId}_${index}.jpg`,
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/octet-stream",
        },
        data: parsed.buffer,
      };

      const response = await axios.request(options);
      console.log("success");
      if (response.data.HttpCode === 201) {
        return `${objectId}_${index}.jpg`;
      }
    }
  );

  const uploadedIds = await Promise.all(uploadPromises);

  const auction = await Auction.create({
    _id: objectId,
    title: body.title,
    description: body.description,
    images: uploadedIds,
    reserved: body.reserved === "no" ? false : true,
    reservePrice: body.reservePrice,
    city: body.city,
    make: body.make,
    model: body.model,
    variant: body.variant,
    year: body.year,
    registered: body.registered === "Registered" ? true : false,
    registeredProvince: body.registeredProvince,
    sellerId: body.sellerId,
    engineCapacity: body.engineCapacity,
    transmissionType: body.transmission,
    mileage: body.mileage,
    fuelType: body.fuelType,
    flawed: body.flaws === "yes" ? true : false,
    modified: body.modified === "yes" ? true : false,
    imported: body.imported === "Imported" ? true : false,
    auctionExpiry: "123455",
  });

  res.status(201).send(auction);

  console.log(
    auction.year +
      " " +
      auction.make +
      " " +
      auction.model +
      " " +
      auction.variant
  );

  const { error } = await resend.emails.send({
    from: "No-Reply <noreply@carnilami.com>",
    to: [user.email],
    subject: "Auction Submitted",
    html: email
      .replace(/\{\$name\}/g, user.name)
      .replace(
        /\{\$car\}/g,
        auction.year +
          " " +
          auction.make +
          " " +
          auction.model +
          " " +
          auction.variant
      ),
  });
  if (error) {
    console.error("Error sending email: ", error);
  }
});

/* Biddings */

router.get("/:id/bids", async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid id.");
  }

  const auction = await Auction.findById(id);
  if (auction === null) {
    return res.status(404).send("Auction not found.");
  }

  const biddings = await Bidding.find();

  res.status(200).send(biddings || []);
});

router.post("/:id/bids", auth, async (req: Request, res: Response) => {
  const body = req.body;
  const user = req.user as User;
  const auctionId = req.params.id;

  if (!auctionId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid id.");
  }

  const auction = await Auction.findById(auctionId);
  if (auction === null) {
    return res.status(404).send("Auction not found.");
  }

  const validation = BiddingValidation.safeParse(body);
  if (!validation.success) {
    return res.status(400).send(validation.error.issues[0].message);
  }

  const highestBid = await Bidding.findOne({ auctionId }).sort({ bid: -1 });
  if (highestBid && body.bid <= highestBid.bid) {
    return res
      .status(400)
      .send(
        "The minimum bid amount is " + (highestBid.bid + 1000).toLocaleString() + " rupees."
      );
  }

  const bidding = await Bidding.create({
    auctionId,
    userId: user._id,
    bid: body.bid,
  });

  res.status(201).send(bidding);
});

export default router;
