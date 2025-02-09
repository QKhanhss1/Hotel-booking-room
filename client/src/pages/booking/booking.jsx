// BookingPage.js
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./booking.css";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";
import { API_URL } from "../../utils/apiConfig";

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

          // Lấy tất cả booking, không chỉ những booking thành công
          setBookings(res.data);
          setError(null);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          setError("Không thể tải lịch sử đặt phòng");
        } finally {
          setLoading(false);
        }
      };
      fetchBookings();
    }
  }, [user, navigate]);

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
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

const BookingCard = ({ booking, formatDate }) => {
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
      <p>Số tiền: {booking.totalPrice?.toLocaleString("vi-VN")} VND</p>
      <p>Trạng thái thanh toán: {
        booking.paymentStatus === "success" ? "Thành công" :
        booking.paymentStatus === "failed" ? "Thất bại" :
        "Đang xử lý"
      }</p>
    </div>
  );
};

export default BookingPage;

