import axios, { AxiosRequestConfig } from "axios";
import { Router } from "express";
import multer from "multer";

const router = Router();

const apiKey = "ac05a30e-11a9-4e12-8243967912f8-bac3-42ef";

const axiosInstance = axios.create({
  baseURL: "sg.storage.bunnycdn.com",
});

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Set up Multer midleware to handle file uploa
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/", upload.array("image"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const files = req.files as MulterFile[];

    const uploadPromises = files.map(async (file, index) => {
      const options: AxiosRequestConfig = {
        method: "PUT",
        url: `https://storage.bunnycdn.com/carnilami/2393456/f345bx_${index}.jpg`,
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/octet-stream",
        },
        data: file.buffer,
      };

      const response = await axios.request(options);
      console.log("success")
      if (response.data.HttpCode === 201) {
        return `https://cdn.carnilami.com/2393456/f345bx_${index}.jpg`;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    res.status(200).json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
