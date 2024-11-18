import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import "./reserve.css";
import useFetch from "../../hooks/useFetch";
import { useContext, useState, useEffect } from "react";
import { SearchContext } from "../../context/SearchContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Reserve = ({ setOpen, hotelId }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const { data, loading, error } = useFetch(`/hotels/room/${hotelId}`);
  const [roomPrices, setRoomPrices] = useState({});
  const { dates } = useContext(SearchContext);
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
          roomPricesMap[roomNumber._id] = room.price || 0;
        });
      });
      setRoomPrices(roomPricesMap);
    }
  }, [data]);

  const handleClick = async () => {
    if (selectedRooms.length === 0 || days <= 0) {
      console.error("No valid rooms selected or invalid date range.");
      return;
    }

    const totalPrice = selectedRooms.reduce((total, roomId) => {
      const roomPrice = roomPrices[roomId] || 0;
      return total + roomPrice * days;
    }, 0);

    try {
      await Promise.all(
        selectedRooms.map((roomId) =>
          axios.put(`/rooms/availability/${roomId}`, {
            dates: alldates,
          })
        )
      );

      localStorage.setItem(
        "reservationData",
        JSON.stringify({ totalPrice, selectedRooms, hotelId })
      );
      navigate("/payment");
      setOpen(false);
    } catch (err) {
      console.error("Error updating room availability:", err);
    }
  };

  return (
    <div className="reserve">
      <div className="rContainer">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="rClose"
          onClick={() => setOpen(false)}
        />
        <span>Select your rooms:</span>

        {loading && <span>Loading...</span>}
        {error && <span>Error loading data. Please try again later.</span>}

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
          <span>No rooms available.</span>
        )}

        <button
          onClick={handleClick}
          className="rButton"
          disabled={selectedRooms.length === 0}
        >
          Reserve Now!
        </button>
      </div>
    </div>
  );
};

export default Reserve;
