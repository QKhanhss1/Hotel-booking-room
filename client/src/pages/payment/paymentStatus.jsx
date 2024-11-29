import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './payment.css';

const PaymentStatus = () => {
  const { status } = useParams(); // Lấy giá trị status từ URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const amount = queryParams.get('amount');
  const [selectedRoomDetails, setSelectedRoomDetails] = useState([]);
  const [updateStatus, setUpdateStatus] = useState({ success: true, message: '' });
  const [loading, setLoading] = useState(false);

  // Hàm để chuyển đổi danh sách ngày về định dạng đúng
  const getDatesInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    let current = new Date(start);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  useEffect(() => {
    const reservationData = JSON.parse(localStorage.getItem('reservationData'));
    const rawDates = JSON.parse(localStorage.getItem('dates'));
    const bookingId = localStorage.getItem('bookingId'); // Lấy bookingId từ localStorage

    if (!bookingId) {
      console.error("Lỗi: bookingId không tồn tại.");
      setUpdateStatus({ success: false, message: 'Không tìm thấy bookingId để cập nhật trạng thái thanh toán.' });
      return; // Dừng thực thi nếu bookingId không tồn tại
    }

    // Hàm cập nhật trạng thái thanh toán
    const updatePaymentStatus = async (bookingId, paymentStatus) => {
      try {
        const response = await axios.put("http://localhost:8800/api/booking/update/status", {
          bookingId,
          paymentStatus,
        });

        console.log(`Cập nhật trạng thái thanh toán (${paymentStatus}) thành công:`, response.data);
        setUpdateStatus({
          success: true,
          message: `Cập nhật trạng thái thanh toán (${paymentStatus}) thành công!`,
        });
      } catch (error) {
        console.error(`Lỗi khi cập nhật trạng thái thanh toán (${paymentStatus}):`, error);
        setUpdateStatus({
          success: false,
          message: `Lỗi khi cập nhật trạng thái thanh toán (${paymentStatus}).`,
        });
      }
    };

    if (status === 'success' && reservationData?.selectedRooms) {
      // Xử lý cập nhật trạng thái phòng nếu thanh toán thành công
      const formattedDates = rawDates?.[0]
        ? getDatesInRange(rawDates[0].startDate, rawDates[0].endDate)
        : [];
      const updatePromises = reservationData.selectedRooms.map((room) =>
        axios.put(`http://localhost:8800/api/hotels/rooms/availability/${room.id}`, { dates: formattedDates })
      );

      setLoading(true);
      Promise.all(updatePromises)
        .then(() => {
          updatePaymentStatus(bookingId, 'success');
          localStorage.removeItem('reservationData');
          localStorage.removeItem('dates');
          localStorage.removeItem('bookingId');
        })
        .catch((error) => {
          console.error("Lỗi khi cập nhật trạng thái phòng:", error);
          setUpdateStatus({ success: false, message: 'Có lỗi khi cập nhật trạng thái phòng.' });
        })
        .finally(() => setLoading(false));
    } else if (status !== 'success') {
      // Xử lý khi thanh toán thất bại
      updatePaymentStatus(bookingId, 'failed');
      localStorage.removeItem('reservationData');
      localStorage.removeItem('dates');
      localStorage.removeItem('bookingId');
    }
  }, [status]);

  // Giao diện
  return (
    <div className="body">
      <div className="container">
        {status === 'success' ? (
          <>
            <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
            <h1 className="title">Thanh toán thành công số tiền {amount}₫</h1>
            <p className="description">Cảm ơn vì đã sử dụng dịch vụ của chúng tôi.</p>
            <a href="/" className="button-success">
              Quay lại trang chủ
            </a>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
            <h1 className="title">Thanh toán không thành công</h1>
            <p className="description">
              Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
            </p>
            <a href="/" className="button-error">
              Quay lại trang chủ
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
