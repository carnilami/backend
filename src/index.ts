import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import "./database/database";
import { createApp } from "./utils/createApp";

async function main() {
  try {
    const app = createApp();
    app.listen(3000, () => console.log("Listening on port 3000"));
  } catch (err) {}
}

main();
