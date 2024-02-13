import axios, { AxiosRequestConfig } from "axios";
import { dataUriToBuffer } from "data-uri-to-buffer";
import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import Auction from "../database/schemas/Auction";
import {
  AuctionUpdateValidation,
  AuctionValidation,
} from "../utils/validations";

const router = Router();

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

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
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
  console.log(auction);
  res.status(201).send(auction);
});

export default router;
