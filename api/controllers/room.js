import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import Image from "../models/Image.js";
import { createError } from "../utils/error.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const createRoom = async (req, res, next) => {
  const hotelId = req.params.hotelId;
  const { title, price, maxPeople, desc, roomNumbers, imageIds, amenities, roomSize } = req.body;

  try {
    console.log("Creating room with hotelId:", hotelId);
    
    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID is required" });
    }

    // Kiểm tra hotelId có hợp lệ không
    const hotelExists = await Hotel.findById(hotelId);
    if (!hotelExists) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const newRoom = new Room({
      title,
      price,
      maxPeople,
      desc,
      roomNumbers,
      imageIds,
      hotelId, // Đảm bảo hotelId được gán đúng
      amenities: amenities || [],
      roomSize: roomSize || "30"
    });

    const savedRoom = await newRoom.save();

    // Thêm id phòng vào hotel
    await Hotel.findByIdAndUpdate(hotelId, {
      $push: { rooms: savedRoom._id },
    });

    res.status(201).json(savedRoom);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ 
      success: false, 
      status: 500, 
      message: err.message,
      stack: err.stack 
    });
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

export const updateRoomAvailability = async (req, res, next) => {
  try {
    await Room.updateOne(
      { "roomNumbers._id": req.params.id }, // Tìm roomNumber theo ID
      {
        $push: {
          "roomNumbers.$.unavailableDates": req.body.dates,
        },
      }
    );
    res.status(200).json("Room status has been updated.");
  } catch (err) {
    next(err);
  }
};
//hủy phòng
export const deleteUnavailableDates = async (req, res, next) => {
  try {
    const { roomNumberId } = req.params; // ID của roomNumber
    const { dates } = req.body; // Danh sách ngày cần xóa

    console.log("Room delete dates:", {roomNumberId, dates}); // Debug log

    if (!roomNumberId || !dates) {
      return res.status(400).json({ message: "Missing roomNumberId or dates" });
    }

    // Xóa các ngày khỏi trường unavailableDates
    const result = await Room.updateOne(
      { "roomNumbers.idRoomNumber": roomNumberId },
      {
        $pull: {
          "roomNumbers.$.unavailableDates": { $in: dates },
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy hoặc không có ngày để xóa" });
    }

    res.status(200).json({ message: "Xóa ngày thành công!", result });
  } catch (err) {
    console.error("Error in deleteUnavailableDates:", err);
    next(err); // Chuyển lỗi cho middleware xử lý lỗi
  }
};
export const deleteRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const hotelId = req.params.hotelId;

    console.log("Deleting room:", roomId, "from hotel:", hotelId);

    // Kiểm tra xem phòng có tồn tại không
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng!" });
    }

    // Kiểm tra xem khách sạn có tồn tại không
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn!" });
    }

    // Xóa phòng
    await Room.findByIdAndDelete(roomId);
    
    // Cập nhật danh sách phòng trong khách sạn
    await Hotel.findByIdAndUpdate(hotelId, {
      $pull: { rooms: roomId }
    });

    console.log("Room deleted successfully");
    res.status(200).json({ message: "Xóa phòng thành công!" });
  } catch (err) {
    console.error("Error deleting room:", err);
    next(err);
  }
};

export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json(room);
  } catch (err) {
    next(err);
  }
};
export const getRooms = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    console.log("Getting rooms for hotelId:", hotelId);

    // Tìm khách sạn và populate rooms
    const hotel = await Hotel.findById(hotelId).populate('rooms');
    
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Lấy danh sách phòng từ khách sạn
    const rooms = await Room.find({ 
      _id: { $in: hotel.rooms } 
    });

    console.log("Found rooms:", rooms.length);

    res.status(200).json(rooms);
  } catch (err) {
    console.error("Error in getRooms:", err);
    next(err);
  }
};

export const getRoomsByHotel = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    console.log("Fetching rooms for hotel:", hotelId);

    const rooms = await Room.find({ hotelId: hotelId })
      .populate('imageIds') // Populate imageIds để lấy thông tin đầy đủ của ảnh
      .exec();

    console.log("Found rooms:", rooms);
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
};

export const getRoomNumber = async (req, res, next) => {
  try {
    // Tìm phòng theo id phòng (roomId) và id của roomNumber
    const room = await Room.findOne(
      { _id: req.params.roomId, 'roomNumbers._id': req.params.roomNumberId },
      { 'roomNumbers.$': 1 }  // Chỉ trả về roomNumber
    );

    if (!room) {
      return res.status(404).json({ message: "RoomNumber not found" });
    }

    // Trả về roomNumber tìm thấy
    res.status(200).json(room.roomNumbers[0]);
  } catch (err) {
    next(err); // Chuyển lỗi cho middleware xử lý lỗi
  }
};