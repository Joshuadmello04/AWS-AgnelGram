import express from "express";
import "dotenv/config";
import http from "http";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import userRouter from "./userRoutes.js";
import { Server } from "socket.io";
import { dynamoDB } from "./awsConfig.js";
import jwt from "jsonwebtoken";
import { Message } from "./userModel.js";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// S3 Client setup
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error("AWS credentials or region are not defined in environment variables");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const io = new Server(server, {
  cors: {
    origin: "*",
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
        type: "text",
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

// File upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { sender, receiver, token } = req.body;

    if (!file || !sender || !receiver || !token) {
      return res.status(400).json({ error: "Missing file or user data" });
    }

    // Verify JWT token
    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    if (decoded.email !== sender) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload to S3
    await s3Client.send(new PutObjectCommand(s3Params));

    // Store file metadata in DynamoDB
    const conversationId =
      sender < receiver ? `${sender}#${receiver}` : `${receiver}#${sender}`;

    const fileMessage: Message = {
      messageId: uuidv4(),
      conversationId,
      timestamp: Date.now(),
      message: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      sender,
      reciver: receiver,
      time: new Date().toISOString(),
      type: "file",
    };

    await dynamoDB
      .put({
        TableName: "chatgram_messages",
        Item: fileMessage,
      })
      .promise();

    // Emit Socket.IO event
    io.sockets.emit("refresh", "new File Message");

    res.json({ file: fileName });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

app.use("/", userRouter);

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});