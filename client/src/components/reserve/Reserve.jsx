import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import "./reserve.css";
import useFetch from "../../hooks/useFetch";
import { useContext, useState, useEffect } from "react";
import { SearchContext } from "../../context/SearchContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Payment from "../../pages/payment/payment";

const Reserve = ({ setOpen, hotelId }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const { data, loading, error } = useFetch(`/hotels/rooms/${hotelId}`);
  const [roomPrices, setRoomPrices] = useState({});
  const { dates } = useContext(SearchContext);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();

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

  // Kiểm tra xem phòng có khả dụng không
  const isAvailable = (roomNumber) => {
    const unavailableDates = roomNumber?.unavailableDates?.map((date) =>
      new Date(date).toISOString().split("T")[0]
    );
    return !alldates.some((date) => unavailableDates?.includes(date));
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


  return (
    <div className="reserve">
      <div className="rContainer">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="rClose"
          onClick={() => {
            setSelectedRooms([]); // Reset danh sách phòng đã chọn
            setOpen(false); // Đóng modal
          }}
        />
        <span>Chọn phòng bạn muốn:</span>

        {loading && <span>Loading...</span>}
        {error && <span>Lỗi tải lại trang , vui lòng thử lại.</span>}

        {!loading && !error && data?.length > 0 ? (
          data.map((item) => (
            <div className="rItem" key={item._id}>
              <div className="rItemInfo">
                <div className="rTitle">{item?.title || "No title available"}</div>
                <div className="rDesc">{item?.desc || "No description available"}</div>
                <div className="rMax">
                  Max people: <b>{item?.maxPeople || "N/A"}</b>
                </div>
                <div className="rPrice">{item?.price || "N/A"}</div>
              </div>
              <div className="rSelectRooms">
                {item?.roomNumbers?.map((roomNumber) => (
                  <div className="room" key={roomNumber?._id}>
                    <label>{roomNumber?.number || "Room"}</label>
                    <input
                      type="checkbox"
                      value={roomNumber?._id}
                      onChange={handleSelect}
                      disabled={!isAvailable(roomNumber)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <span>Không có phòng nào.</span>
        )}

        <button
          onClick={handleClick}
          className="rButton"
          disabled={selectedRooms.length === 0}
        >
          Đặt ngay!
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
