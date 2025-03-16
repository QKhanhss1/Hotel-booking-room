import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faUser, faChevronLeft, faChevronRight, faBed, faDoorOpen, faExpand, faRulerCombined, faUserFriends, faWifi, faUtensils, faSwimmingPool, faSpa, faParking, faSnowflake, faTv, faSmoking, faBan, faWineGlass, faCoffee } from "@fortawesome/free-solid-svg-icons";
import "./reserve.css";
import useFetch from "../../hooks/useFetch";
import { useContext, useState, useEffect } from "react";
import { SearchContext } from "../../context/SearchContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Payment from "../../pages/payment/payment";
import { API_IMAGES } from "../../utils/apiConfig";

const Reserve = ({ setOpen, hotelId }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const { dates } = useContext(SearchContext);
  const { data, loading, error } = useFetch(
    `/hotels/rooms/${hotelId}?startDate=${dates[0]?.startDate}&endDate=${dates[0]?.endDate}`
  );
  const [roomPrices, setRoomPrices] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();
  const [imageUrls, setImageUrls] = useState({});
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [bookedRooms, setBookedRooms] = useState([]);
  const [showRoomDetail, setShowRoomDetail] = useState(null);

  console.log("Room data received:", data); 

  // Hàm lấy danh sách ngày trong phạm vi
  const getDatesInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start.getTime());
    const dates = [];

    while (date <= end) {
      const formattedDate = date.toISOString().split("T")[0];
      dates.push(formattedDate);
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const alldates = getDatesInRange(dates?.[0]?.startDate, dates?.[0]?.endDate);

  // Cập nhật lại hàm isAvailable
  const isAvailable = (roomNumber) => {
    try {
      if (!dates || !dates[0] || !roomNumber) return false;

      // Convert dates to timestamps for easier comparison
      const requestStart = new Date(dates[0].startDate).getTime();
      const requestEnd = new Date(dates[0].endDate).getTime();

      // Check if room is booked in the requested period
      const isBooked = bookedRooms.some(booking => {
        const bookedRoomIds = booking.roomId.map(id => id._id || id);
        
        if (bookedRoomIds.includes(roomNumber._id)) {
          const bookedStart = new Date(booking.checkinDate).getTime();
          const bookedEnd = new Date(booking.checkoutDate).getTime();

          // Room is unavailable if there's any overlap between periods
          return (
            (requestStart < bookedEnd && requestEnd > bookedStart)
          );
        }
        return false;
      });

      return !isBooked;
    } catch (error) {
      console.error("Error checking availability:", error);
      return false;
    }
  };

  // Cập nhật danh sách phòng đã chọn
  const handleSelect = (e, roomId, roomNumber) => {
    const { checked } = e.target;
    
    if (checked) {
      setSelectedRooms(prev => [...prev, roomId]);
    } else {
      setSelectedRooms(prev => prev.filter(item => item !== roomId));
    }
  };

  const days =
    (new Date(dates?.[0]?.endDate) - new Date(dates?.[0]?.startDate)) /
    (1000 * 3600 * 24);

  useEffect(() => {
    if (data?.length > 0) {
      const roomPricesMap = {};
      data.forEach((room) => {
        room.roomNumbers.forEach((roomNumber) => {
          roomPricesMap[roomNumber._id] =
          {
            price: room.price || 0,
            title: room.title || "Unknown Room",
            desc: room.desc || "",
            maxPeople: room.maxPeople || 2,
            roomId: room._id,
            roomSize: room.roomSize || "30 m²"
          }
        });
      });
      setRoomPrices(roomPricesMap);
    }
  }, [data]);

  useEffect(() => {
    console.log("Room data:", data);
  }, [data]);

  useEffect(() => {
    const fetchImageUrls = async () => {
      if (data) {
        try {
          const promises = data.flatMap(room => 
            room.imageIds.map(async (imageId) => {
              try {
                const response = await axios.get(`${API_IMAGES}/${imageId._id}`);
                if (response.data && response.data.imageUrl) {
                  setImageUrls(prev => ({
                    ...prev,
                    [imageId._id]: response.data.imageUrl
                  }));
                }
              } catch (error) {
                console.error(`Error fetching image ${imageId._id}:`, error);
              }
            })
          );
          await Promise.all(promises);
        } catch (error) {
          console.error("Error in fetchImageUrls:", error);
        }
      }
    };
    fetchImageUrls();
  }, [data]);

  // Cập nhật useEffect cho việc lấy danh sách phòng đã đặt
  useEffect(() => {
    const fetchBookedRooms = async () => {
      try {
        const response = await axios.get(`/booking/hotel/${hotelId}`);
        const bookings = response.data;
        
        // Chỉ lấy các booking đã thanh toán thành công
        const successfulBookings = bookings.filter(
          booking => booking.paymentStatus === "success"
        );

        // Map dữ liệu booking để dễ sử dụng
        const booked = successfulBookings.map(booking => ({
          roomId: booking.selectedRooms.map(room => ({ 
            _id: room.roomId._id || room.roomId,
            number: room.roomNumber
          })),
          checkinDate: booking.paymentInfo.checkinDate,
          checkoutDate: booking.paymentInfo.checkoutDate
        }));

        setBookedRooms(booked);
      } catch (error) {
        console.error("Error fetching booked rooms:", error);
      }
    };

    if (hotelId && dates?.[0]?.startDate && dates?.[0]?.endDate) {
      fetchBookedRooms();
    }
  }, [hotelId, dates]);

  const handleClick = () => {
    if (selectedRooms.length === 0 || !days || days <= 0) {
      alert("Vui lòng chọn phòng và kiểm tra lại ngày đặt!");
      return;
    }

    const totalPrice = selectedRooms.reduce((total, roomId) => {
      const room = roomPrices[roomId] || {};
      return total + (room.price || 0) * days;
    }, 0);

    const selectedRoomDetails = selectedRooms.map((roomId) => {
      // Lấy dữ liệu từ `roomPrices` và `data`
      const roomNumberData = data
        .flatMap((room) => room.roomNumbers)
        .find((roomNumber) => roomNumber._id === roomId);
      //lấy id số phòng
      if (!roomNumberData) {
        console.error("Không tìm thấy roomNumber cho ID:", roomId);
        return null; // Bỏ qua nếu không tìm thấy roomNumber
      }
      //lấy id phòng
      const roomData = data.find((room) => room.roomNumbers.some(roomNumber => roomNumber._id === roomId));
      return {
        id: roomId,
        roomId: roomData._id,
        number: roomNumberData.number || "Unknown Number", // Lấy `number`
        title: roomPrices[roomId]?.title || "Unknown Room", // Lấy `title`
        price: roomPrices[roomId]?.price || 0, // Lấy `price`
      };
    }).filter(Boolean); // Loại bỏ các giá trị null khỏi mảng

    // Lưu vào localStorage
    localStorage.setItem(
      "reservationData",
      JSON.stringify({
        totalPrice,
        selectedRooms: selectedRoomDetails,
        hotelId,
      })
    );
    setShowPaymentModal(true);
  };

  const handleImageNav = (roomId, direction) => {
    setCurrentImageIndexes(prev => {
      const currentIndex = prev[roomId] || 0;
      const totalImages = data.find(room => room._id === roomId)?.imageIds.length || 0;
      
      if (direction === 'next') {
        return { ...prev, [roomId]: (currentIndex + 1) % totalImages };
      } else {
        return { ...prev, [roomId]: (currentIndex - 1 + totalImages) % totalImages };
      }
    });
  };

  const showRoomDetails = (room) => {
    setShowRoomDetail(room);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getAmenityIcon = (amenityId) => {
    const iconMap = {
      'wifi': faWifi,
      'breakfast': faUtensils,
      'pool': faSwimmingPool,
      'spa': faSpa,
      'parking': faParking,
      'ac': faSnowflake,
      'tv': faTv,
      'minibar': faWineGlass,
      'coffee': faCoffee,
      'no-smoking': faBan,
      'balcony': faDoorOpen,
      'bathtub': faBed
    };
    
    return iconMap[amenityId] || faWifi;
  };

  const getAmenityLabel = (amenityId) => {
    const labelMap = {
      'wifi': 'WiFi miễn phí',
      'breakfast': 'Bữa sáng',
      'pool': 'Hồ bơi',
      'spa': 'Spa',
      'parking': 'Bãi đậu xe',
      'ac': 'Máy điều hòa',
      'tv': 'TV',
      'minibar': 'Minibar',
      'coffee': 'Máy pha cà phê',
      'no-smoking': 'Không hút thuốc',
      'balcony': 'Ban công',
      'bathtub': 'Bồn tắm'
    };
    
    return labelMap[amenityId] || amenityId;
  };

  return (
    <div className="reserve">
      <div className="rContainer">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="rClose"
          onClick={() => setOpen(false)}
        />
        <h2 className="rTitle">Chọn phòng của bạn</h2>
        <p className="rSubtitle">Chọn phòng phù hợp với nhu cầu của bạn</p>

        {loading ? (
          <div className="rLoading">
            <div className="rLoadingSpinner"></div>
            <p>Đang tìm phòng phù hợp cho bạn...</p>
          </div>
        ) : error ? (
          <div className="rError">
            <FontAwesomeIcon icon={faCircleXmark} />
            <p>Có lỗi xảy ra: {error}</p>
          </div>
        ) : (
          <div className="rRoomList">
            {data && data.length > 0 ? (
              data.map((room) => {
                // Lọc ra các phòng còn trống
                const availableRooms = room.roomNumbers.filter(roomNumber => isAvailable(roomNumber));

                // Chỉ hiển thị các phòng còn trống
                return availableRooms.length > 0 ? (
                  <div className="rRoomCard" key={room._id}>
                    <div className="rRoomImageContainer">
                      {room.imageIds && room.imageIds.length > 0 ? (
                        <div className="rRoomImageSlider">
                          <img
                            src={imageUrls[room.imageIds[currentImageIndexes[room._id] || 0]?._id] || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}
                            alt={room.title}
                            className="rRoomImage"
                            onError={(e) => {
                              console.error("Image load error:", e);
                              e.target.onerror = null; // Prevent infinite error loop
                              e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                              e.target.className = "rRoomImage bg-gray-200";
                            }}
                          />
                          {room.imageIds.length > 1 && (
                            <>
                              <button 
                                className="rImageNavPrev"
                                onClick={() => handleImageNav(room._id, 'prev')}
                              >
                                <FontAwesomeIcon icon={faChevronLeft} />
                              </button>
                              <button 
                                className="rImageNavNext"
                                onClick={() => handleImageNav(room._id, 'next')}
                              >
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="rRoomNoImage">
                          <FontAwesomeIcon icon={faBed} />
                          <span>Không có ảnh</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="rRoomInfo">
                      <div className="rRoomHeader">
                        <h3 className="rRoomTitle">{room.title}</h3>
                        <div className="rRoomSpecs">
                          <div className="rRoomSpec">
                            <FontAwesomeIcon icon={faRulerCombined} />
                            <span>{room.roomSize || "30 m²"}</span>
                          </div>
                          <div className="rRoomSpec">
                            <FontAwesomeIcon icon={faUserFriends} />
                            <span>{room.maxPeople} khách</span>
                          </div>
                        </div>
                      </div>

                      <div className="rRoomAmenities">
                        {room.amenities && room.amenities.length > 0 ? (
                          room.amenities.slice(0, 4).map((amenity, index) => (
                            <div className="rRoomAmenity" key={index}>
                              <FontAwesomeIcon icon={getAmenityIcon(amenity)} />
                              <span>{getAmenityLabel(amenity)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="rRoomAmenity">
                            <FontAwesomeIcon icon={faWifi} />
                            <span>WiFi miễn phí</span>
                          </div>
                        )}
                        {room.amenities && room.amenities.length > 4 && (
                          <div className="rRoomAmenity">
                            <span>+{room.amenities.length - 4} tiện nghi khác</span>
                          </div>
                        )}
                      </div>

                      <div className="rRoomDesc">
                        <p>{room.desc}</p>
                      </div>

                      <button 
                        className="rRoomDetailBtn"
                        onClick={() => showRoomDetails(room)}
                      >
                        Xem chi tiết phòng
                      </button>
                    </div>

                    <div className="rRoomBooking">
                      <div className="rRoomPriceContainer">
                        <div className="rRoomPrice">
                          <span className="rRoomPriceValue">{formatPrice(room.price)} VND</span>
                          <span className="rRoomPriceNight">/đêm</span>
                        </div>
                        <div className="rRoomTaxesInfo">Đã bao gồm thuế và phí</div>
                      </div>

                      <div className="rRoomSelectContainer">
                        <div className="rRoomQuantity">
                          <span>Số lượng phòng:</span>
                          <select className="rRoomSelect">
                            {[...Array(availableRooms.length)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div className="rRoomNumbers">
                          {availableRooms.map((roomNumber) => (
                            <div className="rRoomNumberItem" key={roomNumber._id}>
                              <label className="rRoomNumberLabel">
                                <input
                                  type="checkbox"
                                  value={roomNumber._id}
                                  onChange={(e) => handleSelect(e, roomNumber._id, roomNumber.number)}
                                  className="rRoomNumberCheckbox"
                                />
                                <span className="rRoomNumberText">Phòng {roomNumber.number}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })
            ) : (
              <div className="rNoRooms">
                <FontAwesomeIcon icon={faBed} size="2x" />
                <p>Không tìm thấy phòng trống cho ngày đã chọn</p>
                <button onClick={() => setOpen(false)}>Chọn ngày khác</button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={selectedRooms.length === 0}
          className="rBookButton"
        >
          Đặt {selectedRooms.length} phòng - Tiếp tục thanh toán
        </button>
      </div>

      {showRoomDetail && (
        <div className="rRoomDetailModal" onClick={() => setShowRoomDetail(null)}>
          <div className="rRoomDetailContent" onClick={(e) => e.stopPropagation()}>
            <button className="rRoomDetailClose" onClick={() => setShowRoomDetail(null)}>
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>
            
            <div className="rRoomDetailHeader">
              <h3>{showRoomDetail.title}</h3>
            </div>
            
            <div className="rRoomDetailBody">
              <div className="rRoomDetailInfo">
                <div className="rRoomDetailInfoItem">
                  <FontAwesomeIcon icon={faRulerCombined} />
                  <span>{showRoomDetail.roomSize || "30 m²"}</span>
                </div>
                <div className="rRoomDetailInfoItem">
                  <FontAwesomeIcon icon={faUserFriends} />
                  <span>{showRoomDetail.maxPeople} khách</span>
                </div>
              </div>
              
              {showRoomDetail.amenities && showRoomDetail.amenities.length > 0 ? (
                <>
                  <div className="rRoomDetailSection">
                    <h4>Tiện nghi phòng</h4>
                    <div className="rRoomDetailFeatures">
                      {showRoomDetail.amenities.map((amenity, index) => (
                        <div className="rRoomDetailFeature" key={index}>
                          <FontAwesomeIcon icon={getAmenityIcon(amenity)} />
                          <span>{getAmenityLabel(amenity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rRoomDetailSection">
                    <h4>Tính năng phòng bạn thích</h4>
                    <div className="rRoomDetailFeatures">
                      <div className="rRoomDetailFeature">
                        <FontAwesomeIcon icon={faDoorOpen} />
                        <span>Bồn tắm</span>
                      </div>
                      <div className="rRoomDetailFeature">
                        <FontAwesomeIcon icon={faExpand} />
                        <span>Ban công / Sân hiên</span>
                      </div>
                      <div className="rRoomDetailFeature">
                        <FontAwesomeIcon icon={faUserFriends} />
                        <span>Khu vực chờ</span>
                      </div>
                      <div className="rRoomDetailFeature">
                        <FontAwesomeIcon icon={faSnowflake} />
                        <span>Máy lạnh</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rRoomDetailSection">
                    <h4>Tiện nghi cơ bản</h4>
                    <div className="rRoomDetailAmenities">
                      <div className="rRoomDetailAmenity">
                        <FontAwesomeIcon icon={faUtensils} />
                        <span>Bữa sáng</span>
                      </div>
                      <div className="rRoomDetailAmenity">
                        <FontAwesomeIcon icon={faBan} />
                        <span>Phòng cấm hút thuốc</span>
                      </div>
                      <div className="rRoomDetailAmenity">
                        <FontAwesomeIcon icon={faUserFriends} />
                        <span>Khu vực chờ</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rRoomDetailSection">
                    <h4>Tiện nghi phòng</h4>
                    <div className="rRoomDetailFacilities">
                      <div className="rRoomDetailFacility">
                        <FontAwesomeIcon icon={faSnowflake} />
                        <span>Máy lạnh</span>
                      </div>
                      <div className="rRoomDetailFacility">
                        <FontAwesomeIcon icon={faWineGlass} />
                        <span>Quầy bar mini</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="rRoomDetailDesc">
                <h4>Mô tả phòng</h4>
                <p>{showRoomDetail.desc}</p>
              </div>
            </div>
            
            <div className="rRoomDetailFooter">
              <div className="rRoomDetailPrice">
                <div className="rRoomDetailPriceLabel">Khởi điểm từ:</div>
                <div className="rRoomDetailPriceValue">
                  {formatPrice(showRoomDetail.price)} VND
                  <span>/ phòng / đêm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
          <Payment onClose={() => setShowPaymentModal(false)} />
        </div>
      )}
    </div>
  );
};

export default Reserve;
