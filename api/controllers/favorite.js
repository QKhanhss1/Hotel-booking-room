import Favorite from "../models/Favorite.js";
import Hotel from "../models/Hotel.js";
// Get
export const getFavorites = async (req, res) => {
    try {
        // Kiểm tra xem req.user.id có hợp lệ không
        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: "Thông tin người dùng không hợp lệ." });
        }

        const favorites = await Favorite.findOne({ user: req.user.id }).populate("hotels");

        // Kiểm tra nếu không tìm thấy danh sách yêu thích
        if (!favorites) {
            return res.status(404).json({ message: "Danh sách yêu thích không tồn tại." });
        }

        // Trả về kết quả
        res.status(200).json(favorites);
    } catch (error) {
        // Gửi chi tiết lỗi ra để kiểm tra
        console.error(error);
        res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};
// ADD
export const addFavorite = async (req, res) => {
    try {
        const { hotelId } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Khách sạn không tồn tại." });
        }
        //kiểm tra danh sách yêu thích tồn tại chưa
        let favorite = await Favorite.findOne({ user: req.user.id });
        
        if (!favorite) {
            favorite = new Favorite({ user: req.user.id, hotels: [hotelId] });
        } else {
            if (favorite.hotels.includes(hotelId)) {
                return res.status(400).json({ message: "Khách sạn đã có trong danh sách yêu thích." });
            }
            favorite.hotels.push(hotelId);
        }

        await favorite.save();
        res.status(200).json({ message: "Đã thêm vào danh sách yêu thích.", favorite });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống", error });
    }
};

// Delete
export const removeFavorite = async (req, res) => {
    try {
        const hotelId = req.params.id;
        
        let favorite = await Favorite.findOne({ user: req.user.id });
        if (!favorite) return res.status(404).json({ message: "Danh sách yêu thích không tồn tại." });

        favorite.hotels = favorite.hotels.filter(id => id.toString() !== hotelId);
        await favorite.save();

        res.status(200).json({ message: "Đã xóa khỏi danh sách yêu thích.", favorite });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống", error });
    }
};

