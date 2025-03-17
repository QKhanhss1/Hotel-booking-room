import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import { AuthContext } from "../../context/AuthContext";
import { API_UPLOAD, API_HOTELS,API_HOTEL, API_IMAGES } from '../../utils/apiConfig';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HotelList from '../../components/HotelList';
import HotelAddForm from '../../components/HotelAddForm';
import HotelEditModal from '../../components/HotelEditModal';

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
    amenities: [],
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imageIds, setImageIds] = useState([]);
  const [editSelectedImages, setEditSelectedImages] = useState([]);
  const [editImageIds, setEditImageIds] = useState([]);

  const navigate = useNavigate();

  //fetch images (giữ nguyên hàm này)
  // Danh sách các tiện ích phổ biến
  const availableAmenities  = [
    { id: "wifi", name: "WiFi", icon: "📶" },
    { id: "parking", name: "Chỗ đậu xe", icon: "🅿️" },
    { id: "pool", name: "Hồ bơi", icon: "🏊" },
    { id: "gym", name: "Phòng tập thể dục", icon: "🏋️" },
    { id: "restaurant", name: "Nhà hàng", icon: "🍴" },
    { id: "ac", name: "Điều hòa", icon: "🌡️" },
    { id: "spa", name: "Spa", icon: "💆" },
    { id: "meeting", name: "Phòng họp", icon: "🤝" },
    { id: "bar", name: "Quầy bar", icon: "🍸" },
    { id: "laundry", name: "Giặt ủi", icon: "🧺" },
    { id: "roomService", name: "Dịch vụ phòng", icon: "🛏️" },
    { id: "childFriendly", name: "Thân thiện với trẻ em", icon: "👶" },
    { id: "petFriendly", name: "Cho phép thú cưng", icon: "🐾" },
    { id: "breakfast", name: "Bữa sáng", icon: "🥣" },
    { id: "tv", name: "TV", icon: "📺" },
    { id: "shuttle", name: "Đưa đón sân bay", icon: "🛫" },
  ];

  // Hàm xử lý khi chọn/bỏ chọn tiện ích
  const handleAmenityChange = (amenityId, isEdit = false) => {
    console.log("handleAmenityChange được gọi với amenityId:", amenityId, "isEdit:", isEdit); 
    if (isEdit) {
      console.log("Trước khi cập nhật, editingHotel.amenities:", editingHotel.amenities);
      // Xử lý cho form chỉnh sửa
      const updatedAmenities = editingHotel.amenities?.includes(amenityId)
        ? editingHotel.amenities.filter(id => id !== amenityId)
        : [...(editingHotel.amenities || []), amenityId];
      
      setEditingHotel({
        ...editingHotel,
        amenities: updatedAmenities
      });
      console.log("Sau khi cập nhật, editingHotel.amenities:", updatedAmenities); // Log state sau khi cập nhật
      console.log("State editingHotel sau setEditingHotel:", editingHotel); 
    } else {
      // Xử lý cho form thêm mới
      const updatedAmenities = newHotel.amenities.includes(amenityId)
        ? newHotel.amenities.filter(id => id !== amenityId)
        : [...newHotel.amenities, amenityId];
      
      setNewHotel({
        ...newHotel,
        amenities: updatedAmenities
      });
    }
  };

  //fetch images
  const fetchHotelImages = async (hotel) => {
    if (hotel.imageIds && hotel.imageIds.length > 0) {
      const images = await Promise.all(
        hotel.imageIds.map(async (image) => {
          const imageId = typeof image === 'string' ? image : image._id
          const imageResponse = await axios.get(`${API_IMAGES}/${imageId}`);
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
    setSelectedImages(Array.from(e.target.files));
  };

  const handleCreate = async () => {
    // ... (giữ nguyên logic handleCreate)
    try {
      if (
        !newHotel.name ||
        !newHotel.type ||
        !newHotel.city ||
        !newHotel.address ||
        !newHotel.desc ||
        !newHotel.cheapestPrice
      ) {
        toast.warn("Vui lòng điền đầy đủ thông tin!", {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }
      if (isImageUploading) {
        toast.warn("Vui lòng chờ ảnh được tải lên trước khi tạo khách sạn!", {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }
      if (imageIds.length === 0) {
        toast.warn("Vui lòng tải ảnh lên trước khi tạo khách sạn!", {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }

      // Tạo khách sạn với mảng ID ảnh
      const newHotelData = {
        ...newHotel,
        imageIds: imageIds, // Lưu mảng các ID ảnh
      };
      const response = await axios.post(
        API_HOTEL,
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
        amenities: [],
      });
      setSelectedImages([]);
      setImageIds([]);
      setIsImageUploading(false);
      setShowAddForm(false);
      toast.success("Thêm khách sạn thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error creating hotel:", error);
      setIsImageUploading(false);
      toast.error("Có lỗi xảy ra khi thêm khách sạn: " + error.message, {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };



  const handleUploadImage = async () => {
    try {
      setIsImageUploading(true);

      const formData = new FormData();
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });
      const imageResponse = await axios.post(API_UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const imageIds = imageResponse.data.map((image) => image._id);
      setImageIds(imageIds);
      toast.success("Tải ảnh thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
      setIsImageUploading(false);
    } catch (error) {
      console.error("Error creating hotel:", error);
      setIsImageUploading(false);
      toast.error("Có lỗi xảy ra khi tải ảnh: " + error.message, {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const handleHotelClick = (hotelId) => {
    navigate(`/rooms/${hotelId}`);
  };

  const handleUpdate = async (id) => {
    try {
      console.log("editingHotel before axios.put:", editingHotel.amenities);
      const response = await axios.put(
        `${API_HOTEL}/${id}`,
        {
          ...editingHotel,
          imageIds: imageIds,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
        
      );
      console.log("Response from backend after axios.put:", response.data);
      const hotelsWithImage = await fetchHotelImages(response.data);
      setHotels((prevHotels) =>
        prevHotels.map((hotel) => (hotel._id === id ? hotelsWithImage : hotel))
      );
      closeEditModal();
      toast.success("Cập nhật khách sạn thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error updating hotel:", error);
      toast.error("Có lỗi xảy ra khi cập nhật khách sạn: " + error.message, {
        position: "top-center",
        autoClose: 2000,
      });
    }
    
  };

  const handleDelete = async (id) => {
    // ... (giữ nguyên logic handleDelete)
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa khách sạn này không?");
    if (!confirmDelete) return;
    try {

      await axios.delete(`${API_HOTEL}/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setHotels(hotels.filter((hotel) => hotel._id !== id));
      toast.success("Xóa khách sạn thành công!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error deleting hotel:", error);
      toast.error("Có lỗi xảy ra khi xóa khách sạn: " + error.message, {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };
const handleEditImageUpload = async () => {
        try {
            setIsImageUploading(true);
            const formData = new FormData();
            editSelectedImages.forEach((image) => {
                formData.append('images', image);
            });
            const imageResponse = await axios.post(API_UPLOAD, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const newImageIds = imageResponse.data.map((image) => image._id);
            // Cập nhật imageIds hiện tại bằng cách thêm các ID mới
            setImageIds(prevImageIds => [...prevImageIds, ...newImageIds]);
            toast.success("Tải ảnh thành công!", {
                position: "top-center",
                autoClose: 2000,
            });
            setIsImageUploading(false);
        } catch (error) {
            console.error("Lỗi tải ảnh:", error);
            setIsImageUploading(false);
            toast.error("Có lỗi xảy ra khi tải ảnh: " + error.message, {
                position: "top-center",
                autoClose: 2000,
            });
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
    setImageIds(hotel.imageIds || []);
    setSelectedImages([]);
    setIsImageUploading(false);
  };

  const closeEditModal = () => {
    setEditingHotel(null);
    setIsEditModalOpen(false);
  };


  return (
    <div className="w-full overflow-x-hidden" id="root">
      <Navbar />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12" style={{ marginLeft: '220px' }}>
        <div className="flex justify-between items-center mb-12 px-4">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold font-['Poppins'] leading-tight text-black">
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
        <HotelAddForm
          availableAmenities={availableAmenities}
          handleAmenityChange={handleAmenityChange}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          newHotel={newHotel}
          setNewHotel={setNewHotel}
          handleImageChange={handleImageChange}
          handleUploadImage={handleUploadImage}
          isImageUploading={isImageUploading}
          selectedImages={selectedImages}
          handleCreate={handleCreate}
          imageIds={imageIds}
          setImageIds={setImageIds}
        />

        {/* Modal chỉnh sửa khách sạn */}
        <HotelEditModal
          availableAmenities={availableAmenities}
          handleAmenityChange={handleAmenityChange}
          isEditModalOpen={isEditModalOpen}
          editingHotel={editingHotel}
          closeEditModal={closeEditModal}
          setEditingHotel={setEditingHotel}
          handleUpdate={handleUpdate}
          handleImageChange={handleImageChange}
          handleEditImageUpload={handleEditImageUpload}
          isImageUploading={isImageUploading}
          editSelectedImages={editSelectedImages}
          editImageIds={editImageIds}
          setImageIds={setImageIds}
          setEditSelectedImages={setEditSelectedImages} 
        />

        {/* Danh sách khách sạn */}
        <HotelList
          hotels={hotels}
          handleHotelClick={handleHotelClick}
          startEditing={startEditing}
          handleDelete={handleDelete}
          availableAmenities={availableAmenities}
        />
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

export default Hotels;