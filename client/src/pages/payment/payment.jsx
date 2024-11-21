import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useEffect, useState } from "react";
import './payment.css';  // Import CSS

const Payment = ({ onClose }) => {
  const [reservationData, setReservationData] = useState(null);
  
  useEffect(() => {
    // Lấy dữ liệu từ localStorage
    const data = localStorage.getItem("reservationData");
    if (data) {
      setReservationData(JSON.parse(data));
    } else {
      console.error("No reservation data found.");
    }
  }, []);

  if (!reservationData) {
    return <p>Invalid data. Please go back and select rooms again.</p>;
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
        <h1>Payment Page</h1>
        <p>Total Price: {totalPrice}</p>
        <p>Selected Rooms: {selectedRooms.join(", ")}</p>
        <button onClick={handlePayment}>Proceed to Payment</button>
        <button className="cancel-button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default Payment;
