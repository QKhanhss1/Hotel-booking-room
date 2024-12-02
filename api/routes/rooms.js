import express from "express";
import {
  createRoom,
  getRoom,
  getRooms,
  updateRoom,
  updateRoomAvailability,
  deleteRoom,
  getRoomNumber,
  deleteUnavailableDates
} from "../controllers/room.js";
import { verifyAdmin, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();
//CREATE
router.post("/:hotelid", verifyAdmin, createRoom);

//UPDATE
router.put("/availability/:id", updateRoomAvailability);
router.put("/:id", verifyAdmin, updateRoom);
router.put("/:roomNumberId/unavailable-dates", verifyAdmin,deleteUnavailableDates);

//DELETE
// router.delete("/:id/:hotelid", verifyAdmin, deleteRoom);
router.delete("/room/:roomId/:hotelId", verifyAdmin, deleteRoom);
//GET

router.get("/:id", getRoom);
//GET ALL
router.get("/", getRooms);
//GET ROOM NUMBER
router.get("/:roomId/roomnumbers/:roomNumberId", getRoomNumber);

export default router;
