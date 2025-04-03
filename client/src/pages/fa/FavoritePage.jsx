import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./favoritePage.css";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faStar, faLocationDot, faCheck, faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { API_IMAGES } from "../../utils/apiConfig";

const FavoritePage = () => {
  const { user, token } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    } else {
      const fetchFavorites = async () => {
        try {
          setLoading(true);
          const res = await axios.get("/favorites", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          const hotels = res.data.hotels;
          setFavorites(hotels);
          
          // Fetch image URLs for each hotel
          const fetchImagePromises = hotels.flatMap(hotel => 
            hotel.imageIds?.map(async (imageId) => {
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
            }) || []
          );
          
          await Promise.all(fetchImagePromises.filter(Boolean));
          setLoading(false);
        } catch (error) {
          console.error("Error fetching favorites:", error);
          setLoading(false);
        }
      };
      fetchFavorites();
    }
  }, [user, token, navigate]);

  const handleRemoveFavorite = async (hotelId) => {
    try {
      await axios.delete(`/favorites/${hotelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFavorites(favorites.filter((hotel) => hotel._id !== hotelId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  return (
    <>
      <Navbar />
      <Header type="list" />
      <div className="favoriteContainer">
        <div className="favoriteWrapper">
          <h1 className="favoriteTitle">
            <FontAwesomeIcon icon={faHeart} className="favoriteIcon" /> Khách sạn bạn yêu thích
          </h1>
          
          {loading ? (
            <div className="loadingContainer">
              <div className="loadingSpinner"></div>
              <p>Đang tải danh sách yêu thích của bạn...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="emptyFavorites">
              <div className="emptyMessage">
                <h2>Bạn chưa có khách sạn yêu thích nào</h2>
                <p>Hãy khám phá và thêm khách sạn vào danh sách yêu thích!</p>
                <Link to="/" className="exploreButton">Khám phá ngay</Link>
              </div>
            </div>
          ) : (
            <div className="favoriteList">
              {favorites.map((hotel) => (
                <div key={hotel._id} className="favoriteItem">
                  <button
                    className="removeFavoriteBtn"
                    onClick={() => handleRemoveFavorite(hotel._id)}
                    title="Xóa khỏi danh sách yêu thích"
                  >
                    <FontAwesomeIcon icon={faHeart} />
                  </button>
                  
                  <div className="favoriteItemImageContainer">
                    {hotel.imageIds && hotel.imageIds.length > 0 && imageUrls[hotel.imageIds[0]] ? (
                      <img
                        src={imageUrls[hotel.imageIds[0]]}
                        alt={hotel.name}
                        className="favoriteItemImage"
                      />
                    ) : (
                      <img
                        src="https://cf.bstatic.com/xdata/images/hotel/square600/261707778.webp?k=fa6b6128468ec15e81f7d076b6f2473fa3a80c255582f155cae35f9edbffdd78&o=&s=1"
                        alt={hotel.name}
                        className="favoriteItemImage"
                      />
                    )}
                  </div>
                  
                  <div className="favoriteItemInfo">
                    <div className="favoriteItemHeader">
                      <h2 className="favoriteItemName">{hotel.name}</h2>
                      {hotel.rating && (
                        <div className="favoriteItemRating">
                          <span>{hotel.rating.toFixed(1)}</span>
                          <FontAwesomeIcon icon={faStar} className="starIcon" />
                        </div>
                      )}
                    </div>
                    
                    <div className="favoriteItemLocation">
                      <FontAwesomeIcon icon={faLocationDot} className="locationIcon" />
                      <span>{hotel.address}, {hotel.city}</span>
                    </div>
                    
                    <div className="favoriteItemDistance">
                      <span>{hotel.distance} từ trung tâm</span>
                    </div>
                    
                    <div className="favoriteItemDescription">
                      {hotel.desc && hotel.desc.length > 150 
                        ? `${hotel.desc.substring(0, 150)}...` 
                        : hotel.desc}
                    </div>
                    
                    <div className="favoriteItemFeatures">
                      {hotel.amenities && hotel.amenities.length > 0 && (
                        <div className="amenitiesList">
                          {hotel.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="amenity">
                              <FontAwesomeIcon icon={faCheck} className="amenityIcon" />
                              {amenity}
                            </span>
                          ))}
                          {hotel.amenities.length > 3 && (
                            <span className="moreAmenities">+{hotel.amenities.length - 3} thêm</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="favoriteItemDetails">
                      <div className="favoriteItemPrice">
                        <span className="priceValue">{new Intl.NumberFormat('vi-VN').format(hotel.cheapestPrice)}₫</span>
                        <span className="priceNight">/đêm</span>
                      </div>
                      
                      <div className="favoriteItemActions">
                        <span className="taxInfo">
                          <FontAwesomeIcon icon={faMoneyBill} className="taxIcon" />
                          Đã bao gồm thuế và phí
                        </span>
                        <Link to={`/hotels/${hotel._id}`} className="viewDealButton">
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FavoritePage;
