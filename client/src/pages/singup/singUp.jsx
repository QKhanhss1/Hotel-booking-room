import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./singUp.css";
import axios from "axios";

function SingUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [phone, setPhone] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [emptyError, setEmptyError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset các thông báo
    setEmptyError("");
    setLoginError("");
    setSuccessMessage("");

    if (!email || !password) {
      setEmptyError("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (password !== confirmPassword) {
      setLoginError("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      const userData = {
        username,
        email,
        phone,
        password,
      };
      console.log("Sending user data:", {
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
      });
      const response = await axios.post(
        "http://localhost:8800/api/auth/register",
        userData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Response:", response.data);
      if (response.data) {
        setSuccessMessage("Đăng ký thành công!");
        // Chờ 1 giây rồi chuyển sang trang đăng nhập
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }
    } catch (error) {
      console.error("Error details:", error);
      if (error.response) {
        console.log("Error response:", error.response.data);
        // Lỗi từ server
        setLoginError(
          error.response.data.message || "Đăng ký thất bại. Vui lòng thử lại!"
        );
      } else {
        // Lỗi kết nối
        setLoginError("Không thể kết nối đến server!");
      }
    }
  };
  // Thêm useEffect để reset data khi component mount
  useEffect(() => {
    // Reset form khi component mount
    const resetForm = () => {
      setEmail("");
      setPassword("");
      setUsername("");
      setPhone("");
      setConfirmPassword("");
      setEmptyError("");
      setLoginError("");
      setSuccessMessage("");
    };

    resetForm();
    // Xóa dòng window.location.reload(true)
  }, []);

  return (
    <div
      className="khung-dang-nhap"
      // style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="hop-dang-nhap">
        <h2 className="tieu-de-dang-nhap">ĐĂNG KÍ</h2>

        <div className="khung-nut-mxh">
          <button className="nut-mxh nut-facebook">
            {/* <span className="material-icons">facebook</span> */}
            <span className="text-nut-mxh">Facebook</span>
          </button>
          <button className="nut-mxh nut-google">
            {/* <span className="material-icons">google</span> */}
            <span className="text-nut-mxh">Google</span>
          </button>
        </div>

        <div className="duong-phan-cach">
          <span className="chu-phan-cach">Hoặc</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="nhom-truong-nhap">
            <input
              type="text"
              placeholder="Tên đăng nhập"
              className="o-nhap-lieu"
              onChange={(e) => setUsername(e.target.value)}
              autocomplete="username"
            />
          </div>

          <div className="nhom-truong-nhap">
            <input
              type="email"
              placeholder="Email"
              className="o-nhap-lieu"
              onChange={(e) => setEmail(e.target.value)}
              autocomplete="email"
            />
          </div>

          <div className="nhom-truong-nhap">
            <input
              type="text"
              placeholder="Số điện thoại"
              className="o-nhap-lieu"
              onChange={(e) => setPhone(e.target.value)}
              autocomplete="tel"
            />
          </div>

          <div className="nhom-truong-nhap">
            <input
              type="password"
              placeholder="Mật khẩu"
              className="o-nhap-lieu"
              onChange={(e) => setPassword(e.target.value)}
              autocomplete="new-password"
            />
          </div>

          <div className="nhom-truong-nhap">
            <input
              type="password"
              placeholder="Xác nhận lại mật khẩu"
              className="o-nhap-lieu"
              onChange={(e) => setConfirmPassword(e.target.value)}
              autocomplete="new-password"
            />
          </div>

          {emptyError && <p className="thong-bao-loi">{emptyError}</p>}
          {loginError && <p className="thong-bao-loi">{loginError}</p>}

          <button type="submit" className="nut-dang-nhap">
            Đăng kí
          </button>

          {successMessage && (
            <p className="thong-bao-thanh-cong">{successMessage}</p>
          )}

          <div className="khung-dang-ky">
            <span>Bạn đã có tài khoản? </span>
            <Link to="/login" className="lien-ket-dang-ky">
              Đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SingUp;
