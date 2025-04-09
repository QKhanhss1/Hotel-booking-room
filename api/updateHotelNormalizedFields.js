import mongoose from "mongoose";
import dotenv from "dotenv";
import Hotel from "./models/Hotel.js";

dotenv.config();

// Hàm chuẩn hóa chuỗi (bỏ dấu và chuyển thành chữ thường)
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Kết nối với MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Cập nhật các trường normalized cho tất cả khách sạn
const updateNormalizedFields = async () => {
  try {
    console.log("Đang cập nhật trường dữ liệu chuẩn hóa cho tất cả khách sạn...");
    
    // Lấy tất cả khách sạn
    const hotels = await Hotel.find({});
    console.log(`Tìm thấy ${hotels.length} khách sạn cần cập nhật`);
    
    // Cập nhật từng khách sạn
    for (const hotel of hotels) {
      hotel.normalizedName = normalizeString(hotel.name);
      hotel.normalizedCity = normalizeString(hotel.city);
      hotel.normalizedAddress = normalizeString(hotel.address);
      
      await hotel.save();
      console.log(`Đã cập nhật khách sạn: ${hotel.name}`);
    }
    
    console.log("Hoàn tất cập nhật tất cả khách sạn!");
  } catch (error) {
    console.error("Lỗi khi cập nhật:", error);
  }
};

// Chạy script
const main = async () => {
  await connectDB();
  await updateNormalizedFields();
  process.exit(0);
};

main(); 