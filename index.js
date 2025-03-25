import express from "express";
import http from "http";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";

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
import { createPost } from "./controllers/post.js";
import { createShop } from "./controllers/shop.js";
import { authenticate } from "./middlewares/authMiddleware.js";
import { getAccessToken } from "./config/notification.js";
import { getChatHistory, saveMessage } from "./controllers/chat.js";

// CONFIGURATION
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
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
    const fileExtension = file.originalname.split(".").pop();
    cb(null, `${timestamp}-${randomNumber}`);
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
    { name: "additionalFiles", maxCount: 4 },
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

app.get("/mail", async (req, res) => {
  res.redirect("mailto:botiqstore@gmail.com?subject=Request%20to%20Delete%20My%20Account&body=Hello,%0D%0A%0D%0AI");
})

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

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    const messageId = await saveMessage(senderId, receiverId, content);

    if (messageId) {
      const message = {
        id: messageId,
        senderId,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
      };

      const roomId = [senderId, receiverId].sort().join("_");
      io.to(roomId).emit("receiveMessage", message);
    }
  });

  socket.on("fetchChatHistory", async ({ senderId, receiverId }, callback) => {
    const messages = await getChatHistory(senderId, receiverId);
    callback(messages);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// START SERVER
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Server is running on port ${PORT}`)
);
