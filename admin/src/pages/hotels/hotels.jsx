import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import { AuthContext } from "../../context/AuthContext";
import { API_UPLOAD, API_HOTELS, API_IMAGES } from '../../utils/apiConfig';

function Hotels() {
  const { user } = useContext(AuthContext);
  const [hotels, setHotels] = useState([]);
  const [newHotel, setNewHotel] = useState({
    name: "",
    city: "",
    address: "",
    desc: "",
    rating: "",
    cheapestPrice: "",
    type: "",
    distance: "",
    title: "",
    photos: null,
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  //fetch images
  const fetchHotelImages = async (hotel) => {
    if (hotel.imageIds && hotel.imageIds.length > 0) {
      const images = await Promise.all(
        hotel.imageIds.map(async (id) => {
          const imageResponse = await axios.get(`${API_IMAGES}/${id}`);
          return imageResponse.data.imageUrl;
        })
      );
      return {
        ...hotel,
        images: images,
      }
    }
    return {
      ...hotel,
      images: []
    }
  }

  const handleImageChange = (e) => {
    console.log("e.target.files:", e.target.files);
    setSelectedImages(Array.from(e.target.files)); // Chắc chắn e.target.files là một mảng
  };

  const handleCreate = async () => {
    try {
      if (
        !newHotel.name ||
        !newHotel.type ||
        !newHotel.city ||
        !newHotel.address ||
        !newHotel.desc ||
        !newHotel.cheapestPrice
      ) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }
      // console.log("selectedImages:", selectedImages);

      const formData = new FormData();
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      const imageResponse = await axios.post(API_UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // console.log(imageResponse);

      const imageIds = imageResponse.data.map((image) => image._id);
      // Tạo khách sạn với mảng ID ảnh
      const newHotelData = {
        ...newHotel,
        imageIds: imageIds, // Lưu mảng các ID ảnh
      };

      // console.log('newHotelData:', newHotelData);

      const response = await axios.post(
        API_HOTELS,
        newHotelData,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      setHotels([...hotels, response.data]);

      setNewHotel({
        name: "",
        city: "",
        address: "",
        desc: "",
        rating: "",
        cheapestPrice: "",
        type: "",
        distance: "",
        title: "",
        photos: null,
      });
      setSelectedImages([]);
      setShowAddForm(false);
      alert("Thêm khách sạn thành công!");
    } catch (error) {
      console.error("Error creating hotel:", error);
      alert("Có lỗi xảy ra khi thêm khách sạn: " + error.message);
    }
  };

  const handleHotelClick = (hotelId) => {
    navigate(`/rooms/${hotelId}`);
  };

  const handleUpdate = async (id) => {
    try {
      console.log('editingHotel:', editingHotel);
      const response = await axios.put(
        `${API_HOTELS}/${id}`,
        {
          ...editingHotel,
          imageIds: editingHotel.imageIds, // Gửi editingHotel chứa imageIds
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`, // Sử dụng token từ ngữ cảnh
          },
        }
      );
      // console.log('response after update', response.data);

      // Sau khi update thành công, fetch lại data
      const hotelsWithImage = await fetchHotelImages(response.data);
      setHotels((prevHotels) =>
        prevHotels.map((hotel) => (hotel._id === id ? hotelsWithImage : hotel))
      );
      closeEditModal();
      alert("Cập nhật khách sạn thành công!");
    } catch (error) {
      console.error("Error updating hotel:", error);
      alert("Có lỗi xảy ra khi cập nhật khách sạn: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    console.log("Xác nhận xóa khách sạn với ID:", id);
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa khách sạn này không?");
    if (!confirmDelete) return;
    try {
      await axios.delete(`${API_HOTELS}/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`, // Sử dụng token từ ngữ cảnh
        },
      });
      setHotels(hotels.filter((hotel) => hotel._id !== id));
    } catch (error) {
      console.error("Error deleting hotel:", error);
    }
  };
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axios.get(API_HOTELS);
        const hotelsWithImage = await Promise.all(
          response.data.map(async (hotel) => {
            return await fetchHotelImages(hotel)
          })
        );
        setHotels(hotelsWithImage);
      }
      catch (error) {
        console.error("Error fetch hotel:", error);
      }
    };
    fetchHotels();
  }, []);

  const startEditing = (hotel) => {
    setEditingHotel(hotel);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingHotel(null);
    setIsEditModalOpen(false);
  };

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  };

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12" style={{ marginLeft: '220px' }}>
        <div className="flex justify-between items-center mb-12 px-4">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold font-['Poppins'] leading-tight text-black">
            Danh Sách Khách Sạn
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            {showAddForm ? "Hủy" : "+ Thêm Khách Sạn"}
          </button>
        </div>

        {/* Form thêm khách sạn */}
        {showAddForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Tên khách sạn"
                  value={newHotel.name}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, name: e.target.value })
                  }
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Loại khách sạn"
                  value={newHotel.type}
                  onChange={(e) => setNewHotel({ ...newHotel, type: e.target.value })}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Thành phố"
                  value={newHotel.city}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, city: e.target.value })
                  }
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Địa chỉ"
                  value={newHotel.address}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, address: e.target.value })
                  }
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Khoảng cách"
                  value={newHotel.distance}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, distance: e.target.value })
                  }
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Tiêu đề"
                  value={newHotel.title}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, title: e.target.value })
                  }
                  className="p-2 border rounded-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="Đánh giá (1-5)"
                  value={newHotel.rating}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, rating: e.target.value })
                  }
                  className="p-2 border rounded-md"
                  min="1"
                  max="5"
                />
                <input
                  type="number"
                  placeholder="Giá rẻ nhất"
                  value={newHotel.cheapestPrice}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, cheapestPrice: e.target.value })
                  }
                  className="p-2 border rounded-md"
                />
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className="p-2 border rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <textarea
                  placeholder="Mô tả"
                  value={newHotel.desc}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, desc: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={handleCreate}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Thêm Khách Sạn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form chỉnh sửa khách sạn */}
        {isEditModalOpen && editingHotel && (
          <div style={modalStyles.overlay} onClick={closeEditModal}>
            <div
              className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chỉnh sửa khách sạn</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Tên khách sạn"
                    value={editingHotel.name}
                    onChange={(e) =>
                      setEditingHotel({ ...editingHotel, name: e.target.value })
                    }
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Loại"
                    value={editingHotel.type}
                    onChange={(e) =>
                      setEditingHotel({ ...editingHotel, type: e.target.value })
                    }
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Thành phố"
                    value={editingHotel.city}
                    onChange={(e) =>
                      setEditingHotel({ ...editingHotel, city: e.target.value })
                    }
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Địa chỉ"
                    value={editingHotel.address}
                    onChange={(e) =>
                      setEditingHotel({
                        ...editingHotel,
                        address: e.target.value,
                      })
                    }
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Khoảng cách"
                    value={editingHotel.distance}
                    onChange={(e) =>
                      setEditingHotel({
                        ...editingHotel,
                        distance: e.target.value,
                      })
                    }
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Tiêu đề"
                    value={editingHotel.title}
                    onChange={(e) =>
                      setEditingHotel({
                        ...editingHotel,
                        title: e.target.value,
                      })
                    }
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    placeholder="Đánh giá (1-5)"
                    value={editingHotel.rating}
                    onChange={(e) =>
                      setEditingHotel({
                        ...editingHotel,
                        rating: e.target.value,
                      })
                    }
                    className="p-2 border rounded-md"
                    min="1"
                    max="5"
                  />
                  <input
                    type="number"
                    placeholder="Giá rẻ nhất"
                    value={editingHotel.cheapestPrice}
                    onChange={(e) =>
                      setEditingHotel({
                        ...editingHotel,
                        cheapestPrice: e.target.value,
                      })
                    }
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      console.log('files', files);
                      if (files && files.length > 0) {
                        const formData = new FormData();
                        files.forEach((file) => {
                          formData.append("images", file);
                        });
                        console.log('formData', formData)
                        try {
                          const response = await axios.post(
                            API_UPLOAD,
                            formData,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              },
                            }
                          );
                          const newImageIds = response.data.map(image => image._id);
                          // console.log("newImageIds:", newImageIds);
                          // console.log("editingHotel.imageIds (before):", editingHotel.imageIds);
                          setEditingHotel({
                            ...editingHotel,
                            imageIds: editingHotel.imageIds ? [...editingHotel.imageIds, ...newImageIds] : [...newImageIds],
                          });
                          // console.log("editingHotel.imageIds (after):", editingHotel.imageIds);
                        } catch (error) {
                          console.error("Error uploading image:", error);
                        }
                      }
                    }}
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <textarea
                    placeholder="Mô tả"
                    value={editingHotel.desc}
                    onChange={(e) =>
                      setEditingHotel({ ...editingHotel, desc: e.target.value })
                    }
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    onClick={closeEditModal}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleUpdate(editingHotel._id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="Room w-full max-w-full mx-auto px-2 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-8 auto-rows-fr">
            {hotels.map((hotel) => (
              <div
                key={hotel._id}
                className="Room-1 flex-col justify-start items-start gap-2 flex px-2"
              >
                <div className="flex flex-col items-center h-full w-full">
                  <img
                    className="Image h-60 relative w-full object-cover rounded-lg"
                    src={hotel.images[0]}
                    
                    alt={hotel.name}
                    onClick={() => handleHotelClick(hotel._id)}
                  />
                  <div className="Name text-[#1a1a1a] text-xl font-semibold font-['Inter'] leading-loose text-center w-full">
                    {hotel.name}
                  </div>

                  {/* Loại khách sạn */}
                  <div className="Type flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Loại khách sạn:</span>
                    <span>{hotel.type}</span>
                  </div>

                  {/* Thành phố */}
                  <div className="City flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Thành phố:</span>
                    <span>{hotel.city}</span>
                  </div>

                  {/* Địa chỉ */}
                  <div className="Address flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Địa chỉ:</span>
                    <span>{hotel.address}</span>
                  </div>

                  {/* Khoảng cách */}
                  <div className="Distance flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Khoảng cách:</span>
                    <span>{hotel.distance}</span>
                  </div>

                  {/* Tiêu đề */}
                  <div className="Title flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Tiêu đề:</span>
                    <span>{hotel.title}</span>
                  </div>

                  {/* Đánh giá */}
                  <div className="Rating flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Đánh giá:</span>
                    <span className="text-yellow-500">
                      {"★".repeat(Math.floor(hotel.rating))}
                      {"☆".repeat(5 - Math.floor(hotel.rating))}
                    </span>
                    <span>({hotel.rating}/5)</span>
                  </div>

                  {/* Giá rẻ nhất */}
                  <div className="LowestPrice flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Giá từ:</span>
                    <span className="text-blue-600 font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(hotel.cheapestPrice)}
                      /đêm
                    </span>
                  </div>

                  {/* Mô tả */}
                  <div className="Mo-ta text-[#667084] text-base font-normal font-['Inter'] leading-relaxed overflow-hidden flex-grow mt-2">
                    <span className="font-semibold">Mô tả: </span>
                    <span>{hotel.desc}</span>
                  </div>

                  <div className="flex gap-6 mt-auto pt-4">
                    <button
                      onClick={() => startEditing(hotel)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(hotel._id)}
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

export default Hotels;
