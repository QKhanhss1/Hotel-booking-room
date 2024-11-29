import React from "react";
import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
function Navbar() {
  const navigate = useNavigate(); // Khởi tạo useNavigate

  const handleLogout = () => {
    // Xóa thông tin người dùng khỏi local storage
    localStorage.removeItem("user"); // Hoặc sessionStorage.removeItem("user") nếu bạn sử dụng session storage

    // Chuyển hướng về trang đăng nhập
    navigate("/login"); // Thay đổi đường dẫn nếu cần
  };
  return (
    <div className="layout">
      {/* Navbar */}
      <div className="navbar">
        <input type="text" className="search-bar" placeholder="Tìm kiếm..." />
        <button className="btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <Link to="/users">
          <button className="nav-btn">Quản lý người dùng</button>
        </Link>
        <Link to="/">
          <button className="nav-btn">Quản lý khách sạn</button>
        </Link>
        <Link to="/status_room">
          <button className="nav-btn">Quản lý trạng thái phòng</button>
        </Link>
      </div>

      {/* Nội dung chính */}
      <div className="content">
        {/* <h1>Welcome to My Page</h1>
        <p>Đây là nội dung chính của trang.</p> */}
      </div>
    </div>
  );
}

export default Navbar;
