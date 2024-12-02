import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const { user, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRegister = () => {
    navigate("/signUp");
  };
  const handleLogin = () => {
    navigate("/login");
  };
  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/"); 
  };

  // Thêm hàm điều hướng đến trang Yêu thích
  const handleFavorites = () => {
    navigate("/favorites");
  };
  //lịch sử đặt phòng
  const handleBooking = () => {
    navigate("/booking");
  }

  return (
    <div className="navbar">
      <div className="navContainer">
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
          <span className="logo">SECONDBOOKING</span>
        </Link>
        {console.log("USER DETAILS", user)}
        {user && user.details ? (
          <div className="userMenu">
            <span
              className="userName"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user.details.username}
            </span>
            {dropdownOpen && (
              <div className="dropdownMenu">
                <button className="logoutButton" onClick={handleLogout}>
                  Đăng xuất
                </button>
                <button className="favoriteButton" onClick={handleFavorites}>
                  Yêu thích
                </button>
                <button className="bookingButton" onClick={handleBooking}>
                  Lịch sử đặt phòng
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="navItems">
            <button className="navButton" onClick={handleRegister}>
              Register
            </button>
            <button className="navButton" onClick={handleLogin}>
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
