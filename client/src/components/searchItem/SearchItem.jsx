import { Link } from "react-router-dom";
import "./searchItem.css";

const SearchItem = ({ item }) => {
  return (
    <div className="searchItem">
      {item.imageIds && item.imageIds.length > 0 ? (
        <img
          src={item.imageIds[0].url}
          alt={item.name}
          className="siImg"
        />
      ) : (
        <img
          src="/images/placeholder.png"
          alt={item.name}
          className="siImg"
        />
      )}
      <div className="siDesc">
        <h1 className="siTitle">{item.name}</h1>
        <span className="siDistance">{item.distance}m từ trung tâm</span>
        <span className="siTaxiOp">Xe đưa đón sân bay miễn phí</span>
        <span className="siSubtitle">
          Căn hộ studio có máy lạnh
        </span>
        <span className="siFeatures">{item.desc}</span>
        <span className="siCancelOp">Hủy miễn phí</span>
        <span className="siCancelOpSubtitle">
          Bạn có thể hủy sau, hãy giữ mức giá tuyệt vời này hôm nay!
        </span>
      </div>
      <div className="siDetails">
        {item.rating && <div className="siRating">
          <span>Excellent</span>
          <button>{item.rating}</button>
        </div>}
        <div className="siDetailTexts">
          <span className="siPrice">{item.cheapestPrice.toLocaleString('vi-VN')} VND</span>
          <span className="siTaxOp">Đã bao gồm thuế và phí</span>
          <span className="siPricePerNight">/đêm</span>
          <Link to={`/hotels/${item._id}`}>
            <button className="siCheckButton">Xem tình trạng phòng</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchItem;
