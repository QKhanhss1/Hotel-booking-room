import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { SharedArray } from 'k6/data';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Cấu hình kiểm tra
export const options = {
  // Mô phỏng 200 người dùng đăng nhập đồng thời (giới hạn ít hơn vì đây là tính năng xác thực)
  stages: [
    { duration: '30s', target: 50 },  // Tăng lên 50 VU trong 30 giây
    { duration: '1m', target: 100 },  // Tăng lên 100 VU trong 1 phút
    { duration: '1m', target: 200 },  // Tăng lên 200 VU trong 1 phút
    { duration: '2m', target: 200 },  // Duy trì 200 VU trong 2 phút
    { duration: '30s', target: 0 },   // Giảm dần về 0 VU
  ],
  thresholds: {
    http_req_duration: ['p(90)<4000'], // 90% của các request phải hoàn thành trong vòng 4 giây
    http_req_failed: ['rate<0.15'],    // Tỉ lệ thất bại nhỏ hơn 15%
  },
};

// Danh sách người dùng mẫu để đăng nhập
const users = [
  { username: 'user1', password: 'password1' },
  { username: 'user2', password: 'password2' },
  { username: 'user3', password: 'password3' },
  { username: 'user4', password: 'password4' },
  { username: 'user5', password: 'password5' },
  // Trong thực tế, bạn cần thay thế bằng tài khoản thật
];

// Danh sách ID khách sạn mẫu
const hotelIds = ['123456789012', '234567890123', '345678901234', '456789012345', '567890123456'];

export default function () {
  // Chọn người dùng ngẫu nhiên
  const user = randomItem(users);
  let authToken = null;
  
  // Đăng nhập
  group('Đăng nhập', function() {
    const loginResponse = http.post('https://localhost:8800/api/auth/login', JSON.stringify({
      username: user.username,
      password: user.password
    }), {
      headers: { 'Content-Type': 'application/json' },
      insecureSkipTLSVerify: true
    });
    
    check(loginResponse, {
      'Đăng nhập thành công': (r) => r.status === 200,
      'Thời gian đăng nhập < 3s': (r) => r.timings.duration < 3000,
      'Nhận được token': (r) => {
        try {
          const body = JSON.parse(r.body);
          authToken = body.token;
          return !!authToken;
        } catch (e) {
          return false;
        }
      }
    });
  });
  
  // Nếu không đăng nhập thành công, bỏ qua các phần còn lại
  if (!authToken) {
    console.log('Đăng nhập thất bại, bỏ qua các bước tiếp theo');
    sleep(1);
    return;
  }
  
  sleep(1); // Nghỉ 1 giây sau khi đăng nhập
  
  // Lấy danh sách yêu thích
  group('Lấy danh sách yêu thích', function() {
    const favoritesResponse = http.get('https://localhost:8800/api/favorites', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      insecureSkipTLSVerify: true
    });
    
    check(favoritesResponse, {
      'Lấy danh sách yêu thích thành công': (r) => r.status === 200,
      'Thời gian phản hồi < 2s': (r) => r.timings.duration < 2000,
    });
  });
  
  sleep(1);
  
  // Thêm vào yêu thích
  group('Thêm vào yêu thích', function() {
    // Chọn một khách sạn ngẫu nhiên để thêm vào yêu thích
    const randomHotelId = randomItem(hotelIds);
    
    const addFavoriteResponse = http.post('https://localhost:8800/api/favorites', 
      JSON.stringify({ hotelId: randomHotelId }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        insecureSkipTLSVerify: true
      }
    );
    
    check(addFavoriteResponse, {
      'Thêm yêu thích thành công hoặc đã tồn tại': (r) => r.status === 200 || r.status === 400,
      'Thời gian phản hồi < 2s': (r) => r.timings.duration < 2000,
    });
  });
  
  sleep(Math.random() * 3 + 1); // Nghỉ 1-4 giây
  
  // Xóa khỏi yêu thích
  group('Xóa khỏi yêu thích', function() {
    const randomHotelId = randomItem(hotelIds);
    
    const removeFavoriteResponse = http.del(`https://localhost:8800/api/favorites/${randomHotelId}`, null, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      insecureSkipTLSVerify: true
    });
    
    check(removeFavoriteResponse, {
      'Xóa yêu thích có phản hồi': (r) => r.status !== 0,
      'Thời gian phản hồi < 2s': (r) => r.timings.duration < 2000,
    });
  });
  
  sleep(Math.random() * 3 + 2); // Nghỉ 2-5 giây
} 