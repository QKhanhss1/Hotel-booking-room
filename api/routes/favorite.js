import express from "express";
import { addFavorite, getFavorites,removeFavorite } from "../controllers/favorite.js";
import { verifyUser } from "../utils/verifyToken.js";


const router = express.Router();
//ADD
router.post("/", verifyUser ,addFavorite);
//UPDATE

//DELETE
router.delete("/:id", verifyUser ,removeFavorite);
//GET 
router.get("/", verifyUser ,getFavorites);

export default router;
