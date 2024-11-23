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
export const deleteRoom = async (req, res, next) => {
  const { roomId, hotelId } = req.params;
//   try {
//     console.log("Deleting room:", roomId, "from hotel:", hotelId);

//     // 1. Xóa room từ collection Room
//     const deletedRoom = await Room.findByIdAndDelete(roomId);
//     if (!deletedRoom) {
//         return res.status(404).json({ message: "Không tìm thấy phòng" });
//     }

//     // 2. Xóa room ID từ array rooms trong Hotel
//     const updatedHotel = await Hotel.findByIdAndUpdate(
//         hotelId,
//         {
//             $pull: { rooms: roomId }
//         },
//         { new: true }
//     ).exec();

//     if (!updatedHotel) {
//         console.error("Hotel not found:", hotelId);
//         return res.status(404).json({ message: "Không tìm thấy khách sạn" });
//     }
   
//     console.log("Hotel rooms after deletion:", verifyHotel.rooms);
//       // 3. Đợi một chút để đảm bảo các thay đổi đã được lưu
//       await new Promise(resolve => setTimeout(resolve, 300));

//       // 4. Verify lại
//       const verifyRoom = await Room.findById(roomId);
//       const verifyHotel = await Hotel.findById(hotelId);

//       if (verifyRoom) {
//           console.warn("Room still exists after deletion!");
//       }

//       res.status(200).json({ 
//           message: "Xóa phòng thành công",
//           deletedRoom,
//           updatedHotel
//       });

//   } catch (err) {
//       console.error("Error deleting room:", err);
//       next(err);
//   }
// };
try {
  const roomId = req.params.id;
  console.log("Deleting room:", roomId);

  const deletedRoom = await Room.findByIdAndDelete(roomId);
  
  if (!deletedRoom) {
      return res.status(404).json({
          success: false,
          message: "Không tìm thấy phòng"
      });
  }

  res.status(200).json({
      success: true,
      message: "Xóa phòng thành công",
      data: deletedRoom
  });

} catch (err) {
  console.error("Delete room error:", err);
  next(err);
}
};
// export const getRoom = async (req, res, next) => {
//   try {
//     const room = await Room.findById(req.params.id);
//     res.status(200).json(room);
//   } catch (err) {
//     next(err);
//   }
// };
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
