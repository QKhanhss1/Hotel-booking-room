import express from "express";
import { createBooking, updateBookingStatus,getBookings } from "../controllers/booking.js";
import { verifyUser } from "../utils/verifyToken.js";

const router = express.Router();
//ADD
router.post("/create", verifyUser, createBooking);
//UPDATE
router.put("/update/status", updateBookingStatus);
//DELETE

//GET
router.get("/:id",verifyUser,getBookings);
export default router;
