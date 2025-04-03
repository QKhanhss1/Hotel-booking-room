@echo off
echo ===================================
echo Bắt đầu kiểm tra tải Secondbooking
echo ===================================

echo.
echo 1. Kiểm tra trang chủ và API danh sách khách sạn
echo -----------------------------------------------
k6 run homepage-load-test.js

echo.
echo 2. Kiểm tra trang chi tiết khách sạn và tìm kiếm
echo -----------------------------------------------
k6 run hotel-detail-search-test.js

echo.
echo 3. Kiểm tra đăng nhập và tính năng yêu thích
echo -----------------------------------------------
k6 run auth-favorites-test.js

echo.
echo 4. Kiểm tra đặt phòng và thanh toán
echo -----------------------------------------------
k6 run booking-test.js

echo.
echo ===============================
echo Hoàn thành tất cả kiểm tra tải
echo =============================== 