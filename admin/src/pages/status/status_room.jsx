import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import Navbar from "../navbar/Navbar";
import { AuthContext } from "../../context/AuthContext";

const StatusRoom = () => {
  const [hotels, setHotels] = useState([]);
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axios.get("http://localhost:8800/api/hotels");
        setHotels(response.data);
      } catch (error) {
        console.error(
          "Error fetching hotels:",
          error.response ? error.response.data : error.message
        );
      }
    };

    fetchHotels();
  }, []);

  useEffect(() => {
    const fetchBookingsByHotel = async () => {
      if (selectedHotelId) {
        try {
          const response = await axios.get(
            `http://localhost:8800/api/booking/hotel/${selectedHotelId}`
          );
          setBookings(response.data);
          setErrorMessage("");
          const extractedData = response.data.map((booking) => {
            const bookingId = booking._id;
            const roomId = booking.selectedRooms.map((room) => room.idRoomNumber);
            const checkinDate = booking.paymentInfo.checkinDate; // checkinDate
            const checkoutDate = booking.paymentInfo.checkoutDate; // checkoutDate
            return {
              roomId,
              checkinDate,
              checkoutDate,
              bookingId
            };
          });
          console.log("Extracted Data:", extractedData);
        } catch (error) {
          console.error(
            "Error fetching bookings:",
            error.response ? error.response.data : error.message
          );
          setErrorMessage("Không tìm thấy đơn đặt phòng nào cho khách sạn này!");
          setBookings([]);
        }
      } else {
        setBookings([]);
        setErrorMessage("");
      }
    };

    fetchBookingsByHotel();
  }, [selectedHotelId]);

  const hasBookings = bookings.length > 0;
  //hủy phòng
  const cancelBooking = async (roomId, checkinDate, checkoutDate, bookingId) => {
    try {
      const dates = [
        new Date(checkinDate).toISOString().split("T")[0],
        new Date(checkoutDate).toISOString().split("T")[0],
      ];

      const response = await axios.put(
        `http://localhost:8800/api/hotels/rooms/${roomId}/unavailable-dates`,
        { dates },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      const deleteResponse = await axios.delete(
        `http://localhost:8800/api/booking/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      console.log("Hủy phòng thành công:", response.data);
      console.log("Đặt phòng đã bị hủy:", deleteResponse.data);
      alert("Hủy phòng thành công!");
    } catch (error) {
      console.error("Lỗi khi hủy phòng:", error.response ? error.response.data : error.message);
      alert("Lỗi khi hủy phòng!");
    }
  };


  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <div
        className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        style={{ marginLeft: "220px" }}
      >
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-black mb-8">
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
              bookings.map((booking) =>
                booking.selectedRooms.map((room) => (
                  <tr key={room._id}>
                    <td className="border border-gray-200 p-2">{room.roomId?.title || "N/A"}</td>
                    <td className="border border-gray-200 p-2">{room.roomNumber || "N/A"}</td>
                    <td className="border border-gray-200 p-2">{booking.paymentStatus}</td>
                    <td className="border border-gray-200 p-2">{booking.customer.username}</td>
                    <td className="border border-gray-200 p-2">
                      {new Date(booking.paymentInfo.checkinDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {new Date(booking.paymentInfo.checkoutDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="border border-gray-200 p-2">
                      <button
                        className="bg-red-500 text-white p-1 rounded"
                        onClick={() =>
                          cancelBooking(
                            room.idRoomNumber, 
                            booking.paymentInfo.checkinDate, 
                            booking.paymentInfo.checkoutDate,
                            booking._id, 
                          )
                        }
                      >
                        Hủy
                      </button>
                    </td>
                  </tr>
                ))
              )
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
    </div>
  );
};

export default StatusRoom;
