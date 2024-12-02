import express from "express";
import { createBooking, updateBookingStatus, getBookings, getBookingById, getBookingsByHotelId, deleteBooking } from "../controllers/booking.js";
import { verifyUser } from "../utils/verifyToken.js";

const router = express.Router();
//ADD
router.post("/create", verifyUser, createBooking);
//UPDATE
router.put("/update/status", updateBookingStatus);
//DELETE

// Lấy tất cả bookings
router.get("/", getBookings);
// Thêm route để lấy booking theo ID
router.get("/:id", getBookingById);
// Thêm route để lấy booking theo hotelId
router.get("/hotel/:hotelId", getBookingsByHotelId);
// Thêm route để xóa booking
router.delete("/:id", verifyUser, deleteBooking);
// Thêm route để lấy booking theo userId
router.get("/user/:id", verifyUser, getBookings);

export default router;
