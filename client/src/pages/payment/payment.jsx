import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useEffect, useState } from "react";

const Payment = () => {
  const [reservationData, setReservationData] = useState(null);
  const [total, totalMoney] = useState(null);

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
  const { totalPrice, selectedRooms,hotelId } = reservationData;

  //payment 
  async function handlePayment() {
    try {
      const newPayment = {
        bankCode: null,
        selectedRooms,
        hotelId,
        totalPrice,
        language: "vn",
      };
      const response = await axios.post(
        `http://localhost:8800/api/payment/vnpay`,
        newPayment
      );
  
      if (response.status === 200 && response.data?.url) {
        // Chuyển hướng đến URL trả về
        window.location.href = response.data.url;
      } else {
        console.error("Invalid response format:", response.data);
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  }

  return (
    <div>
      <h1>Payment Page</h1>
      <p>Total Price: {totalPrice}</p>
      <p>Selected Rooms: {selectedRooms.join(", ")}</p>
      <button onClick={handlePayment}>payment</button><br/>
      <button>cancel</button>
    </div>
  );
};

export default Payment;
