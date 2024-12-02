import express from "express";
import { createBooking, updateBookingStatus, getBookings, getBookingsByHotelId, deleteBooking } from "../controllers/booking.js";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();
//ADD
router.post("/create", verifyUser, createBooking);
//UPDATE
router.put("/update/status", updateBookingStatus);
//DELETE
// Thêm route để lấy booking theo hotelId
router.get("/hotel/:hotelId", getBookingsByHotelId);
// Thêm route để xóa booking
router.delete("/:id", verifyAdmin, deleteBooking);
// Thêm route để lấy booking theo userId
router.get("/user/:id", verifyUser, getBookings);

export default router;
