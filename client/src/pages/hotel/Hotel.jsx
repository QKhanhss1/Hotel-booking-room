import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import Comment from "../../components/comments/comment";
import Rating from "../../components/rating-hotel/rating";
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

const Hotel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split("/")[2];
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
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


  console.log('days:', days)
  // Kiểm tra xem khách sạn có trong danh sách yêu thích không
  useEffect(() => {
    setIsFavorite(favorites.some((hotel) => hotel._id === id));
  }, [favorites, id]);


  useEffect(() => {
    if (data && options.room && days) {
      const calculatedPrice = days * data.cheapestPrice * options.room;
      setTotalPrice(calculatedPrice);
      localStorage.setItem("totalprice", calculatedPrice);  // Store the price in localStorage
    }
  }, [days, data, options]);


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
      } else {
        // Thêm vào danh sách yêu thích
        await axios.post(
          "/favorites",
          { hotelId: id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        dispatch({ type: "ADD_FAVORITE", payload: { _id: id } });
      }
      setIsFavorite(!isFavorite); // Thay đổi trạng thái của `isFavorite`
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    let newSlideNumber;

    if (direction === "l") {
      newSlideNumber = slideNumber === 0 ? 5 : slideNumber - 1;
    } else {
      newSlideNumber = slideNumber === 5 ? 0 : slideNumber + 1;
    }

    setSlideNumber(newSlideNumber);
  };

  const handleClick = () => {
    if (user) {
      setOpenModal(true);
    } else {
      navigate("/login");
    }
  };

  return (
    <div>
      <Navbar />
      <Header type="list" />
      {loading ? (
        "loading"
      ) : (
        <div className="hotelContainer">
          {open && (
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
                  src={data.photos[slideNumber]}
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
              Excellent location – {data.distance}m from center
            </span>
            <span className="hotelPriceHighlight">
              Book a stay over ${data.cheapestPrice} at this property and get a
              free airport taxi
            </span>
            <div className="hotelImages">
              <div className="hotelImgWrapper">
                <img
                  onClick={() => handleOpen()}
                  src={`http://localhost:8800/api/images/${data.photos}`}
                  alt=""
                  className="hotelImg"
                />
              </div>
            </div>
            <div className="hotelDetails">
              <div className="hotelDetailsTexts">
                <h1 className="hotelTitle">{data.title}</h1>
                <p className="hotelDesc">{data.desc}</p>
              </div>
              <div className="hotelDetailsPrice">
                <h1>Perfect for a {days}-night stay!</h1>
                <span>
                  Located in the real heart of Krakow, this property has an
                  excellent location score of 9.8!
                </span>
                <h2>
                  <b>${totalprice}</b> ({days} nights)
                </h2>
                <button onClick={handleClick}>Reserve or Book Now!</button>
              </div>
            </div>
          </div>
          <Rating />
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