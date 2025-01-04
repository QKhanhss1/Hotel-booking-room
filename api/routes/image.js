import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
const router = express.Router();
import Image from '../models/Image.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';




// Cấu hình multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Đường dẫn lưu file tạm thời
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Tên file sau khi upload
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.array('images'), async (req, res) => {
    try {
        console.log('req.files:', req.files);
        if (!req.files || req.files.length === 0) {
            console.log('No file received from client');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const uploadPromises = req.files.map(async (file) => {
            // console.log('File path:', file.path);
            // console.log('File name:', file.filename);
            const cloudinaryResult = await uploadToCloudinary(file).catch(error => {
                console.error('Error uploading to cloudinary', error);
                throw new Error('Cloudinary upload failed');
            });
            const newImage = new Image({
                name: file.filename,
                url: cloudinaryResult.secure_url,
            });
            const savedImage = await newImage.save().catch(error => {
                console.error("MongoDB Error:", error);
               throw error;
             });
             console.log('savedImage', savedImage);
             // Xóa file tạm thời sau khi upload thành công
            fs.unlink(file.path, (err) => {
                if (err) {
                    console.error("Error deleting temporary file:", err);
                } else {
                    console.log("Temporary file deleted successfully");
                }
            });
            return savedImage
        })
        const savedImages = await Promise.all(uploadPromises);
        res.json(savedImages);
    } catch (error) {
        console.error('Overall Error:', error.message);
        res.status(500).json({ error: 'Failed to upload image', details: error.message });
    }
});



// Route GET
router.get('/images/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        res.json({ imageUrl: image.url }); 
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
});

export default router;