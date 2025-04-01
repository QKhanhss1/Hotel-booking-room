import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import Navbar from "../navbar/Navbar";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StatusRoom = () => {
  const [hotels, setHotels] = useState([]);
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [bookedRoomDetails, setBookedRoomDetails] = useState([]);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axios.get("https://localhost:8800/api/hotels");
        setHotels(response.data);
      } catch (error) {
        console.error(
          "Error fetching hotels:",
          error.response ? error.response.data : error.message
        );
        toast.error(`Lỗi khi tải danh sách khách sạn: ${error.response ? error.response.data : error.message}`, {
          position: "top-center",
          autoClose: 2000,
        });
      }
    };

    fetchHotels();
  }, []);

  useEffect(() => {
    const fetchBookingsByHotel = async () => {
      if (selectedHotelId) {
        try {
          const response = await axios.get(
            `https://localhost:8800/api/booking/hotel/${selectedHotelId}`
          );
          
          // Lấy tất cả booking
          const allBookings = response.data;

          // Tạo danh sách chi tiết phòng đã đặt
          const bookedRooms = allBookings.flatMap(booking => 
            booking.selectedRooms.map(room => ({
              bookingId: booking._id,
              roomId: room.roomId._id,
              roomNumber: room.roomNumber,
              idRoomNumber: room.idRoomNumber, // Thêm idRoomNumber
              roomTitle: room.roomId.title,
              customerName: booking.customer.username,
              checkinDate: new Date(booking.paymentInfo.checkinDate),
              checkoutDate: new Date(booking.paymentInfo.checkoutDate),
              status: booking.paymentStatus,
              canCancel: true // Đã sửa đổi ở đây
            }))
          );

          setBookedRoomDetails(bookedRooms);
          setBookings(response.data);
          setErrorMessage("");
        } catch (error) {
          console.error("Error fetching bookings:", error);
          setErrorMessage("Không tìm thấy đơn đặt phòng nào cho khách sạn này!");
          setBookings([]);
        }
      } else {
        setBookings([]);
        setBookedRoomDetails([]);
        setErrorMessage("");
      }
    };

    fetchBookingsByHotel();
  }, [selectedHotelId]);

  const hasBookings = bookings.length > 0;
  //hủy phòng
  const cancelBooking = async (roomId, roomIdNumber, checkinDate, checkoutDate, bookingId) => {
    try {
      const dates = [
        new Date(checkinDate).toISOString().split("T")[0],
        new Date(checkoutDate).toISOString().split("T")[0],
      ];
  
      // Sử dụng roomIdNumber thay vì roomId
      const response = await axios.put(
        `https://localhost:8800/api/rooms/availability/${roomIdNumber}`,
        { dates },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      // Xóa booking
      const deleteResponse = await axios.delete(
        `https://localhost:8800/api/booking/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      
      console.log("Hủy phòng thành công:", response.data);
      console.log("Đặt phòng đã bị hủy:", deleteResponse.data);
      toast.success("Hủy phòng thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
  
      // Cập nhật state bookedRoomDetails để loại bỏ phòng đã hủy
      setBookedRoomDetails(prevDetails => 
        prevDetails.filter(room => !(room.bookingId === bookingId && room.idRoomNumber === roomIdNumber))
      );
  
    } catch (error) {
      console.error("Lỗi khi hủy phòng:", error.response ? error.response.data : error.message);
      toast.error(`Lỗi khi hủy phòng: ${error.response ? error.response.data : error.message}`, {
        position: "top-center", 
        autoClose: 2000,
      });
    }
  };

  const isRoomCurrentlyOccupied = (roomId) => {
    const now = new Date();
    return bookedRoomDetails.some(room => 
      room.roomId === roomId &&
      room.checkinDate <= now &&
      room.checkoutDate >= now
    );
  };

  const getStatusText = (status) => {
    switch (status) {
      case "success": return "Đang sử dụng";
      case "pending": return "Chờ thanh toán";
      case "expired": return "Đã hết hạn";
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "success": return "text-green-500";
      case "pending": return "text-yellow-500";
      case "expired": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <div
        className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        style={{ marginLeft: "220px" }}
      >
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold  font-['Poppins'] leading-tight text-black mb-8">
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
          <div className="text-red-500 text-center mb-4">{errorMessage}</div>
        )}

        {/* Bảng danh sách đặt phòng */}
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
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
              bookedRoomDetails.map((room) => (
                <tr key={`${room.bookingId}-${room.roomId}`}>
                  <td className="border border-gray-200 p-2">{room.roomTitle}</td>
                  <td className="border border-gray-200 p-2">{room.roomNumber}</td>
                  <td className={`border border-gray-200 p-2 ${getStatusClass(room.status)}`}>
                    {getStatusText(room.status)}
                  </td>
                  <td className="border border-gray-200 p-2">{room.customerName}</td>
                  <td className="border border-gray-200 p-2">
                    {new Date(room.checkinDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {new Date(room.checkoutDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {room.canCancel && (
                      <button
                        className="bg-red-500 text-white p-1 rounded"
                        onClick={() => cancelBooking(
                          room.roomId,
                          room.idRoomNumber, // Sử dụng idRoomNumber 
                          room.checkinDate,
                          room.checkoutDate,
                          room.bookingId
                        )}
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center border border-gray-200 p-2">
                  Không có đặt phòng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  );
};

export default StatusRoom;