import {
  faBed,
  faCalendarDays,
  faCar,
  faPerson,
  faPlane,
  faTaxi,
  faSearch,
  faHistory,
  faLocationDot,
  faHotel,
  faBuilding,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./header.css";
import { DateRange } from "react-date-range";
import { useContext, useState, useEffect, useRef } from "react";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";

const Header = ({ type }) => {
  const [destination, setDestination] = useState("");
  const [openDate, setOpenDate] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [popularLocations, setPopularLocations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

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

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { dispatch } = useContext(SearchContext);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch city suggestions when user types in the search input
  const fetchSuggestions = async (query) => {
    try {
      const response = await axios.get(`/hotels/cities?query=${query}`);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Fetch popular locations when input is focused with empty query
  const fetchPopularLocations = async () => {
    try {
      const response = await axios.get(`/hotels/cities?query=`);
      setPopularLocations(response.data);
    } catch (error) {
      console.error("Error fetching popular locations:", error);
    }
  };

  useEffect(() => {
    fetchPopularLocations();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    if (value.length > 0) {
      fetchSuggestions(value);
      setShowSuggestions(true);
      setShowRecentSearches(false);
    } else {
      setShowSuggestions(false);
      setShowRecentSearches(true);
    }
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    if (destination.length === 0) {
      setShowRecentSearches(true);
      setShowSuggestions(false);
    } else {
      fetchSuggestions(destination);
      setShowSuggestions(true);
      setShowRecentSearches(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setDestination(suggestion.name);
    setShowDropdown(false);
  };

  const handleRecentSearchClick = (search) => {
    setDestination(search);
    setShowDropdown(false);
  };

  const handleOption = (name, operation) => {
    setOptions((prev) => {
      return {
        ...prev,
        [name]: operation === "i" ? options[name] + 1 : options[name] - 1,
      };
    });
  };

  const saveRecentSearch = (searchTerm) => {
    if (searchTerm.trim() === "") return;
    
    // Add to recent searches, avoiding duplicates and keeping only the last 5
    const updatedSearches = [
      searchTerm,
      ...recentSearches.filter(search => search !== searchTerm)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  const handleSearch = () => {
    saveRecentSearch(destination);
    dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options } });
    navigate("/hotels", { state: { destination, dates, options } });
  };

  const handleRegister = () => {
    navigate("/singUp");
  };

  // Helper function to get the appropriate icon for a suggestion
  const getSuggestionIcon = (category) => {
    switch (category) {
      case 'city':
        return faLocationDot;
      case 'type':
        return faHotel;
      default:
        return faBed;
    }
  };

  return (
    <div className="header">
      <div
        className={
          type === "list" ? "headerContainer listMode" : "headerContainer"
        }
      >
        <div className="headerList">
          <div className="headerListItem active">
            <FontAwesomeIcon icon={faBed} />
            <span>Nhà Ở</span>
          </div>
          <div className="headerListItem">
            <FontAwesomeIcon icon={faPlane} />
            <span>Chuyến bay</span>
          </div>
          <div className="headerListItem">
            <FontAwesomeIcon icon={faCar} />
            <span>Thuê Xe</span>
          </div>
          <div className="headerListItem">
            <FontAwesomeIcon icon={faTaxi} />
            <span>Sân bay</span>
          </div>
        </div>
        {type !== "list" && (

          <>
            <h1 className="headerTitle">
              Cả đời nhận ưu đãi? Thật thông minh.
            </h1>
            <p className="headerDesc">
              Nhận phần thưởng cho chuyến du lịch của bạn – mở khóa giảm giá ngay lập tức 10% hoặc
              hơn với tài khoản Secondbooking miễn phí
            </p>
            {!user && (
              <button className="headerBtn" onClick={handleRegister}>
                Đăng nhập / Đăng ký
              </button>
            )}

            <div className="headerSearch">
              <div className="headerSearchItem">
                <FontAwesomeIcon icon={faBed} className="headerIcon" />
                <div className="searchInputContainer">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Thành phố, địa điểm hoặc tên khách sạn"
                    className="headerSearchInput"
                    value={destination}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                  />
                  
                  {/* Dropdown with recent searches and popular locations */}
                  {showDropdown && (
                    <div className="searchDropdown" ref={suggestionsRef}>
                      {/* Header for dropdown */}
                      <div className="dropdownHeader">
                        <span>Kết quả tìm kiếm cuối cùng</span>
                        <FontAwesomeIcon icon={faHistory} className="dropdownHeaderIcon" />
                      </div>
                      
                      {/* Recent searches section */}
                      {showRecentSearches && recentSearches.length > 0 && (
                        <div className="recentSearchesContainer">
                          {recentSearches.map((search, index) => (
                            <div 
                              key={index} 
                              className="searchResultItem"
                              onClick={() => handleRecentSearchClick(search)}
                            >
                              <div className="searchResultItemLeft">
                                <FontAwesomeIcon icon={faSearch} className="searchResultIcon" />
                                <span className="searchResultText">{search}</span>
                              </div>
                              <div className="searchResultItemRight">
                                <span className="searchResultType">Khách sạn</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Search suggestions section */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="suggestionsContainer">
                          {suggestions.map((suggestion, index) => (
                            <div 
                              key={index} 
                              className="searchResultItem"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <div className="searchResultItemLeft">
                                <FontAwesomeIcon 
                                  icon={getSuggestionIcon(suggestion.category)} 
                                  className="searchResultIcon" 
                                />
                                <span className="searchResultText">{suggestion.name}</span>
                              </div>
                              <div className="searchResultItemRight">
                                <span className="searchResultCount">
                                  {suggestion.count} khách sạn
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Popular locations section - shown when input is empty */}
                      {showRecentSearches && popularLocations.length > 0 && (
                        <div className="popularLocationsContainer">
                          <div className="popularLocationsHeader">
                            <span>Địa điểm</span>
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="dropdownHeaderIcon" />
                          </div>
                          {popularLocations.map((location, index) => (
                            <div 
                              key={index} 
                              className="searchResultItem"
                              onClick={() => handleSuggestionClick(location)}
                            >
                              <div className="searchResultItemLeft">
                                <FontAwesomeIcon 
                                  icon={faLocationDot} 
                                  className="searchResultIcon" 
                                />
                                <span className="searchResultText">{location.name}</span>
                              </div>
                              <div className="searchResultItemRight">
                                <span className="searchResultCount">
                                  {location.count} khách sạn
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                        <span className="optionCounterNumber">
                          {options.adult}
                        </span>
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
                        <span className="optionCounterNumber">
                          {options.room}
                        </span>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
