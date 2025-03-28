import axios from "axios";
import { useEffect, useState, useContext } from "react";
import './payment.css';
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard, faCalendarAlt, faUser, faBed, faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { API_URL } from "../../utils/apiConfig";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Payment = ({ onClose }) => {
  const [reservationData, setReservationData] = useState(null);
  const [reservationDates, setReservationDates] = useState(null);
  const { user } = useContext(AuthContext);
  const token = user?.token;
  const [email, setEmail] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("reservationData");
    const datesData = localStorage.getItem("dates");

    console.log("Loaded reservationData from localStorage:", data);

    if (data) {
      const parsedData = JSON.parse(data);
      console.log("Parsed reservationData:", parsedData);
      setReservationData(parsedData);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!reservationData) {
    return <p>Dữ liệu không hợp lệ. Vui lòng quay lại và chọn lại phòng.</p>;
  }

  const { totalPrice, selectedRooms, hotelId } = reservationData;

  const createBooking = async (inputEmail) => {
    try {
      if (!user?.details?._id) {
        toast.warn("Vui lòng đăng nhập để đặt phòng!", {
          position: "top-center",
          autoClose: 2000,
        });
        return null;  
      }

      console.log("Creating booking with data:", {
        hotelId: hotelId,
        selectedRooms: selectedRooms,
        totalPrice: totalPrice,
        customer: user.details._id,
        dates: reservationDates
      });

      const bookingData = {
        hotelId: hotelId,
        selectedRooms: selectedRooms.map(room => ({
          roomId: room.roomId,
          roomNumber: room.number,
          idRoomNumber: room.roomId
        })),
        totalPrice: totalPrice,
        customer: user.details._id,
        paymentInfo: {
          checkinDate: new Date(reservationDates.checkinDate).toISOString(),
          checkoutDate: new Date(reservationDates.checkoutDate).toISOString()
        },
        paymentStatus: "pending",
        email: inputEmail // Sử dụng email được nhập vào
      };

      const response = await axios.post(`${API_URL}/booking/create`, bookingData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error("Error creating booking:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "Không thể tạo đơn đặt phòng. Vui lòng thử lại.", {
        position: "top-center",
        autoClose: 2000,
      });
      return null;
    }
  };

  const isValidEmail = (email) => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePayment = async (email) => {
    if (!isValidEmail(email)) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ!", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    try {
      const booking = await createBooking(email);
      if (!booking) return;

      // Lưu ID booking vào localStorage
      localStorage.setItem("bookingId", booking._id);

      // Tạo URL thanh toán VNPay
      const response = await axios.post(
        `${API_URL}/vnpay/create_payment_url`, 
        {
          amount: booking.totalPrice,
          orderInfo: `Thanh toan don hang: ${booking._id}`
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Chuyển hướng người dùng đến trang lịch sử đặt phòng
      toast.success("Đặt phòng thành công! Vui lòng kiểm tra email để xác nhận thanh toán", {
        position: "top-center", 
        autoClose: 2000,
      });

      setTimeout(() => {
        window.location.href = '/booking';
      }, 2000);

    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Lỗi khi đặt phòng. Vui lòng thử lại!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  return (
    <div className="payment-modal">
      <div className="payment-container">
        <div className="payment-header">
          <FontAwesomeIcon icon={faCreditCard} className="payment-icon" />
          <h1>Chi tiết thanh toán</h1>
        </div>

        <div className="payment-info-grid">
          <div className="payment-info-item">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <div className="info-content">
              <h3>Thời gian lưu trú</h3>
              <p>Nhận phòng: {reservationDates && formatDate(reservationDates.checkinDate)}</p>
              <p>Trả phòng: {reservationDates && formatDate(reservationDates.checkoutDate)}</p>
            </div>
          </div>

          <div className="payment-info-item">
            <FontAwesomeIcon icon={faBed} />
            <div className="info-content">
              <h3>Thông tin phòng</h3>
              <div className="room-list">
                {selectedRooms.map((room, index) => (
                  <div key={index} className="room-item">
                    <p>{room.title}</p>
                    <p>Phòng số: {room.number}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="payment-info-item">
            <FontAwesomeIcon icon={faMoneyBill} />
            <div className="info-content">
              <h3>Chi tiết giá</h3>
              <div className="price-details">
                <p>Tổng tiền: <span className="price">
                  {reservationData?.totalPrice?.toLocaleString("vi-VN")} VND
                </span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="email-confirmation">
          <h3>Thông tin xác nhận</h3>
          <div className="form-group">
            <label>Email nhận xác nhận đặt phòng:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
            />
          </div>
        </div>

        <div className="payment-actions">
          <button
            className="payment-button"
            onClick={() => handlePayment(email)}
            disabled={!email}
          >
            Đặt phòng
          </button>
          <button className="cancel-button" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  );
};

export default Payment;