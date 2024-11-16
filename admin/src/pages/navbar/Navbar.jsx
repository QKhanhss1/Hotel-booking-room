import React from "react";
import "./navbar.css";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="layout">
      {/* Navbar */}
      <div className="navbar">
        <input type="text" className="search-bar" placeholder="Tìm kiếm..." />
        <button className="btn">Đăng xuất</button>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
      <Link to="/users">
          <button className="nav-btn">Quản lý người dùng</button>
        </Link>
        <Link to="/">
          <button className="nav-btn">Quản lý khách sạn</button>
        </Link>
        <Link to="/room">
          <button className="nav-btn">Quản lý phòng khách sạn</button>
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
