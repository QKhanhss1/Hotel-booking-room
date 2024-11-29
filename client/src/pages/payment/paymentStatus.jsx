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

    // Kiểm tra và chuyển đổi `dates` sang định dạng hợp lệ
    let formattedDates = [];
    if (rawDates?.[0]) {
      const { startDate, endDate } = rawDates[0];
      formattedDates = getDatesInRange(startDate, endDate); // Chuyển đổi sang danh sách ngày
    }

    // Lưu danh sách phòng vào state
    if (reservationData?.selectedRooms) {
      setSelectedRoomDetails(reservationData.selectedRooms);
    }

    // Chỉ thực hiện cập nhật trạng thái phòng khi thanh toán thành công
    if (status === 'success' && reservationData?.selectedRooms) {
      setLoading(true);
      const updatePromises = reservationData.selectedRooms.map((room) =>
        axios
          .put(`http://localhost:8800/api/hotels/rooms/availability/${room.id}`, { dates: formattedDates })
          .then((response) => {
            console.log(`Cập nhật trạng thái phòng ${room.id} thành công:`, response.data);
          })
          .catch((error) => {
            console.error(`Lỗi khi cập nhật trạng thái phòng ${room.id}:`, error);
            throw error; // Quăng lỗi để xử lý toàn bộ
          })
      );

      Promise.all(updatePromises)
        .then(() => {
          setUpdateStatus({ success: true, message: 'Cập nhật trạng thái phòng thành công!' });
          localStorage.removeItem('reservationData'); // Xóa dữ liệu đặt phòng
          localStorage.removeItem('dates'); // Xóa danh sách ngày
        })
        .catch(() => {
          setUpdateStatus({ success: false, message: 'Có lỗi khi cập nhật trạng thái phòng.' });
        })
        .finally(() => {
          setLoading(false); // Kết thúc tải
        });
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
            {loading ? (
              <p className="loading-message">Đang cập nhật trạng thái phòng...</p>
            ) : (
              <p className={`update-message ${updateStatus.success ? 'success' : 'error'}`}>
                {updateStatus.message}
              </p>
            )}
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
