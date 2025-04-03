import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const { user, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Kiểm tra và log chi tiết thông tin người dùng
    const localStorageUser = localStorage.getItem("user");
    console.log("LocalStorage user raw:", localStorageUser);
    
    if (localStorageUser) {
      try {
        const parsedUser = JSON.parse(localStorageUser);
        console.log("Parsed user object:", parsedUser);
        console.log("User object properties:", Object.keys(parsedUser));
        console.log("Username property:", parsedUser.username || parsedUser.name || "không có thuộc tính username");
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    }
    
    console.log("AuthContext user:", user);
    if (user) {
      console.log("AuthContext user properties:", Object.keys(user));
      console.log("AuthContext username:", user.username || user.name || "không có thuộc tính username");
    }
  }, [user]);

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
        {user ? (
          <div className="userMenu">
            <span
              className="userName"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user.username || user.name || "User"}
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