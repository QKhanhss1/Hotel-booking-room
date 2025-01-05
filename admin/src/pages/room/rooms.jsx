import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import { AuthContext } from "../../context/AuthContext"; 

function Rooms() {
  const { user } = useContext(AuthContext); 
  const [searchParams] = useSearchParams();
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
    images: [],
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [hotelId, setHotelId] = useState(id || searchParams.get("hotelId"));
  const [editRoom, setEditRoom] = useState({
    title: "",
    price: "",
    maxPeople: "",
    desc: "",
    roomNumbers: [],
    existingImages: [],
    newImages: []
  });

  const openEditModal = (room) => {
    setIsEditing(true);
    setEditRoom({
      ...room,
      roomNumbers: room.roomNumbers.map(r => r.number),
      existingImages: room.images
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
        console.log("Fetching rooms for hotelId:", hotelId);

        if (hotelId) {
          const roomsResponse = await axios.get(
            `http://localhost:8800/api/hotels/${hotelId}/rooms`,
            {
              headers: {
                Authorization: `Bearer ${user?.token}`
              }
            }
          );
          
          console.log("Rooms data:", roomsResponse.data);
          
          if (Array.isArray(roomsResponse.data)) {
            setRooms(roomsResponse.data);
          } else {
            console.error("Invalid response format:", roomsResponse.data);
            setRooms([]);
          }
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchData();
    }
  }, [hotelId, user]);

  // Log mỗi khi rooms state thay đổi
  useEffect(() => {
    console.log("Rooms state updated:", rooms.length, "rooms");
    console.log("Full rooms data:", JSON.stringify(rooms, null, 2));
  }, [rooms]);

  // Thêm useEffect để log khi hotelId thay đổi
  useEffect(() => {
    console.log("HotelId changed to:", hotelId);
  }, [hotelId]);

  useEffect(() => {
    return () => {
      imagePreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreview]);

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
    try {
      if (!hotelId || !newRoom.title || !newRoom.price || !newRoom.maxPeople) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      const formData = new FormData();
      formData.append('title', newRoom.title);
      formData.append('price', newRoom.price);
      formData.append('maxPeople', newRoom.maxPeople);
      formData.append('desc', newRoom.desc);
      
      // Thêm roomNumbers
      const roomNumbersArray = newRoom.roomNumbers
        .toString()
        .split(",")
        .map(num => ({
          number: parseInt(num.trim()),
          unavailableDates: []
        }))
        .filter(room => !isNaN(room.number));
      
      formData.append('roomNumbers', JSON.stringify(roomNumbersArray));
      
      // Thêm từng ảnh vào formData
      selectedImages.forEach(file => {
        formData.append('images', file);
      });

      console.log("Sending images:", selectedImages); // Debug log

      const response = await axios.post(
        `http://localhost:8800/api/hotels/${hotelId}/rooms`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user?.token}`
          }
        }
      );

      setRooms(prev => [...prev, response.data]);
      resetForm();
      setIsModalOpen(false);
      alert("Thêm phòng thành công!");
    } catch (error) {
      console.error("Error creating room:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi thêm phòng!");
    }
  };

  // Thêm hàm resetForm
  const resetForm = () => {
    setEditRoom({
      title: "",
      price: "",
      maxPeople: "",
      desc: "",
      roomNumbers: [],
      existingImages: []
    });
    
    // Giải phóng URL objects
    imagePreview.forEach(url => URL.revokeObjectURL(url));
    
    setSelectedImages([]);
    setImagePreview([]);
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
  const updateRoom = async (id) => {
    try {
      if (!editRoom?.title || !editRoom?.price || !editRoom?.maxPeople) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      // Kiểm tra tổng số ảnh
      const totalImages = (editRoom.existingImages?.length || 0) + selectedImages.length;
      if (totalImages > 5) {
        alert("Tổng số ảnh không được vượt quá 5!");
        return;
      }

      const formData = new FormData();
      formData.append('title', editRoom.title);
      formData.append('price', editRoom.price);
      formData.append('maxPeople', editRoom.maxPeople);
      formData.append('desc', editRoom.desc);

      // Format roomNumbers
      const formattedRoomNumbers = editRoom.roomNumbers.map(number => ({
        number: parseInt(number),
        unavailableDates: []
      }));
      formData.append('roomNumbers', JSON.stringify(formattedRoomNumbers));

      // Thêm ảnh hiện tại
      if (editRoom.existingImages) {
        formData.append('existingImages', JSON.stringify(editRoom.existingImages));
      }

      // Thêm ảnh mới
      selectedImages.forEach(file => {
        formData.append('images', file);
      });

      console.log("Updating room with data:", {
        title: editRoom.title,
        price: editRoom.price,
        maxPeople: editRoom.maxPeople,
        desc: editRoom.desc,
        roomNumbers: formattedRoomNumbers,
        existingImages: editRoom.existingImages,
        newImages: selectedImages.length
      });

      const res = await axios.put(
        `http://localhost:8800/api/hotels/${hotelId}/rooms/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user?.token}`
          }
        }
      );

      setRooms(rooms.map(room => 
        room._id === id ? res.data : room
      ));
      
      // Reset form và states
      resetForm();
      setIsModalOpen(false);
      setIsEditing(false);
      alert("Cập nhật phòng thành công!");
    } catch (err) {
      console.error("Error updating room:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật phòng!");
    }
  };

  // Hàm xóa ảnh đã chọn
  const handleRemoveImage = (index) => {
    // Xóa ảnh khỏi state
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    
    // Xóa preview và giải phóng URL
    URL.revokeObjectURL(imagePreview[index]);
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  // Hàm xóa ảnh hiện có khi edit
  const handleRemoveExistingImage = (index) => {
    setEditRoom(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  //  Xoá phòng
  const handleDelete = async (roomId) => {
    try {
      if (!window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) {
        return;
      }

      console.log("Deleting room:", roomId, "from hotel:", hotelId);

      const response = await axios.delete(
        `http://localhost:8800/api/hotels/${hotelId}/rooms/${roomId}/${hotelId}`, 
        {
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        }
      );

      if (response.status === 200) {
        setRooms(rooms.filter(room => room._id !== roomId));
        alert("Xóa phòng thành công!");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      } else {
        alert(error.response?.data?.message || "Có lỗi xảy ra khi xóa phòng!");
      }
    }
  };

  // Hàm xử lý khi chọn ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    console.log("Selected files:", files);
    
    // Kiểm tra số lượng ảnh
    const totalImages = (editRoom?.existingImages?.length || 0) + selectedImages.length + files.length;
    if (totalImages > 5) {
      alert("Tổng số ảnh không được vượt quá 5!");
      return;
    }
    
    // Thêm ảnh mới vào state
    setSelectedImages(prevImages => [...prevImages, ...files]);

    // Tạo URL preview cho ảnh mới
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  // Hàm mở modal sửa
  const handleEditClick = (room) => {
    console.log("Opening edit modal for room:", room);
    
    setEditRoom({
      title: room.title || '',
      price: room.price || '',
      maxPeople: room.maxPeople || '',
      desc: room.desc || '',
      roomNumbers: room.roomNumbers ? room.roomNumbers.map(r => r.number) : [],
      existingImages: room.images || []
    });
    
    // Reset các state liên quan đến ảnh mới
    setSelectedImages([]);
    setImagePreview([]);
    
    setEditingRoom(room);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Form edit trong modal
  const EditRoomForm = () => {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sửa Phòng</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Tên phòng"
            value={editRoom.title}
            onChange={(e) => setEditRoom({...editRoom, title: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Giá"
            value={editRoom.price}
            onChange={(e) => setEditRoom({...editRoom, price: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Số người tối đa"
            value={editRoom.maxPeople}
            onChange={(e) => setEditRoom({...editRoom, maxPeople: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Số phòng"
            value={editRoom.roomNumbers.join(",")}
            onChange={(e) => setEditRoom({
              ...editRoom, 
              roomNumbers: e.target.value.split(",").map(num => num.trim())
            })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Mô tả"
            value={editRoom.desc}
            onChange={(e) => setEditRoom({...editRoom, desc: e.target.value})}
            className="w-full p-2 border rounded"
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh phòng</label>
            
            {/* Grid container cho cả ảnh cũ và ảnh mới */}
            <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
              {/* Hiển thị ảnh hiện có */}
              {isEditing && editRoom.existingImages && editRoom.existingImages.map((img, index) => (
                <div key={`existing-${index}`} className="relative">
                  <img
                    src={`http://localhost:8800${img}`}
                    alt={`Room ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Hiển thị preview ảnh mới */}
              {imagePreview.map((url, index) => (
                <div key={`preview-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Input chọn ảnh */}
            <div className="mt-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Tổng số ảnh không được vượt quá 5
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setIsModalOpen(false);
              setIsEditing(false);
              resetForm();
            }}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => updateRoom(editingRoom._id)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Cập nhật
          </button>
        </div>
      </div>
    );
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
              <h2 className="text-2xl font-semibold mb-4">
                {isEditing ? "Sửa Phòng" : "Thêm Phòng Mới"}
              </h2>
              <div className="space-y-4">
                {/* Form chung cho cả thêm và sửa */}
                <input
                  type="text"
                  name="title"
                  value={isEditing ? editRoom.title : newRoom.title}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditRoom({...editRoom, title: e.target.value});
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  placeholder="Tên phòng"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                />
                <input
                  type="number"
                  name="price"
                  value={isEditing ? editRoom.price : newRoom.price}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditRoom({...editRoom, price: e.target.value});
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  placeholder="Giá (VNĐ)"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                />
                <input
                  type="number"
                  name="maxPeople"
                  value={isEditing ? editRoom.maxPeople : newRoom.maxPeople}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditRoom({...editRoom, maxPeople: e.target.value});
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  placeholder="Số người tối đa"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                />
                <input
                  type="text"
                  name="roomNumbers"
                  value={isEditing ? editRoom.roomNumbers.join(',') : newRoom.roomNumbers}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditRoom({
                        ...editRoom,
                        roomNumbers: e.target.value.split(',').map(num => num.trim())
                      });
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  placeholder="Số phòng (phân cách bằng dấu phẩy)"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                />
                <textarea
                  name="desc"
                  value={isEditing ? editRoom.desc : newRoom.desc}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditRoom({...editRoom, desc: e.target.value});
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  placeholder="Mô tả"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh phòng</label>
                  
                  {/* Grid container cho cả ảnh cũ và ảnh mới */}
                  <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
                    {/* Hiển thị ảnh hiện có */}
                    {isEditing && editRoom.existingImages && editRoom.existingImages.map((img, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <img
                          src={`http://localhost:8800${img}`}
                          alt={`Room ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {/* Hiển thị preview ảnh mới */}
                    {imagePreview.map((url, index) => (
                      <div key={`preview-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Input chọn ảnh */}
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1 block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Tổng số ảnh không được vượt quá 5
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditing(false);
                      resetForm();
                    }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        updateRoom(editingRoom._id);
                      } else {
                        createRoom();
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    {isEditing ? "Cập nhật" : "Thêm"}
                  </button>
                </div>
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
                  {/* Hiển thị nhiều ảnh dạng slider hoặc grid */}
                  {room.images && room.images.length > 0 ? (
                    <div className="w-full mb-4 grid grid-cols-2 gap-2">
                      {room.images.map((image, index) => (
                        <img
                          key={index}
                          src={`http://localhost:8800${image}`}
                          alt={`${room.title} - ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            console.error("Image load error for URL:", e.target.src);
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-gray-500">No images available</span>
                    </div>
                  )}
                  
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
                      onClick={() => handleEditClick(room)}
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
    </div>
  );
}

export default Rooms;
