import express from "express";
import "dotenv/config";
import http from "http";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import userRouter from "./userRoutes";
import { Server } from "socket.io";
import { dynamoDB } from "./awsConfig";
import jwt from "jsonwebtoken";
import { Message } from "./userModel";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  socket.on("joined", () => {
    io.sockets.emit("new-user", "new user joined");
  });

  socket.on("private message", async (to, message, mySelf) => {
    try {
      const decoded: any = jwt.verify(mySelf, process.env.ACCESS_TOKEN_SECRET!);
      const sender = decoded.email;
      const reciver = to;

      const conversationId =
        sender < reciver ? `${sender}#${reciver}` : `${reciver}#${sender}`;

      const newMsg: Message = {
        messageId: uuidv4(),
        conversationId,
        timestamp: Date.now(),
        message,
        sender,
        reciver,
        time: new Date().toISOString(),
      };

      await dynamoDB
        .put({
          TableName: "chatgram_messages",
          Item: newMsg,
        })
        .promise();

      io.sockets.emit("refresh", "new Message");
    } catch (err) {
      console.error("Message sending error:", err);
    }
  });
});

app.use("/", userRouter);

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
