import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./payment.css";
import { API_URL } from "../../utils/apiConfig";

const PaymentStatus = () => {
  const { status } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  // Lấy amount từ query params hoặc localStorage
  const amount = queryParams.get("amount") || localStorage.getItem("totalprice") || 0;
  const [selectedRoomDetails, setSelectedRoomDetails] = useState([]);
  const [updateStatus, setUpdateStatus] = useState({
    success: true,
    message: "",
  });
  const [loading, setLoading] = useState(false);

  // Hàm để chuyển đổi danh sách ngày về định dạng đúng
  const getDatesInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    let current = new Date(start);

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  useEffect(() => {
    const updateBookingAndRooms = async () => {
      try {
        setLoading(true);
        const reservationData = JSON.parse(
          localStorage.getItem("reservationData")
        );
        const rawDates = JSON.parse(localStorage.getItem("dates"));
        const bookingId = localStorage.getItem("bookingId");

        if (!bookingId || !reservationData || !rawDates) {
          throw new Error("Thiếu thông tin cần thiết");
        }

        if (status === "success") {
          await axios.put(`${API_URL}/booking/update/status`, {
            bookingId,
            paymentStatus: "success",
          });
          const formattedDates = getDatesInRange(
            rawDates[0].startDate,
            rawDates[0].endDate
          );
          await Promise.all(
            reservationData.selectedRooms.map((room) =>
              axios.put(`${API_URL}/hotels/rooms/availability/${room.roomId}`, {
                dates: formattedDates,
              })
            )
          );

          setUpdateStatus({
            success: true,
            message: "Đặt phòng thành công!",
          });
        } else {
          await axios.put(`${API_URL}/booking/update/status`, {
            bookingId,
            paymentStatus: "failed",
          });
          setUpdateStatus({
            success: false,
            message: "Thanh toán thất bại!",
          });
        }
      } catch (error) {
        console.error("Error updating booking:", error);
        setUpdateStatus({
          success: false,
          message: "Có lỗi xảy ra khi cập nhật đơn đặt phòng",
        });
      } finally {
        setLoading(false);
        // Đợi một chút trước khi xóa dữ liệu để đảm bảo hiển thị số tiền
        setTimeout(() => {
          localStorage.removeItem("reservationData");
          localStorage.removeItem("dates");
          localStorage.removeItem("bookingId");
          localStorage.removeItem("totalprice");
        }, 1000);
      }
    };

    updateBookingAndRooms();
  }, [status]);

  // Format số tiền với đơn vị VND
  const formatAmount = (amount) => {
    return Number(amount).toLocaleString("vi-VN");
  };

  return (
    <div className="body">
      <div className="container">
        {status === "success" ? (
          <>
            <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
            <h1 className="title">Thanh toán thành công số tiền {formatAmount(amount)} VND</h1>
            <p className="description">
              Cảm ơn vì đã sử dụng dịch vụ của chúng tôi.
            </p>
            <a href="/" className="button-status button-success">
              Quay lại trang chủ
            </a>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
            <h1 className="title error">Thanh toán không thành công</h1>
            <p className="description error">
              Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
            </p>
            <a href="/" className="button-status button-error">
              Quay lại trang chủ
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
