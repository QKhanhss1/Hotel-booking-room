import axios from "axios";
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./login.css";

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

  const handleClick = async (e) => {
    e.preventDefault();
    //   dispatch({ type: "LOGIN_START" });
    //   try {
    //     const res = await axios.post("/auth/login", credentials);
    //     dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
    //     navigate("/");
    //   } catch (err) {
    //     dispatch({ type: "LOGIN_FAILURE", payload: err.response.data });
    //   }
    // };
    try {
      const response = await axios.post(
        "http://localhost:8800/api/auth/login",
        {
          username: credentials.username,
          password: credentials.password,
        }
      );

      // Log để debug
      console.log("Login response:", response.data);

      if (response.data) {
        dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      dispatch({ type: "LOGIN_FAILURE", payload: err.response?.data });
    }
  };

  // Xử lý đăng nhập bằng Facebook
  const handleFacebookLogin = async () => {
    try {
      dispatch({ type: "LOGIN_START" });
      // Gọi API đăng nhập Facebook
      const res = await axios.get("/auth/facebook");
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
      navigate("/");
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE", payload: err.response.data });
    }
  };

  // Xử lý đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    try {
      dispatch({ type: "LOGIN_START" });
      // Gọi API đăng nhập Google
      const res = await axios.get("/auth/google");
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
      navigate("/");
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE", payload: err.response.data });
    }
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
          <button
            className="nut-mxh nut-facebook"
            onClick={handleFacebookLogin}
          >
            <img
              src="/assets/images/facebook1.png"
              alt="Facebook"
              className="icon-mxh"
            />
            <span className="text-nut-mxh">Facebook</span>
          </button>
          <button className="nut-mxh nut-google" onClick={handleGoogleLogin}>
            <img
              src="/assets/images/google.png"
              alt="Google"
              className="icon-mxh"
            />
            <span className="text-nut-mxh">Google</span>
          </button>
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
              <Link to="/singUp" className="lien-ket-dang-ky">
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
