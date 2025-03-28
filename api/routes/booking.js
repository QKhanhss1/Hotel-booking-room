import express from "express";
import { createBooking, updateBookingStatus, getBookings, getBookingsByHotelId, deleteBooking, checkUserBookedHotel } from "../controllers/booking.js";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";
import Booking from "../models/Booking.js";

const router = express.Router();
//ADD
router.post("/create", verifyUser, createBooking);
router.post("/update", updateBookingStatus);
//DELETE
router.delete("/:id", verifyUser, deleteBooking);
//GET
router.get("/hotel/:hotelId", getBookingsByHotelId);
router.get("/user/:id", verifyUser, getBookings);
router.get("/check/:userId/:hotelId", verifyUser, checkUserBookedHotel);
router.get("/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng!" });
    }
    
    res.status(200).json(booking);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin booking:", error.message);
    res.status(500).json({ error: "Lỗi khi lấy thông tin booking!" });
  }
});

export default router;
