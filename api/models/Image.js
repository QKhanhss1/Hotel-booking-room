import mongoose from 'mongoose';

// Định nghĩa schema cho ảnh
const imageSchema = new mongoose.Schema({
    name: String, 
    url: String,  
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }, 
});

// Tạo và xuất model
const Image = mongoose.model('Image', imageSchema);
export default Image;