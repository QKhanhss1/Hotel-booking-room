import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import favoriteRoute from "./routes/favorite.js";
import usersRoute from "./routes/users.js";
import hotelsRoute from "./routes/hotels.js";
import imageRoutes from "./routes/image.js";
import roomsRoute from "./routes/rooms.js";
import bookingRoute from "./routes/booking.js";
import vnpayRoute from "./routes/vnpay.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from "./routes/auth.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log để debug
app.use('/uploads', (req, res, next) => {
  console.log('Accessing uploads:', req.url);
  next();
});

const connect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB:", conn.connection.host);

    // Log để kiểm tra connection string
    console.log("MongoDB URI:", process.env.MONGO);
    console.log(mongoose.version);
    // Log trạng thái kết nối
    console.log("Connection state:", mongoose.connection.readyState);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Thoát ứng dụng nếu không kết nối được DB
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("mongoDB disconnected!");
});

//middlewares
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3002"],
    credentials: true, // Cho phép gửi cookie
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.use("/api", imageRoutes);
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/hotels", hotelsRoute);
// app.use("/api/rooms", roomsRoute);
// app.use("/api/hotels", roomsRoute);
app.use("/api/rooms", roomsRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/vnpay", vnpayRoute);

app.use("/api/favorites", favoriteRoute);

app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
});

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  console.error("Error Stack:", err.stack);
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

app.listen(8800, () => {
  connect();
  console.log("Connected to backend.");
});
