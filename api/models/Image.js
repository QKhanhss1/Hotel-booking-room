import mongoose from 'mongoose';

// Định nghĩa schema cho ảnh
const imageSchema = new mongoose.Schema({
    name: String,
    img: {
        data: Buffer,
        contentType: String,
    },
});

// Tạo và xuất model
const Image = mongoose.model('Image', imageSchema);
export default Image;