import axios from "axios";
import React, { useState, useContext } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate, Link } from "react-router-dom";
import { googleLogin } from "../../utils/auth";
import "./login.css";
import environment from'../../environments/environment';
import { AuthContext, login } from "../../context/AuthContext"; 

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: undefined,
    password: undefined,
  });

  const { loading, error, dispatch } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleClick = (e) => {
    e.preventDefault();
    console.log("Login attempt with:", credentials);
    
    axios
      .post("https://localhost:8800/api/auth/login", {
        username: credentials.username,
        password: credentials.password,
      })
      .then((res) => {
        console.log("Login response:", res.data);
        if (res.data) {
          const { details, token } = res.data;
          console.log("User details:", details);
          console.log("Token from login:", token);
          
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: details,
              token: token,
            },
          });
          
          // Verify what's in localStorage after dispatch
          setTimeout(() => {
            console.log("LocalStorage after login:", {
              user: localStorage.getItem("user"),
              token: localStorage.getItem("token")
            });
          }, 100);
          
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        dispatch({ type: "LOGIN_FAILURE", payload: err.response?.data });
      });
  };

  
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
          dispatch({ 
            type: "LOGIN_SUCCESS", 
            payload: {
              user: res.data.user,
              token: res.data.token
            }
          }); // Cập nhật context
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

  // Xử lý quên mật khẩu
  const [email, setEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/forgot-password", { email });
      setResetMessage("Link đặt lại mật khẩu đã được gửi đến email của bạn!");
    } catch (err) {
      setResetMessage(err.response.data.message || "Có lỗi xảy ra!");
    }
  };

  return (
    <div
      className="khung-dang-nhap"
      style={{ backgroundImage: "url('/assets/images/nen.png')" }}
    >
      <div className="hop-dang-nhap">
        <h1 className="tieu-de-dang-nhap">Đăng nhập</h1>

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
          <span className="chu-phan-cach">hoặc</span>
        </div>

        {!showForgotPassword ? (
          <form>
            <div className="nhom-truong-nhap">
              <input
                type="text"
                placeholder="Tên đăng nhập"
                id="username"
                onChange={handleChange}
                className="o-nhap-lieu"
              />
            </div>

            <div className="nhom-truong-nhap">
              <input
                type="password"
                placeholder="Mật khẩu"
                id="password"
                onChange={handleChange}
                className="o-nhap-lieu"
                autoComplete="current-password"
              />
            </div>

            <div className="quen-mat-khau">
              <a
                href="#"
                className="lien-ket-quen-mk"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotPassword(true);
                }}
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              disabled={loading}
              onClick={handleClick}
              className="nut-dang-nhap"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            {error && (
              <span
                style={{ color: "red", textAlign: "center", display: "block" }}
              >
                {error.message}
              </span>
            )}

            <div className="khung-dang-ky">
              Chưa có tài khoản?
              <Link to="/signUp" className="lien-ket-dang-ky">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <div className="nhom-truong-nhap">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="o-nhap-lieu"
                required
              />
            </div>

            <button type="submit" className="nut-dang-nhap">
              Gửi link đặt lại mật khẩu
            </button>

            {resetMessage && (
              <span
                style={{
                  color: resetMessage.includes("lỗi") ? "red" : "green",
                  textAlign: "center",
                  display: "block",
                }}
              >
                {resetMessage}
              </span>
            )}

            <div className="quen-mat-khau">
              <a
                href="#"
                className="lien-ket-quen-mk"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotPassword(false);
                }}
              >
                Quay lại đăng nhập
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
