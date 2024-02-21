// main.js

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import "./database/database";
import { createApp } from "./utils/createApp";

import { Server } from "socket.io";
import http from "http";

let io: Server;

async function main() {
  try {
    const app = createApp();
    const server = http.createServer(app);

    io = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    server.listen(3000, () => console.log("Listening on port 3000 (express & socket)"));
  } catch (err) {
    console.error(err);
  }
}

main();

export { io };
