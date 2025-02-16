import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

//create
export const createBooking = async (req, res) => {
  try {
    const {
      hotelId,
      selectedRooms,
      totalPrice,
      customer,
      paymentInfo,
      paymentStatus
    } = req.body;

    // Validate required fields
    if (!hotelId || !selectedRooms || !totalPrice || !customer || !paymentInfo) {
      return res.status(400).json({ error: "Dữ liệu không đầy đủ!" });
    }

    // Log received data
    console.log("Received booking data:", {
      hotelId,
      selectedRooms,
      totalPrice,
      customer,
      paymentInfo,
      paymentStatus
    });

    // Create new booking
    const newBooking = new Booking({
      hotelId,
      selectedRooms,
      totalPrice,
      customer,
      paymentInfo: {
        checkinDate: new Date(paymentInfo.checkinDate),
        checkoutDate: new Date(paymentInfo.checkoutDate)
      },
      paymentStatus: paymentStatus || "pending"
    });

    // Save booking
    const savedBooking = await newBooking.save();
    res.status(200).json(savedBooking);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Lỗi server khi tạo booking!" });
  }
};
//update status
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
      return res
        .status(400)
        .json({ error: "Trạng thái thanh toán không hợp lệ!" });
    }

    // Tìm và cập nhật trạng thái thanh toán trong một bước
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: bookingId }, // Tìm booking bằng _id
      {
        paymentStatus,
        paymentDate: Date.now(), // Cập nhật trạng thái và ngày thanh toán
      },
      { new: true } // Trả về tài liệu sau khi cập nhật
    );

    // Nếu không tìm thấy đơn đặt phòng
    if (!updatedBooking) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy đơn đặt phòng với bookingId này!" });
    }

    // Trả về kết quả cập nhật
    res.status(200).json({
      message: "Cập nhật trạng thái thành công!",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái thanh toán:", error.message);
    res.status(500).json({ error: "Lỗi cập nhật trạng thái thanh toán!" });
  }
};
//get booking theo user id
export const getBookings = async (req, res) => {
  try {
    const { id } = req.params; // Lấy userId từ params

    // Kiểm tra dữ liệu đầu vào
    if (!id) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp ID người dùng!" });
    }

    // Kiểm tra userId có tồn tại trong bảng User
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy người dùng với ID này!" });
    }

    // Tìm tất cả các booking thuộc về người dùng
    const userBookings = await Booking.find({ customer: id })
      .populate("hotelId", "name location address")
      .populate("selectedRooms.roomId", "title");

    // Nếu không tìm thấy bất kỳ booking nào
    if (userBookings.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt phòng nào cho người dùng này!",
      });
    }

    // Trả về danh sách các booking
    res.status(200).json(userBookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách booking:", error.message);
    res.status(500).json({ error: "Lỗi khi lấy danh sách booking!" });
  }
};
//get theo khách sạn
export const getBookingsByHotelId = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Kiểm tra dữ liệu đầu vào
    if (!hotelId) {
      return res.status(400).json({ error: "Vui lòng cung cấp ID khách sạn!" });
    }

    // Tìm tất cả các booking thuộc về khách sạn
    const hotelBookings = await Booking.find({ hotelId })
      .populate("customer", "username") 
      .populate("selectedRooms.roomId", "title");

    // Nếu không tìm thấy bất kỳ booking nào
    if (hotelBookings.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt phòng nào cho khách sạn này!",
      });
    }

    // Trả về danh sách các booking
    res.status(200).json(hotelBookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách booking theo khách sạn:", error.message);
    res.status(500).json({ error: "Lỗi khi lấy danh sách booking theo khách sạn!" });
  }
};
// Thêm hàm xóa booking
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params; // Lấy bookingId từ params

    // Kiểm tra dữ liệu đầu vào
    if (!id) {
      return res.status(400).json({ error: "Vui lòng cung cấp ID booking!" });
    }

    // Xóa booking theo ID
    const deletedBooking = await Booking.findByIdAndDelete(id);

    // Nếu không tìm thấy booking
    if (!deletedBooking) {
      return res.status(404).json({ error: "Không tìm thấy booking với ID này!" });
    }

    // Trả về thông báo thành công
    res.status(200).json({ message: "Đơn đặt phòng đã được xóa thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa booking:", error.message);
    res.status(500).json({ error: "Lỗi khi xóa booking!" });
  }
};
