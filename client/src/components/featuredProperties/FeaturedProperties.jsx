import { useRef } from "react";
import { useEffect } from "react";
import useFetch from "../../hooks/useFetch";
import "./featuredProperties.css";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { SearchContext } from "../../context/SearchContext";

const FeaturedProperties = () => {
  const { data, loading, error } = useFetch("/hotels/features");
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);

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

  const scrollLeft = () => {
    scrollRef.current.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollLeft = scrollRef.current.scrollLeft;
      setIsAtStart(scrollLeft === 0);
    };

    const currentRef = scrollRef.current;
    currentRef.addEventListener("scroll", handleScroll);

    return () => {
      currentRef.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (

    <div className="fpContainer">
      {!isAtStart && (
        <button className="fpArrow left" onClick={scrollLeft}>
          &#8249;
        </button>
      )}

      <div className="fp" ref={scrollRef}>
        {console.log(data)}
        {loading ? (
          "Loading"
        ) : error ? (
          <div>Error: {error.message}</div>
        ) : (
          <>
            {data.map((item) => (
              <div className="fpItem" key={item._id} onClick={() => handleCityClick(item.city)}>
                  {item.imageIds && item.imageIds.length > 0 ? (
                    <img
                      src={item.imageIds[0].url}
                      alt={item.name}
                      className="fpImg"
                    />
                  ) : (
                    <img
                      src="/images/placeholder.png"
                      alt={item.name}
                      className="fpImg"
                    />
                  )}
                <span className="fpName">{item.name}</span>
                {item.rating && item.numReviews && (
                  <div className="fpRating">
                     <img src="/assets/icons/review.png" alt="Rating Icon" className="ratingIcon" />
                    <span className="fpRatingValue">{item.rating.toFixed(1)}/5</span>
                    <span className="fpRatingCount">({item.numReviews})</span>
                  </div>
                )}


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
      <button className="fpArrow right" onClick={scrollRight}>
        &#8250;
      </button>
    </div>
  );
};

export default FeaturedProperties;
