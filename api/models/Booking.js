import mongoose from "mongoose";
const BookingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    selectedRooms: [
      {
        roomId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Room",
          required: true,
        },
        roomNumber: {
          type: Number,
          required: true,
        },
        idRoomNumber:{
          type: String,
          required: true,
        }
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    paymentInfo: {
      checkinDate: { type: Date },
      checkoutDate: { type: Date },
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
BookingSchema.methods.setPaymentInfo = function (checkinDate, checkoutDate) {
  this.paymentInfo.checkinDate = checkinDate;
  this.paymentInfo.checkoutDate = checkoutDate;
};

export default mongoose.model("Booking", BookingSchema);
