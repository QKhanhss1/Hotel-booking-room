import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const register = async (req, res, next) => {
  try {
    // Log dữ liệu nhận được
    console.log("Received registration data:", req.body);

    // Kiểm tra dữ liệu đầu vào
    if (
      !req.body.username ||
      !req.body.email ||
      !req.body.password ||
      !req.body.phone
    ) {
      console.log("Missing fields:", {
        username: !req.body.username,
        email: !req.body.email,
        password: !req.body.password,
        phone: !req.body.phone,
      });
      return res.status(400).json({ message: "Missing required fields" });
    }
    // Kiểm tra username đã tồn tại
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return next(createError(400, "Tên đăng nhập đã tồn tại"));
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return next(createError(400, "Email đã tồn tại"));
    }

    // Kiểm tra kết nối database
    if (!mongoose.connection.readyState) {
      console.log("Database not connected");
      return res.status(500).json({ message: "Database connection error" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      password: hash,
    });

    // Log user trước khi save
    console.log("Attempting to save user:", newUser);

    const savedUser = await newUser.save();

    // Log sau khi save thành công
    console.log("User saved successfully:", savedUser);

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        username: savedUser.username,
        email: savedUser.email,
        phone: savedUser.phone,
      },
    });
  } catch (err) {
    // Log chi tiết lỗi
    console.error("Registration error:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });

    // Trả về lỗi cụ thể
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email hoặc số điện thoại đã được sử dụng",
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
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
      { id: user._id, isAdmin: user.isAdmin },
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
