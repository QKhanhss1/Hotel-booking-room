import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
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
  // Add startDate and endDate to API call
  const { data, loading, error } = useFetch(
    `/hotels/rooms/${hotelId}?startDate=${dates[0]?.startDate}&endDate=${dates[0]?.endDate}`
  );
  const [roomPrices, setRoomPrices] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();
  const [imageUrls, setImageUrls] = useState({});
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [bookedRooms, setBookedRooms] = useState([]);

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
  const handleSelect = (e) => {
    const { checked, value } = e.target;
    setSelectedRooms((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
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
            title: room.title || "Unknown Room"
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
        const urlPromises = data.flatMap(room => 
          room.imageIds.map(async (imageId) => {
            try {
              // Sử dụng API_IMAGES từ config
              const response = await axios.get(`${API_IMAGES}/${imageId._id}`);
              setImageUrls(prev => ({
                ...prev,
                [imageId._id]: response.data.imageUrl
              }));
            } catch (error) {
              console.error("Error fetching image URL:", error);
            }
          })
        );
        await Promise.all(urlPromises);
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

  return (
    <div className="reserve">
      <div className="rContainer">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="rClose"
          onClick={() => setOpen(false)}
        />
        <h2 className="text-2xl font-bold mb-6">Chọn phòng của bạn</h2>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : (
          data?.map((item) => {
            // Lọc ra các phòng còn trống
            const availableRooms = item.roomNumbers.filter(roomNumber => isAvailable(roomNumber));

            // Chỉ hiển thị các phòng còn trống
            return availableRooms.length > 0 ? (
              <div className="rItem" key={item._id}>
                <div className="rItemImage">
                  {item.imageIds && item.imageIds.length > 0 ? (
                    <div className="image-slider">
                      <div className="image-grid">
                        <img
                          src={imageUrls[item.imageIds[currentImageIndexes[item._id] || 0]._id] || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                          }}
                        />
                        {item.imageIds.length > 1 && (
                          <>
                            <button 
                              className="slider-nav prev"
                              onClick={() => handleImageNav(item._id, 'prev')}
                            >
                              <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            <button 
                              className="slider-nav next"
                              onClick={() => handleImageNav(item._id, 'next')}
                            >
                              <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                            <div className="image-dots">
                              {item.imageIds.map((_, index) => (
                                <span
                                  key={index}
                                  className={`dot ${index === (currentImageIndexes[item._id] || 0) ? 'active' : ''}`}
                                  onClick={() => setCurrentImageIndexes(prev => ({ ...prev, [item._id]: index }))}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                
                <div className="rItemInfo">
                  <h3 className="rTitle">{item.title}</h3>
                  <p className="rDesc">{item.desc}</p>
                  
                  <div className="rDetails">
                    <div className="rMax">
                      <FontAwesomeIcon icon={faUser} />
                      <span>Tối đa {item.maxPeople} người</span>
                    </div>
                  </div>

                  <div className="rSelectRooms">
                    {availableRooms.map((roomNumber) => (
                      <div className="room" key={roomNumber._id}>
                        <label>Phòng {roomNumber.number}</label>
                        <input
                          type="checkbox"
                          value={roomNumber._id}
                          onChange={handleSelect}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null;
          })
        )}

        <button
          onClick={handleClick}
          disabled={selectedRooms.length === 0}
          className="rButton"
        >
          Đặt phòng ngay!
        </button>
      </div>

      {showPaymentModal && (
        <div className="modal-overlay">
          <Payment onClose={() => setShowPaymentModal(false)} />
        </div>
      )}
    </div>
  );
};

export default Reserve;
