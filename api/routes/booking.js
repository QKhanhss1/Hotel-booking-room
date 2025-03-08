import express from "express";
import { createBooking, updateBookingStatus, getBookings, getBookingsByHotelId, deleteBooking } from "../controllers/booking.js";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();
//ADD
router.post("/create", verifyUser, createBooking);
//UPDATE 
router.put("/update/status", updateBookingStatus); // Đảm bảo đường dẫn này khớp
//DELETE
router.delete("/:id", verifyAdmin, deleteBooking);
//GET
router.get("/hotel/:hotelId", getBookingsByHotelId);
router.get("/user/:id", verifyUser, getBookings);

export default router;
