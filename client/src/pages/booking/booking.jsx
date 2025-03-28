// BookingPage.js
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./booking.css";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";
import { API_URL } from "../../utils/apiConfig";
import { toast } from "react-toastify";

const BookingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Hàm định dạng ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      const fetchBookings = async () => {
        try {
          setLoading(true);
          console.log("Fetching bookings for user:", user.details._id);
          
          const res = await axios.get(
            `${API_URL}/booking/user/${user.details._id}`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

          console.log("Received bookings:", res.data);

          // Xử lý và lọc bỏ các đơn trùng lặp
          // (giữ lại đơn gần nhất theo khách sạn, phòng và thời gian)
          const processedBookings = processBookings(res.data);
          setBookings(processedBookings);
          setError(null);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          setError("Không có đơn đặt phòng nào.");
        } finally {
          setLoading(false);
        }
      };
      fetchBookings();
    }
  }, [user, navigate]);

  // Hàm xử lý và loại bỏ đơn trùng lặp
  const processBookings = (bookingsData) => {
    // Sắp xếp bookings theo thời gian cập nhật gần nhất
    const sortedBookings = [...bookingsData].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    // Tạo map để lưu trữ booking theo khóa duy nhất (hotelId + phòng + check-in/out)
    const uniqueBookings = new Map();

    sortedBookings.forEach(booking => {
      // Tạo khóa duy nhất dựa trên thông tin đặt phòng
      const hotelId = booking.hotelId?._id || booking.hotelId;
      const checkin = booking.paymentInfo?.checkinDate;
      const checkout = booking.paymentInfo?.checkoutDate;
      
      // Tạo khóa duy nhất
      const key = `${hotelId}-${checkin}-${checkout}`;
      
      // Chỉ giữ lại booking gần nhất nếu chưa có trong map
      if (!uniqueBookings.has(key)) {
        uniqueBookings.set(key, booking);
      }
    });

    // Chuyển đổi map thành mảng và trả về
    return Array.from(uniqueBookings.values());
  };

  return (
    <>
      <Navbar />
      <Header />
      <div className="bookingPage">
        <h1>Lịch sử đặt phòng</h1>
        <div className="historyBooking">
          {loading ? (
            <p>Đang tải...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : bookings.length === 0 ? (
            <p>Bạn chưa có lịch sử đặt phòng.</p>
          ) : (
            bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                formatDate={formatDate}
                user={user}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

const BookingCard = ({ booking, formatDate, user }) => {
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chưa thanh toán";
      case "success":
        return "Thanh toán thành công";
      case "failed":
        return "Thanh toán thất bại";
      case "expired":
        return "Đã hủy";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "success":
        return "text-green-500";
      case "failed":
      case "expired":
      case "cancelled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="bookingCard">
      <h2>{booking.hotelId?.name || "Thông tin khách sạn không có"}</h2>
      <p>Địa chỉ: {booking.hotelId?.address || "Không có địa chỉ"}</p>
      <div>
        <p><strong>Phòng đã đặt:</strong></p>
        {booking.selectedRooms?.length > 0 ? (
          <ul>
            {booking.selectedRooms.map((room, index) => (
              <li key={index}>
                Số phòng: {room.roomNumber || "Không có số"}
              </li>
            ))}
          </ul>
        ) : (
          <p>Không có thông tin phòng</p>
        )}
      </div>
      <p>Ngày check-in: {formatDate(booking.paymentInfo?.checkinDate)}</p>
      <p>Ngày check-out: {formatDate(booking.paymentInfo?.checkoutDate)}</p>
      
      {/* Tính số ngày lưu trú */}
      {booking.paymentInfo?.checkinDate && booking.paymentInfo?.checkoutDate && (
        <p>
          Số đêm: {Math.ceil(
            (new Date(booking.paymentInfo.checkoutDate) - new Date(booking.paymentInfo.checkinDate)) /
            (1000 * 60 * 60 * 24)
          )}
        </p>
      )}
      
      {booking.totalPrice && booking.paymentInfo?.checkinDate && booking.paymentInfo?.checkoutDate && (
        <p>Giá: {(booking.totalPrice / Math.ceil(
            (new Date(booking.paymentInfo.checkoutDate) - new Date(booking.paymentInfo.checkinDate)) /
            (1000 * 60 * 60 * 24)
          )).toLocaleString("vi-VN")} VND/đêm</p>
      )}
      <p>Tổng tiền: {booking.totalPrice ? booking.totalPrice.toLocaleString("vi-VN") : 0} VND</p>
      <div className={`booking-status ${getStatusColor(booking.paymentStatus)}`}>
        <p>Trạng thái: {getStatusText(booking.paymentStatus)}</p>
      </div>
    </div>
  );
};

export default BookingPage;

