import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import { AuthContext } from "../../context/AuthContext";
import { API_UPLOAD, API_ROOMS, API_IMAGES } from '../../utils/apiConfig';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    amenities: [],
    roomSize: "30",
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
    newImages: [],
    amenities: [],
    roomSize: "30",
  });
  const [currentImages, setCurrentImages] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  
  // Danh sách các tiện ích có thể chọn
  const availableAmenities = [
    { id: 'ac', label: 'Máy lạnh' },
    { id: 'family', label: 'Phòng gia đình' },
    { id: 'no-smoking', label: 'Phòng cấm hút thuốc' },
    { id: 'hairdryer', label: 'Máy sấy tóc' },
    { id: 'fridge', label: 'Tủ lạnh' },
    { id: 'bathtub', label: 'Bồn tắm' },
    { id: 'connecting', label: 'Phòng liên thông' },
    { id: 'kitchen', label: 'Nhà bếp' },
    { id: 'heater', label: 'Máy sưởi' }
  ];

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log("Fetching rooms for hotelId:", hotelId);
        const response = await axios.get(`${API_ROOMS}/hotel/${hotelId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        console.log("Fetch rooms response:", response.data);
        setRooms(response.data);
        
        // Fetch image URLs for all room images
        if (response.data && response.data.length > 0) {
          const fetchImagePromises = response.data.flatMap(room => 
            room.imageIds?.map(async (imageId) => {
              try {
                // Extract the ID properly whether it's an object or string
                const id = typeof imageId === 'object' ? imageId._id : imageId;
                
                const imageResponse = await axios.get(`${API_IMAGES}/${id}`);
                if (imageResponse.data && imageResponse.data.imageUrl) {
                  setImageUrls(prev => ({
                    ...prev,
                    [id]: imageResponse.data.imageUrl
                  }));
                }
              } catch (error) {
                console.error(`Error fetching image ${imageId}:`, error);
              }
            }) || []
          );
          
          await Promise.all(fetchImagePromises.filter(Boolean));
        }
      } catch (error) {
        console.error("Fetch rooms error:", error);
      }
    };

    fetchRooms();
  }, [hotelId, user.token]);

  const openEditModal = (room) => {
    setIsEditing(true);
    setEditRoom({
      ...room,
      roomNumbers: room.roomNumbers.map(r => r.number),
      existingImages: room.images,
      amenities: room.amenities || [],
      roomSize: room.roomSize || "30"
    });
    setIsModalOpen(true);
  };

  const fetchHotels = async () => {
    try {
      const response = await axios.get("https://localhost:8800/api/hotels");
      setHotels(response.data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };
  const checkData = async () => {
    try {
      const response = await axios.get(
        "https://localhost:8800/api/hotels/check/rooms"
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
            `https://localhost:8800/api/hotels/${hotelId}/rooms`,
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

  // Thêm console.log để debug dữ liệu ảnh
  useEffect(() => {
    if (rooms.length > 0) {
      console.log("Room image data sample:", {
        room: rooms[0].title,
        imageIds: rooms[0].imageIds
      });
    }
  }, [rooms]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_ROOMS}/hotel/${hotelId}`);
      setRooms(response.data);

      // Fetch image URLs for all room images
      if (response.data && response.data.length > 0) {
        const fetchImagePromises = response.data.flatMap(room => 
          room.imageIds?.map(async (imageId) => {
            try {
              const id = typeof imageId === 'object' ? imageId._id : imageId;
              const imageResponse = await axios.get(`${API_IMAGES}/${id}`);
              if (imageResponse.data && imageResponse.data.imageUrl) {
                setImageUrls(prev => ({
                  ...prev,
                  [id]: imageResponse.data.imageUrl
                }));
              }
            } catch (error) {
              console.error(`Error fetching image ${imageId}:`, error);
            }
          }) || []
        );
        
        await Promise.all(fetchImagePromises.filter(Boolean));
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const createRoom = async () => {
    try {
      if (!hotelId || !newRoom.title || !newRoom.price || !newRoom.maxPeople) {
        toast.warn("Vui lòng điền đầy đủ thông tin!", {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }

      // Upload ảnh trước
      const imageUploadPromises = selectedImages.map(file => {
        const formData = new FormData();
        formData.append('images', file);
        return axios.post(API_UPLOAD, formData);
      });

      const imageResponses = await Promise.all(imageUploadPromises);
      const imageIds = imageResponses.flatMap(response =>
        response.data.map(img => img._id)
      );

      // Sửa endpoint URL để match với parameter trong controller
      const endpoint = `${API_ROOMS}/hotel/${hotelId}`;
      console.log('API Endpoint:', endpoint);

      const roomData = {
        title: newRoom.title,
        price: newRoom.price,
        maxPeople: newRoom.maxPeople,
        desc: newRoom.desc,
        roomNumbers: newRoom.roomNumbers.map(num => ({
          number: parseInt(num),
          unavailableDates: []
        })),
        imageIds: imageIds,
        images: imageIds,
        amenities: newRoom.amenities,
        roomSize: newRoom.roomSize
      };

      console.log('Room data being sent:', roomData);

      const res = await axios.post(endpoint, roomData, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      // Fetch image URLs for the new room
      const newImageUrls = {};
      await Promise.all(imageIds.map(async (imageId) => {
        try {
          const imageResponse = await axios.get(`${API_IMAGES}/${imageId}`);
          if (imageResponse.data && imageResponse.data.imageUrl) {
            newImageUrls[imageId] = imageResponse.data.imageUrl;
          }
        } catch (error) {
          console.error(`Error fetching image ${imageId}:`, error);
        }
      }));

      // Update state with new room and image URLs
      setRooms(prevRooms => [...prevRooms, res.data]);
      setImageUrls(prev => ({
        ...prev,
        ...newImageUrls
      }));

      console.log("Room creation response:", res.data);
      resetForm();
      setIsModalOpen(false);
      toast.success("Tạo phòng thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Create room error:", err);
      console.error("API Error:", err.response?.status, err.response?.statusText);
      console.error("Error details:", err.response?.data);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo phòng!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const resetForm = () => {
    setNewRoom({
      title: "",
      price: "",
      maxPeople: "",
      desc: "",
      roomNumbers: [],
      images: [],
      amenities: [],
      roomSize: "30"
    });
    
    setEditRoom({
      title: "",
      price: "",
      maxPeople: "",
      desc: "",
      roomNumbers: [],
      existingImages: [],
      amenities: [],
      roomSize: "30"
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
        [name]: value.split(",").map(num => num.trim())
      }));
    } else {
      setNewRoom((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAmenityChange = (amenityId) => {
    if (isEditing) {
      setEditRoom(prev => {
        const updatedAmenities = prev.amenities.includes(amenityId)
          ? prev.amenities.filter(item => item !== amenityId)
          : [...prev.amenities, amenityId];
        return { ...prev, amenities: updatedAmenities };
      });
    } else {
      setNewRoom(prev => {
        const updatedAmenities = prev.amenities.includes(amenityId)
          ? prev.amenities.filter(item => item !== amenityId)
          : [...prev.amenities, amenityId];
        return { ...prev, amenities: updatedAmenities };
      });
    }
  };

  const updateRoom = async (id) => {
    try {
      // Upload ảnh mới nếu có
      let newImageIds = [];
      if (selectedImages.length > 0) {
        const imageUploadPromises = selectedImages.map(file => {
          const formData = new FormData();
          formData.append('images', file);
          return axios.post(API_UPLOAD, formData);
        });
        const imageResponses = await Promise.all(imageUploadPromises);
        newImageIds = imageResponses.flatMap(response =>
          response.data.map(img => img._id).filter(id => id) // Lọc bỏ các giá trị null/undefined
        );
      }

      // Kết hợp ảnh cũ (chưa bị xóa) và ảnh mới
      const allImageIds = [...(currentImages || []), ...newImageIds].filter(id => id); // Đảm bảo không có id null

      const roomData = {
        title: editRoom.title,
        price: editRoom.price,
        maxPeople: editRoom.maxPeople,
        desc: editRoom.desc,
        roomNumbers: editRoom.roomNumbers.map(number => ({
          number: parseInt(number),
          unavailableDates: []
        })),
        imageIds: allImageIds,
        amenities: editRoom.amenities,
        roomSize: editRoom.roomSize
      };

      console.log('Update room data:', roomData);

      const res = await axios.put(`${API_ROOMS}/${id}`, roomData, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      setRooms(rooms.map(room => room._id === id ? res.data : room));
      resetForm();
      setIsModalOpen(false);
      setIsEditing(false);
      toast.success("Cập nhật phòng thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Error updating room:", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật phòng!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  // Hàm xóa ảnh đã chọn
  const handleRemoveImage = (imageIdToRemove) => {
    setCurrentImages(currentImages.filter(image =>
      (image._id || image) !== (imageIdToRemove._id || imageIdToRemove)
    ));
  };

  // Hàm xóa ảnh hiện có khi edit
  const handleRemoveExistingImage = (index) => {
    setEditRoom(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) {
        return;
      }

      console.log("Deleting room:", id, "from hotel:", hotelId);

      await axios.delete(`${API_ROOMS}/${id}/${hotelId}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });

      setRooms(rooms.filter(room => room._id !== id));
      toast.success("Xóa phòng thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!", {
          position: "top-center",
          autoClose: 2000,
        });
      } else {
        toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa phòng!", {
          position: "top-center",
          autoClose: 2000,
        });
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
      toast.warn("Tổng số ảnh không được vượt quá 5!", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    // Thêm ảnh mới vào state
    setSelectedImages(prevImages => [...prevImages, ...files]);

    // Tạo URL preview cho ảnh mới
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  // Hàm mở modal sửa
  const handleEdit = (room) => {
    console.log("Room data for edit:", room);
    setEditRoom({
      ...room,
      roomNumbers: room.roomNumbers.map(r => r.number), 
      amenities: room.amenities || [],
      roomSize: room.roomSize || "30"
    });
    setEditingRoom(room);
    setCurrentImages(room.imageIds || []);
    
    // Fetch images if not already in the imageUrls state
    if (room.imageIds && room.imageIds.length > 0) {
      room.imageIds.forEach(async (image) => {
        const imageId = typeof image === 'object' ? image._id : image;
        if (!imageUrls[imageId]) {
          try {
            const imageResponse = await axios.get(`${API_IMAGES}/${imageId}`);
            if (imageResponse.data && imageResponse.data.imageUrl) {
              setImageUrls(prev => ({
                ...prev,
                [imageId]: imageResponse.data.imageUrl
              }));
            }
          } catch (error) {
            console.error(`Error fetching image ${imageId}:`, error);
          }
        }
      });
    }
    
    setSelectedImages([]);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <div
        className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        style={{ marginLeft: "220px" }}
      >
        {hotel && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold mb-4">{hotel.name}</h1>
          </div>
        )}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold mb-4">
                {isEditing ? "Sửa Phòng" : "Thêm Phòng Mới"}
              </h2>
              <div className="space-y-4">
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
                <div className="flex gap-4">
                  <input
                    type="number"
                    name="roomSize"
                    value={isEditing ? editRoom.roomSize : newRoom.roomSize}
                    onChange={(e) => {
                      if (isEditing) {
                        setEditRoom({...editRoom, roomSize: e.target.value});
                      } else {
                        setNewRoom({...newRoom, roomSize: e.target.value});
                      }
                    }}
                    placeholder="Kích thước phòng (m²)"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-lg"
                  />
                  <span className="flex items-center text-lg">m²</span>
                </div>
                <input
                  type="text"
                  name="roomNumbers"
                  value={isEditing 
                    ? (Array.isArray(editRoom.roomNumbers) 
                        ? editRoom.roomNumbers.join(',') 
                        : editRoom.roomNumbers.map(r => r.number).join(','))
                    : newRoom.roomNumbers.join(',')}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiện nghi phòng
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableAmenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity.id}`}
                          checked={isEditing 
                            ? editRoom.amenities.includes(amenity.id)
                            : newRoom.amenities.includes(amenity.id)
                          }
                          onChange={() => handleAmenityChange(amenity.id)}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor={`amenity-${amenity.id}`}>{amenity.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh hiện tại
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {currentImages.map((image, index) => {
                        // Xác định ID ảnh dựa trên loại dữ liệu
                        let imageId;
                        if (typeof image === 'object' && image._id) {
                          imageId = image._id;
                        } else {
                          imageId = image;
                        }
                        
                        return (
                          <div key={index} className="relative">
                            <img
                              src={imageUrls[imageId] || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}
                              alt={`Room ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                console.error('Modal image load error. Image ID:', imageId);
                                e.target.onerror = null;
                                e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                                e.target.className = "w-full h-32 object-cover rounded-lg bg-gray-200";
                              }}
                            />
                            <button
                              onClick={() => handleRemoveImage(image)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thêm ảnh mới
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    className="w-full"
                    accept="image/*"
                  />
                </div>

                {selectedImages.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh mới đã chọn
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setSelectedImages(selectedImages.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {room.imageIds && room.imageIds.length > 0 ? (
                      room.imageIds.map((image, index) => {
                        // Xác định ID ảnh dựa trên loại dữ liệu
                        let imageId;
                        if (typeof image === 'object' && image._id) {
                          imageId = image._id;
                        } else {
                          imageId = image;
                        }
                        
                        return (
                          <div key={index} className="relative">
                            <img
                              key={index}
                              src={imageUrls[imageId] || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}
                              alt={`Room ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                console.error('Image load error for room:', room.title, 'Image ID:', imageId);
                                e.target.onerror = null; // Tránh lặp vô hạn
                                e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                                e.target.className = "w-full h-48 object-cover rounded-lg bg-gray-200";
                              }}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center col-span-2">
                        <span className="text-gray-500">Không có ảnh</span>
                      </div>
                    )}
                  </div>

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
                    <span className="font-semibold">Kích thước:</span>
                    <span>{room.roomSize || "30"} m²</span>
                  </div>

                  <div className="flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Số phòng:</span>
                    <span>
                      {" "}
                      {room.roomNumbers.map((room) => room.number).join(", ") ||
                        "Không có"}
                    </span>
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="mt-2 w-full">
                      <span className="font-semibold">Tiện nghi: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.amenities.map((amenity, index) => (
                          <span key={index} className="bg-gray-100 text-xs px-2 py-1 rounded">
                            {availableAmenities.find(a => a.id === amenity)?.label || amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[#667084] text-base font-normal font-['Inter'] leading-relaxed overflow-hidden flex-grow mt-2 w-full">
                    <span className="font-semibold">Mô tả: </span>
                    <span>{room.desc}</span>
                  </div>

                  <div className="flex gap-6 mt-auto pt-4">
                    <button
                      onClick={() => handleEdit(room)}
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
}

export default Rooms;