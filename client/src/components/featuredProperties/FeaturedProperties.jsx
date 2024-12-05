import useFetch from "../../hooks/useFetch";
import "./featuredProperties.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { SearchContext } from "../../context/SearchContext";

const FeaturedProperties = () => {
  const { data, loading, error } = useFetch("http://localhost:8800/api/hotels/features");
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
  const handleCityClick = (destination) => {
    dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options } });
    navigate("/hotels", { state: { destination, dates, options } });
  };
  return (

    <div className="fp">
    {console.log(data)}
      {loading ? (
        "Loading"
      ) : error ? (
        <div>Error: {error.message}</div>  // Hiển thị lỗi nếu có
      ) : (
        <>
          {data.map((item) => (
            <div className="fpItem" key={item._id} onClick={()=> handleCityClick(item.city)}>
            
              <img
                src={`http://localhost:8800/api/images/${item.photos}`}
                alt=""
                className="fpImg"
              />

              <span className="fpName">{item.name}</span>
              <span className="fpCity">{item.city}</span>
              <span className="fpPrice">Giá khoảng {item.cheapestPrice} VND</span>
              {/* {item.rating && <div className="fpRating">
                <button>{item.rating}</button>
                <span>Excellent</span>
              </div>} */}
              
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default FeaturedProperties;
