import axios from "axios";
import { useEffect, useState, useContext } from "react";
import './payment.css';
import { AuthContext } from "../../context/AuthContext";

const Payment = ({ onClose }) => {
  const [reservationData, setReservationData] = useState(null);
  const [reservationDates, setReservationDates] = useState(null);
  const { user } = useContext(AuthContext);
  const token = user?.token;
  useEffect(() => {
    // Lấy dữ liệu từ localStorage
    const data = localStorage.getItem("reservationData");
    const datesData = localStorage.getItem("dates");
    if (data) {
      const parsedData = JSON.parse(data);
      console.log("Parsed reservation data in Payment:", parsedData);
      setReservationData(JSON.parse(data));
    } else {
      console.error("No reservation data found.");
    }
    if (datesData) {
      const parsedDates = JSON.parse(datesData);
      if (Array.isArray(parsedDates) && parsedDates[0]) {
        setReservationDates({
          checkinDate: new Date(parsedDates[0].startDate),
          checkoutDate: new Date(parsedDates[0].endDate),
        });
      }
    }
  }, []);

  if (!reservationData) {
    return <p>Dữ liệu không hợp lệ. Vui lòng quay lại và chọn lại phòng.</p>;
  }

  const { totalPrice, selectedRooms, hotelId } = reservationData;
  //new booking
  async function createBooking() {
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${day}-${month}`;
    };
    // Chuẩn bị dữ liệu từ localStorage
    const selectedRoomsData = selectedRooms.map((room) => ({
      roomId: room.roomId, 
      roomNumber: room.number,
      idRoomNumber: room.id,
    }));
    try {
      const newBooking = {
        hotelId: hotelId,
        selectedRooms: selectedRoomsData, 
        totalPrice: totalPrice,
        customer: user.details._id,
        checkinDate: formatDate(reservationDates.checkinDate), // Chuyển đổi ngày
        checkoutDate: formatDate(reservationDates.checkoutDate), // Chuyển đổi ngày
      };

      const response = await axios.post(
        "http://localhost:8800/api/booking/create",
        newBooking,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Thêm token vào đây
          },
        }
      );

      if (response.status === 200) {
        console.log("Booking created successfully:", response.data);
        localStorage.setItem("bookingId", response.data._id);
        return response.data;
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Không thể tạo booking. Vui lòng thử lại.");
      return null;
    }
  }

  //payment 
  async function handlePayment() {
    try {
      const booking = await createBooking();
      if (!booking) return;

      const newPayment = {
        bankCode: null,
        amount: totalPrice,
        language: "vn",
      };
      const response = await axios.post(
        "http://localhost:8800/api/v1/vnpay/create_payment_url",
        newPayment
      );

      if (response.status === 200 && response.data) {
        window.location.href = response.data
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  }

  return (
    <div className="payment-modal">
      <div className="payment-container">
        <h1>Trang thanh toán</h1>
        <p>Tổng giá: {totalPrice.toLocaleString("vi-VN")} VND</p>
        <p>Chọn phòng:</p>
        <ul>
          {selectedRooms.map((room, index) => (
            <li key={index}>
              {room.title}
            </li>
          ))}
        </ul>
        <button onClick={handlePayment}>Tiến hành thanh toán</button>
        <button className="cancel-button" onClick={onClose}>Hủy</button>
      </div>
    </div>
  );
};

export default Payment;
