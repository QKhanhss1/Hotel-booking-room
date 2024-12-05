import useFetch from "../../hooks/useFetch";
import "./featuredProperties.css";
import { Link } from "react-router-dom";

const FeaturedProperties = () => {
  const { data, loading, error } = useFetch("http://localhost:8800/api/hotels/features");

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
            <div className="fpItem" key={item._id}>
            <Link to={`/hotels/${item._id}`}>
              <img
                src={`http://localhost:8800/api/images/${item.photos}`}
                alt=""
                className="fpImg"
              />
              </Link>
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
