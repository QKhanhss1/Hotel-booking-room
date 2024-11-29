import mongoose from "mongoose";
import Booking from "../models/Booking.js";

export const createBooking = async (req, res) => {
  try {
    const { hotelId, selectedRooms, totalPrice, customer } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!hotelId || !selectedRooms || !totalPrice || !customer) {
      return res.status(400).json({ error: "Dữ liệu không đầy đủ!" });
    }

    // Kiểm tra hotelId và customer có phải ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(hotelId) || !mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({ error: "ID không hợp lệ!" });
    }

    // Kiểm tra các selectedRooms có phải là ObjectId hợp lệ không
    const invalidRooms = selectedRooms.filter(roomId => !mongoose.Types.ObjectId.isValid(roomId));
    if (invalidRooms.length > 0) {
      return res.status(400).json({ error: "ID phòng không hợp lệ!", invalidRooms });
    }

    // Tạo booking mới
    const newBooking = new Booking({
      hotelId,
      selectedRooms,
      totalPrice,
      customer,
      paymentStatus: "pending", // Mặc định là "pending"
    });

    await newBooking.save();
    res.status(200).json(newBooking);
  } catch (error) {
    console.error("Lỗi tạo đơn hàng:", error.message);
    res.status(500).json({ error: "Lỗi tạo đơn hàng!" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, paymentStatus } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!bookingId || !paymentStatus) {
      return res.status(400).json({ error: "Dữ liệu không đầy đủ!" });
    }

    // Kiểm tra paymentStatus có hợp lệ không
    const validStatuses = ["success", "failed"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: "Trạng thái thanh toán không hợp lệ!" });
    }

    // Tìm và cập nhật trạng thái thanh toán trong một bước
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: bookingId }, // Tìm booking bằng _id
      { 
        paymentStatus, 
        paymentDate: Date.now() // Cập nhật trạng thái và ngày thanh toán
      },
      { new: true } // Trả về tài liệu sau khi cập nhật
    );

    // Nếu không tìm thấy đơn đặt phòng
    if (!updatedBooking) {
      return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng với bookingId này!" });
    }

    // Trả về kết quả cập nhật
    res.status(200).json({ message: "Cập nhật trạng thái thành công!", booking: updatedBooking });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái thanh toán:", error.message);
    res.status(500).json({ error: "Lỗi cập nhật trạng thái thanh toán!" });
  }
};

