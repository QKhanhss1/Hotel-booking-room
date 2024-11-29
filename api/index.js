import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import favoriteRoute from "./routes/favorite.js";
import usersRoute from "./routes/users.js";
import hotelsRoute from "./routes/hotels.js";
import imageRoutes from "./routes/image.js";
import roomsRoute from "./routes/rooms.js";
import bookingRoute from "./routes/booking.js";
import paymentRoute from "./routes/vnpay.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();

const connect = async () => {
  try {
    //   await mongoose.connect(process.env.MONGO);
    //   console.log("Connected to mongoDB.");
    // } catch (error) {
    //   throw error;
    // }
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

app.use("/api", imageRoutes);
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/hotels", hotelsRoute);
// app.use("/api/rooms", roomsRoute);
// app.use("/api/hotels", roomsRoute);
app.use("/api/hotels/rooms", roomsRoute); // Thay vì /api/rooms
app.use("/api/booking", bookingRoute);

app.use("/api/favorites", favoriteRoute);
app.use("/api/v1/vnpay", paymentRoute);


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
