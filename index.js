  import express from "express";
  import bodyParser from "body-parser";
  import dotenv from "dotenv";
  import multer from "multer";
  import cors from "cors";
  import helmet from "helmet";
  import morgan from "morgan";

  import shopRoutes from "./routes/shop.js";
  import authRoutes from "./routes/auth.js";
  import postRoutes from "./routes/post.js";
  import streamRoutes from "./functions/stream.js";
  import userRoutes from "./routes/user.js";
  import { createPost } from "./controllers/post.js";
  import { createShop } from "./controllers/shop.js";
  import { authenticate } from "./middlewares/authMiddleware.js";

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
  app.set('trust proxy', true);


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
      cb(null, `${timestamp}-${file.originalname}`);
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

  // ERROR HANDLING (optional but recommended)
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  });

  // START SERVER
  app.listen(PORT, "0.0.0.0", () => console.log(`Server is running on port ${PORT}`));
