import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { SharedArray } from 'k6/data';

// Cấu hình kiểm tra
export const options = {
  // Mô phỏng 500 người dùng đồng thời
  stages: [
    { duration: '30s', target: 100 }, // Tăng lên 100 VU trong 30 giây
    { duration: '1m', target: 300 },  // Tăng lên 300 VU trong 1 phút
    { duration: '1m', target: 500 },  // Tăng lên 500 VU trong 1 phút
    { duration: '2m', target: 500 },  // Duy trì 500 VU trong 2 phút
    { duration: '30s', target: 0 },   // Giảm dần về 0 VU
  ],
  thresholds: {
    http_req_duration: ['p(90)<3000'], // 90% của các request phải hoàn thành trong vòng 3 giây
    http_req_failed: ['rate<0.1'],     // Tỉ lệ thất bại nhỏ hơn 10%
  },
};

// Mô phỏng ID khách sạn - trong thực tế bạn sẽ lấy từ API
const hotelIds = ['123456789012', '234567890123', '345678901234', '456789012345', '567890123456'];

export default function () {
  // Kiểm tra trang tìm kiếm khách sạn
  group('Tìm kiếm khách sạn', function() {
    const searchResponse = http.get('https://localhost:8800/api/hotels?city=Hồ Chí Minh&min=100000&max=5000000', {
      insecureSkipTLSVerify: true
    });
    check(searchResponse, {
      'Tìm kiếm trả về status 200': (r) => r.status === 200,
      'Thời gian tìm kiếm < 2s': (r) => r.timings.duration < 2000,
      'Kết quả tìm kiếm có dữ liệu': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body) && body.length > 0;
      },
    });
  });

  sleep(1);

  // Kiểm tra chi tiết khách sạn
  group('Chi tiết khách sạn', function() {
    // Chọn ngẫu nhiên một ID khách sạn
    const randomHotelId = hotelIds[Math.floor(Math.random() * hotelIds.length)];
    
    const hotelDetailResponse = http.get(`https://localhost:8800/api/hotels/find/${randomHotelId}`, {
      insecureSkipTLSVerify: true
    });
    
    // Không kiểm tra status 200 vì có thể ID không tồn tại
    check(hotelDetailResponse, {
      'Chi tiết khách sạn có phản hồi': (r) => r.status !== 0,
      'Thời gian phản hồi chi tiết < 3s': (r) => r.timings.duration < 3000,
    });
  });

  // Kiểm tra danh sách phòng của khách sạn
  group('Danh sách phòng', function() {
    const randomHotelId = hotelIds[Math.floor(Math.random() * hotelIds.length)];
    
    // Tạo ngày bắt đầu và kết thúc ngẫu nhiên trong 90 ngày tới
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + Math.floor(Math.random() * 30)); // Ngày bắt đầu trong 30 ngày tới
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10) + 1); // Thời gian lưu trú 1-10 ngày
    
    const roomsResponse = http.get(
      `https://localhost:8800/api/hotels/rooms/${randomHotelId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, 
      { insecureSkipTLSVerify: true }
    );
    
    check(roomsResponse, {
      'Phản hồi danh sách phòng': (r) => r.status !== 0,
      'Thời gian lấy danh sách phòng < 2s': (r) => r.timings.duration < 2000,
    });
  });

  // Nghỉ giữa các request
  sleep(Math.random() * 5 + 2); // Nghỉ từ 2-7 giây
} 