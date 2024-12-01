import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBed, faPerson, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { format } from "date-fns"; 
import { DateRange } from "react-date-range"; 
import { SearchContext } from "../../context/SearchContext";

import "./hotelTypes.css";

const HotelTypes = () => {
  const { dispatch } = useContext(SearchContext);
  const [destination, setDestination] = useState(""); 
  const [openDate, setOpenDate] = useState(false); 
  const [dates, setDates] = useState([ 
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [openOptions, setOpenOptions] = useState(false); 
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

  const handleOption = (name, operation) => {
    setOptions((prev) => {
      return {
        ...prev,
        [name]: operation === "i" ? options[name] + 1 : options[name] - 1,
      };
    });
  };

  const handleSearch = () => {
    dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options } }); // Phú phải có 1 cái dispatch lấy NEW SEARCH không thì nó sẽ lấy thằng search gần nhất
    navigate("/hotels", {
      state: { destination, dates, options }, 
    });
  };
  const handleCityClick = (destination) => {
    dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options } });
    navigate("/hotels", { state: { destination, dates, options } });
  };
  return (
    <div className="hotelTypes">
      <div className="headerSearch">
        <div className="headerSearchItem">
          <FontAwesomeIcon icon={faBed} className="headerIcon" />
          <input
            type="text"
            placeholder="Nơi bạn muốn đi?"
            className="headerSearchInput"
            onChange={(e) => setDestination(e.target.value)}
            value={destination}
          />
        </div>

        <div className="headerSearchItem">
          <FontAwesomeIcon icon={faCalendarDays} className="headerIcon" />
          <span
            onClick={() => setOpenDate(!openDate)}
            className="headerSearchText"
          >{`${format(dates[0].startDate, "MM/dd/yyyy")} to ${format(
            dates[0].endDate,
            "MM/dd/yyyy"
          )}`}</span>
          {openDate && (
            <DateRange
              editableDateInputs={true}
              onChange={(item) => setDates([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dates}
              className="date"
              minDate={new Date()}
            />
          )}
        </div>

        <div className="headerSearchItem">
          <FontAwesomeIcon icon={faPerson} className="headerIcon" />
          <span
            onClick={() => setOpenOptions(!openOptions)}
            className="headerSearchText"
          >{`${options.adult} adult · ${options.children} children · ${options.room} room`}</span>
          {openOptions && (
            <div className="options">
              <div className="optionItem">
                <span className="optionText">Người lớn</span>
                <div className="optionCounter">
                  <button
                    disabled={options.adult <= 1}
                    className="optionCounterButton"
                    onClick={() => handleOption("adult", "d")}
                  >
                    -
                  </button>
                  <span className="optionCounterNumber">{options.adult}</span>
                  <button
                    className="optionCounterButton"
                    onClick={() => handleOption("adult", "i")}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="optionItem">
                <span className="optionText">Trẻ em</span>
                <div className="optionCounter">
                  <button
                    disabled={options.children <= 0}
                    className="optionCounterButton"
                    onClick={() => handleOption("children", "d")}
                  >
                    -
                  </button>
                  <span className="optionCounterNumber">
                    {options.children}
                  </span>
                  <button
                    className="optionCounterButton"
                    onClick={() => handleOption("children", "i")}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="optionItem">
                <span className="optionText">Phòng</span>
                <div className="optionCounter">
                  <button
                    disabled={options.room <= 1}
                    className="optionCounterButton"
                    onClick={() => handleOption("room", "d")}
                  >
                    -
                  </button>
                  <span className="optionCounterNumber">{options.room}</span>
                  <button
                    className="optionCounterButton"
                    onClick={() => handleOption("room", "i")}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="headerSearchItem">
          <button className="headerBtn" onClick={handleSearch}>
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Hiển thị các khách sạn */}
      <div className="hotelList">
        {loading
          ? "Loading..."
          : error
          ? "Có lỗi xảy ra"
          : data &&
            data.map((hotel) => (
              <div key={hotel._id} className="hotelItem" onClick={() => handleCityClick(hotel.city)}>
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
                  <span>{hotel.rating}</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default HotelTypes;
