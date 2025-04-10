import express from "express";
import {
  countByCity,
  countByType,
  createHotel,
  deleteHotel,
  getHotel,
  getHotelRooms,
  getHotels,
  updateHotel,
  getFeaturedHotels,
  createReview,
  getReviewsByHotelId,
  getHotelsByType,
  getCitiesByQuery,
  deleteReview,
  getAllHotel,
  getCities
} from "../controllers/hotel.js";
import Hotel from "../models/Hotel.js";
import { verifyAdmin, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

//CREATE
router.post("/", verifyAdmin, createHotel);

//UPDATE
router.put("/:id", verifyAdmin, updateHotel);

//DELETE
router.delete("/:id", verifyAdmin, deleteHotel);

//GET
router.get("/find/:id", getHotel);
//GET ALL
router.get("/features", getFeaturedHotels);
router.get("/", getHotels);
router.get("/all", getAllHotel);

router.get("/countByCity", countByCity);
router.get("/countByType", countByType);
router.get("/rooms/:id", getHotelRooms);
router.post("/reviews/:id", createReview);
router.get("/review/all/:id", getReviewsByHotelId);
router.delete("/:hotelId/reviews/:reviewId", verifyAdmin, deleteReview);
router.get("/type/:type", getHotelsByType);

// Tìm kiếm theo query (thành phố, loại, tên khách sạn)
router.get("/cities", getCitiesByQuery);

// Lấy danh sách các thành phố có hình ảnh (cho Featured component)
router.get("/cities/featured", getCities);

export default router;
