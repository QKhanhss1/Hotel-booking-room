import "./list.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import { SearchContext } from "../../context/SearchContext";
import { useState, useContext, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { DateRange } from "react-date-range";
import SearchItem from "../../components/searchItem/SearchItem";
import useFetch from "../../hooks/useFetch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronDown, 
  faChevronUp, 
  faStar, 
  faTimesCircle,
  // faSpinner
} from "@fortawesome/free-solid-svg-icons";

const List = () => {
  // const { destination, dates, options, dispatch } = useContext(SearchContext);
  const { destination, dates = [{ startDate: new Date(), endDate: new Date(), key: "selection" }], options, dispatch } = useContext(SearchContext);
  const [openDate, setOpenDate] = useState(false);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(999999999);
  const [sortOption, setSortOption] = useState("recommended");
  const [filteredData, setFilteredData] = useState([]);
  const [recentFilters, setRecentFilters] = useState([]);
  const [openFilters, setOpenFilters] = useState({
    ratings: true,
    propertyType: true,
    amenities: true,
    roomAmenities: true
  });

  const defaultDates = [{ startDate: new Date(), endDate: new Date(), key: "selection" }];
  const validDates =
  dates && dates.length > 0 && dates[0]?.startDate && dates[0]?.endDate
    ? [
        {
          startDate: new Date(dates[0].startDate), 
          endDate: new Date(dates[0].endDate), 
          key: "selection"
        }
      ]
    : defaultDates;
  
  const isDateValid = () => {
    if (!dates || dates.length === 0 || !dates[0].startDate || !dates[0].endDate) {
      return false;
    }
  
    const startDate = new Date(dates[0].startDate);
    const endDate = new Date(dates[0].endDate);
  
    // Kiểm tra nếu ngày hợp lệ
    return (
      !isNaN(startDate.getTime()) && // Kiểm tra ngày hợp lệ
      !isNaN(endDate.getTime()) &&
      startDate.getTime() < endDate.getTime()
    );
  };
  

  // Filter options
  const [selectedFilters, setSelectedFilters] = useState({
    ratings: [],
    propertyTypes: [],
    amenities: [],
    roomAmenities: []
  });

  // Thêm state để lưu số lượng cho mỗi bộ lọc
  const [filterCounts, setFilterCounts] = useState({
    ratings: {},
    propertyTypes: {},
    amenities: {},
    roomAmenities: {}
  });

  // Thêm state để kiểm soát việc hiển thị tiện nghi
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllRoomAmenities, setShowAllRoomAmenities] = useState(false);

  // Load recent filters from localStorage
  useEffect(() => {
    const savedRecentFilters = localStorage.getItem("recentFilters");
    if (savedRecentFilters) {
      try {
        setRecentFilters(JSON.parse(savedRecentFilters));
      } catch (error) {
        console.error("Error loading recent filters:", error);
      }
    }
  }, []);

  // Property types
  const propertyTypes = [
    { id: "hotel", name: "Khách sạn" },
    { id: "apartment", name: "Căn hộ" },
    { id: "resort", name: "Khu nghỉ dưỡng" },
    { id: "villa", name: "Biệt thự" },
    { id: "cabin", name: "Nhà gỗ" }
  ];

  // Hotel amenities - Cập nhật theo dữ liệu từ admin
  const hotelAmenities = [
    { id: "laundry", name: "Dịch vụ giặt ủi" },
    { id: "pool", name: "Hồ bơi" },
    { id: "restaurant", name: "Nhà hàng" },
    { id: "parking", name: "Bãi gửi xe" },
    { id: "spa", name: "Spa" },
    { id: "gym", name: "Phòng tập gym" },
    { id: "meeting", name: "Phòng hội nghị" },
    { id: "earlyCheckin", name: "Nhận phòng sớm" },
    { id: "nearBeach", name: "Gần biển" },
    { id: "childFriendly", name: "Tiện nghi cho trẻ" },
    { id: "petFriendly", name: "Cho phép vật nuôi" }
  ];

  // Room amenities - Cập nhật theo dữ liệu từ admin
  const roomAmenities = [
    { id: "ac", name: "Máy lạnh" },
    { id: "family", name: "Phòng gia đình" },
    { id: "no-smoking", name: "Phòng cấm hút thuốc" },
    { id: "hairdryer", name: "Máy sấy tóc" },
    { id: "fridge", name: "Tủ lạnh" },
    { id: "bathtub", name: "Bồn tắm" },
    { id: "connecting", name: "Phòng liên thông" },
    { id: "kitchen", name: "Nhà bếp" },
    { id: "heater", name: "Máy sưởi" }
  ];

  // Star ratings
  const ratings = [
    { value: 5, label: "5 sao" },
    { value: 4, label: "4 sao" },
    { value: 3, label: "3 sao" },
    { value: 2, label: "2 sao" },
    { value: 1, label: "1 sao" }
  ];

  // Url parameters to be used for API query
  const [queryParams, setQueryParams] = useState({
    min: min,
    max: max,
    city: destination || "",
    name: ""
  });

  useEffect(() => {
    // Check if the search is for a hotel name instead of a city
    const selectedSuggestion = sessionStorage.getItem('selectedSuggestion');
    if (selectedSuggestion) {
      try {
        const suggestionData = JSON.parse(selectedSuggestion);
        if (suggestionData.category === 'hotel') {
          // Set name parameter instead of city for hotel name search
          setQueryParams(prev => ({
            ...prev,
            city: "",
            name: destination || ""
          }));
        } else {
          // For city or type searches, use city parameter
          setQueryParams(prev => ({
            ...prev,
            city: destination || "",
            name: ""
          }));
        }
        // Clear the suggestion data after using it
        sessionStorage.removeItem('selectedSuggestion');
      } catch (error) {
        console.error("Error parsing selected suggestion:", error);
        // Fallback to standard city search
        setQueryParams(prev => ({
          ...prev,
          city: destination || "",
          name: ""
        }));
      }
    } else {
      // Standard search, assume it's a city
      setQueryParams(prev => ({
        ...prev,
        city: destination || "",
        name: ""
      }));
    }
  }, [destination]);

  // Use the useFetch hook with queryParams
  const { data, loading, error, reFetch } = useFetch(
    `/hotels?min=${queryParams.min}&max=${queryParams.max}${queryParams.city ? `&city=${queryParams.city}` : ''}${queryParams.name ? `&name=${queryParams.name}` : ''}`
  );

  // Update the fetch when queryParams change
  useEffect(() => {
    reFetch();
  }, [queryParams]);

  // Tính toán số lượng cho mỗi bộ lọc
  const calculateFilterCounts = useCallback((items) => {
    if (!items || !Array.isArray(items)) return;

    const counts = {
      ratings: {},
      propertyTypes: {},
      amenities: {},
      roomAmenities: {}
    };

    // Khởi tạo số lượng ban đầu là 0 cho tất cả tiện nghi phòng
    roomAmenities.forEach(amenity => {
      counts.roomAmenities[amenity.id] = 0;
    });

    items.forEach(hotel => {
      // Log để debug cấu trúc dữ liệu
      console.log("Hotel data:", hotel);

      // Đếm số lượng theo rating
      if (hotel.rating) {
        const rating = Math.floor(hotel.rating);
        counts.ratings[rating] = (counts.ratings[rating] || 0) + 1;
      }

      // Đếm số lượng theo loại hình lưu trú
      if (hotel.type) {
        counts.propertyTypes[hotel.type] = (counts.propertyTypes[hotel.type] || 0) + 1;
      }

      // Đếm số lượng theo tiện nghi khách sạn
      if (hotel.amenities && Array.isArray(hotel.amenities)) {
        hotel.amenities.forEach(amenity => {
          counts.amenities[amenity] = (counts.amenities[amenity] || 0) + 1;
        });
      }

      // Đếm số lượng theo tiện nghi phòng
      if (hotel.rooms && Array.isArray(hotel.rooms)) {
        // Tạo Set để theo dõi tiện nghi đã được đếm cho khách sạn này
        const hotelAmenities = new Set();

        // Duyệt qua từng phòng của khách sạn
        hotel.rooms.forEach(room => {
          if (room && room.amenities && Array.isArray(room.amenities)) {
            room.amenities.forEach(amenity => {
              // Nếu tiện nghi này chưa được đếm cho khách sạn này
              if (!hotelAmenities.has(amenity)) {
                hotelAmenities.add(amenity);
                counts.roomAmenities[amenity] = (counts.roomAmenities[amenity] || 0) + 1;
                console.log(`Counting amenity ${amenity} for hotel ${hotel._id}`);
              }
            });
          }
        });
      }
    });

    console.log("Final room amenities counts:", counts.roomAmenities);
    setFilterCounts(counts);
  }, []);

    // Apply all filters and sorting
    const applyFilters = useCallback(() => {
      if (!data || !Array.isArray(data)) return;
  
      let result = [...data];
  
      // Apply rating filter
      if (selectedFilters.ratings.length > 0) {
        result = result.filter(item => 
          item.rating && selectedFilters.ratings.includes(Math.floor(item.rating))
        );
      }
  
      // Apply property type filter
      if (selectedFilters.propertyTypes.length > 0) {
        result = result.filter(item => 
          selectedFilters.propertyTypes.includes(item.type)
        );
      }
  
      // Apply hotel amenities filter
      if (selectedFilters.amenities.length > 0) {
        result = result.filter(item => 
          item.amenities && selectedFilters.amenities.every(amenity => 
            item.amenities.includes(amenity)
          )
        );
      }
  
      // Apply room amenities filter
      if (selectedFilters.roomAmenities.length > 0) {
        result = result.filter(item => {
          // Check if hotel has rooms with these amenities
          if (!item.rooms || !Array.isArray(item.rooms)) return false;
          
          return item.rooms.some(room => 
            room.amenities && selectedFilters.roomAmenities.every(amenity => 
              room.amenities.includes(amenity)
            )
          );
        });
      }
  
      // Apply sorting
      if (sortOption === "rating") {
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortOption === "price-asc") {
        result.sort((a, b) => (a.cheapestPrice || 0) - (b.cheapestPrice || 0));
      } else if (sortOption === "price-desc") {
        result.sort((a, b) => (b.cheapestPrice || 0) - (a.cheapestPrice || 0));
      }
  
      setFilteredData(result);
    }, [data, selectedFilters, sortOption]);

  // Cập nhật useEffect để tính toán số lượng khi data thay đổi
  useEffect(() => {
    console.log("Search data:", data);
    console.log("Search error:", error);
    
    if (data) {
      calculateFilterCounts(data);
      applyFilters();
    }
  }, [data, error, destination, min, max, selectedFilters, sortOption, calculateFilterCounts, applyFilters]);


  // // Apply all filters and sorting
  // const applyFilters = () => {
  //   if (!data || !Array.isArray(data)) return;

  //   let result = [...data];

  //   // Apply rating filter
  //   if (selectedFilters.ratings.length > 0) {
  //     result = result.filter(item => 
  //       item.rating && selectedFilters.ratings.includes(Math.floor(item.rating))
  //     );
  //   }

  //   // Apply property type filter
  //   if (selectedFilters.propertyTypes.length > 0) {
  //     result = result.filter(item => 
  //       selectedFilters.propertyTypes.includes(item.type)
  //     );
  //   }

  //   // Apply hotel amenities filter
  //   if (selectedFilters.amenities.length > 0) {
  //     result = result.filter(item => 
  //       item.amenities && selectedFilters.amenities.every(amenity => 
  //         item.amenities.includes(amenity)
  //       )
  //     );
  //   }

  //   // Apply room amenities filter
  //   if (selectedFilters.roomAmenities.length > 0) {
  //     result = result.filter(item => {
  //       // Check if hotel has rooms with these amenities
  //       if (!item.rooms || !Array.isArray(item.rooms)) return false;
        
  //       return item.rooms.some(room => 
  //         room.amenities && selectedFilters.roomAmenities.every(amenity => 
  //           room.amenities.includes(amenity)
  //         )
  //       );
  //     });
  //   }

  //   // Apply sorting
  //   if (sortOption === "rating") {
  //     result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  //   } else if (sortOption === "price-asc") {
  //     result.sort((a, b) => (a.cheapestPrice || 0) - (b.cheapestPrice || 0));
  //   } else if (sortOption === "price-desc") {
  //     result.sort((a, b) => (b.cheapestPrice || 0) - (a.cheapestPrice || 0));
  //   }

  //   setFilteredData(result);
  // };

  // Handle destination input change
  const handleDestinationChange = (e) => {
    dispatch({ type: "UPDATE_DESTINATION", payload: e.target.value });
    
    // Update search parameters based on input
    if (e.target.value) {
      // Since we're typing manually, assume we're searching by both name and city
      setQueryParams(prev => ({
        ...prev,
        city: e.target.value,
        name: e.target.value
      }));
    } else {
      setQueryParams(prev => ({
        ...prev,
        city: "",
        name: ""
      }));
    }
  };

  // Handle date range selection
  // const handleDateChange = (item) => {
  //   dispatch({ type: "UPDATE_DATES", payload: [item.selection] });
  // };
  const handleDateChange = (ranges) => {
    const { startDate, endDate } = ranges.selection;
  
    if (!startDate || !endDate || isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
      alert("Ngày không hợp lệ, vui lòng chọn lại.");
      return;
    }
  
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      alert("Ngày nhận phòng không thể lớn hơn ngày trả phòng.");
      return;
    }
  
    dispatch({
      type: "NEW_SEARCH",
      payload: { 
        destination, 
        dates: [{ startDate, endDate, key: "selection" }], 
        options 
      }
    });
  };
  
  

  // Handle search button click
  const handleSearch = () => {
    if (!dates?.length || !dates[0]?.startDate || !dates[0]?.endDate) {
      alert("Vui lòng chọn ngày nhận phòng trước khi tìm kiếm!");
      return;
    }
    // Check price range
    if (min > max) {
      alert("Giá tối thiểu không thể lớn hơn Giá tối đa");
      return;
    }
    
    setQueryParams({
      min: min,
      max: max,
      city: destination,
      name: destination // Also search by name
    });

  };

  // Toggle filter sections
  const toggleFilter = (section) => {
    setOpenFilters({
      ...openFilters,
      [section]: !openFilters[section]
    });
  };

  // Handle filter selection
  const handleFilterChange = (type, value) => {
    let updatedFilters = { ...selectedFilters };
    
    if (type === 'ratings') {
      if (updatedFilters.ratings.includes(value)) {
        updatedFilters.ratings = updatedFilters.ratings.filter(r => r !== value);
      } else {
        updatedFilters.ratings = [...updatedFilters.ratings, value];
      }
    } else if (type === 'propertyTypes') {
      if (updatedFilters.propertyTypes.includes(value)) {
        updatedFilters.propertyTypes = updatedFilters.propertyTypes.filter(pt => pt !== value);
      } else {
        updatedFilters.propertyTypes = [...updatedFilters.propertyTypes, value];
      }
    } else if (type === 'amenities') {
      if (updatedFilters.amenities.includes(value)) {
        updatedFilters.amenities = updatedFilters.amenities.filter(a => a !== value);
      } else {
        updatedFilters.amenities = [...updatedFilters.amenities, value];
      }
    } else if (type === 'roomAmenities') {
      if (updatedFilters.roomAmenities.includes(value)) {
        updatedFilters.roomAmenities = updatedFilters.roomAmenities.filter(ra => ra !== value);
      } else {
        updatedFilters.roomAmenities = [...updatedFilters.roomAmenities, value];
      }
    }

    setSelectedFilters(updatedFilters);
    
    // Add to recent filters if not already there
    let filterName = "";
    
    if (type === 'ratings') {
      filterName = `${value} sao`;
    } else if (type === 'propertyTypes') {
      filterName = propertyTypes.find(pt => pt.id === value)?.name || value;
    } else if (type === 'amenities') {
      filterName = hotelAmenities.find(a => a.id === value)?.name || value;
    } else if (type === 'roomAmenities') {
      filterName = roomAmenities.find(ra => ra.id === value)?.name || value;
    }
    
    if (!recentFilters.some(filter => filter.type === type && filter.value === value)) {
      const newRecentFilters = [
        { type, value, name: filterName },
        ...recentFilters
      ];
      setRecentFilters(newRecentFilters);
      localStorage.setItem("recentFilters", JSON.stringify(newRecentFilters));
    }
  };

  // Remove a filter
  const removeFilter = (type, value) => {
    let updatedFilters = { ...selectedFilters };
    
    if (type === 'ratings') {
      updatedFilters.ratings = updatedFilters.ratings.filter(r => r !== value);
    } else if (type === 'propertyTypes') {
      updatedFilters.propertyTypes = updatedFilters.propertyTypes.filter(pt => pt !== value);
    } else if (type === 'amenities') {
      updatedFilters.amenities = updatedFilters.amenities.filter(a => a !== value);
    } else if (type === 'roomAmenities') {
      updatedFilters.roomAmenities = updatedFilters.roomAmenities.filter(ra => ra !== value);
    }
    
    setSelectedFilters(updatedFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({
      ratings: [],
      propertyTypes: [],
      amenities: [],
      roomAmenities: []
    });
  };

  return (
    <div>
      <Navbar />
      <Header type="list" />
      <div className="listContainer">
        <div className="listWrapper">
          <div className="listSearch">
            <h1 className="lsTitle">Tìm kiếm</h1>
            
            {/* Destination input */}
            <div className="lsItem">
              <label>Nơi đến</label>
              <input
                value={destination}
                onChange={handleDestinationChange}
                type="text"
                placeholder="Nhập điểm đến của bạn"
              />
            </div>
            
            {/* Date selection */}
            <div className="lsItem">
              <label>Ngày nhận phòng</label>
              <span onClick={() => setOpenDate(!openDate)}>
                {/* {`${format(dates[0].startDate, "dd/MM/yyyy")} → ${format(dates[0].endDate, "dd/MM/yyyy")}`} */}
                {dates?.length > 0 && dates[0]?.startDate && dates[0]?.endDate
                  ? `${format(new Date(dates[0].startDate), "dd/MM/yyyy")} → ${format(new Date(dates[0].endDate), "dd/MM/yyyy")}`
                  : "Chọn ngày nhận phòng"}
              </span>
              {openDate && (
               <DateRange
               onChange={handleDateChange}
               minDate={new Date()}
               ranges={validDates}
               className="date"
             />
             
             
              )}
            </div>
            
            {/* Options */}
            <div className="lsItem">
              <label>Tùy chọn</label>
              <div className="lsOptions">
                <div className="lsOptionItem">
                  <span className="lsOptionText">
                    Giá tối thiểu
                    <small>mỗi đêm</small>
                  </span>
                  <input
                    type="number"
                    onChange={(e) => setMin(e.target.value)}
                    className="lsOptionInput"
                    min={0}
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">
                    Giá tối đa
                    <small>mỗi đêm</small>
                  </span>
                  <input
                    type="number"
                    onChange={(e) => setMax(e.target.value)}
                    className="lsOptionInput"
                    min={0}
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">Người lớn</span>
                  <input
                    type="number"
                    min={1}
                    className="lsOptionInput"
                    placeholder={options.adult}
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">Trẻ em</span>
                  <input
                    type="number"
                    min={0}
                    className="lsOptionInput"
                    placeholder={options.children}
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">Phòng</span>
                  <input
                    type="number"
                    min={1}
                    className="lsOptionInput"
                    placeholder={options.room}
                  />
                </div>
              </div>
            </div>
            
            {/* Search button */}
            <button onClick={handleSearch}>Tìm kiếm</button>
            
            {/* Recent filters */}
            {recentFilters.length > 0 && (
              <div className="recentFilters">
                <h2 className="lsTitle">Bộ lọc gần đây</h2>
                <div>
                  {recentFilters.map((filter, index) => (
                    <div 
                      key={index} 
                      className={`recentFilter ${
                        (filter.type === 'ratings' && selectedFilters.ratings.includes(filter.value)) ||
                        (filter.type === 'propertyTypes' && selectedFilters.propertyTypes.includes(filter.value)) ||
                        (filter.type === 'amenities' && selectedFilters.amenities.includes(filter.value)) ||
                        (filter.type === 'roomAmenities' && selectedFilters.roomAmenities.includes(filter.value))
                          ? 'active' 
                          : ''
                      }`}
                      onClick={() => handleFilterChange(filter.type, filter.value)}
                    >
                      {filter.name}
                      <span className="removeFilter" onClick={(e) => {
                        e.stopPropagation();
                        removeFilter(filter.type, filter.value);
                      }}>
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Star rating filter */}
            <div className="filterSection">
              <div 
                className={`filterTitle ${openFilters.ratings ? 'open' : ''}`}
                onClick={() => toggleFilter('ratings')}
              >
                Xếp hạng sao
                <FontAwesomeIcon icon={openFilters.ratings ? faChevronUp : faChevronDown} className="icon" />
              </div>
              <div className={`filterContent ${openFilters.ratings ? 'open' : ''}`}>
                {ratings.map((rating) => (
                  <div key={rating.value} className="filterItem">
                    <input
                      type="checkbox"
                      id={`rating-${rating.value}`}
                      checked={selectedFilters.ratings.includes(rating.value)}
                      onChange={() => handleFilterChange('ratings', rating.value)}
                      className="filterCheckbox"
                    />
                    <label htmlFor={`rating-${rating.value}`} className="filterItemLabel">
                      <div className="starRating">
                        {[...Array(rating.value)].map((_, i) => (
                          <FontAwesomeIcon key={i} icon={faStar} className="starIcon" />
                        ))}
                      </div>
                      {filterCounts.ratings[rating.value] > 0 && (
                        <span className="filterItemCount">({filterCounts.ratings[rating.value]})</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Property type filter */}
            <div className="filterSection">
              <div 
                className={`filterTitle ${openFilters.propertyType ? 'open' : ''}`}
                onClick={() => toggleFilter('propertyType')}
              >
                Loại hình lưu trú
                <FontAwesomeIcon icon={openFilters.propertyType ? faChevronUp : faChevronDown} className="icon" />
              </div>
              <div className={`filterContent ${openFilters.propertyType ? 'open' : ''}`}>
                {propertyTypes.map((type) => (
                  <div key={type.id} className="filterItem">
                    <input
                      type="checkbox"
                      id={`type-${type.id}`}
                      checked={selectedFilters.propertyTypes.includes(type.id)}
                      onChange={() => handleFilterChange('propertyTypes', type.id)}
                      className="filterCheckbox"
                    />
                    <label htmlFor={`type-${type.id}`} className="filterItemLabel">
                      {type.name}
                      {filterCounts.propertyTypes[type.id] > 0 && (
                        <span className="filterItemCount">({filterCounts.propertyTypes[type.id]})</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hotel amenities filter */}
            <div className="filterSection">
              <div 
                className={`filterTitle ${openFilters.amenities ? 'open' : ''}`}
                onClick={() => toggleFilter('amenities')}
              >
                Tiện nghi phổ biến
                <FontAwesomeIcon icon={openFilters.amenities ? faChevronUp : faChevronDown} className="icon" />
              </div>
              <div className={`filterContent ${openFilters.amenities ? 'open' : ''}`}>
                {hotelAmenities.slice(0, showAllAmenities ? hotelAmenities.length : 5).map((amenity) => (
                  <div key={amenity.id} className="filterItem">
                    <input
                      type="checkbox"
                      id={`amenity-${amenity.id}`}
                      checked={selectedFilters.amenities.includes(amenity.id)}
                      onChange={() => handleFilterChange('amenities', amenity.id)}
                      className="filterCheckbox"
                    />
                    <label htmlFor={`amenity-${amenity.id}`} className="filterItemLabel">
                      {amenity.name}
                      {filterCounts.amenities[amenity.id] > 0 && (
                        <span className="filterItemCount">({filterCounts.amenities[amenity.id]})</span>
                      )}
                    </label>
                  </div>
                ))}
                <div 
                  className="showMoreLess"
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                >
                  {showAllAmenities ? "Ẩn bớt" : "Xem tất cả"}
                </div>
              </div>
            </div>
            
            {/* Room amenities filter */}
            <div className="filterSection">
              <div 
                className={`filterTitle ${openFilters.roomAmenities ? 'open' : ''}`}
                onClick={() => toggleFilter('roomAmenities')}
              >
                Tiện nghi phòng
                <FontAwesomeIcon icon={openFilters.roomAmenities ? faChevronUp : faChevronDown} className="icon" />
              </div>
              <div className={`filterContent ${openFilters.roomAmenities ? 'open' : ''}`}>
                {roomAmenities.slice(0, showAllRoomAmenities ? roomAmenities.length : 5).map((amenity) => (
                  <div key={amenity.id} className="filterItem">
                    <input
                      type="checkbox"
                      id={`room-amenity-${amenity.id}`}
                      checked={selectedFilters.roomAmenities.includes(amenity.id)}
                      onChange={() => handleFilterChange('roomAmenities', amenity.id)}
                      className="filterCheckbox"
                    />
                    <label htmlFor={`room-amenity-${amenity.id}`} className="filterItemLabel">
                      {amenity.name}
                      <span className="filterItemCount">
                        {filterCounts.roomAmenities[amenity.id] > 0 && `(${filterCounts.roomAmenities[amenity.id]})`}
                      </span>
                    </label>
                  </div>
                ))}
                <div 
                  className="showMoreLess"
                  onClick={() => setShowAllRoomAmenities(!showAllRoomAmenities)}
                >
                  {showAllRoomAmenities ? "Ẩn bớt" : "Xem tất cả"}
                </div>
              </div>
            </div>
          </div>
          
          <div className="listResult">
          {!isDateValid() ? (
              <div className="noResults">
                <p>Vui lòng chọn ngày nhận phòng và trả phòng hợp lệ trước khi tìm kiếm khách sạn.</p>
              </div>
            ) : (
              <>
                {/* Sorting options */}
                {filteredData && filteredData.length > 0 && (
                <div className="sortOptions">
                  <span className="sortLabel">Sắp xếp theo:</span>
                  <button
                    className={`sortOption ${sortOption === 'recommended' ? 'active' : ''}`}
                    onClick={() => setSortOption('recommended')}
                  >
                    Đề xuất
                  </button>
                  <button
                    className={`sortOption ${sortOption === 'rating' ? 'active' : ''}`}
                    onClick={() => setSortOption('rating')}
                  >
                    Đánh giá
                  </button>
                  <button
                    className={`sortOption ${sortOption === 'price-asc' ? 'active' : ''}`}
                    onClick={() => setSortOption('price-asc')}
                  >
                    Giá thấp - cao
                  </button>
                  <button
                    className={`sortOption ${sortOption === 'price-desc' ? 'active' : ''}`}
                    onClick={() => setSortOption('price-desc')}
                  >
                    Giá cao - thấp
                  </button>
                </div>
                )}
                
                {/* Results count */}
                {!loading && filteredData && filteredData.length > 0 && (
                  <div className="searchItemsHeader">
                    <div className="resultsCount">
                      {filteredData.length} chỗ nghỉ được tìm thấy {destination && `ở ${destination}`}
                    </div>
                  </div>
                )}
                
                {/* Loading state */}
                {loading ? (
                  <div className="loading">
                    <div className="loadingSpinner"></div>
                  </div>
                ) : (
                  <>
                    {/* No results */}
                    {filteredData && filteredData.length === 0 ? (
                      <div className="noResults">
                        <p>Không tìm thấy kết quả</p>
                        <p>Đã thử tìm: {destination} (giá từ {min || 0} đến {max || 'không giới hạn'})</p>
                        <p>Hãy thử điều chỉnh các bộ lọc hoặc tìm kiếm địa điểm khác</p>
                      </div>
                    ) : (
                      // Results list
                      filteredData.map((item) => (
                        <SearchItem item={item} key={item._id} />
                      ))
                    )}
                  </>
                )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;
