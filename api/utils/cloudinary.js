import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 60000,
})

const uploadToCloudinary = (file) => {
    console.log('File path in uploadToCloudinary:', file.path); // Log file path
    console.log('File name in uploadToCloudinary:', file.filename); // Log file name
    return new Promise((resolve, reject) => {
        const retryUpload = (attempt) => {
        cloudinary.uploader.upload(file.path, {
            folder: 'Hotels',
            use_filename: true, // Giữ nguyên tên file gốc
            unique_filename: false, // Không tạo filename unique
        }, (error, result) => {
            if (error) {
                if (attempt < 3) { // retry 3 lần
                    console.log(`Retrying upload, attempt ${attempt + 1}`);
                    setTimeout(() => {
                        retryUpload(attempt + 1);
                    }, 2000); // Khoảng delay khi retry là 2s
                } else {
                    console.error("Cloudinary upload error after retries:", error);
                    reject(error);
                }
            } else {
                console.log("Cloudinary upload result:", result);
                resolve(result);
            }
        })
    };
    retryUpload(0);
    })
    
};
export { uploadToCloudinary };