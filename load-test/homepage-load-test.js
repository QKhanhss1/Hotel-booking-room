import http from 'k6/http';
import { sleep, check } from 'k6';

// Cấu hình kiểm tra
export const options = {
  // Mô phỏng 500 người dùng truy cập
  stages: [
    { duration: '30s', target: 100 }, // Tăng lên 100 VU trong 30 giây
    { duration: '1m', target: 250 },  // Tăng lên 250 VU trong 1 phút
    { duration: '1m', target: 500 },  // Tăng lên 500 VU trong 1 phút
    { duration: '1m', target: 500 },  // Duy trì 500 VU trong 1 phút
    { duration: '30s', target: 0 },   // Giảm dần về 0 VU
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% của các request phải hoàn thành trong vòng 2 giây
    http_req_failed: ['rate<0.1'],     // Tỉ lệ thất bại nhỏ hơn 10%
  },
};

export default function () {
  // Kiểm tra trang chủ (không có xác thực)
  const homeResponse = http.get('https://localhost:3000/', {
    insecureSkipTLSVerify: true  // Bỏ qua lỗi SSL tự ký
  });
  check(homeResponse, {
    'Trang chủ trả về status 200': (r) => r.status === 200,
    'Thời gian phản hồi < 2s': (r) => r.timings.duration < 2000,
  });

  // Kiểm tra API danh sách khách sạn
  const hotelsListResponse = http.get('https://localhost:8800/api/hotels', {
    insecureSkipTLSVerify: true
  });
  check(hotelsListResponse, {
    'API danh sách khách sạn trả về status 200': (r) => r.status === 200,
    'Thời gian phản hồi của API < 1s': (r) => r.timings.duration < 1000,
  });

  // Nghỉ giữa các request để mô phỏng hành vi người dùng thực
  sleep(Math.random() * 3 + 1); // Nghỉ từ 1-4 giây 
} 