import mongoose from "mongoose";
const { Schema } = mongoose;

const RoomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    maxPeople: {
      type: Number,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    imageIds: {
      type: Array,
      default: [],
    },
    roomNumbers: [{ number: Number, unavailableDates: {type: [Date]}}],
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true
    },
    images: {
      type: [String],
      default: []
    },
    amenities: {
      type: [String],
      default: []
    },
    roomSize: {
      type: String,
      default: "30"
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Thêm pre-save middleware để đảm bảo hotelId hợp lệ
RoomSchema.pre('save', async function(next) {
  try {
    const hotel = await mongoose.model('Hotel').findById(this.hotelId);
    if (!hotel) {
      throw new Error('Hotel not found');
    }
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("Room", RoomSchema);
