import User from "../models/User.js";
import bcrypt from "bcryptjs";
import uniqid from "uniqid";
import { sendMail } from "../utils/sendMail.js";
import emailValidator from 'email-validator';
import { OAuth2Client } from 'google-auth-library';
import { createError } from "../utils/error.js";
import { fileURLToPath } from 'url';
import path from "path";
import jwt from "jsonwebtoken";
import axios from "axios"; 
import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validateEmailWithAbstract = async (email) => {
  const API_KEY = process.env.ABSTRACT_API_KEY;
  try {
    const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${email}`);
    return response.data.is_smtp_valid.value;
  } catch (error) {
    console.error("Error checking email with Abstract API:", error);
    return false; 
  }
};

const client = new OAuth2Client(process.env.GG_CLIENT_ID);

export const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GG_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log("Google Token Payload:", payload); // Debug
    return payload;
  } catch (error) {
    console.error("Xác thực Google thất bại:", error);
    throw new Error("Xác thực Google thất bại");
  }
};


export const register = async (req, res, next) => {
  try {
    console.log("Received registration data:", req.body);

    const { username, email, phone, password } = req.body;

    if (!username || !email || !password || !phone) {
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
    }

    if (!emailValidator.validate(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return next(createError(400, "Email đã tồn tại"));

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const verificationToken = uniqid();
    console.log("Generated verification token:", verificationToken);

    res.cookie("registerToken", JSON.stringify({
      username,
      email,
      phone,
      password: hashedPassword,
      token: verificationToken,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, 
    });
    
    
    console.log("Cookie set:", res.getHeaders()["set-cookie"]);

    const verificationLink = `${process.env.URL_SERVER}/api/auth/verify/${verificationToken}`;
    console.log("Verification Link:", verificationLink);


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

     
     let user = await User.findOne({ email: registerToken.email });
     if (!user) {
       user = new User({
         username: registerToken.username,
         email: registerToken.email,
         phone: registerToken.phone,
         password: registerToken.password,
       });
 
       await user.save();
     }
 
     
     res.clearCookie("registerToken");
 
  
     const jwtToken = jwt.sign(
       { id: user._id, isAdmin: user.isAdmin, username: user.username },
       process.env.JWT,
       { expiresIn: "7d" }
     );
 
 
     res.cookie("access_token", jwtToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "Lax", 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
     console.log("User verified and logged in:", user);
 
     return res.redirect("https://localhost:3000/login");
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};

export const login = async (req, res, next) => {
  console.log("Request body login:", req.body); // Đã có, giữ lại
  console.log("Username from request body:", req.body.username); // Thêm dòng này

  try {
    const user = await User.findOne({ username: req.body.username });
    console.log("User found from database:", user); // Thêm dòng này

    if (!user) {
      console.log("User NOT found!"); // Thêm dòng này để chắc chắn log khi user không tìm thấy
      return next(createError(404, "User not found!"));
    }
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
      .json({ details: { username: user.username, ...otherDetails }, isAdmin, token });
  } catch (err) {
    next(err);
  }
};

export const facebookLogin = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;

    if (!accessToken || !userID) {
      return res.status(400).json({ message: "Thiếu accessToken hoặc userID" });
    }

    // Xác thực token với Facebook API
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${userID}?fields=id,name,email&access_token=${accessToken}`
    );

    const { id, name, email } = response.data;
    if (!id) {
      return res.status(400).json({ message: "Xác thực Facebook thất bại" });
    }

    // Kiểm tra xem user đã tồn tại chưa
    let user = await User.findOne({ facebookId: id });

    if (!user) {
      user = new User({
        username: name,
        email: email || `facebook_${id}@example.com`, // Nếu Facebook không cung cấp email
        facebookId: id,
        is_active: true,
        phone: "", 
        password: "", 
      });

      await user.save();
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, username: user.username },
      process.env.JWT,
      { expiresIn: "7d" }
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ user, token });
  } catch (err) {
    console.error("Lỗi đăng nhập Facebook:", err);
    return res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Thiếu token Google" });

    const payload = await verifyGoogleToken(token);
    if (!payload) return res.status(401).json({ message: "Token không hợp lệ" });

    const { email, name, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: name,
        email,
        is_active: true,
        googleId: sub,  // Lưu googleId vào DB
        isAdmin: false, 
      });
    }    

    const jwtToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin, username: user.username }, process.env.JWT, { expiresIn: "7d" });

    res.cookie("access_token", jwtToken, { httpOnly: true, secure: false, sameSite: "Lax", maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({ 
      user: { 
        _id: user._id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.isAdmin 
      }, 
      token: jwtToken 
    });

    return res.status(200).json({ user, token: jwtToken });
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};

