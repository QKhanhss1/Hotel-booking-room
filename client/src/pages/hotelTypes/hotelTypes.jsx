import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { SearchContext } from "../../context/SearchContext";
import Header from "../../components/header/Header"; // Import Header component

import "./hotelTypes.css";
import Navbar from "../../components/navbar/Navbar";

const HotelTypes = () => {
  const { dispatch } = useContext(SearchContext);
  const [dates, setDates] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [options, setOptions] = useState({
    adult: 1,
    children: 0,
    room: 1,
  });

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const type = params.get("type");

  const { data, loading, error } = useFetch(`/hotels/type/${type}`);
  const navigate = useNavigate();

  const handleCityClick = (destination) => {
    dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options  } });
    navigate("/hotels", { state: {  destination, dates, options   } });
  };

  return (
    <div>
      <Navbar />
      <Header />
      <div className="hotelTypes">
        <div className="hotelList">
          {loading
            ? "Loading..."
            : error
              ? "Có lỗi xảy ra"
              : data &&
              data.map((hotel) => (
                <div
                  key={hotel._id}
                  className="hotelItem"
                  onClick={() => handleCityClick(hotel.city)}
                >
                  <div className="hotelImages">
                    <div className="hotelImgWrapper">
                      <img
                        src={`http://localhost:8800/api/images/${hotel.photos}`}
                        alt={hotel.name}
                        className="hotelImg"
                      />
                    </div>
                  </div>
                  <div className="hotelTitles">
                    <h2>{hotel.name}</h2>
                    <p>{hotel.address}</p>
                    <span>{hotel.city}</span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default HotelTypes;
