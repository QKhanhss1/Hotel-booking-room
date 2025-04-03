import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Cấu hình kiểm tra
export const options = {
  // Mô phỏng đặt phòng nhiều người dùng
  stages: [
    { duration: '30s', target: 30 },  // Tăng lên 30 VU trong 30 giây
    { duration: '1m', target: 80 },   // Tăng lên 80 VU trong 1 phút
    { duration: '2m', target: 150 },  // Tăng lên 150 VU trong 2 phút
    { duration: '1m', target: 0 },    // Giảm dần về 0 VU
  ],
  thresholds: {
    http_req_duration: ['p(90)<5000'], // 90% của các request phải hoàn thành trong vòng 5 giây
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
];

// Danh sách ID khách sạn mẫu
const hotelIds = ['123456789012', '234567890123', '345678901234', '456789012345', '567890123456'];

// Danh sách ID phòng mẫu
const roomIds = [
  { _id: '123roomid1', roomId: 'room001', number: 101 },
  { _id: '123roomid2', roomId: 'room002', number: 102 },
  { _id: '123roomid3', roomId: 'room003', number: 201 },
  { _id: '123roomid4', roomId: 'room004', number: 202 },
  { _id: '123roomid5', roomId: 'room005', number: 301 },
];

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
    });
    
    try {
      const body = JSON.parse(loginResponse.body);
      if (body && body.token) {
        authToken = body.token;
      }
    } catch (e) {
      console.error('Lỗi khi parse JSON từ response đăng nhập:', e);
    }
  });
  
  // Nếu không đăng nhập thành công, bỏ qua các phần còn lại
  if (!authToken) {
    console.log('Đăng nhập thất bại, bỏ qua các bước tiếp theo');
    sleep(1);
    return;
  }
  
  sleep(1);
  
  // Chọn khách sạn và phòng ngẫu nhiên
  const randomHotelId = randomItem(hotelIds);
  const selectedRooms = [randomItem(roomIds)];
  
  // Tạo ngày bắt đầu và kết thúc
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1); // 1-30 ngày tới
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7) + 1); // Ở 1-7 ngày
  
  // Tạo booking
  group('Tạo đặt phòng', function() {
    const bookingData = {
      hotelId: randomHotelId,
      selectedRooms: selectedRooms,
      totalPrice: Math.floor(Math.random() * 5000000) + 500000, // 500,000 - 5,500,000 VND
      customer: user.username,
      paymentInfo: {
        checkinDate: startDate.toISOString(),
        checkoutDate: endDate.toISOString(),
      },
      email: `${user.username}@example.com`
    };
    
    const createBookingResponse = http.post('https://localhost:8800/api/booking/create',
      JSON.stringify(bookingData),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        insecureSkipTLSVerify: true
      }
    );
    
    check(createBookingResponse, {
      'Tạo đặt phòng có phản hồi': (r) => r.status !== 0,
      'Thời gian phản hồi < 4s': (r) => r.timings.duration < 4000,
    });
    
    let bookingId = null;
    try {
      const body = JSON.parse(createBookingResponse.body);
      if (body && body._id) {
        bookingId = body._id;
      }
    } catch (e) {
      console.error('Lỗi khi parse JSON từ response tạo booking:', e);
    }
    
    // Nếu tạo booking thành công, cập nhật trạng thái thanh toán
    if (bookingId) {
      sleep(2); // Nghỉ 2 giây trước khi thanh toán
      
      const updatePaymentResponse = http.post('https://localhost:8800/api/booking/update',
        JSON.stringify({
          bookingId: bookingId,
          paymentStatus: 'success'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          insecureSkipTLSVerify: true
        }
      );
      
      check(updatePaymentResponse, {
        'Cập nhật thanh toán có phản hồi': (r) => r.status !== 0,
        'Thời gian phản hồi < 3s': (r) => r.timings.duration < 3000,
      });
    }
  });
  
  sleep(Math.random() * 3 + 2); // Nghỉ 2-5 giây
} 