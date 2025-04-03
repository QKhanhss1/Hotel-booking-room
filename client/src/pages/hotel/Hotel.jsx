import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import MailList from "../../components/mailList/MailList";
import Footer from "../../components/footer/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart, 
  faCircleArrowLeft, 
  faCircleArrowRight, 
  faCircleXmark, 
  faLocationDot, 
  faStar, 
  faStarHalfAlt, 
  faWifi, 
  faSwimmingPool, 
  faParking, 
  faUtensils, 
  faSpa, 
  faDumbbell, 
  faLink,
  faSave,
  faCheck,
  faRulerCombined,
  faUserFriends,
  faSnowflake,
  faWineGlass,
  faCoffee,
  faSmoking,
  faDoorOpen,
  faBed,
  faChevronLeft,
  faChevronRight,
  faExpandArrowsAlt,
  faCamera,
  faUpload,
  faMouse
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useState, useEffect, useRef } from "react";
import useFetch from "../../hooks/useFetch";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SearchContext } from "../../context/SearchContext";
import { FavoriteContext } from "../../context/FavoriteContext";
import axios from "axios";
import { API_UPLOAD, API_HOTELS, API_IMAGES } from '../../utils/apiConfig';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Payment from "../payment/payment";

const Hotel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = location.pathname.split("/")[2];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [open, setOpen] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [comments, setComments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  const [bookedRooms, setBookedRooms] = useState([]);
  const [commentFormData, setCommentFormData] = useState({
    userId: "",
    rating: 0,
    comment: "",
    images: []
  });
  const [loading, setLoading] = useState(true);
  const [currentRoomImages, setCurrentRoomImages] = useState({});
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [showRoomDetail, setShowRoomDetail] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [checkingBookingStatus, setCheckingBookingStatus] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadPreview, setUploadPreview] = useState([]);
  
  // Refs for scroll navigation
  const overviewRef = useRef(null);
  const roomsRef = useRef(null);
  const locationRef = useRef(null);
  const amenitiesRef = useRef(null);
  const reviewsRef = useRef(null);
  const policiesRef = useRef(null);
  
  const { data, error } = useFetch(`/hotels/find/${id}`);
  const { user } = useContext(AuthContext);
  const { favorites, dispatch } = useContext(FavoriteContext);
  const { dates = [], options = {} } = useContext(SearchContext);

  const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
  function dayDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / MILLISECONDS_PER_DAY);
  }

  const USD_TO_VND = 24000;

  // Total price calculation
  const [totalprice, setTotalPrice] = useState(() => {
    const storedPrice = localStorage.getItem("totalprice");
    return storedPrice ? parseFloat(storedPrice) : 0;
  });

  const days = dates?.[0] ? dayDifference(dates[0].endDate, dates[0].startDate) : 0;

  // Fetch hotel images
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

  // Check if hotel is in favorites
  useEffect(() => {
    setIsFavorite(favorites.some((hotel) => hotel._id === id));
  }, [favorites, id]);

  // Fetch hotel data
  useEffect(() => {
    const fetchHotelData = async () => {
      if (data) {
        const hotelWithImage = await fetchHotelImages(data);
        console.log("Fetched hotel data:", hotelWithImage);
        console.log("Amenities:", hotelWithImage.amenities);
        setHotel(hotelWithImage);
        setLoading(false);
        
        if (user && user.details && user.details._id) {
          setCommentFormData(prev => ({
            ...prev,
            userId: user.details._id
          }));
        }
      }
    };
    fetchHotelData();
  }, [data, user]);

  // Calculate total price for hotel (not selected rooms)
  useEffect(() => {
    if (data && days) {
      const calculatedPrice = days * data.cheapestPrice;
      const roundedPrice = Math.round(calculatedPrice);
      setTotalPrice(roundedPrice);
      // Không cần lưu vào localStorage nữa vì chúng ta sẽ sử dụng totalRoomsPrice cho việc thanh toán
    }
  }, [days, data]);

  // Fetch comments/reviews
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/hotels/review/all/${id}`);
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    
    if (id) {
      fetchComments();
    }
  }, [id]);

  // Fetch room data
  useEffect(() => {
    const fetchRooms = async () => {
      if (id && dates?.[0]?.startDate && dates?.[0]?.endDate) {
        try {
          setLoadingRooms(true);
          const response = await axios.get(
            `/hotels/rooms/${id}?startDate=${dates[0].startDate}&endDate=${dates[0].endDate}`
          );
          setRoomsData(response.data);
          setLoadingRooms(false);
        } catch (error) {
          console.error("Error fetching rooms:", error);
          setRoomsError("Không thể tải thông tin phòng. Vui lòng thử lại sau.");
          setLoadingRooms(false);
        }
      }
    };
    fetchRooms();
  }, [id, dates]);

  // Fetch booked rooms
  useEffect(() => {
    const fetchBookedRooms = async () => {
      try {
        const response = await axios.get(`/booking/hotel/${id}`);
        const bookings = response.data;
        
        // Chỉ lấy các booking đã thanh toán thành công
        const successfulBookings = bookings.filter(
          booking => booking.paymentStatus === "success"
        );

        // Map dữ liệu booking để dễ sử dụng
        const booked = successfulBookings.map(booking => ({
          roomId: booking.selectedRooms.map(room => ({ 
            _id: room.roomId._id || room.roomId,
            number: room.roomNumber
          })),
          checkinDate: booking.paymentInfo.checkinDate,
          checkoutDate: booking.paymentInfo.checkoutDate
        }));

        setBookedRooms(booked);
      } catch (error) {
        console.error("Error fetching booked rooms:", error);
      }
    };

    if (id && dates?.[0]?.startDate && dates?.[0]?.endDate) {
      fetchBookedRooms();
    }
  }, [id, dates]);

  // Fetch room images
  useEffect(() => {
    const fetchRoomImages = async () => {
      if (roomsData && roomsData.length > 0) {
        const imageMap = {};
        const indexMap = {};

        await Promise.all(
          roomsData.map(async (room) => {
            if (room.imageIds && room.imageIds.length > 0) {
              try {
                const images = await Promise.all(
                  room.imageIds.map(async (imageId) => {
                    const id = typeof imageId === 'object' ? imageId._id : imageId;
                    try {
                      const response = await axios.get(`${API_IMAGES}/${id}`);
                      return response.data.imageUrl;
                    } catch (error) {
                      console.error("Error fetching room image:", error);
                      return null;
                    }
                  })
                );
                imageMap[room._id] = images.filter(Boolean);
                indexMap[room._id] = 0;
              } catch (error) {
                console.error(`Error fetching images for room ${room._id}:`, error);
                imageMap[room._id] = [];
              }
            } else {
              imageMap[room._id] = [];
            }
          })
        );

        setCurrentRoomImages(imageMap);
        setCurrentImageIndexes(indexMap);
      }
    };

    if (!loadingRooms && roomsData) {
      fetchRoomImages();
    }
  }, [roomsData, loadingRooms]);

  // Helper function to check if room is available
  const isAvailable = (roomNumber) => {
    try {
      if (!dates || !dates[0] || !roomNumber) return false;

      // Convert dates to timestamps for easier comparison
      const requestStart = new Date(dates[0].startDate).getTime();
      const requestEnd = new Date(dates[0].endDate).getTime();

      // Check if room is booked in the requested period
      const isBooked = bookedRooms.some(booking => {
        const bookedRoomIds = booking.roomId.map(id => id._id || id);
        
        if (bookedRoomIds.includes(roomNumber._id)) {
          const bookedStart = new Date(booking.checkinDate).getTime();
          const bookedEnd = new Date(booking.checkoutDate).getTime();

          // Room is unavailable if there's any overlap between periods
          return (
            (requestStart < bookedEnd && requestEnd > bookedStart)
          );
        }
        return false;
      });

      return !isBooked;
    } catch (error) {
      console.error("Error checking availability:", error);
      return false;
    }
  };

  // Handle room selection
  const handleSelectRoom = (e, roomId) => {
    const { checked } = e.target;
    
    if (checked) {
      setSelectedRooms(prev => [...prev, roomId]);
    } else {
      setSelectedRooms(prev => prev.filter(item => item !== roomId));
    }
  };

  // Tính tổng giá phòng khi chọn phòng và lưu vào state
  const [totalRoomsPrice, setTotalRoomsPrice] = useState(0);

  useEffect(() => {
    if (selectedRooms.length > 0 && days > 0 && roomsData.length > 0) {
      const calculatedTotal = selectedRooms.reduce((total, roomId) => {
        const roomNumber = roomsData
          .flatMap(room => room.roomNumbers)
          .find(roomNumber => roomNumber._id === roomId);
        
        if (!roomNumber) return total;
        
        const roomData = roomsData.find(room => 
          room.roomNumbers.some(rn => rn._id === roomId)
        );
        
        return total + (roomData?.price || 0) * days;
      }, 0);
      
      setTotalRoomsPrice(calculatedTotal);
    } else {
      setTotalRoomsPrice(0);
    }
  }, [selectedRooms, days, roomsData]);

  // Handle booking button
  const handleBookRooms = () => {
    // Kiểm tra user đã đăng nhập chưa
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt phòng!");
      navigate("/login");
      return;
    }

    console.log("Current user:", user); // Debug thông tin user

    if (selectedRooms.length === 0 || !days || days <= 0) {
      toast.error("Vui lòng chọn phòng và kiểm tra lại ngày đặt!");
      return;
    }

    // Tính toán lại tổng giá phòng để đảm bảo dữ liệu cập nhật nhất
    const currentTotalPrice = selectedRooms.reduce((total, roomId) => {
      const roomData = roomsData.find((room) => 
        room.roomNumbers.some(roomNumber => roomNumber._id === roomId)
      );
      return total + (roomData?.price || 0) * days;
    }, 0);

    const selectedRoomDetails = selectedRooms.map((roomId) => {
      // Tìm thông tin phòng
      const roomData = roomsData.find((room) => 
        room.roomNumbers.some(roomNumber => roomNumber._id === roomId)
      );
      
      // Tìm thông tin số phòng
      const roomNumberData = roomsData
        .flatMap((room) => room.roomNumbers)
        .find((roomNumber) => roomNumber._id === roomId);

      if (!roomNumberData || !roomData) {
        console.error("Không tìm thấy thông tin phòng:", roomId);
        return null;
      }

      return {
        id: roomId,
        roomId: roomData._id,
        number: roomNumberData.number || "Không xác định",
        title: roomData.title || "Không xác định",
        price: roomData.price || 0,
      };
    }).filter(Boolean);

    // Xóa dữ liệu cũ trong localStorage để tránh sử dụng lại
    localStorage.removeItem("reservationData");
    
    // Lưu vào localStorage với giá tính đúng mới nhất
    localStorage.setItem(
      "reservationData",
      JSON.stringify({
        totalPrice: currentTotalPrice,
        selectedRooms: selectedRoomDetails,
        hotelId: id,
      })
    );
    
    // Cập nhật state totalRoomsPrice
    setTotalRoomsPrice(currentTotalPrice);
    
    // Lưu thông tin ngày
    localStorage.setItem("dates", JSON.stringify(dates));
    
    // Hiển thị modal thanh toán
    setShowPaymentModal(true);
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };
  
  // Handle tab click and scroll to section
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const refs = {
      overview: overviewRef,
      rooms: roomsRef,
      location: locationRef,
      amenities: amenitiesRef,
      reviews: reviewsRef,
      policies: policiesRef
    };
    
    if (refs[tab] && refs[tab].current) {
      refs[tab].current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle favorite button click
  const handleFavoriteClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      // Lấy token từ cấu trúc phù hợp
      const authToken = user.token || user.details?.token;
      
      if (!authToken) {
        console.error("Token không tồn tại");
        toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      
      if (isFavorite) {
        await axios.delete(`/favorites/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        dispatch({ type: "REMOVE_FAVORITE", payload: id });
        toast.info('Đã xóa khỏi danh sách yêu thích');
      } else {
        await axios.post(
          "/favorites",
          { hotelId: id },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        dispatch({ type: "ADD_FAVORITE", payload: { _id: id } });
        toast.info("Đã thêm vào danh sách yêu thích!");
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast.error("Lỗi khi cập nhật yêu thích. Vui lòng thử lại!");
    }
  };

  // Handle booking button
  const handleBookingClick = () => {
    setActiveTab('rooms');
    if (roomsRef && roomsRef.current) {
      roomsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle image gallery navigation
  const handleOpen = (index) => {
    setSelectedImageIndex(index);
    setOpen(true);
  }

  const handleMove = (direction) => {
    let newSlideNumber;
    if (direction === "l") {
      newSlideNumber = selectedImageIndex === 0 ? hotel.images.length - 1 : selectedImageIndex - 1;
    } else {
      newSlideNumber = selectedImageIndex === hotel.images.length - 1 ? 0 : selectedImageIndex + 1;
    }
    setSelectedImageIndex(newSlideNumber)
  };

  // Rating related functions
  const handleRatingChange = (ratingValue) => {
    setCommentFormData(prev => ({ ...prev, rating: ratingValue }));
  };

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setCommentFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add file upload handler 
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error("Chỉ được tải lên tối đa 5 ảnh!");
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));
    setUploadPreview(previews);
    setUploadedImages(files);
  };

  // Remove preview image
  const removePreviewImage = (index) => {
    const newPreviews = [...uploadPreview];
    const newImages = [...uploadedImages];
    
    newPreviews.splice(index, 1);
    newImages.splice(index, 1);
    
    setUploadPreview(newPreviews);
    setUploadedImages(newImages);
  };

  // Submit comment/review
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!id) {
      toast.error("Không tìm thấy khách sạn!");
      return;
    }

    if (!user || !user.details._id) {
      toast.error("Vui lòng đăng nhập để đánh giá!");
      return;
    }

    if (!commentFormData.rating || !commentFormData.comment.trim()) {
      toast.error("Vui lòng nhập đánh giá và xếp hạng!");
      return;
    }

    try {
      // Upload images first if any
      let imageIds = [];
      if (uploadedImages.length > 0) {
        console.log("Uploading images:", uploadedImages.length);
        const formData = new FormData();
        uploadedImages.forEach(image => {
          formData.append('images', image);
        });

        const uploadResponse = await axios.post(`${API_UPLOAD}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        console.log("Upload response:", uploadResponse.data);
        
        // Lấy ID ảnh từ phản hồi
        imageIds = uploadResponse.data.map(img => img._id);
        console.log("Extracted image IDs:", imageIds);
      }

      // Then submit the review with image IDs
      const payload = {
        ...commentFormData,
        userId: user.details._id,
        images: imageIds
      };

      console.log("Sending review payload:", payload);
      
      const response = await axios.post(`/hotels/reviews/${id}`, payload);
      
      // Reset form
      setCommentFormData({ 
        userId: user.details._id, 
        rating: 0, 
        comment: "",
        images: []
      });
      setUploadPreview([]);
      setUploadedImages([]);
      
      // Refetch comments
      const commentsResponse = await axios.get(`/hotels/review/all/${id}`);
      console.log("Updated comments:", commentsResponse.data);
      setComments(commentsResponse.data);
      
      toast.success("Đánh giá của bạn đã được gửi thành công!");
    } catch (error) {
      console.error("Error submitting review:", error);
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message || "Bạn đã đánh giá khách sạn này rồi!");
      } else {
        toast.error("Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại!");
      }
    }
  };

  // Delete comment/review
  const handleDeleteComment = async (reviewId) => {
    try {
      const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).token : null;
      const response = await axios.delete(`/hotels/${id}/reviews/${reviewId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setComments(comments.filter((comment) => comment._id !== reviewId));
        // Đặt lại trạng thái canReview để người dùng có thể đánh giá lại
        setCanReview(true);
        toast.success("Xóa đánh giá thành công! Bạn có thể đánh giá lại.");
      } else {
        toast.error("Không thể xóa đánh giá này.");
      }
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      toast.error("Đã xảy ra lỗi khi xóa đánh giá. Vui lòng thử lại!");
    }
  };

  // Kiểm tra tab từ URL query params và mở tab đánh giá nếu được chỉ định
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'reviews') {
      setActiveTab('reviews');
      // Scroll đến phần đánh giá nếu có ref
      if (reviewsRef.current) {
        reviewsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  // Kiểm tra xem người dùng có đặt phòng thành công ở khách sạn này chưa
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user || !id) return;
      
      try {
        setCheckingBookingStatus(true);
        const response = await axios.get(
          `/booking/check/${user.details._id}/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
        
        setCanReview(response.data.hasBooked);
      } catch (error) {
        console.error("Error checking booking status:", error);
        setCanReview(false);
      } finally {
        setCheckingBookingStatus(false);
      }
    };

    checkBookingStatus();
  }, [id, user]);

  // Render rating stars
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesomeIcon key={`star-${i}`} icon={faStar} className="star-icon filled" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FontAwesomeIcon key="half-star" icon={faStarHalfAlt} className="star-icon filled" />);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FontAwesomeIcon key={`empty-star-${i}`} icon={faStar} className="star-icon" />);
    }
    
    return stars;
  };

  // Thay đổi mảng tiện ích thành động, dựa trên dữ liệu từ MongoDB
  const getAmenityIcon = (amenityId) => {
    const iconMap = {
      "wifi": faWifi,
      "parking": faParking,
      "restaurant": faUtensils,
      "pool": faSwimmingPool,
      "spa": faSpa,
      "gym": faDumbbell,
      "ac": faSnowflake,
      "meeting": faCheck,
      "bar": faWineGlass,
      "laundry": faCheck,
      "roomService": faCheck,
      "childFriendly": faCheck,
      "petFriendly": faCheck,
      "breakfast": faUtensils,
      "tv": faStar,
      "shuttle": faCheck,
      "minibar": faWineGlass,
      "coffee": faCoffee,
      "no-smoking": faSmoking,
      "balcony": faDoorOpen,
      "bathtub": faBed,
      "hairdryer": faCheck,
      "kitchen": faUtensils,
      "fridge": faCheck,
      "connecting": faCheck,
      "heater": faCheck,
      "family": faUserFriends,
      "earlyCheckin": faCheck,
      "nearBeach": faCheck,
      "default": faCheck
    };
    
    return iconMap[amenityId] || iconMap.default;
  };
  
  const getAmenityLabel = (amenityId) => {
    const labelMap = {
      "wifi": "WiFi miễn phí",
      "parking": "Bãi đậu xe",
      "restaurant": "Nhà hàng",
      "pool": "Hồ bơi",
      "spa": "Spa",
      "gym": "Phòng tập gym",
      "ac": "Điều hòa",
      "meeting": "Phòng họp",
      "bar": "Quầy bar",
      "laundry": "Dịch vụ giặt ủi",
      "roomService": "Dịch vụ phòng",
      "childFriendly": "Tiện nghi cho trẻ",
      "petFriendly": "Cho phép thú cưng",
      "breakfast": "Bữa sáng",
      "tv": "TV",
      "shuttle": "Đưa đón sân bay",
      "minibar": "Minibar",
      "coffee": "Máy pha cà phê",
      "no-smoking": "Không hút thuốc",
      "balcony": "Ban công",
      "bathtub": "Bồn tắm",
      "hairdryer": "Máy sấy tóc",
      "kitchen": "Nhà bếp",
      "fridge": "Tủ lạnh",
      "connecting": "Phòng liên thông",
      "heater": "Máy sưởi",
      "family": "Phòng gia đình",
      "earlyCheckin": "Nhận phòng sớm",
      "nearBeach": "Gần biển"
    };
    
    return labelMap[amenityId] || amenityId;
  };

  // Chuyển đổi hình ảnh phòng
  const handleImageNav = (roomId, direction) => {
    const images = currentRoomImages[roomId] || [];
    if (images.length <= 1) return;

    setCurrentImageIndexes(prev => {
      const currentIndex = prev[roomId] || 0;
      let newIndex;
      
      if (direction === "prev") {
        newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      }
      
      return { ...prev, [roomId]: newIndex };
    });
  };

  // Hiển thị chi tiết phòng
  const showRoomDetails = (room) => {
    setShowRoomDetail(room);
  };

  // Render review section in Traveloka style
  const renderCommentSection = () => {
    if (!user) {
      return (
        <div className="login-to-comment">
          <p>Vui lòng đăng nhập để đánh giá</p>
          <button
            className="login-button"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        </div>
      );
    }

    if (checkingBookingStatus) {
      return <div className="checking-status">Đang kiểm tra thông tin đặt phòng...</div>;
    }

    if (!canReview) {
      return <div className="cannot-review">Bạn cần đặt phòng và hoàn thành thanh toán trước khi đánh giá khách sạn này.</div>;
    }

    return (
      <div className="comment-form">
        <h3 className="review-form-title">Đánh giá:</h3>
        
        <div className="rating-input">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${commentFormData.rating >= star ? "filled" : ""}`}
              onClick={() => handleRatingChange(star)}
            >
              ★
            </span>
          ))}
          <span className="rating-text">
            {commentFormData.rating > 0 ? 
              (commentFormData.rating === 5 ? "Xuất sắc" : 
               commentFormData.rating === 4 ? "Rất tốt" : 
               commentFormData.rating === 3 ? "Bình thường" : 
               commentFormData.rating === 2 ? "Tạm được" : "Kém") 
              : "Chọn đánh giá"}
          </span>
        </div>
        
        <div className="comment-input-container">
          <textarea
            className="comment-textarea"
            placeholder="Chia sẻ trải nghiệm của bạn với khách sạn này..."
            value={commentFormData.comment}
            onChange={(e) =>
              setCommentFormData({
                ...commentFormData,
                comment: e.target.value,
              })
            }
          ></textarea>
          
          <div className="image-upload-container">
            <div className="upload-instruction">
              <FontAwesomeIcon icon={faCamera} className="camera-icon" />
              <span>Thêm ảnh (tối đa 5 ảnh)</span>
            </div>
            
            <label className="upload-button">
              <FontAwesomeIcon icon={faUpload} />
              <span>Tải ảnh lên</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
              />
            </label>
            
            {uploadPreview.length > 0 && (
              <div className="image-preview-container">
                {uploadPreview.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index}`} />
                    <button 
                      className="remove-image" 
                      onClick={() => removePreviewImage(index)}
                    >
                      <FontAwesomeIcon icon={faCircleXmark} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button
          className="submit-review-btn"
          onClick={handleSubmitComment}
          disabled={!commentFormData.rating || !commentFormData.comment.trim()}
        >
          Gửi đánh giá
        </button>
      </div>
    );
  };

  // Render reviews with better formatting like Traveloka
  const renderReviews = () => {
    if (comments.length === 0) {
      return (
        <div className="no-reviews">
          <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá khách sạn này!</p>
        </div>
      );
    }

    return (
      <div className="reviews-list">
        {comments.map((comment, index) => (
          <div className="review-item" key={index}>
            <div className="review-header">
              <div className="reviewer-info">
                <div className="reviewer-name">{comment.username}</div>
                <div className="review-meta">
                  <div className="review-rating">
                    <span className="rating-value">{comment.rating}/5</span>
                    <div className="rating-stars">
                      {renderRatingStars(comment.rating)}
                    </div>
                  </div>
                  <div className="review-date">
                    Đánh giá cách đây {Math.floor((new Date() - new Date(comment.createdAt)) / (1000 * 60 * 60 * 24))} ngày
                  </div>
                </div>
              </div>
              {(user?.isAdmin === true || (user?.details && user.details._id === comment.user)) && (
                <button
                  className="delete-review-btn"
                  onClick={() => handleDeleteComment(comment._id)}
                  title="Xóa đánh giá"
                >
                  <FontAwesomeIcon icon={faCircleXmark} />
                </button>
              )}
            </div>
            
            {comment.stayType && (
              <div className="stay-type">
                <FontAwesomeIcon icon={faMouse} />
                <span>Kỳ nghỉ {comment.stayType}</span>
              </div>
            )}
            
            <p className="review-content">{comment.comment}</p>
            
            {comment.images && comment.images.length > 0 && (
              <div className="review-images">
                {comment.images.map((image, idx) => (
                  <div className="review-image" key={idx}>
                    <img 
                      src={image} 
                      alt={`Review image ${idx}`} 
                      onError={(e) => {
                        console.error("Failed to load review image:", image);
                        e.target.onerror = null;
                        e.target.src = "/images/placeholder.png";
                      }} 
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="review-helpful">
              <button className="helpful-btn">
                <FontAwesomeIcon icon={faCheck} /> Đánh giá này hữu ích không?
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin khách sạn...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="error-container">
        <p>Không tìm thấy thông tin khách sạn. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <Header type="list" />
      
      <div className="hotelContainer">
        {/* Image gallery slider modal */}
        {open && hotel && hotel.images && (
          <div className="slider">
            <FontAwesomeIcon
              icon={faCircleXmark}
              className="close"
              onClick={() => setOpen(false)}
            />
            <FontAwesomeIcon
              icon={faCircleArrowLeft}
              className="arrow"
              onClick={() => handleMove("l")}
            />
            <div className="sliderWrapper">
              <img
                src={hotel.images[selectedImageIndex]}
                alt=""
                className="sliderImg"
              />
            </div>
            <FontAwesomeIcon
              icon={faCircleArrowRight}
              className="arrow"
              onClick={() => handleMove("r")}
            />
          </div>
        )}

        {/* Top navigation bar */}
        <div className="hotel-nav-bar">
          <div className="hotel-nav-container">
            <div className="hotel-nav-tabs">
              <button 
                className={`hotel-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabClick('overview')}
              >
                Tổng quan
              </button>
              <button 
                className={`hotel-nav-tab ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => handleTabClick('rooms')}
              >
                Phòng
              </button>
              <button 
                className={`hotel-nav-tab ${activeTab === 'location' ? 'active' : ''}`}
                onClick={() => handleTabClick('location')}
              >
                Vị trí
              </button>
              <button 
                className={`hotel-nav-tab ${activeTab === 'amenities' ? 'active' : ''}`}
                onClick={() => handleTabClick('amenities')}
              >
                Tiện ích
              </button>
              <button 
                className={`hotel-nav-tab ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => handleTabClick('reviews')}
              >
                Đánh giá
              </button>
              <button 
                className={`hotel-nav-tab ${activeTab === 'policies' ? 'active' : ''}`}
                onClick={() => handleTabClick('policies')}
              >
                Chính sách
              </button>
            </div>
            <div className="hotel-nav-actions">
              <button className="hotel-action-button" onClick={handleFavoriteClick}>
                <FontAwesomeIcon icon={faHeart} /> {isFavorite ? " Đã Yêu thích" : "Yêu thích"}
              </button>
            </div>
          </div>
        </div>

        <div className="hotelWrapper">
          {/* Overview Section */}
          <div ref={overviewRef} className="hotel-section" id="overview">
            <div className="hotel-overview">
              <div className="hotel-overview-header">
                <div className="hotel-overview-title">
                  <h1>{hotel.name}</h1>
                  <div className="hotel-rating">
                    {hotel.rating && renderRatingStars(hotel.rating)}
                    <span className="hotel-rating-number">{hotel.rating?.toFixed(1) || "N/A"}</span>
                  </div>
                  <div className="hotel-address">
                    <FontAwesomeIcon icon={faLocationDot} />
                    <span>{hotel.address}</span>
                  </div>
                </div>
                <div className="hotel-overview-price">
                  <div className="hotelDetailsPrice">
                    <h1>Hoàn hảo cho {days}-kỳ nghỉ đêm!</h1>
                    <span>
                      Tọa lạc tại trung tâm thực sự của Vaa, khách sạn này có một Điểm vị trí xuất sắc!
                    </span>
                    <h2>
                      <b>{totalprice.toLocaleString('vi-VN')} VND</b> ({days} đêm)
                    </h2>

                    <button onClick={handleBookingClick}>Đặt chỗ hoặc Đặt ngay!</button>
                  </div>
                </div>
              </div>

              <div className="hotel-gallery">
                {hotel && hotel.images && hotel.images.length > 0 && (
                  <div className="hotel-gallery-grid">
                    <div className="gallery-main-image" onClick={() => handleOpen(0)}>
                      <img src={hotel.images[0]} alt={hotel.name} />
                    </div>
                    <div className="gallery-thumbnails">
                      {hotel.images.slice(1, 5).map((imageUrl, index) => (
                        <div 
                          className="gallery-thumbnail" 
                          key={index} 
                          onClick={() => handleOpen(index + 1)}
                        >
                          <img src={imageUrl} alt={`${hotel.name}-${index+1}`} />
                        </div>
                      ))}
                      {hotel.images.length > 5 && (
                        <div 
                          className="gallery-thumbnail gallery-more" 
                          onClick={() => setOpen(true)}
                        >
                          <div className="gallery-more-overlay">
                            <span>+{hotel.images.length - 5} ảnh</span>
                          </div>
                          <img src={hotel.images[5]} alt={`${hotel.name}-more`} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hotel-description">
                <h2>Thông tin về {hotel.name}</h2>
                <p>{hotel.desc}</p>
                <div className="hotel-highlights">
                  <div className="highlight-item">
                    <FontAwesomeIcon icon={faLocationDot} />
                    <span>Khoảng cách: {hotel.distance}m từ trung tâm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms Section */}
          <div ref={roomsRef} className="hotel-section" id="rooms">
            <div className="section-header">
              <h2>Danh sách phòng</h2>
              <p>Chọn phòng phù hợp với nhu cầu của bạn</p>
            </div>

            <div className="hotel-rooms">
              {loadingRooms ? (
                <div className="rooms-loading">
                  <div className="loading-spinner"></div>
                  <p>Đang tải thông tin phòng...</p>
                </div>
              ) : roomsError ? (
                <div className="rooms-error">
                  <p>{roomsError}</p>
                </div>
              ) : roomsData && roomsData.length > 0 ? (
                <div className="rooms-list">
                  {roomsData.map((room) => {
                    // Lọc ra các phòng còn trống
                    const availableRooms = room.roomNumbers.filter(roomNumber => isAvailable(roomNumber));
                    
                    // Nếu không có phòng trống thì bỏ qua
                    if (availableRooms.length === 0) return null;
                    
                    // Lấy hình ảnh và index hiện tại
                    const roomImages = currentRoomImages[room._id] || [];
                    const currentImageIndex = currentImageIndexes[room._id] || 0;
                    
                    return (
                      <div className="room-card" key={room._id}>
                        <div className="room-image-container">
                          {roomImages.length > 0 ? (
                            <div className="room-image-slider">
                              <img 
                                src={roomImages[currentImageIndex]} 
                                alt={room.title} 
                                className="room-image"
                              />
                              {roomImages.length > 1 && (
                                <>
                                  <button 
                                    className="image-nav prev"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageNav(room._id, "prev");
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                  </button>
                                  <button 
                                    className="image-nav next"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageNav(room._id, "next");
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="room-no-image">
                              <FontAwesomeIcon icon={faBed} />
                              <span>Không có ảnh</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="room-info">
                          <h3 className="room-title">{room.title}</h3>
                          <div className="room-specs">
                            <div className="room-spec">
                              <FontAwesomeIcon icon={faRulerCombined} />
                              <span>{room.roomSize || "30 m²"}</span>
                            </div>
                            <div className="room-spec">
                              <FontAwesomeIcon icon={faUserFriends} />
                              <span>{room.maxPeople} khách</span>
                            </div>
                          </div>
                          
                          <div className="room-amenities">
                            {room.amenities && room.amenities.length > 0 ? (
                              room.amenities.slice(0, 3).map((amenity, index) => (
                                <div className="room-amenity" key={index}>
                                  <FontAwesomeIcon icon={getAmenityIcon(amenity)} />
                                  <span>{getAmenityLabel(amenity)}</span>
                                </div>
                              ))
                            ) : (
                              <div className="room-amenity">
                                <FontAwesomeIcon icon={faWifi} />
                                <span>WiFi miễn phí</span>
                              </div>
                            )}
                            {room.amenities && room.amenities.length > 3 && (
                              <div className="room-amenity">
                                <span>+{room.amenities.length - 3} tiện nghi khác</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="room-desc">
                            <p>{room.desc || "Phòng với đầy đủ tiện nghi, thoáng mát và thoải mái."}</p>
                          </div>
                          
                          <button 
                            className="room-detail-btn"
                            onClick={() => showRoomDetails(room)}
                          >
                            Xem chi tiết phòng
                          </button>
                        </div>
                        
                        <div className="room-booking">
                          <div className="room-price">
                            <div className="price-value">{formatPrice(room.price)} VND</div>
                            <div className="price-night">/đêm</div>
                            <div className="price-taxes">Đã bao gồm thuế và phí</div>
                          </div>
                          
                          <div className="room-selection">
                            <div className="room-select-header">
                              <span>Phòng còn trống: {availableRooms.length}</span>
                            </div>
                            
                            <div className="room-numbers">
                              {availableRooms.map((roomNumber) => (
                                <div className="room-number-item" key={roomNumber._id}>
                                  <label className="room-number-label">
                                    <input
                                      type="checkbox"
                                      value={roomNumber._id}
                                      onChange={(e) => handleSelectRoom(e, roomNumber._id)}
                                      checked={selectedRooms.includes(roomNumber._id)}
                                      className="room-number-checkbox"
                                    />
                                    <span className="room-number-text">Phòng {roomNumber.number}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Booking button */}
                  {selectedRooms.length > 0 && (
                    <div className="room-booking-action">
                      <div className="selected-rooms-info">
                        <span>Đã chọn {selectedRooms.length} phòng</span>
                        <span>Tổng tiền: {formatPrice(totalRoomsPrice)} VND ({days} đêm)</span>
                      </div>
                      <button 
                        className="book-rooms-button"
                        onClick={handleBookRooms}
                      >
                        Đặt phòng ngay
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-rooms">
                  <p>Không tìm thấy phòng trống cho ngày đã chọn</p>
                </div>
              )}
            </div>
          </div>

          {/* Location Section - Sửa lỗi Google Maps */}
          <div ref={locationRef} className="hotel-section" id="location">
            <div className="section-header">
              <h2>Vị trí</h2>
            </div>
            <div className="hotel-location">
              <div className="hotel-address-detail">
                <FontAwesomeIcon icon={faLocationDot} className="location-icon" />
                <div className="address-info">
                  <h3>Địa chỉ</h3>
                  <p>{hotel.address}</p>
                </div>
              </div>
              <div className="hotel-map">
                <iframe
                  title="Hotel Location"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              </div>
            </div>
          </div>

          {/* Amenities Section - Thay mảng tĩnh thành động */}
          <div ref={amenitiesRef} className="hotel-section" id="amenities">
            <div className="section-header">
              <h2>Tiện ích</h2>
            </div>
            <div className="hotel-amenities">
              <div className="amenities-grid">
                {hotel.amenities && hotel.amenities.length > 0 ? (
                  hotel.amenities.map((amenityId, index) => (
                    <div className="amenity-item" key={index}>
                      <FontAwesomeIcon icon={getAmenityIcon(amenityId)} className="amenity-icon" />
                      <span>{getAmenityLabel(amenityId)}</span>
                    </div>
                  ))
                ) : (
                  // Fallback nếu không có tiện ích
                  <div className="no-amenities">
                    <p>Không có thông tin về tiện ích của khách sạn.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div ref={reviewsRef} className="hotel-section" id="reviews">
            <div className="section-header">
              <h2>Đánh giá từ khách hàng</h2>
              <div className="review-summary">
                <div className="review-score">
                  <span className="big-score">{hotel.rating?.toFixed(1) || "5.0"}</span>
                  <div className="score-stars">
                    {hotel.rating && renderRatingStars(hotel.rating)}
                    <span>{hotel.numReviews || 0} đánh giá</span>
                  </div>
                </div>
                
            
              </div>
            </div>
            
            <div className="reviews-container">
              <div className="review-filter-container">
                
                
              </div>
              
              {/* Comment Form */}
              {renderCommentSection()}
              
              {/* Reviews List */}
              {renderReviews()}
              
            </div>
          </div>

          {/* Policies Section */}
          <div ref={policiesRef} className="hotel-section" id="policies">
            <div className="section-header">
              <h2>Chính sách khách sạn</h2>
            </div>
            <div className="hotel-policies">
              <div className="policy-group">
                <h3>Nhận phòng & Trả phòng</h3>
                <div className="policy-item">
                  <p><strong>Nhận phòng:</strong> Từ 14:00</p>
                  <p><strong>Trả phòng:</strong> Trước 12:00</p>
                  <p><strong>Nhận phòng sớm/trễ:</strong> Tùy thuộc vào tình trạng phòng</p>
                </div>
              </div>
              
              <div className="policy-group">
                <h3>Chính sách hủy phòng</h3>
                <div className="policy-item">
                  <p>Đặt phòng này <strong>không hoàn tiền</strong></p>
                  <p>Khi đã xác nhận đặt phòng, khách hàng sẽ không được hoàn tiền nếu hủy hoặc không đến.</p>
                </div>
              </div>
              
              <div className="policy-group">
                <h3>Trẻ em & Giường phụ</h3>
                <div className="policy-item">
                  <p><strong>Trẻ em dưới 6 tuổi:</strong> Miễn phí khi ở cùng giường với người lớn</p>
                  <p><strong>Trẻ em từ 6-12 tuổi:</strong> Phụ thu 50% giá phòng</p>
                  <p><strong>Giường phụ:</strong> Có sẵn với phụ phí</p>
                </div>
              </div>
              
              <div className="policy-group">
                <h3>Lưu ý quan trọng</h3>
                <div className="policy-item">
                  <p>Vui lòng xuất trình giấy tờ tùy thân có ảnh và thẻ tín dụng khi nhận phòng.</p>
                  <p>Khách sạn có thể yêu cầu đặt cọc hoặc thế chấp cho các chi phí phát sinh.</p>
                  <p>Không hút thuốc trong phòng và các khu vực công cộng.</p>
                </div>
              </div>
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
        
        <MailList />
        <Footer />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <Payment onClose={() => setShowPaymentModal(false)} />
        </div>
      )}

      {/* Room Detail Modal */}
      {showRoomDetail && (
        <div className="room-detail-modal" onClick={() => setShowRoomDetail(null)}>
          <div className="room-detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="room-detail-close" onClick={() => setShowRoomDetail(null)}>
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>
            
            <div className="room-detail-header">
              <h3>{showRoomDetail.title}</h3>
            </div>
            
            {/* Thêm hiển thị ảnh trong modal chi tiết phòng */}
            {currentRoomImages[showRoomDetail._id] && currentRoomImages[showRoomDetail._id].length > 0 && (
              <div className="room-detail-images">
                <div className="room-detail-image-slider">
                  <img 
                    src={currentRoomImages[showRoomDetail._id][currentImageIndexes[showRoomDetail._id] || 0]} 
                    alt={showRoomDetail.title}
                    className="room-detail-image"
                  />
                  {currentRoomImages[showRoomDetail._id].length > 1 && (
                    <>
                      <button 
                        className="image-nav prev"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageNav(showRoomDetail._id, "prev");
                        }}
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                      <button 
                        className="image-nav next"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageNav(showRoomDetail._id, "next");
                        }}
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </>
                  )}
                </div>
                <div className="room-detail-image-thumbnails">
                  {currentRoomImages[showRoomDetail._id].slice(0, 6).map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`room-detail-thumbnail ${currentImageIndexes[showRoomDetail._id] === idx ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndexes(prev => ({...prev, [showRoomDetail._id]: idx}))}
                    >
                      <img src={img} alt={`thumbnail ${idx}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="room-detail-body">
              <div className="room-detail-info">
                <div className="room-detail-info-item">
                  <FontAwesomeIcon icon={faRulerCombined} />
                  <span>{showRoomDetail.roomSize || "30 m²"}</span>
                </div>
                <div className="room-detail-info-item">
                  <FontAwesomeIcon icon={faUserFriends} />
                  <span>{showRoomDetail.maxPeople} khách</span>
                </div>
              </div>
              
              <div className="room-detail-section">
                <h4>Tính năng phòng bạn thích</h4>
                <div className="room-detail-features">
                  {showRoomDetail.amenities && showRoomDetail.amenities.length > 0 ? (
                    showRoomDetail.amenities.map((amenity, index) => (
                      <div className="room-detail-feature" key={index}>
                        <FontAwesomeIcon icon={getAmenityIcon(amenity)} />
                        <span>{getAmenityLabel(amenity)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="room-detail-feature">
                        <FontAwesomeIcon icon={faDoorOpen} />
                        <span>Bồn tắm</span>
                      </div>
                      <div className="room-detail-feature">
                        <FontAwesomeIcon icon={faExpandArrowsAlt} />
                        <span>Ban công / Sân hiên</span>
                      </div>
                      <div className="room-detail-feature">
                        <FontAwesomeIcon icon={faUserFriends} />
                        <span>Khu vực chờ</span>
                      </div>
                      <div className="room-detail-feature">
                        <FontAwesomeIcon icon={faSnowflake} />
                        <span>Máy lạnh</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="room-detail-desc">
                <h4>Mô tả phòng</h4>
                <p>{showRoomDetail.desc || "Phòng với đầy đủ tiện nghi, thoáng mát và thoải mái."}</p>
              </div>
            </div>
            
            <div className="room-detail-footer">
              <div className="room-detail-price">
                <div className="room-detail-price-label">Khởi điểm từ:</div>
                <div className="room-detail-price-value">
                  {formatPrice(showRoomDetail.price)} VND
                  <span>/ phòng / đêm</span>
                </div>
              </div>
              <button 
                className="room-detail-button"
                onClick={() => {
                  setShowRoomDetail(null);
                  handleTabClick('rooms');
                }}
              >
                Đặt phòng ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hotel;