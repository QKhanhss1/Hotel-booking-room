import express from "express";
import { verifyAdmin } from "../utils/verifyToken.js";
import multer from "multer";
import {
  createRoom,
  updateRoom,
  deleteRoom,
  getRoom,
  getRooms
} from "../controllers/room.js";
import path from 'path';

const router = express.Router({ mergeParams: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
router.get("/", getRooms);
router.post("/", verifyAdmin, upload.array('images', 5), createRoom);
router.put("/:id", verifyAdmin, upload.array('images', 5), updateRoom);
router.delete("/:id/:hotelId", verifyAdmin, deleteRoom);
router.get("/:id", getRoom);

export default router;
