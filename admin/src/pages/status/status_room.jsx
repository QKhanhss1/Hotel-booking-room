import React, { useState, useEffect } from "react";
import axios from "axios";
// import "./status.css";
import Navbar from "../navbar/Navbar";

const StatusRoom = () => {
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(""); // Khách sạn mặc định
  const [filteredBookings, setFilteredBookings] = useState([]); // Thêm state để lưu bookings theo khách sạn
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); // Thêm biến trạng thái cho thông báo lỗi

  useEffect(() => {
    const fetchHotelsAndBookings = async () => {
      try {
        const hotelsResponse = await axios.get("http://localhost:8800/api/hotels");
        setHotels(hotelsResponse.data);
      } catch (error) {
        console.error("Error fetching hotels:", error.response ? error.response.data : error.message);
      }
    };

    fetchHotelsAndBookings();
  }, []);

  useEffect(() => {
    const fetchBookingsByHotel = async () => {
      if (selectedHotelId) {
        try {
          const bookingsResponse = await axios.get(`http://localhost:8800/api/booking/hotel/${selectedHotelId}`);
          setBookings(bookingsResponse.data);
          setErrorMessage(""); // Reset thông báo lỗi nếu có dữ liệu
        } catch (error) {
          console.error("Error fetching bookings:", error.response ? error.response.data : error.message);
          setErrorMessage("Không tìm thấy đơn đặt phòng nào cho khách sạn này!"); // Cập nhật thông báo lỗi
          setBookings([]); // Reset bookings nếu có lỗi
        }
      } else {
        setBookings([]); // Reset bookings nếu không có khách sạn nào được chọn
        setErrorMessage(""); // Reset thông báo lỗi
      }
    };

    fetchBookingsByHotel();
  }, [selectedHotelId]);

  // Tạo danh sách khách sạn duy nhất dựa trên tên
  const uniqueHotels = Array.from(new Set(bookings.map(booking => booking.hotelId._id)))
    .map(id => {
      return hotels.find(hotel => hotel._id === id);
    });

  console.log("Unique Hotels:", uniqueHotels); // In ra để kiểm tra

  const formatDate = (date) => new Date(date).toISOString().slice(0, 10);

  const updateRoomStatus = (hotelId, roomId, action) => {
    const updatedHotels = hotels.map((hotel) => {
      if (hotel.id === hotelId) {
        const updatedRooms = hotel.rooms.map((room) => {
          if (room.id === roomId) {
            const today = formatDate(new Date());
            if (action === "Check-In") {
              return {
                ...room,
                status: "Đang thuê",
                guest: prompt("Nhập tên khách hàng:") || room.guest,
                checkInDate: today,
                checkOutDate: null,
              };
            } else if (action === "Check-Out") {
              return {
                ...room,
                status: "Trống",
                guest: "",
                checkOutDate: today,
              };
            }
          }
          return room;
        });
        return { ...hotel, rooms: updatedRooms };
      }
      return hotel;
    });
    setHotels(updatedHotels);
  };

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking);
  };

  console.log("Bookings:", bookings); // In ra để kiểm tra

  // Thêm điều kiện kiểm tra
  const hasBookings = bookings.length > 0;

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy đơn đặt phòng này?");
    if (confirmCancel) {
      try {
        const token = localStorage.getItem("token"); // Lấy token từ localStorage
        await axios.delete(`http://localhost:8800/api/booking/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Gửi token trong header
          },
        });
        setBookings(prevBookings => prevBookings.filter(booking => booking._id !== bookingId));
        console.log(`Đơn đặt phòng với ID ${bookingId} đã được hủy.`);
      } catch (error) {
        console.error("Lỗi khi hủy đơn đặt phòng:", error.response ? error.response.data : error.message);
      }
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12" style={{ marginLeft: '220px' }}>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold font-['Poppins'] leading-tight text-black mb-8">
          Quản lý nhận trả phòng
        </h2>

        {/* Dropdown chọn khách sạn */}
        <div className="dropdown-container mb-6">
          <label className="mr-2">Chọn khách sạn: </label>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="">Chọn khách sạn</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && (
          <div className="text-red-500 text-center mb-4">
            {errorMessage} {/* Hiển thị thông báo lỗi */}
          </div>
        )}

        {/* Bảng danh sách đặt phòng */}
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-2">ID</th>
              <th className="border border-gray-200 p-2">Tên phòng</th>
              <th className="border border-gray-200 p-2">Số phòng</th>
              <th className="border border-gray-200 p-2">Trạng thái</th>
              <th className="border border-gray-200 p-2">Khách hàng</th>
              <th className="border border-gray-200 p-2">Ngày nhận</th>
              <th className="border border-gray-200 p-2">Ngày trả</th>
              <th className="border border-gray-200 p-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {hasBookings ? (
              bookings.map((booking) => (
                <tr key={booking._id} onClick={() => setSelectedBooking(booking)}>
                  <td className="border border-gray-200 p-2">{booking._id}</td>
                  <td className="border border-gray-200 p-2">
                    {booking.selectedRooms.map(room => room.roomId.title).join(", ")}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {booking.selectedRooms.map(room => room.roomNumber).join(", ")}
                  </td>
                  <td className="border border-gray-200 p-2">{booking.paymentStatus}</td>
                  <td className="border border-gray-200 p-2">{booking.customer.username}</td>
                  <td className="border border-gray-200 p-2">
                    {new Date(booking.paymentInfo.checkinDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {new Date(booking.paymentInfo.checkoutDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="border border-gray-200 p-2">
                    <button 
                      className="bg-red-500 text-white p-1 rounded" 
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      Hủy
                    </button>
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>

        
      </div>
    </div>
  );
};

export default StatusRoom;