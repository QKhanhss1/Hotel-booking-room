import mongoose from "mongoose";
const BookingSchema = new mongoose.Schema({
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel', 
        required: true,
    },
    selectedRooms: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
    }],
    totalPrice: {
        type: Number, 
        required: true,
    },
    paymentStatus: {
        type: String, 
        enum: ['pending', 'success', 'failed'],
        default: 'pending', 
    },
    paymentDate: {
        type: Date, 
        default: Date.now,
    },
    bookingDate: {
        type: Date,
        default: Date.now,
    },
    transactionRef: {
        type: String, 
    },
    paymentInfo: {
        type: Map,
        of: String, 
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
},
    {
        timestamps: true
    });

export default mongoose.model("Booking", BookingSchema)