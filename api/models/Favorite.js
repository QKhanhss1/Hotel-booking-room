import mongoose from "mongoose";
const FavoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    hotels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
        required: true
    }]
},
    {
        timestamps: true
    });

export default mongoose.model("Favorite", FavoriteSchema)