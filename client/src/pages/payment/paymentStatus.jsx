import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faHome,
  faListAlt
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./paymentStatus.css";
import { API_URL } from "../../utils/apiConfig";

// Tạo axios instance phù hợp cho môi trường trình duyệt
const axiosInstance = axios.create();

const PaymentStatus = () => {
  const { status } = useParams();
  const { user } = useContext(AuthContext);
  const token = user?.token;
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const amount = queryParams.get("amount");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePaymentStatus = async () => {
      try {
        const bookingId = localStorage.getItem("bookingId");
        
        if (status === "success" && bookingId) {
          // Sử dụng axiosInstance để gọi API
          await axiosInstance.post(`${API_URL}/booking/update`, {
            bookingId,
            paymentStatus: "success"
          });
        }
      } catch (error) {
        console.error("Error handling payment status:", error);
      } finally {
        setLoading(false);
        // Đợi một chút trước khi xóa dữ liệu để đảm bảo hiển thị đúng
        setTimeout(() => {
          localStorage.removeItem("bookingId");
          localStorage.removeItem("reservationData");
          localStorage.removeItem("dates");
        }, 1000);
      }
    };

    handlePaymentStatus();
  }, [status]);

  const formatAmount = (amount) => {
    if (!amount) return "0";
    return parseInt(amount).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <div className="payment-status-page">
        <div className="header">
          <div className="logo">
            <img src="/logo.png" alt="Logo" />
          </div>
        </div>
        <div className="body">
          <div className="container">
            <FontAwesomeIcon icon={faSpinner} spin className="spinner-icon" />
            <h2>Đang xử lý...</h2>
            <p>Vui lòng đợi trong khi chúng tôi xác nhận giao dịch của bạn.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status-page">
      <div className="header">
        <div className="logo">
          <img src="/logo.png" alt="Logo" />
        </div>
      </div>

      <div className="body">
        <div className="container">
          {status === "success" && (
            <div className="payment-success-content">
              <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
              <h2>Thanh toán thành công!</h2>
              <p>Cảm ơn bạn đã đặt phòng. Email xác nhận đã được gửi đến địa chỉ email của bạn.</p>
              {amount && <p className="amount">Tổng thanh toán: <span>{formatAmount(amount)} VND</span></p>}
              <div className="payment-actions">
                <button onClick={() => navigate('/booking')}>
                  <FontAwesomeIcon icon={faListAlt} /> Xem đặt phòng
                </button>
                <button onClick={() => navigate('/')}>
                  <FontAwesomeIcon icon={faHome} /> Trở về trang chủ
                </button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="payment-failed-content">
              <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
              <h2>Thanh toán thất bại!</h2>
              <p>Rất tiếc, thanh toán của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
              <div className="payment-actions">
                <button onClick={() => navigate('/booking')}>
                  <FontAwesomeIcon icon={faListAlt} /> Xem đặt phòng
                </button>
                <button onClick={() => navigate('/')}>
                  <FontAwesomeIcon icon={faHome} /> Trở về trang chủ
                </button>
              </div>
            </div>
          )}

          {status === "cancelled" && (
            <div className="payment-cancelled-content">
              <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
              <h2>Đặt phòng đã bị hủy!</h2>
              <p>Đặt phòng của bạn đã bị hủy. Nếu đây là một lỗi, vui lòng liên hệ với chúng tôi.</p>
              <div className="payment-actions">
                <button onClick={() => navigate('/')}>
                  <FontAwesomeIcon icon={faHome} /> Trở về trang chủ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
