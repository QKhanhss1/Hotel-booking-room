import express from "express";
import { verifyAdmin } from "../utils/verifyToken.js";
import {
  createRoom,
  deleteRoom,
  getRoom,
  getRooms,
  getRoomsByHotel,
  updateRoom,
  updateRoomAvailability,
} from "../controllers/room.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log('Room Route:', req.method, req.url);
  next();
});

router.get("/hotel/:hotelId", getRoomsByHotel);  
router.post("/hotel/:hotelId", verifyAdmin, createRoom);  

router.get("/", getRooms);
router.get("/:id", getRoom);
router.put("/:id", verifyAdmin, updateRoom);
router.delete("/:id/:hotelId", verifyAdmin, deleteRoom);
router.put("/availability/:id", updateRoomAvailability);

export default router;
