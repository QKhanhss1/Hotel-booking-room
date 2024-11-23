import axios from "axios";
import { useEffect, useState } from "react";
import './payment.css';

const Payment = ({ onClose }) => {
  const [reservationData, setReservationData] = useState(null);

  useEffect(() => {
    // Lấy dữ liệu từ localStorage
    const data = localStorage.getItem("reservationData");
    if (data) {
      const parsedData = JSON.parse(data);
      console.log("Parsed reservation data in Payment:", parsedData); 
      setReservationData(JSON.parse(data));
    } else {
      console.error("No reservation data found.");
    }
  }, []);

  if (!reservationData) {
    return <p>Dữ liệu không hợp lệ. Vui lòng quay lại và chọn lại phòng.</p>;
  }

  const { totalPrice, selectedRooms, hotelId } = reservationData;
  

  //payment 
  async function handlePayment() {
    try {
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
