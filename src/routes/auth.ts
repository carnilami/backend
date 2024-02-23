import axios from "axios";
import { Request, Response, Router } from "express";
import passport from "passport";
import User from "../entities/User";
import { formatMilliseconds } from "../utils/helpers";

const router = Router();

interface Otp {
  phone: string;
  otp: number;
  expiry: number;
  triesRemaining: number;
}

const otpCodes: Otp[] = [];
const lockedPhones: Record<string, number> = {};

/* Local auth */

router.post("/initiateLogin", async function (req: Request, res: Response) {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).send("Phone number is required.");
    return;
  }

  const isPhoneLocked = lockedPhones[phone];
  if (isPhoneLocked && isPhoneLocked > Date.now()) {
    res
      .status(400)
      .send(
        `OTP limit exhausted. Try again in ${formatMilliseconds(
          isPhoneLocked - Date.now()
        )}.`
      );
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiry = Date.now() + 60 * 1000; // 1 minute

  try {
    await axios.post(
      "https://graph.facebook.com/v18.0/175765962297046/messages",
      {
        messaging_product: "whatsapp",
        to: "+92" + phone,
        type: "template",
        template: {
          name: "car_nilami_test",
          language: {
            code: "en_US",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: otp.toString(),
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: otp.toString(),
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          contentType: "application/json",
        },
      }
    );
  } catch (error) {
    return res
      .status(400)
      .send("Unable to send OTP at the moment. Please try again later.");
  }

  otpCodes.push({ phone, otp, expiry, triesRemaining: 3 });

  res.status(200).send("OTP sent.");
});

router.post("/refreshOtp", async function (req: Request, res: Response) {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).send("Phone number is required.");
    return;
  }

  const isPhoneLocked = lockedPhones[phone];
  if (isPhoneLocked && isPhoneLocked > Date.now()) {
    res
      .status(400)
      .send(
        `OTP limit exhausted. Try again in ${formatMilliseconds(
          isPhoneLocked - Date.now()
        )}.`
      );
    return;
  }

  const index = otpCodes.findIndex((otpCode) => otpCode.phone === phone);

  if (index === -1) {
    res.status(400).send("No existing OTP found for this phone number.");
    return;
  }

  if (otpCodes[index].expiry > Date.now()) {
    res
      .status(400)
      .send("Old OTP is still valid, please wait for it to expire.");
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiry = Date.now() + 60 * 1000; // 1 minute

  try {
    await axios.post(
      "https://graph.facebook.com/v18.0/175765962297046/messages",
      {
        messaging_product: "whatsapp",
        to: "+92" + phone,
        type: "template",
        template: {
          name: "car_nilami_test",
          language: {
            code: "en_US",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: otp.toString(),
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: otp.toString(),
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          contentType: "application/json",
        },
      }
    );
  } catch (error) {
    return res
      .status(400)
      .send("Unable to send OTP at the moment. Please try again later.");
  }

  otpCodes[index] = { phone, otp, expiry, triesRemaining: 3 };

  res.status(200).send("New OTP sent.");
});

router.post("/verifyOtp", function (req: Request, res: Response) {
  const { phone, otp } = req.body;

  if (!phone) {
    res.status(400).send("Phone number was not provided.");
    return;
  }

  if (!otp) {
    res.status(400).send("OTP is required.");
    return;
  }

  const validation = new RegExp("\\d{6}");
  if (!validation.test(otp)) {
    res.status(400).send("Invalid OTP format.");
    return;
  }

  const index = otpCodes.findIndex(
    (otpCode) => otpCode.phone === phone && otpCode.otp === otp
  );

  if (index === -1) {
    const triesRemaining =
      otpCodes.find((otpCode) => otpCode.phone === phone)?.triesRemaining || 0;
    if (triesRemaining > 0) {
      otpCodes.find((otpCode) => otpCode.phone === phone)!.triesRemaining -= 1;
    } else {
      lockedPhones[phone] = Date.now() + 60 * 1000; // 1 minute
      otpCodes.splice(
        otpCodes.findIndex((otpCode) => otpCode.phone === phone),
        1
      );
      res
        .status(400)
        .send(
          `Invalid OTP. Phone number locked. Try again in ${formatMilliseconds(
            lockedPhones[phone] - Date.now()
          )}.`
        );
      return;
    }
    res
      .status(400)
      .send(`Invalid OTP. You have ${triesRemaining} tries remaining.`);
    return;
  }

  if (otpCodes[index].expiry < Date.now()) {
    res.status(400).send("OTP expired. Please generate a new one.");
    return;
  }

  passport.authenticate("local", (err: Error, user: User, info: any) => {
    if (err) {
      res.status(400).send("Internal Server Error");
      return;
    }
    req.logIn(user, (err) => {
      if (err) {
        res.status(400).send("Internal Server Error");
        return;
      }
      otpCodes.splice(index, 1);
      res.status(200).send("Login successful.");
    });
  })(req, res);
});

/* Google auth */

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req: Request, res: Response) {
    res.redirect(process.env.FRONTEND_URL!);
  }
);

/* Logout */

router.delete("/logout", function (req: Request, res: Response) {
  req.logout((err) => {
    if (err) {
      res.status(400).send("Unable to logout.");
      return;
    }
  });
  res.status(200).send("Logged out.");
});

export default router;
