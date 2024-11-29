import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import { AuthContext } from "../../context/AuthContext"; 

function Rooms() {
  const { user } = useContext(AuthContext); 
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get("hotelId");
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedHotelid, setSelectedHotelid] = useState("");
  const [hotels, setHotels] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomHotels, setRoomHotels] = useState({});
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomsByHotel, setRoomsByHotel] = useState({});
  const [newRoom, setNewRoom] = useState({
    title: "",
    price: "",
    maxPeople: "",
    desc: "",
    roomNumbers: [],
  });

  const openEditModal = (room) => {
    setIsEditing(true);
    setEditingRoom(room);
    setSelectedHotelid(room.hotelId); // Nếu có hotelId
    setNewRoom({
      title: room.title,
      price: room.price,
      maxPeople: room.maxPeople,
      desc: room.desc || "",
      roomNumbers: room.roomNumbers.map((r) => r.number),
    });
    setIsModalOpen(true);
  };

  const fetchHotels = async () => {
    try {
      const response = await axios.get("http://localhost:8800/api/hotels");
      setHotels(response.data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };
  const checkData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8800/api/hotels/check/rooms"
      );
      console.log("Database check:", response.data);
    } catch (error) {
      console.error("Error checking data:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (id) {
          // Fetch hotel details
          const hotelResponse = await axios.get(
            `http://localhost:8800/api/hotels/find/${id}`
          );
          setHotel(hotelResponse.data);
          console.log("Hotel data:", hotelResponse.data); // Debug log

          // Fetch hotel rooms - sửa endpoint
          const roomsResponse = await axios.get(
            `http://localhost:8800/api/hotels/rooms/${id}`
          );
          console.log("Rooms data:", roomsResponse.data);
          setRooms(roomsResponse.data);
        }
        // Debug log
        else {
          // Nếu không có id, lấy tất cả các phòng
          const response = await axios.get(
            "http://localhost:8800/api/hotels/rooms"
          );
          setRooms(response.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Gọi fetchData ngay khi component mount hoặc id thay đổi
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  const fetchRooms = async () => {
    try {
      const response = await axios.get( `http://localhost:8800/api/hotels/rooms/${id}`);
      const roomsData = response.data;
      setRooms(response.data);
      // console.log("Rooms Data:", roomsData);
      // // Tạo mapping room-hotel

      // const hotelMapping = {};
      // for (const room of roomsData) {
      //   console.log("Fetching hotel for room:", room._id);
      //   const hotelResponse = await axios.get(
      //     `http://localhost:8800/api/hotels/room/${room._id}`
      //   );
      //   console.log("Hotel Response:", hotelResponse.data);
      //   hotelMapping[room._id] = hotelResponse.data._id;
      // }
      // console.log("Hotel Mapping:", hotelMapping);

      // setRoomHotels(hotelMapping);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // Hàm thêm phòng
  const createRoom = async () => {
    if (!id) {
      // Sử dụng id từ useParams thay vì selectedHotelid
      alert("Không tìm thấy thông tin khách sạn!");
      return;
    }
    const token = localStorage.getItem("token");
    if (!newRoom.title || !newRoom.price || !newRoom.maxPeople) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    // Kiểm tra và format dữ liệu
    if (!newRoom.roomNumbers || !newRoom.roomNumbers.length) {
      alert("Vui lòng nhập số phòng!");
      return;
    }

    console.log("Selected Hotel ID:", selectedHotelid);
    console.log("Room Data:", newRoom);
    try {
      // Chuyển đổi roomNumbers từ string sang array số
      const roomNumbersArray = newRoom.roomNumbers
        .toString()
        .split(",")
        .map((num) => ({
          number: parseInt(num.trim()),
          unavailableDates: [], // Add this if your schema requires it
        }))
        .filter((room) => !isNaN(room.number)); // Filter out invalid numbers

      if (roomNumbersArray.length === 0) {
        alert("Vui lòng nhập số phòng hợp lệ!");
        return;
      }

      const roomData = {
        title: newRoom.title,
        price: Number(newRoom.price),
        maxPeople: Number(newRoom.maxPeople),
        desc: newRoom.desc,
        roomNumbers: roomNumbersArray,
        hotelId: id  
      };
      console.log("Room Data sending:", roomData);
      console.log("Hotel ID:", selectedHotelid);
      console.log("Token:", token);
      // Sử dụng id từ useParams
      const response = await axios.post(
        `http://localhost:8800/api/hotels/rooms/${id}`,
        // `http://localhost:8800/api/hotels/${id}/rooms`,
        // `http://localhost:8800/api/rooms/${id}`,
        roomData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("Room creation response:", response.data);
      // Refresh danh sách phòng
      // if (id) {
      //   const roomsResponse = await axios.get(
      //     `http://localhost:8800/api/hotels/rooms/${id}`
      //   );
      //   setRooms(roomsResponse.data);
      // }
      // setRooms([...rooms, response.data]);
      setNewRoom({
        title: "",
        price: "",
        maxPeople: "",
        desc: "",
        roomNumbers: [],
      });

      const updatedRoomsResponse = await axios.get(
        `http://localhost:8800/api/hotels/rooms/${id}`
    );
    setRooms(updatedRoomsResponse.data);

      // setSelectedHotelid("");
      setIsModalOpen(false);
      alert("Thêm phòng thành công!");
    } catch (error) {
      console.error("Error response:", error.response?.data);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi thêm phòng!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "roomNumbers") {
      setNewRoom((prev) => ({
        ...prev,
        // [name]: value,
        [name]: value.split(",").map(num => num.trim())
      }));
    } else {
      setNewRoom((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  //  Cập nhật phòng
  const updateRoom = async () => {
    try {
      const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn cần đăng nhập lại!");
            return;
        }

        // Format room numbers
        const roomNumbersArray = newRoom.roomNumbers
        .map(num => (typeof num === 'string' ? num.trim() : num))
        .filter(num => num !== '')
        .map(num => ({
            number: parseInt(num),
            unavailableDates: editingRoom.roomNumbers.find(
                r => r.number === parseInt(num)
            )?.unavailableDates || []
        }))
        .filter(room => !isNaN(room.number));

      const roomData = {
        title: newRoom.title,
        price: Number(newRoom.price),
        maxPeople: Number(newRoom.maxPeople),
        desc: newRoom.desc,
        roomNumbers: [
          {
            number: Number(newRoom.roomNumbers[0]),
          },
        ],
      };
  console.log("Updating room with data:", roomData);
      const response = await axios.put(
        `http://localhost:8800/api/hotels/rooms/${editingRoom._id}`,
        roomData,
        {
          headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      }
      );

      setRooms(
        rooms.map((room) =>
          room._id === editingRoom._id ? response.data : room
        )
      );

      // Reset form
      setNewRoom({
        title: "",
        price: "",
        maxPeople: "",
        desc: "",
        roomNumbers: [],
      });
      setIsEditing(false);
      setEditingRoom(null);
      setSelectedHotelid("");
      setIsModalOpen(false);
      alert("Cập nhật phòng thành công!");
    } catch (error) {
      console.error("Error updating room:", error);
      alert(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật phòng!"
      );
    }
  };

  //  Xoá phòng
  const handleDelete = async (roomId) => {
    // Xác nhận trước khi xóa
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) {
      return;
    }
    try {
      if (!id) {
        throw new Error("Không tìm thấy thông tin khách sạn");
      }
  
      // const hotelResponse = await axios.get(
      //   `http://localhost:8800/api/hotels/room/${roomId}`
      // );

      // if (!hotelResponse.data) {
      //   throw new Error("Không tìm thấy khách sạn chứa phòng này");
      // }
      // Gọi API xóa phòng
      const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập lại!");
    }

    // Gọi API xóa phòng với token xác thực
    await axios.delete(
      `http://localhost:8800/api/hotels/rooms/${roomId}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`, 
          'Content-Type': 'application/json'
        }
      }
    );

      // Cập nhật UI bằng cách lọc bỏ phòng đã xóa
      setRooms(rooms.filter((room) => room._id !== roomId));

      alert("Xóa phòng thành công!");
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra khi xóa phòng!");
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <div
        className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        style={{ marginLeft: "220px" }}
      >
        {/* Header section */}
        {hotel && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold mb-4">{hotel.name}</h1>
            {/* Thêm thông tin khách sạn nếu cần */}
          </div>
        )}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
              <h2 className="text-2xl font-semibold mb-4">Thêm Phòng Mới</h2>
              <div className="space-y-4">
                <div>
                  {/* <select
                    value={selectedHotelid}
                    onChange={(e) => setSelectedHotelid(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                  >
                    <option value="">Chọn khách sạn</option>
                    {hotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select> */}
                </div>
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700">
                    Tên phòng
                  </label> */}
                  <input
                    type="text"
                    name="title"
                    value={newRoom.title}
                    onChange={handleInputChange}
                    placeholder="Tên phòng"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                  />
                </div>
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700">
                    Giá (VNĐ)
                  </label> */}
                  <input
                    type="number"
                    name="price"
                    value={newRoom.price}
                    onChange={handleInputChange}
                    placeholder=" Giá (VNĐ)"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                  />
                </div>
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700">
                    Số người tối đa
                  </label> */}
                  <input
                    type="number"
                    name="maxPeople"
                    value={newRoom.maxPeople}
                    onChange={handleInputChange}
                    placeholder="Số người tối đa"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500  p-2 text-lg"
                  />
                </div>
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700">
                    Số phòng (phân cách bằng dấu phẩy)
                  </label> */}
                  <input
                    type="text"
                    name="roomNumbers"
                    // value={newRoom.roomNumbers.join(", ")}
                    value={newRoom.roomNumbers}
                    onChange={handleInputChange}
                    placeholder="Số phòng"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500  p-2 text-lg"
                  />
                </div>
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700">
                    Mô tả
                  </label> */}
                  <textarea
                    name="desc"
                    value={newRoom.desc}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Mô tả phòng"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500  p-3 text-lg"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditing(false);
                    setEditingRoom(null);
                    setNewRoom({
                      title: "",
                      price: "",
                      maxPeople: "",
                      desc: "",
                      roomNumbers: [],
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={isEditing ? updateRoom : createRoom}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  {isEditing ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* </div> */}

        {/* <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold font-['Poppins'] leading-tight text-black">
              Danh sách phòng
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              + Thêm Phòng
            </button>
          </div>

          {rooms.length === 0 ? (
            <p className="text-center text-gray-500">
              Chưa có phòng nào được thêm vào khách sạn này
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2">{room.title}</h3>
                  <p>
                    <span className="font-semibold">Giá: </span>
                    <span className="text-blue-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(room.price)}
                      /đêm
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Số người tối đa:</span>{" "}
                    {room.maxPeople} người
                  </p>
                  <p>
                    <span className="font-semibold">Số phòng: </span>
                    {room.roomNumbers?.map((r) => r.number).join(", ") ||
                      "Chưa có số phòng"}
                  </p>
                  {room.desc && (
                    <p className="mt-2 text-gray-600">
                      <span className="font-semibold">Mô tả: </span>
                      {room.desc}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div> */}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold font-['Poppins'] leading-tight text-black">
            Danh sách phòng
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            + Thêm Phòng
          </button>
        </div>
        <div className="Room w-full max-w-full mx-auto px-2 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-8 auto-rows-fr">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="Room-1 flex-col justify-start items-start gap-2 flex px-2"
              >
                <div className="flex flex-col items-center h-full w-full p-6 border rounded-lg shadow-sm">
                  <div className="Name text-[#1a1a1a] text-xl font-semibold font-['Inter'] leading-loose text-center w-full">
                    {room.title}
                  </div>

                  <div className="flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Giá:</span>
                    <span className="text-blue-600 font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(room.price)}
                      /đêm
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Số người tối đa:</span>
                    <span>{room.maxPeople} người</span>
                  </div>

                  <div className="flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Số phòng:</span>
                    <span>
                      {" "}
                      {room.roomNumbers.map((room) => room.number).join(", ") ||
                        "Không có"}
                    </span>
                  </div>

                  <div className="text-[#667084] text-base font-normal font-['Inter'] leading-relaxed overflow-hidden flex-grow mt-2 w-full">
                    <span className="font-semibold">Mô tả: </span>
                    <span>{room.desc}</span>
                  </div>

                  <div className="flex gap-6 mt-auto pt-4">
                    <button
                      onClick={() => openEditModal(room)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      //{" "}
    </div>
  );
}

export default Rooms;
