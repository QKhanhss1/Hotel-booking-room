import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    // country: {
    //   type: String,
    //   required: true,
    // },
    img: {
      type: String,
    },
    // city: {
    //   type: String,
    //   required: true,
    // },
    phone: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      default: ""
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
