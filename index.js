import express from "express";
import http from "http";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

import shopRoutes from "./routes/shop.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/post.js";
import streamRoutes from "./functions/stream.js";
import userRoutes from "./routes/user.js";
import likeRoutes from "./routes/like.js";
import shortURLRoutes from "./functions/shortURL.js";
import commentRoutes from "./routes/comment.js";
import followRoutes from "./routes/follow.js";
import chatRoutes from "./routes/chat.js";
import notificationRoutes from "./routes/notification.js";
import reportRoutes from "./routes/report.js";
import salesmanRoutes from "./routes/salesman.js";
import adminRoutes from "./routes/admin.js";
import { createPost } from "./controllers/post.js";
import {
  createShop,
  getShopDetails,
  getShopDetailsFromUserId,
} from "./controllers/shop.js";
import { authenticate } from "./middlewares/authMiddleware.js";
import { getAccessToken } from "./config/notification.js";
import { getChatHistory, saveMessage } from "./controllers/chat.js";
import { getUser } from "./controllers/user.js";
import {
  sendChatNotification,
  sendNotificationToTopic,
} from "./controllers/notification.js";

// CONFIGURATION
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json({ limit: "220mb" }));
app.use(express.urlencoded({ limit: "220mb", extended: true }));
app.use(helmet()); // if not used with helmet, cors will not work
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors());
app.use("/public", express.static("public"));

// If you're behind a proxy, this will tell Express to use the X-Forwarded-For header.
app.set("trust proxy", true);

// FILE STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "public/assets";

    if (req.path.includes("/shops")) uploadPath = "public/assets/shops";
    else if (req.path.includes("/posts")) uploadPath = "public/assets/posts";

    console.log(uploadPath);

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const fileExtension = file.mimetype.split("/")[1];
    cb(null, `${timestamp}-${randomNumber}.${fileExtension}`);
  },
});
const upload = multer({ storage });

// ROUTES WITH FILES
app.post("/shops", authenticate, upload.single("profilePic"), createShop);
app.post(
  "/posts",
  authenticate,
  upload.fields([
    { name: "mainFile", maxCount: 1 },
    { name: "additionalFiles1", maxCount: 1 },
    { name: "additionalFiles2", maxCount: 1 },
    { name: "additionalFiles3", maxCount: 1 },
    { name: "additionalFiles4", maxCount: 1 },
  ]),
  createPost
);

// ROUTES
app.use("/shops", shopRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/stream", streamRoutes);
app.use("/users", userRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use("/share", shortURLRoutes);
app.use("/follow", followRoutes);
app.use("/chat", chatRoutes);
app.use("/notification", notificationRoutes);
app.use("/reports", reportRoutes);
app.use("/salesmen", salesmanRoutes);
app.use("/admin", adminRoutes);

// CUSTOM ROUTES
app.get("/config/notification", async (req, res) => {
  try {
    const token = await getAccessToken();
    res.status(200).json(token);
  } catch (err) {
    console.error("Error generating token:", err);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get("/policy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "assets", "policy.html"));
});

app.get("/support", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "support", "support.html"));
});

// ERROR HANDLING (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// WEB SOCKET
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
// app.use("/chat", chatRoutes);

// GLOBAL DATA STRUCTURES
const activeUsers = new Map(); // Store active users

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on(
    "joinRoom",
    async ({ senderId, receiverId, shopId, isShop }, callback) => {
      const roomId = [senderId, receiverId].sort().join("_") + `_${shopId}`;
      console.log(isShop + " is what getting");
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);

      activeUsers.set(senderId, { socketId: socket.id, receiverId });

      if (!isShop) {
        const shop = await getShopDetailsFromUserId(receiverId);
        callback(shop);
      } else {
        const user = await getUser(receiverId);
        console.log(user);
        callback(user);
      }
    }
  );

  socket.on(
    "sendMessage",
    async ({ senderId, receiverId, content, shopId }) => {
      const messageId = await saveMessage(
        senderId,
        receiverId,
        content,
        shopId
      );
      console.log("sending message with shop " + shopId);

      if (messageId) {
        const message = {
          id: messageId,
          senderId,
          receiverId,
          content,
          timestamp: new Date().toISOString(),
        };

        const roomId = [senderId, receiverId].sort().join("_") + `_${shopId}`;
        io.to(roomId).emit("receiveMessage", message);

        // Send push notification
        if (activeUsers.get(receiverId)?.receiverId != receiverId) {
          await sendChatNotification({
            receiverId,
            senderId,
            senderName: "Shaheeeeeem",
            message: content,
            shopId,
            profilePicURL:
              "https://fastly.picsum.photos/id/1071/200/300.jpg?hmac=y09-AL4WisOkuQR4SOKzDWjPHWptbCDbEaFP0yJkKNY", // Replace with actual profile picture URL
          });
        }
      }
    }
  );

  socket.on("fetchChatHistory", async ({ senderId, receiverId }, callback) => {
    const messages = await getChatHistory(senderId, receiverId);
    callback(messages);
  });

  socket.on("userInactive", ({ userId }) => {
    console.log(userId + " is printing offline");
    activeUsers.set(userId, {
      socketId: socket.id,
      receiverId: activeUsers.get(userId)?.receiverId * -1,
    });
  });

  socket.on("userOnline", ({ userId }) => {
    console.log(userId + " is printing online");
    activeUsers.set(userId, {
      socketId: socket.id,
      receiverId: activeUsers.get(userId)?.receiverId * -1,
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    for (const [userId, user] of activeUsers.entries()) {
      if (user.socketId === socket.id) {
        activeUsers.delete(userId);
        console.log("User removed from active users:", userId);
        break;
      }
    }
  });
});

// Initialize firebase admin SDK
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Commandline Input
const getOnlineUsers = () => {
  console.log("--------------------------------------------------");
  console.log("Active Users Count:", activeUsers.size);
  console.log("Online Users:");
  activeUsers.forEach((user, userId) => {
    console.log(`User ID: ${userId}, Socket ID: ${user.socketId}, receiverId: ${user.receiverId}`);
  console.log("--------------------------------------------------");
  });
}

// Enable stdin reading
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (input) => {
  const command = input.trim();

  if (command === 'online') {
    getOnlineUsers();
  } else {
    console.log(`Unknown command: ${command}`);
  }
});

// Example function to call
function showFunction() {
  console.log('You triggered the "show" function!');
}


// START SERVER
server.listen(PORT, "::", () =>
  console.log(`Server is running on port ${PORT}`)
);
