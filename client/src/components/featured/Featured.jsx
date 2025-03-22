import useFetch from "../../hooks/useFetch";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { SearchContext } from "../../context/SearchContext";

import "./featured.css";

const Featured = () => {
  const navigate = useNavigate();

  
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
  const { data, loading, error } = useFetch(
    "/hotels/countByCity?cities=Nha Trang,Đà Nẵng,Hội An"
  );
  const handleCityClick = (destination) => {
    dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options } });
    navigate("/hotels", { state: { destination, dates, options } });
  };

  return (
    <div className="featured">
      {loading ? (
        "Loading please wait"
      ) : (
        <>
          <div className="featuredItem" onClick={() => handleCityClick("Nha Trang")}>
            <img
              src="https://res.cloudinary.com/djfdpoafb/image/upload/v1742632477/photo0jpg_m6mhev.jpg"
              alt=""
              className="featuredImg"
            />
            <div className="featuredTitles">
              <h1>Nha Trang</h1>
              <h2>{data[0]} Khách sạn</h2>
            </div>
          </div>

          <div className="featuredItem" onClick={() => handleCityClick("Đà Nẵng")}>
            <img
              src="https://res.cloudinary.com/djfdpoafb/image/upload/v1742632668/da-nang_sxxh6x.jpg"
              alt=""
              className="featuredImg"
            />
            <div className="featuredTitles">
              <h1>Đà Nẵng</h1>
              <h2>{data[1]} Khách sạn</h2>
            </div>
          </div>
          <div className="featuredItem"onClick={() => handleCityClick("Hội An")}>
            <img
              src="https://res.cloudinary.com/djfdpoafb/image/upload/v1742632677/shutterstock_1506184586_resize_oueflj.jpg"
              alt=""
              className="featuredImg"
            />
            <div className="featuredTitles">
              <h1>Hội An</h1>
              <h2>{data[2]} Khách sạn</h2>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Featured;
