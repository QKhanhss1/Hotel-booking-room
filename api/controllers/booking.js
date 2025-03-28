import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import User from "../models/User.js"; 
import { sendBookingConfirmation, sendPaymentReminder, sendPaymentTimeout, sendPaymentSuccess, sendBookingCancellation } from "../utils/emailService.js";

//create
export const createBooking = async (req, res) => {
  try {
    const {
      hotelId,
      selectedRooms,
      totalPrice,
      customer,
      paymentInfo,
      email
    } = req.body;

    // Validate required fields with detailed error message
    const requiredFields = {
      hotelId,
      selectedRooms,
      totalPrice, 
      customer,
      paymentInfo,
      email
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Dữ liệu không đầy đủ! Thiếu các trường: ${missingFields.join(', ')}` 
      });
    }

    // Log received data
    console.log("Received booking data:", {
      hotelId,
      selectedRooms,
      totalPrice,
      customer,
      paymentInfo,
      email
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
      paymentStatus: "pending",
      email: email,
      expiryTime: new Date(Date.now() + 60 * 1000) // 1 phút
    });

    // Save booking
    const savedBooking = await newBooking.save();

    // Send confirmation email
    await sendBookingConfirmation(savedBooking, email);

    // Lưu timeout để có thể hủy nếu thanh toán thành công
    if (!global.bookingTimeouts) {
      global.bookingTimeouts = {};
    }

    global.bookingTimeouts[savedBooking._id] = setTimeout(async () => {
      const booking = await Booking.findById(savedBooking._id);
      // Chỉ cập nhật thành expired nếu vẫn đang ở trạng thái pending
      if (booking && booking.paymentStatus === "pending") {
        booking.paymentStatus = "expired";
        await booking.save();
        await sendPaymentTimeout(booking, email);
      }
    }, 60 * 1000); // 1 minute

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

    if (!bookingId || !paymentStatus) {
      return res.status(400).json({ error: "Dữ liệu không đầy đủ!" });
    }

    // Tìm booking trước khi cập nhật
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng!" });
    }

    // Nếu trạng thái hiện tại đã là 'success' và yêu cầu cũng là 'success', không cần cập nhật nữa
    if (existingBooking.paymentStatus === 'success' && paymentStatus === 'success') {
      console.log(`Booking ${bookingId} đã ở trạng thái thanh toán thành công, bỏ qua`);
      return res.status(200).json({
        message: "Đơn hàng đã ở trạng thái thanh toán thành công!",
        booking: existingBooking
      });
    }

    const updateData = {
      paymentStatus: paymentStatus,
      paymentDate: paymentStatus === 'success' ? Date.now() : existingBooking.paymentDate,
      expiryTime: paymentStatus === 'success' ? null : existingBooking.expiryTime
    };

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true, runValidators: false }  // tắt validation khi update
    );

    // Hủy timeout nếu có
    if ((paymentStatus === 'success' || paymentStatus === 'cancelled') && global.bookingTimeouts?.[bookingId]) {
      clearTimeout(global.bookingTimeouts[bookingId]);
      delete global.bookingTimeouts[bookingId];
    }
    
    // Gửi email thông báo tương ứng - chỉ gửi khi trạng thái thực sự thay đổi
    if (paymentStatus === 'success' && existingBooking.paymentStatus !== 'success') {
      // Gửi email xác nhận thanh toán thành công
      console.log(`Gửi email xác nhận thanh toán thành công cho booking ${bookingId}`);
      await sendPaymentSuccess(booking, booking.email);
    } else if (paymentStatus === 'cancelled' && existingBooking.paymentStatus !== 'cancelled') {
      // Gửi email thông báo hủy đặt phòng
      console.log(`Gửi email thông báo hủy đặt phòng cho booking ${bookingId}`);
      await sendBookingCancellation(booking, booking.email);
    }

    res.status(200).json({
      message: "Cập nhật trạng thái thành công!",
      booking: booking
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

// Thêm endpoint mới để kiểm tra xem người dùng đã đặt phòng thành công ở khách sạn chưa
export const checkUserBookedHotel = async (req, res) => {
  try {
    const { userId, hotelId } = req.params;

    // Kiểm tra dữ liệu đầu vào
    if (!userId || !hotelId) {
      return res.status(400).json({ error: "Vui lòng cung cấp đủ thông tin userId và hotelId!" });
    }

    // Tìm booking thành công của user đối với khách sạn
    const booking = await Booking.findOne({
      customer: userId,
      hotelId: hotelId,
      paymentStatus: "success", // Chỉ xét các booking đã thanh toán thành công
    });

    // Trả về kết quả
    res.status(200).json({
      hasBooked: booking !== null,
      booking: booking
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra booking của người dùng:", error.message);
    res.status(500).json({ error: "Lỗi server khi kiểm tra booking!" });
  }
};
