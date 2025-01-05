import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import { createError } from "../utils/error.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const createRoom = async (req, res, next) => {
  const hotelId = req.params.hotelid;
  try {
    // Lưu đường dẫn tương đối
    const imageUrls = req.files ? req.files.map(file => 
      `/uploads/${file.filename}`
    ) : [];

    console.log("Creating room for hotelId:", hotelId); // Debug log

    const roomData = {
      ...req.body,
      hotelId: hotelId,
      images: imageUrls,
      roomNumbers: JSON.parse(req.body.roomNumbers)
    };

    const newRoom = new Room(roomData);
    const savedRoom = await newRoom.save();

    // Thêm phòng vào danh sách phòng của khách sạn
    await Hotel.findByIdAndUpdate(hotelId, {
      $push: { rooms: savedRoom._id }
    });

    console.log("Room created successfully:", savedRoom); // Debug log
    
    res.status(200).json(savedRoom);
  } catch (err) {
    console.error("Error creating room:", err); // Debug log
    next(err);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    // Parse existing images from form data
    let existingImages = [];
    try {
      existingImages = JSON.parse(req.body.existingImages || '[]');
    } catch (error) {
      console.error("Error parsing existingImages:", error);
    }
    
    // Handle new uploaded images
    const newImageUrls = req.files ? req.files.map(file => 
      `/uploads/${file.filename}`
    ) : [];

    // Combine existing and new images
    const allImages = [...existingImages, ...newImageUrls];

    // Parse roomNumbers safely
    let roomNumbers = [];
    try {
      roomNumbers = JSON.parse(req.body.roomNumbers || '[]');
      // Validate roomNumbers structure
      if (!Array.isArray(roomNumbers)) {
        throw new Error('roomNumbers must be an array');
      }
      // Ensure each room number has the correct structure
      roomNumbers = roomNumbers.map(room => ({
        number: parseInt(room.number),
        unavailableDates: room.unavailableDates || []
      }));
    } catch (error) {
      console.error("Error parsing roomNumbers:", error);
      return res.status(400).json({ message: "Invalid roomNumbers format" });
    }

    const updateData = {
      ...req.body,
      images: allImages,
      roomNumbers: roomNumbers
    };

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(updatedRoom);
  } catch (err) {
    console.error("Update error:", err);
    next(err);
  }
};

export const updateRoomAvailability = async (req, res, next) => {
  try {
    await Room.updateOne(
      { "roomNumbers._id": req.params.id },
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

    // Xóa các ngày khỏi trường unavailableDates
    const result = await Room.updateOne(
      { "roomNumbers._id": roomNumberId },
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
    const hotelId = req.params.hotelid;
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
    const rooms = await Room.find({ hotelId: req.params.hotelId }); // Giả sử có trường hotelId trong model Room
    if (!rooms) {
      return res.status(404).json({ message: "No rooms found for this hotel" });
    }
    res.status(200).json(rooms);
  } catch (error) {
    next(error);
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