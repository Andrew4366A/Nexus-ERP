import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createServer } from "node:http";
import { initSocket } from "./socket.js";

await connectDB();

const server = createServer(app);

initSocket(server);

server.listen(env.port, () => {
  console.log(`API server running on http://localhost:${env.port}`);
});
