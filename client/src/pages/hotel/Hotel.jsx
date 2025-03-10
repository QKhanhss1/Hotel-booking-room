import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import Comment from "../../components/comments/comment";
import MailList from "../../components/mailList/MailList";
import Footer from "../../components/footer/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faCircleArrowLeft, faCircleArrowRight, faCircleXmark, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { useContext, useState, useEffect } from "react";
import useFetch from "../../hooks/useFetch";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SearchContext } from "../../context/SearchContext";
import { FavoriteContext } from "../../context/FavoriteContext";
import axios from "axios";
import Reserve from "../../components/reserve/Reserve";
import { API_UPLOAD, API_HOTELS, API_IMAGES } from '../../utils/apiConfig';
import { ToastContainer, toast, Bounce } from 'react-toastify';

const Hotel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split("/")[2];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [open, setOpen] = useState(false);
  const [hotel, setHotel] = useState(null)
  const [openModal, setOpenModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { data, loading } = useFetch(`/hotels/find/${id}`);
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

  //Lưu Giá tiền vào localStorage
  const [totalprice, setTotalPrice] = useState(() => {

    const storedPrice = localStorage.getItem("totalprice");
    return storedPrice ? parseFloat(storedPrice) : 1;
  });


  const days = dates?.[0] ? dayDifference(dates[0].endDate, dates[0].startDate) : 0;


  // fetch ảnh của hotelhotel
  const fetchHotelImages = async (hotel) => {
    if (hotel.imageIds && hotel.imageIds.length > 0) {
      const images = await Promise.all(
        hotel.imageIds.map(async (image) => {
          const imageId = typeof image === 'string' ? image : image._id
          console.log('id', imageId);
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
  // Kiểm tra xem khách sạn có trong danh sách yêu thích không
  useEffect(() => {
    setIsFavorite(favorites.some((hotel) => hotel._id === id));
  }, [favorites, id]);

  useEffect(() => {
    const fetchHotel = async () => {
      if (data) {
        const hotelWithImage = await fetchHotelImages(data);
        setHotel(hotelWithImage);
      }
    };
    fetchHotel();
  }, [data]);

  useEffect(() => {
    if (data && options.room && days) {
      const calculatedPrice = days * data.cheapestPrice * options.room;
      // Làm tròn số để tránh số thập phân dài
      const roundedPrice = Math.round(calculatedPrice);
      setTotalPrice(roundedPrice);
      localStorage.setItem("totalprice", roundedPrice.toString());
    }
  }, [days, data, options]);


  useEffect(() => {
    setIsFavorite(favorites.some((hotel) => hotel._id === id));
  }, [favorites, id]);

  const handleFavoriteClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        // Xóa khỏi danh sách yêu thích
        await axios.delete(`/favorites/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        dispatch({ type: "REMOVE_FAVORITE", payload: id });
        toast.info(' Bạn đã xóa khỏi trang yêu thích', {
        });
      } else {
        // Thêm vào danh sách yêu thích
        await axios.post(
          "/favorites",
          { hotelId: id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        dispatch({ type: "ADD_FAVORITE", payload: { _id: id } });
        toast.info("Bạn đã thêm vào trang yêu thích!")
      }
      setIsFavorite(!isFavorite); // Thay đổi trạng thái của `isFavorite`
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };


  const handleClick = () => {
    if (user) {
      setOpenModal(true);
    } else {
      navigate("/login");
    }
  };
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
  return (
    <div>
      <Navbar />
      <Header type="list" />
      {loading ? (
        "loading"
      ) : (
        <div className="hotelContainer">
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
          <div className="hotelWrapper">
            <div className="actions">
              <button onClick={handleFavoriteClick} className="favoriteicon">
                <FontAwesomeIcon icon={faHeart} color={isFavorite ? "red" : "grey"} />
              </button>

            </div>
            <h1 className="hotelTitle">{data.name}</h1>
            <div className="hotelAddress">
              <FontAwesomeIcon icon={faLocationDot} />
              <span>{data.address}</span>
            </div>
            <span className="hotelDistance">
              Vị trí tuyệt vời – {data.distance}m từ trung tâm
            </span>
            <span className="hotelPriceHighlight">
              Đặt phòng trên {data.cheapestPrice} VND tại khách sạn này và nhận một Taxi sân bay miễn phí
            </span>
            <div className="hotelDetails">
              <div className="hotelDetailsTexts">
                <h1 className="hotelTitle">{data.title}</h1>
                <p className="hotelDesc">{data.desc}</p>
              </div>
            </div>
            <div className="Containerbooking">

              <div className="hotelImages">
                {hotel && hotel.images && hotel.images.length > 0 && (
                  <div className="hotelImgList">
                    {showAllImages ? (
                      hotel.images.map((imageUrl, index) => (
                        <div className="hotelImgWrapper" key={index} onClick={() => handleOpen(index)}>
                          <img src={imageUrl} alt={`hotel-${index}`} className="hotelImg" />
                        </div>
                      ))
                    ) : (
                      <>
                        {hotel.images.slice(0, 4).map((imageUrl, index) => (
                          <div className="hotelImgWrapper" key={index} onClick={() => handleOpen(index)}>
                            <img src={imageUrl} alt={`hotel-${index}`} className="hotelImg" />
                          </div>
                        ))}
                        {hotel.images.length > 4 && (
                          <div className="hotelImgWrapper showMoreButton" onClick={() => setShowAllImages(true)}  >
                            + {hotel.images.length - 4}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="hotelDetailsPrice">
                <h1>Hoàn hảo cho {days}-kỳ nghỉ đêm!</h1>
                <span>
                  Tọa lạc tại trung tâm thực sự của Vaa, khách sạn này có một Điểm vị trí xuất sắc 9,8!
                </span>
                <h2>
                  <b>{totalprice.toLocaleString('vi-VN')} VND</b> ({days} đêm)
                </h2>
                <button onClick={handleClick}>Đặt chỗ hoặc Đặt ngay!</button>
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
          <Comment />
          <MailList />
          <Footer />
        </div>
      )}
      {openModal && <Reserve setOpen={setOpenModal} hotelId={id} />}
    </div>
  );
};

export default Hotel;