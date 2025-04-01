import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./singUp.css";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../../utils/auth";
import { AuthContext, login } from "../../context/AuthContext"; 
import Cookies from "js-cookie";

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

    if (!username || !email || !phone || !password || !confirmPassword) {
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
        "https://localhost:8800/api/auth/register",
        userData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, 
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
        console.log("Error response:", error.response);
    
        // Kiểm tra nếu error.response.data tồn tại trước khi truy cập message
        const errorMessage = error.response.data?.message || "Đăng ký thất bại. Vui lòng thử lại!";
        setLoginError(errorMessage);
      } else {
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

const { loading, error, dispatch } = useContext(AuthContext);


   // Xử lý đăng nhập bằng Facebook
   const handleResponseFacebook = (response) => {
    if (response.authResponse) {
      console.log("Đăng nhập Facebook thành công!", response);
      // Gửi accessToken lên backend để xử lý
      const { accessToken, userID } = response.authResponse;
  
      // Gửi token lên backend để xác thực
      axios.post("https://localhost:8800/api/auth/facebook-login", { accessToken, userID })
      .then(res => {
        console.log("Dữ liệu từ server:", res.data); 
        if (res.data.token) {
          localStorage.setItem("access_token", res.data.token); 
          localStorage.setItem("user", JSON.stringify(res.data.user));
    
          console.log("Token đã lưu:", localStorage.getItem("access_token"));
          console.log("User đã lưu:", localStorage.getItem("user"));

          dispatch({ type: "LOGIN_SUCCESS", payload: res.data }); // Cập nhật context
          navigate("/"); // Chuyển về Home
        } else {
          console.error("Lỗi: Không nhận được token từ server.");
        }
      })
      .catch(err => {
        console.error("Lỗi đăng nhập Facebook:", err.response?.data || err);
      });
    } else {
      console.log("Người dùng hủy đăng nhập hoặc không cấp quyền.");
    }
  };  

  const handleFacebookLogin = () => {
    window.FB.login(handleResponseFacebook, { scope: "email,public_profile" });
  };

  const handleSuccess = async (credentialResponse) =>{
    try{
      const result = await googleLogin(credentialResponse.credential);
      console.log("Google Login Result:", result); // Debug dữ liệu trả về
      if (result?.user?.isAdmin === false) {
          dispatch({ type: "LOGIN_SUCCESS", payload: {
            user: result.user, 
            token: result.token, 
          }, });
          navigate("/");
        } else {
          alert("không có quyền truy cập");
        }
    } catch (error){
      console.error("Google Login Error:", error);
      const data = error?.response?.data;
      alert(data?.message || "đăng nhập thất bại");
    }
  };

  const handleError = () => {
    alert('Login Failed');
  };

  return (
    <div
      className="khung-dang-nhap"
      // style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="hop-dang-nhap">
        <h2 className="tieu-de-dang-nhap">ĐĂNG KÍ</h2>

        <div className="khung-nut-mxh">
        <button className="nut-mxh nut-facebook" onClick={handleFacebookLogin}>
          {/* <img src="/assets/images/facebook1.png" alt="Facebook" className="icon-mxh" /> */}
          <span className="text-nut-mxh">Facebook</span>
        </button>

          
            <GoogleOAuthProvider clientId="450363751315-u27m3q55deu9oqg5tetc5gkfoss5b846.apps.googleusercontent.com">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                />
            </GoogleOAuthProvider>
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
