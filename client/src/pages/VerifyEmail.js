import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("Đang xác thực...");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        console.log("Verifying with token:", token);
        const res = await fetch(`http://localhost:8800/api/auth/verify/${token}`, {
            method: "GET",
            credentials: "include", // Đảm bảo gửi cookie
          });
          
        const data = await res.json();
        if (data.success) {
          setMessage("Xác thực email thành công! Chuyển hướng...");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setMessage(data.message || "Xác thực thất bại!");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setMessage("Lỗi kết nối server!");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="verify-container">
      <h2>Xác thực Email</h2>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;
