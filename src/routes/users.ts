import axios, { AxiosRequestConfig } from "axios";
import { dataUriToBuffer } from "data-uri-to-buffer";
import { Request, Response, Router } from "express";
import AuctionSchema from "../database/schemas/Auction";
import UserSchema from "../database/schemas/User";
import User from "../entities/User";
import auth from "../middlewares/auth";
import {
  UserNotificationsValidation,
  UserProfileValidation,
} from "../utils/validations";

const router = Router();

const apiKey = "ac05a30e-11a9-4e12-8243967912f8-bac3-42ef";

router.get("/me", auth, async (req: Request, res: Response) => {
  const user = req.user as User;
  const userData = await UserSchema.findById(user._id);

  if (!userData) {
    return res.status(404).send("User not found.");
  }

  return res.status(200).send(userData);
});

router.get("/me/listings", auth, async (req: Request, res: Response) => {
  const user = req.user as User;
  const userData = await UserSchema.findById(user._id);

  if (!userData) {
    return res.status(404).send("User not found.");
  }

  const listings = await AuctionSchema.find({ sellerId: user._id });

  return res.status(200).send(listings || []);
});

router.put("/me/notifications", auth, async (req: Request, res: Response) => {
  const user = req.user as User;
  const userData = await UserSchema.findById(user._id);

  if (!userData) {
    return res.status(404).send("User not found.");
  }

  const validation = UserNotificationsValidation.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).send(validation.error.issues[0].message);
  }

  const updatedUser = await UserSchema.findByIdAndUpdate(
    user._id,
    { notifications: req.body },
    { new: true }
  );

  return res.status(200).send(updatedUser);
});

router.put("/me/profile", auth, async (req: Request, res: Response) => {
  const user = req.user as User;
  const body = req.body;

  const validation = UserProfileValidation.safeParse(body);
  if (!validation.success) {
    return res.status(400).send(validation.error.issues[0].message);
  }

  const profilePictureUri = body.profilePicture;
  let profileId = user.profilePicture || "";

  if (profilePictureUri !== user.profilePicture) {
    if (!profilePictureUri && user.profilePicture) {
      const options: AxiosRequestConfig = {
        method: "DELETE",
        url: `https://storage.bunnycdn.com/carnilami/profiles/${user.profilePicture}`,
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/octet-stream",
        },
      };

      await axios.request(options);
      profileId = "";
    }

    if (profilePictureUri) {
      if (profileId) {
        const options: AxiosRequestConfig = {
          method: "DELETE",
          url: `https://storage.bunnycdn.com/carnilami/profiles/${profileId}`,
          headers: {
            AccessKey: apiKey,
            "Content-Type": "application/octet-stream",
          },
        };

        const res = await axios.request(options);
      }

      const parsed = dataUriToBuffer(profilePictureUri);
      const newProfileId =
        user._id + Math.random().toString(36).substring(7) + ".jpg";
      const options: AxiosRequestConfig = {
        method: "PUT",
        url: `https://storage.bunnycdn.com/carnilami/profiles/${newProfileId}`,
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/octet-stream",
        },
        data: parsed.buffer,
      };

      const response = await axios.request(options);
      if (response.data.HttpCode === 201) {
        profileId = newProfileId;
      }
    }
  }

  const updatedUser = await UserSchema.findByIdAndUpdate(
    user._id,
    { name: body.name, bio: body.bio, profilePicture: profileId },
    { new: true }
  );
  res.status(200).send(updatedUser);
});

export default router;
