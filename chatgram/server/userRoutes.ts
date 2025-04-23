import { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { dynamoDB } from "./awsConfig.js";
import "dotenv/config";

const router = Router();

const USERS_TABLE = "chatgram_users";
const MESSAGES_TABLE = "chatgram_messages";

// ✅ Auth: Register or login
router.post("/auth", async (req: Request, res: Response) => {
  const user = { ...req.body };

  const params = {
    TableName: USERS_TABLE,
    Item: {
      ...user,
      id: uuidv4(),
    },
  };

  try {
    await dynamoDB.put(params).promise();
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!);
    res.setHeader("Set-Cookie", `user=${accessToken}; Path=/`);
    res.send("user created");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
});

// ✅ Get all users
router.get("/users", async (_req: Request, res: Response) => {
  const params = { TableName: USERS_TABLE };

  try {
    const data = await dynamoDB.scan(params).promise();
    res.send(data.Items);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
  }
});

// ✅ Get current user by token
router.get("/user", async (req: Request, res: Response) => {
  try {
    const data = jwt.verify(
      req.headers.authorization!,
      process.env.ACCESS_TOKEN_SECRET!
    );

    const params = {
      TableName: USERS_TABLE,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": (data as any).email,
      },
    };

    const user = await dynamoDB.scan(params).promise();
    res.send(user.Items);
  } catch (err) {
    console.error(err);
    res.status(401).send("Invalid token");
  }
});

// ✅ Send a message
router.post("/send", async (req: Request, res: Response) => {
  const { sender, reciver, message } = req.body;

  if (!sender || !reciver || !message) {
    return res.status(400).send("Missing required fields");
  }

  const conversationId =
    sender < reciver ? `${sender}#${reciver}` : `${reciver}#${sender}`;

  const timestamp = Date.now();
  const messageId = uuidv4();

  const messageData = {
    conversationId,
    timestamp,
    messageId,
    sender,
    reciver,
    message,
  };

  const params = {
    TableName: MESSAGES_TABLE,
    Item: messageData,
  };

  try {
    await dynamoDB.put(params).promise();
    res.send({ message: "Message sent", data: messageData });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send("Failed to send message");
  }
});

// ✅ Get messages between two users
router.get("/messages", async (req: Request, res: Response) => {
  const { sender, reciver } = req.query;

  if (!sender || !reciver) {
    return res.status(400).send("Missing sender or reciver");
  }

  const conversationId =
    sender < reciver ? `${sender}#${reciver}` : `${reciver}#${sender}`;

  const params = {
    TableName: MESSAGES_TABLE,
    KeyConditionExpression: "conversationId = :cid",
    ExpressionAttributeValues: {
      ":cid": conversationId,
    },
    ScanIndexForward: true,
  };

  try {
    const data = await dynamoDB.query(params).promise();
    res.send(data.Items);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Error fetching messages");
  }
});

export default router;