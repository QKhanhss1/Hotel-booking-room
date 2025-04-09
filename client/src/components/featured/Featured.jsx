import { useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { SearchContext } from "../../context/SearchContext";
import axios from "axios";
import "./featured.css";

const Featured = () => {
  const navigate = useNavigate();
  const { dispatch } = useContext(SearchContext);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const [dates, setDates] = useState([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      key: "selection",
    },
  ]);
  
  const [options, setOptions] = useState({
    adult: 1,
    children: 0,
    room: 1,
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/hotels/cities/featured");
        setCities(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  const handleCityClick = (destination) => {
    dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options } });
    navigate("/hotels", { state: { destination, dates, options } });
  };

  // Lấy 6 thành phố để hiển thị trước
  const displayedCities = showAll ? cities : cities.slice(0, 6);

  return (
    <div className="featured">
      <h2 className="featuredTitle">Điểm đến hot nhất do Secondbooking đề xuất</h2>
      
      {loading ? (
        <div className="loadingContainer">
          <div className="loadingSpinner"></div>
        </div>
      ) : error ? (
        <div className="errorMessage">
          Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
        </div>
      ) : (
        <>
          <div className="featuredContainer">
            {displayedCities.map((city, index) => (
              <div className="featuredItem" key={index} onClick={() => handleCityClick(city.name)}>
                <img
                  src={city.imageUrl || `https://source.unsplash.com/300x300/?${city.name}`}
                  alt={city.name}
                  className="featuredImg"
                />
                <div className="featuredTitles">
                  <h1>{city.name}</h1>
                  <h2 className="cityHotelCount">Có {city.count} khách sạn</h2>
                </div>
              </div>
            ))}
          </div>
          
          {cities.length > 6 && (
            <button 
              className="viewMoreButton" 
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Thu gọn" : "Xem thêm điểm đến"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Featured;
