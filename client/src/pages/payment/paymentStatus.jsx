import React from 'react';
import { useParams,useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'; // Import biểu tượng thành công và lỗi
import './payment.css';

const PaymentStatus = () => {
  const { status } = useParams(); // Lấy giá trị status từ URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const amount = queryParams.get('amount'); 


  // Kiểm tra trạng thái thanh toán và render giao diện tương ứng
  return (
    <div className="body">
      <div className="container">
        {status === 'success' ? (
          // Giao diện thành công
          <>
            <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
            <h1 className="title">Thanh toán thành công số tiền {amount}</h1>
            <p className="description">Cảm ơn vì đã sử dụng dịch vụ của chúng tôi</p>
            <a href="/" className="button-success">Quay lại trang chủ</a>
          </>
        ) : (
          // Giao diện lỗi
          <>
            <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
            <h1 className="title">Thanh toán không thành công</h1>
            <p className="description">Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.</p>
            <a href="/" className="button-error">Quay lại trang chủ</a>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
