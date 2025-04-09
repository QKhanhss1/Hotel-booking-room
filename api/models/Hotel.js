import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    images: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image"
    }],
  },
  {
    timestamps: true,
  }
)
const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  normalizedName: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
    enum: ['hotel', 'apartment', 'resort', 'villa', 'cabin'],
  },
  city: {
    type: String,
    required: true,
  },
  normalizedCity: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: true,
  },
  normalizedAddress: {
    type: String,
    required: false,
  },
  distance: {
    type: String,
    required: true,
  },
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
    required: false
  }],
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  amenities: {
    type: [String],
    default: []
  },
  reviews: [reviewSchema],
  numReviews: {
    type: Number,
    required: true,
    default: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: false
  }],
  cheapestPrice: {
    type: Number,
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
});

// Hàm chuẩn hóa chuỗi (bỏ dấu và chuyển thành chữ thường)
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Middleware tự động cập nhật các trường normalized trước khi lưu
HotelSchema.pre('save', function(next) {
  if (this.name) {
    this.normalizedName = normalizeString(this.name);
  }
  if (this.city) {
    this.normalizedCity = normalizeString(this.city);
  }
  if (this.address) {
    this.normalizedAddress = normalizeString(this.address);
  }
  next();
});

// Middleware để xử lý khi cập nhật
HotelSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  if (update.name) {
    update.normalizedName = normalizeString(update.name);
  }
  if (update.city) {
    update.normalizedCity = normalizeString(update.city);
  }
  if (update.address) {
    update.normalizedAddress = normalizeString(update.address);
  }
  
  next();
});

export default mongoose.model("Hotel", HotelSchema)