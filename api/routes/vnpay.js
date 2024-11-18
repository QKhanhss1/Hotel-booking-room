import express from 'express';
import config from 'config';
import crypto from 'crypto';
import moment from 'moment';
import querystring from 'qs';

const router = express.Router();

// Hàm sắp xếp tham số theo thứ tự tăng dần (A-Z)
const sortObject = (obj) => {
    const sorted = {};
    Object.keys(obj)
        .sort()
        .forEach((key) => {
            sorted[key] = obj[key]; // Không encode ở đây
        });
    return sorted;
};

// Hàm tạo Secure Hash
const createSecureHash = (params, secretKey) => {
    // Lọc chỉ tham số bắt đầu với "vnp_"
    const filteredParams = {};
    Object.keys(params)
        .filter(key => key.startsWith('vnp_'))
        .sort()
        .forEach(key => {
            filteredParams[key] = params[key]; // Không encode
        });

    const queryString = querystring.stringify(filteredParams, { encode: false }); // Không mã hóa
    console.log("String to Sign:", queryString); // Kiểm tra chuỗi ký

    const hmac = crypto.createHmac('sha512', secretKey);
    return hmac.update(queryString).digest('hex');
};

// Route xử lý tạo URL thanh toán VNPay
router.post('/vnpay', (req, res) => {
    const { selectedRooms, hotelId, totalPrice } = req.body;

    if (!selectedRooms || !hotelId || !totalPrice) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const createDate = moment().format('YYYYMMDDHHmmss');
    const orderId = moment().format('DDHHmmss');

    const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: config.get('vnp_TmnCode'),
        vnp_Amount: totalPrice * 100,
        vnp_CreateDate: createDate,
        vnp_CurrCode: 'VND',
        vnp_IpAddr: req.headers['x-forwarded-for'] || req.ip,  // Lấy địa chỉ IP thực tế của client
        vnp_Locale: 'vn',
        vnp_OrderInfo: `Payment for rooms in hotel ${hotelId}`,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: config.get('vnp_ReturnUrl'),
        vnp_TxnRef: orderId,
    };

    const secureHash = createSecureHash(vnp_Params, config.get('vnp_HashSecret'));
    
    vnp_Params['vnp_SecureHash'] = secureHash;

    const paymentUrl = `${config.get('vnp_Url')}?${querystring.stringify(vnp_Params, { encode: false })}`;
    res.json({ url: paymentUrl });
});

// Route xử lý phản hồi từ VNPay
router.post('/vnpay_return', (req, res) => {
    const { vnp_SecureHash, ...vnp_Params } = req.body;

    console.log("VNPay Response:", vnp_Params);

    const secureHash = createSecureHash(vnp_Params, config.get('vnp_HashSecret'));
    console.log("Generated Secure Hash:", secureHash);
    console.log("VNPay Secure Hash:", vnp_SecureHash);

    if (secureHash !== vnp_SecureHash) {
        return res.status(400).json({ error: 'Invalid Secure Hash' });
    }

    if (vnp_Params.vnp_ResponseCode === '00') {
        res.json({ message: 'Payment successful', data: vnp_Params });
    } else {
        res.json({ message: 'Payment failed', data: vnp_Params });
    }
});

export default router;
