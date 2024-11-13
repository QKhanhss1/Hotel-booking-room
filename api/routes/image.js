import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
const router = express.Router();
import Image from '../models/Image.js';
const app = express();

// Cấu hình multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// Định nghĩa route cho /upload
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const newImage = new Image({
            name: req.body.name,
            img: {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            },
        });
        const savedImage = await newImage.save();
        res.json(savedImage); 
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Route GET để lấy ảnh theo ID và trả về dữ liệu nhị phân của ảnh
router.get('/images/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Đặt Content-Type dựa trên loại ảnh được lưu
        res.set('Content-Type', image.img.contentType);
        // Gửi dữ liệu ảnh nhị phân
        res.send(image.img.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
});
export default router;
