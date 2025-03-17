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
  faCheck
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useState, useEffect, useRef } from "react";
import useFetch from "../../hooks/useFetch";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SearchContext } from "../../context/SearchContext";
import { FavoriteContext } from "../../context/FavoriteContext";
import axios from "axios";
import Reserve from "../../components/reserve/Reserve";
import { API_UPLOAD, API_HOTELS, API_IMAGES } from '../../utils/apiConfig';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Hotel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split("/")[2];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [open, setOpen] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [comments, setComments] = useState([]);
  const [commentFormData, setCommentFormData] = useState({
    userId: "",
    rating: 0,
    comment: "",
  });
  const [loading, setLoading] = useState(true);
  
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

  // Total price calculation
  const [totalprice, setTotalPrice] = useState(() => {
    const storedPrice = localStorage.getItem("totalprice");
    return storedPrice ? parseFloat(storedPrice) : 1;
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

  // Calculate total price
  useEffect(() => {
    if (data && options.room && days) {
      const calculatedPrice = days * data.cheapestPrice * options.room;
      const roundedPrice = Math.round(calculatedPrice);
      setTotalPrice(roundedPrice);
      localStorage.setItem("totalprice", roundedPrice.toString());
    }
  }, [days, data, options]);

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

  // Handle tab click and scroll to section
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const refs = {
      overview: overviewRef,
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
      if (isFavorite) {
        await axios.delete(`/favorites/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        dispatch({ type: "REMOVE_FAVORITE", payload: id });
        toast.info('Đã xóa khỏi danh sách yêu thích');
      } else {
        await axios.post(
          "/favorites",
          { hotelId: id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        dispatch({ type: "ADD_FAVORITE", payload: { _id: id } });
        toast.info("Đã thêm vào danh sách yêu thích!");
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  // Handle booking button click
  const handleBookingClick = () => {
    if (user) {
      setOpenModal(true);
    } else {
      navigate("/login");
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

    const payload = {
      ...commentFormData,
      userId: user.details._id,
    };

    try {
      const response = await axios.post(`/hotels/reviews/${id}`, payload);
      
      // Reset form
      setCommentFormData({ 
        userId: user.details._id, 
        rating: 0, 
        comment: "" 
      });
      
      // Refetch comments
      const commentsResponse = await axios.get(`/hotels/review/all/${id}`);
      setComments(commentsResponse.data);
      
      toast.success("Đánh giá của bạn đã được gửi thành công!");
    } catch (error) {
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
        toast.success("Xóa đánh giá thành công!");
      } else {
        toast.error("Không thể xóa đánh giá này.");
      }
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      toast.error("Đã xảy ra lỗi khi xóa đánh giá. Vui lòng thử lại!");
    }
  };

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
      "ac": faCheck,
      "meeting": faCheck,
      "bar": faCheck,
      "laundry": faCheck,
      "roomService": faCheck,
      "childFriendly": faCheck,
      "petFriendly": faCheck,
      "breakfast": faCheck,
      "tv": faCheck,
      "shuttle": faCheck,
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
      "laundry": "Giặt ủi",
      "roomService": "Dịch vụ phòng",
      "childFriendly": "Thân thiện với trẻ em",
      "petFriendly": "Cho phép thú cưng",
      "breakfast": "Bữa sáng",
      "tv": "TV",
      "shuttle": "Đưa đón sân bay"
    };
    
    return labelMap[amenityId] || amenityId;
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
                  <span className="big-score">{hotel.rating?.toFixed(1) || "N/A"}</span>
                  <div className="score-stars">
                    {hotel.rating && renderRatingStars(hotel.rating)}
                    <span>{hotel.numReviews || 0} đánh giá</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="reviews-container">
              {/* Review Form */}
              {user && (
                <div className="review-form-container">
                  <h3>Viết đánh giá của bạn</h3>
                  <form onSubmit={handleSubmitComment} className="review-form">
                    <div className="rating-selection">
                      <label>Đánh giá của bạn:</label>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`rating-star ${commentFormData.rating >= star ? "active" : ""}`}
                            onClick={() => handleRatingChange(star)}
                          >
                            <FontAwesomeIcon icon={faStar} />
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="comment-input">
                      <textarea
                        name="comment"
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        value={commentFormData.comment}
                        onChange={handleCommentChange}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="submit-review-btn">Gửi đánh giá</button>
                  </form>
                </div>
              )}
              
              {/* Reviews List */}
              <div className="reviews-list">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div className="review-item" key={index}>
                      <div className="review-header">
                        <div className="reviewer-info">
                          <h4>{comment.username}</h4>
                          <div className="review-rating">
                            {renderRatingStars(comment.rating)}
                            <span className="review-date">
                              {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        {(user?.isAdmin === true || (user?.details && user.details._id === comment.user)) && (
                          <button
                            className="delete-review-btn"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            <FontAwesomeIcon icon={faCircleXmark} />
                          </button>
                        )}
                      </div>
                      <p className="review-content">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-reviews">
                    <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá khách sạn này!</p>
                  </div>
                )}
              </div>
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
                </div>
              </div>
              <div className="policy-group">
                <h3>Chính sách hủy phòng</h3>
                <div className="policy-item">
                  <p>Đặt phòng này <strong>không hoàn tiền</strong></p>
                </div>
              </div>
              <div className="policy-group">
                <h3>Lưu ý quan trọng</h3>
                <div className="policy-item">
                  <p>Vui lòng xuất trình giấy tờ tùy thân có ảnh và thẻ tín dụng khi nhận phòng.</p>
                  <p>Khách sạn có thể yêu cầu đặt cọc hoặc thế chấp cho các chi phí phát sinh.</p>
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
      {openModal && <Reserve setOpen={setOpenModal} hotelId={id} />}
    </div>
  );
};

export default Hotel;