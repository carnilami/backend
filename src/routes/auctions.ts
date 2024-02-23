import axios, { AxiosRequestConfig } from "axios";
import { dataUriToBuffer } from "data-uri-to-buffer";
import { Request, Response, Router } from "express";
import moment from "moment";
import mongoose from "mongoose";
import { Resend } from "resend";
import Auction from "../database/schemas/Auction";
import Bidding from "../database/schemas/Bidding";
import Comment from "../database/schemas/Comment";
import UserSchema from "../database/schemas/User";
import User from "../entities/User";
import { io } from "../index";
import { email } from "../utils/emails";
import {
  AuctionUpdateValidation,
  AuctionValidation,
  BiddingValidation,
  CommentUpvoteValidation,
  CommentValidation,
} from "../utils/validations";
import auth from "./auth";

const router = Router();

const resend = new Resend("re_A9qWzEBW_DYMKAUhsxNxTRC2yV2he4i28");
const apiKey = "ac05a30e-11a9-4e12-8243967912f8-bac3-42ef";

router.get("/", async (req: Request, res: Response) => {
  const search = req.query.search;

  if (search) {
    const auctions = await Auction.find();

    const filteredAuctions = auctions.filter((auction) => {
      const mergedString =
        `${auction.make} ${auction.model} ${auction.variant}`.toLowerCase();

      const searchQuery = (search as string).toLowerCase();

      return mergedString.includes(searchQuery);
    });

    res.status(200).send(filteredAuctions);
  } else {
    const auctions = await Auction.find();
    res.status(200).send(auctions);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeSeller = req.query.includeSeller === "true" ? true : false;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid id.");
  }

  const auction = await Auction.findById(id);
  if (auction === null) {
    return res.status(404).send("Auction not found.");
  }

  let auctionWithSeller;
  if (includeSeller) {
    const seller = await UserSchema.findById(auction.sellerId);
    if (seller === null) {
      return res.status(404).send("Seller not found.");
    }
    auctionWithSeller = {
      ...auction.toObject(),
      seller: {
        name: seller.name,
        profilePicture: seller.profilePicture,
      },
    };
  }

  res.status(200).send(includeSeller ? auctionWithSeller : auction);
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
      if (response.data.HttpCode === 201) {
        return `${objectId}_${index}.jpg`;
      }
    }
  );

  const uploadedIds = await Promise.all(uploadPromises);

  let auctionExpiry = moment().add(7, "days").unix();
  if (body.auctionExpiry === "14d")
    auctionExpiry = moment().add(14, "days").unix();
  if (body.auctionExpiry === "30d")
    auctionExpiry = moment().add(30, "days").unix();

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
    auctionExpiry: auctionExpiry,
  });

  res.status(201).send(auction);

  if (user?.email) {
    const { error } = await resend.emails.send({
      from: "No-Reply <noreply@carnilami.com>",
      to: [user.email || ""],
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

  const biddings = await Bidding.find({ auctionId: id }).sort({ bid: -1 });

  const populatedBiddings = await Promise.all(
    biddings.map(async (bidding) => {
      const user = await UserSchema.findById(bidding.userId);

      if (user) {
        return {
          ...bidding.toObject(),
          userName: user.name,
          userProfilePicture: user.profilePicture,
        };
      } else {
        return bidding.toObject();
      }
    })
  );

  res.status(200).send(populatedBiddings || []);
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
        "The minimum bid amount is " +
          (highestBid.bid + 1000).toLocaleString() +
          " rupees."
      );
  }

  const bidding = await Bidding.create({
    auctionId,
    userId: user._id,
    bid: body.bid,
    createdAt: moment().unix(),
  });

  await Auction.findByIdAndUpdate(auctionId, { currentHighestBid: body.bid });

  io.emit("bid", {
    ...bidding.toObject(),
    userName: user.name,
    userProfilePicture: user.profilePicture,
  });

  res.status(201).send(bidding);
});

/* Comments */

router.get("/:id/comments", async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid id.");
  }

  const auction = await Auction.findById(id);
  if (auction === null) {
    return res.status(404).send("Auction not found.");
  }

  const comments = await Comment.find({ auctionId: id }).sort({
    createdAt: -1,
  });

  const populatedComments = await Promise.all(
    comments.map(async (comment) => {
      const user = await UserSchema.findById(comment.userId);

      if (user) {
        return {
          ...comment.toObject(),
          userName: user.name,
          userProfilePicture: user.profilePicture,
        };
      } else {
        return comment.toObject();
      }
    })
  );

  res.status(200).send(populatedComments || []);
});

router.post("/:id/comments", auth, async (req: Request, res: Response) => {
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

  const validation = CommentValidation.safeParse(body);
  if (!validation.success) {
    return res.status(400).send(validation.error.issues[0].message);
  }

  const comment = await Comment.create({
    auctionId,
    userId: user._id,
    content: body.content,
    createdAt: moment().unix(),
  });

  io.emit("comment", {
    ...comment.toObject(),
    userName: user.name,
    userProfilePicture: user.profilePicture,
  });

  res.status(201).send(comment);
});

router.post(
  "/:id/comments/:cId/upvotes",
  auth,
  async (req: Request, res: Response) => {
    const body = req.body;
    const user = req.user as User;
    const auctionId = req.params.id;
    const commentId = req.params.cId;

    if (
      !auctionId.match(/^[0-9a-fA-F]{24}$/) ||
      !commentId.match(/^[0-9a-fA-F]{24}$/)
    ) {
      return res.status(400).send("Invalid id.");
    }

    const auction = await Auction.findById(auctionId);
    if (auction === null) {
      return res.status(404).send("Auction not found.");
    }

    const comment = await Comment.findById({
      _id: commentId,
      auctionId: auctionId,
    });
    if (comment === null) {
      return res.status(404).send("Comment not found.");
    }

    const validation = CommentUpvoteValidation.safeParse(body);
    if (!validation.success) {
      return res.status(400).send(validation.error.issues[0].message);
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: { upvotes: { userId: user._id, createdAt: moment().unix() } },
      },
      { new: true }
    );

    if (updatedComment === null) {
      return res.status(500).send("Internal server error.");
    }

    io.emit("upvote", {
      ...updatedComment.toObject(),
      userName: user.name,
      userProfilePicture: user.profilePicture,
    });

    res.status(201).send(updatedComment);
  }
);

router.delete(
  "/:id/comments/:cId/upvotes",
  auth,
  async (req: Request, res: Response) => {
    const user = req.user as User;
    const auctionId = req.params.id;
    const commentId = req.params.cId;

    if (
      !auctionId.match(/^[0-9a-fA-F]{24}$/) ||
      !commentId.match(/^[0-9a-fA-F]{24}$/)
    ) {
      return res.status(400).send("Invalid id.");
    }

    const auction = await Auction.findById(auctionId);
    if (auction === null) {
      return res.status(404).send("Auction not found.");
    }

    const comment = await Comment.findById({
      _id: commentId,
      auctionId: auctionId,
    });
    if (comment === null) {
      return res.status(404).send("Comment not found.");
    }

    const upvote = comment.upvotes.find(
      (upvote) => upvote.userId === user._id.toString()
    );
    if (upvote === undefined) {
      return res.status(400).send("User has not upvoted this comment.");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $pull: { upvotes: { userId: user._id } },
      },
      { new: true }
    );

    if (updatedComment === null) {
      return res.status(500).send("Internal server error.");
    }

    io.emit("upvote_removed", updatedComment);

    res.status(200).send(updatedComment);
  }
);

export default router;
