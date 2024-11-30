import React, { useState } from "react";
import Navbar from "../navbar/Navbar";

const StatusRoom = () => {
  const [hotels, setHotels] = useState([
    {
      id: 1,
      name: "Khách sạn A",
      rooms: [
        {
          id: 1,
          name: "Phòng 101",
          status: "Trống",

          checkInDate: null,
          checkOutDate: null,
        },
        {
          id: 2,
          name: "Phòng 102",
          status: "Đang thuê",

          checkInDate: null,
          checkOutDate: null,
        },
      ],
    },
    {
      id: 2,
      name: "Khách sạn B",
      rooms: [
        {
          id: 1,
          name: "Phòng 201",
          status: "Đang thuê",

          checkInDate: "2024-11-28",
          checkOutDate: null,
        },
        {
          id: 2,
          name: "Phòng 202",
          status: "Trống",

          checkInDate: null,
          checkOutDate: null,
        },
      ],
    },
  ]);

  const [selectedHotelId, setSelectedHotelId] = useState(1);

  const formatDate = (date) => new Date(date).toISOString().slice(0, 10);

  // Hàm huỷ phòng
  const cancelRoom = (hotelId, roomId) => {
    const updatedHotels = hotels.map((hotel) => {
      if (hotel.id === hotelId) {
        const updatedRooms = hotel.rooms.map((room) => {
          if (room.id === roomId) {
            const today = formatDate(new Date());
            return {
              ...room,
              status: "Trống",
              checkInDate: null,
              checkOutDate: today,
            };
          }
          return room;
        });
        return { ...hotel, rooms: updatedRooms };
      }
      return hotel;
    });
    setHotels(updatedHotels);
  };
  const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId);

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <div
        className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        style={{ marginLeft: "220px" }}
      >
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold font-['Poppins'] leading-tight text-black mb-8">
          Quản lý nhận trả phòng
        </h2>

        {/* Dropdown chọn khách sạn */}
        <div className="dropdown-container mb-6">
          <label className="mr-2">Chọn khách sạn: </label>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(Number(e.target.value))}
            className="p-2 border rounded-md"
          >
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>

        {selectedHotel ? (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-2">ID</th>
                <th className="border border-gray-200 p-2">Tên phòng</th>
                <th className="border border-gray-200 p-2">Trạng thái</th>

                <th className="border border-gray-200 p-2">Ngày nhận</th>
                <th className="border border-gray-200 p-2">Ngày trả</th>
                <th className="border border-gray-200 p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {selectedHotel.rooms.map((room) => (
                <tr key={room.id}>
                  <td className="border border-gray-200 p-2">{room.id}</td>
                  <td className="border border-gray-200 p-2">{room.name}</td>
                  <td className="border border-gray-200 p-2">{room.status}</td>
                  <td className="border border-gray-200 p-2">
                    {room.checkInDate || "Chưa có"}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {room.checkOutDate || "Chưa có"}
                  </td>
                  <td className="border border-gray-200 p-2">
                    {room.status === "Đang thuê" && (
                      <button
                        onClick={() => cancelRoom(selectedHotel.id, room.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Huỷ phòng
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Không tìm thấy khách sạn</p>
        )}
      </div>
    </div>
  );
};

export default StatusRoom;
