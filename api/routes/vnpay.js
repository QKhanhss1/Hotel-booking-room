import express from 'express';
import config from 'config';
import crypto from 'crypto';

const router = express.Router();

// VNPay Payment route
router.post('/vnpay', (req, res) => {
    try {
        const { selectedRooms, hotelId, totalPrice } = req.body;
        const transactionId = `VNPAY${Date.now()}`; // ID giao dịch duy nhất
        if (!selectedRooms || !hotelId || !totalPrice) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        // Your VNPay payment logic here
        const vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: config.get('vnp_TmnCode'),
            vnp_Amount: totalPrice * 100, // Convert amount to VND (VNPay expects the value in cents)
            vnp_CreateDate: new Date().toISOString().replace(/[-T:.Z]/g, ''),
            vnp_CurrCode: 'VND',
            vnp_IpAddr: req.ip,
            vnp_Locale: 'vn',
            vnp_OrderInfo: `Payment for rooms in hotel ${hotelId}`,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: config.get('vnp_ReturnUrl'),
            vnp_TxnRef: crypto.randomBytes(10).toString('hex'),
        };

        // Create the secure hash
        const queryString = new URLSearchParams(vnp_Params).toString();
        const hashData = config.get('vnp_HashSecret') + queryString;
        vnp_Params.vnp_SecureHash = crypto.createHash('sha256').update(hashData).digest('hex');

        // Send the response with the VNPay URL
        res.json({ url: `${config.get('vnp_Url')}?${new URLSearchParams(vnp_Params)}` });

    } catch (error) {
        console.error("Error processing VNPay payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.post('/vnpay_return', (req, res) => {
    const vnp_SecureHash = req.body.vnp_SecureHash;
    const vnp_Params = req.body;

    // Tạo lại chuỗi hash với tham số từ VNPay và so sánh với vnp_SecureHash
    const queryString = new URLSearchParams(vnp_Params).toString();
    const hashData = config.get('vnp_HashSecret') + queryString;
    const checkSecureHash = crypto.createHash('sha256').update(hashData).digest('hex');

    if (checkSecureHash !== vnp_SecureHash) {
        return res.status(400).json({ error: "Invalid secure hash" });
    }

    // Kiểm tra trạng thái giao dịch
    if (vnp_Params.vnp_ResponseCode === '00') {
        // Giao dịch thành công
        res.send('Payment successful');
    } else {
        // Giao dịch không thành công
        res.send('Payment failed');
    }
});

export default router;
