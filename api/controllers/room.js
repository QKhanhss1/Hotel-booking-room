import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import { createError } from "../utils/error.js";

export const createRoom = async (req, res, next) => {
  const hotelId = req.params.hotelid;
  const newRoom = new Room(req.body);

  try {
    console.log("Creating room with data:", req.body);
    console.log("For hotel:", hotelId);

    const newRoom = new Room({
      ...req.body,
      hotelId: hotelId
    });

   console.log("New room object:", newRoom);

    const savedRoom = await newRoom.save(); 
    console.log("Saved room:", savedRoom);

 
try {
  const updatedHotel = await Hotel.findByIdAndUpdate(
      hotelId,
      {
          $push: { rooms: savedRoom._id }
      },
      { new: true } // Trả về document sau khi update
  );

  if (!updatedHotel) {
      throw new Error(`Hotel with id ${hotelId} not found`);
  }

  console.log("Updated hotel rooms:", updatedHotel.rooms);
  
  // 4. Verify cả room và hotel đã được cập nhật
  const verifyRoom = await Room.findById(savedRoom._id);
  const verifyHotel = await Hotel.findById(hotelId);
  
  console.log("Verified saved room:", verifyRoom);
  console.log("Verified updated hotel rooms:", verifyHotel.rooms);

  res.status(200).json({
      room: savedRoom,
      hotelRooms: updatedHotel.rooms
  });
} catch (updateError) {
  // Nếu cập nhật hotel thất bại, xóa room đã tạo
  await Room.findByIdAndDelete(savedRoom._id);
  throw new Error(`Failed to update hotel: ${updateError.message}`);
}

} catch (err) {
console.error("Error in createRoom:", err);
next(err);
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
  const { roomId, hotelId } = req.params;
try {
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
    $pull: { rooms: roomId },
  });

  res.status(200).json({ message: "Xóa phòng thành công!" });
} catch (err) {
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
  } catch (error) {
    next(error); // Chuyển lỗi cho middleware xử lý lỗi
  }
};
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (err) {
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