# Kiểm tra tải cho ứng dụng Secondbooking

Bộ công cụ này được thiết kế để kiểm tra khả năng chịu tải của ứng dụng Secondbooking khi có nhiều người dùng truy cập đồng thời (lên đến 500 người dùng).

## Cài đặt k6

Để thực hiện kiểm tra tải, bạn cần cài đặt công cụ k6. Dưới đây là hướng dẫn cài đặt cho Windows:

1. Cài đặt Chocolatey (nếu chưa có):
   - Mở PowerShell dưới quyền Administrator
   - Thực thi lệnh sau:
   ```
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. Cài đặt k6:
   ```
   choco install k6
   ```

## Các kịch bản kiểm tra

Các kịch bản kiểm tra tải được tạo trong các tệp JavaScript:

1. `homepage-load-test.js` - Kiểm tra trang chủ với 500 người dùng
2. `hotel-detail-search-test.js` - Kiểm tra trang chi tiết khách sạn và tìm kiếm
3. `auth-favorites-test.js` - Kiểm tra đăng nhập và tính năng yêu thích
4. `booking-test.js` - Kiểm tra chức năng đặt phòng và thanh toán

## Chạy kiểm tra

**Lưu ý quan trọng**: Trước khi thực hiện kiểm tra, cần cập nhật các giá trị mẫu trong các tệp kịch bản:
- Danh sách ID khách sạn
- Thông tin đăng nhập người dùng
- URL API nếu khác biệt

### Các lệnh chạy kiểm tra:

1. Kiểm tra trang chủ:
   ```
   k6 run homepage-load-test.js
   ```

2. Kiểm tra trang chi tiết khách sạn và tìm kiếm:
   ```
   k6 run hotel-detail-search-test.js
   ```

3. Kiểm tra đăng nhập và tính năng yêu thích:
   ```
   k6 run auth-favorites-test.js
   ```

4. Kiểm tra đặt phòng:
   ```
   k6 run booking-test.js
   ```

5. Chạy tất cả các kiểm tra cùng một lúc:
   ```
   k6 run homepage-load-test.js hotel-detail-search-test.js auth-favorites-test.js booking-test.js
   ```

## Hiểu kết quả kiểm tra

Sau khi chạy, k6 sẽ cung cấp báo cáo với các thông số quan trọng:

- **Tỉ lệ HTTP**: Số request HTTP mỗi giây
- **Thời gian phản hồi**: Thời gian trung bình, tối thiểu, tối đa cho mỗi request
- **Tỉ lệ thất bại**: Phần trăm request không thành công
- **Thông lượng**: Dung lượng dữ liệu được trao đổi mỗi giây

Ví dụ đọc báo cáo:
```
✓ Trang chủ trả về status 200: 95%
✓ Thời gian phản hồi < 2s: 92%
```

Chỉ số này có nghĩa 95% requests trang chủ trả về status 200 và 92% phản hồi nhanh hơn 2 giây.

## Tối ưu hóa ứng dụng

Nếu kiểm tra hiệu năng cho thấy các vấn đề, đây là một số cách tối ưu hóa:

1. **Cải thiện kết nối cơ sở dữ liệu**:
   - Thêm chỉ mục (index) cho các truy vấn phổ biến
   - Sử dụng bộ nhớ đệm như Redis

2. **Tối ưu server**:
   - Tăng cấu hình phần cứng
   - Sử dụng load balancer
   - Tận dụng Node.js cluster để sử dụng nhiều CPU

3. **Tối ưu frontend**:
   - Tối ưu kích thước bundle JavaScript
   - Sử dụng mạng phân phối nội dung (CDN) cho tài nguyên tĩnh
   - Tăng cường bộ nhớ đệm trình duyệt

## Yêu cầu để hỗ trợ 500 người dùng đồng thời

Để ứng dụng có thể phục vụ 500 người dùng đồng thời, cần đảm bảo:

1. **Cơ sở dữ liệu**:
   - MongoDB Atlas M10 trở lên hoặc tương đương
   - Bộ nhớ đệm tại tầng cơ sở dữ liệu

2. **Backend**:
   - Node.js với ít nhất 4-8 CPU và 8GB RAM
   - Triển khai theo kiến trúc microservices hoặc serverless

3. **Frontend**:
   - CDN cho React bundle và tài nguyên tĩnh
   - Caching mạnh mẽ cho API responses

4. **Mạng và bảo mật**:
   - HTTPS với các chứng chỉ SSL hợp lệ
   - Bảo vệ chống DDoS 