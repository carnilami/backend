// main.js

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import "./database/database";
import { createApp } from "./utils/createApp";

import http from "http";
import { Server } from "socket.io";
import { FRONTEND_URL } from "./utils/constants";

let io: Server;

async function main() {
  try {
    const app = createApp();
    const server = http.createServer(app);

    io = new Server(server, {
      cors: {
        origin: "https://carnilami.com",
        methods: ["GET", "POST"],
      },
    });

    server.listen(3000, () =>
      console.log("Listening on port 3000 (express & socket)")
    );
  } catch (err) {
    console.error(err);
  }
}

main();

export { io };
