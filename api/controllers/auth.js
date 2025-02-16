import User from "../models/User.js";
import bcrypt from "bcryptjs";
import uniqid from "uniqid";
import { sendMail } from "../utils/sendMail.js";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

export const register = async (req, res, next) => {
  try {
    console.log("Received registration data:", req.body);

    const { username, email, phone, password } = req.body;

    if (!username || !email || !password || !phone) {
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return next(createError(400, "Email đã tồn tại"));

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // **Tạo token xác thực**
    const verificationToken = uniqid();
    console.log("Generated verification token:", verificationToken);

    // **Lưu token vào cookie**
    res.cookie("registerToken", JSON.stringify({
      username,
      email,
      phone,
      password: hashedPassword,
      token: verificationToken,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // Chỉ bật nếu chạy HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 phút
    });
    
    
    console.log("Cookie set:", res.getHeaders()["set-cookie"]);

    // **Tạo link xác thực**
    const verificationLink = `${process.env.URL_SERVER}/api/auth/verify/${verificationToken}`;
    console.log("Verification Link:", verificationLink);

    // **Gửi email**
    const emailContent = `
      <h2>Xác nhận đăng ký tài khoản</h2>
      <p>Nhấn vào link dưới đây để hoàn tất đăng ký:</p>
       <p><a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác thực tài khoản</a></p>
      <p>Link này sẽ hết hạn sau 15 phút.</p>
    `;

    await sendMail({ email, subject: "Xác thực tài khoản", html: emailContent });

    return res.json({
      success: true,
      message: "Vui lòng kiểm tra email để kích hoạt tài khoản.",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    console.log("Received token from URL:", req.params.token);
    console.log("All cookies:", req.cookies);

    const { token } = req.params;

    let registerToken = req.cookies?.registerToken || null;
    if (!registerToken) {
      return res.status(400).json({ message: "Không tìm thấy token trong cookies" });
    }

    try {
      registerToken = JSON.parse(registerToken);
    } catch (error) {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }

    if (registerToken.token !== token) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    console.log("User data from cookie:", registerToken);

    const newUser = new User({
      username: registerToken.username,
      email: registerToken.email,
      phone: registerToken.phone,
      password: registerToken.password,
    });

    await newUser.save();
    res.clearCookie("registerToken");

    return res.json({ success: true, message: "Tài khoản đã được kích hoạt thành công!" });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return next(createError(404, "User not found!"));

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect)
      return next(createError(400, "Wrong password or username!"));

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, username: user.username, },
      process.env.JWT
    );

    const { password, isAdmin, ...otherDetails } = user._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin, token });
  } catch (err) {
    next(err);
  }
};