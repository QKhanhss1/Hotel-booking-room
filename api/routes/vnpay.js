import express from 'express';
import config from 'config';
import crypto from 'crypto';
import moment from 'moment';
import querystring from 'qs';
import axios from 'axios'; // Thêm import axios

const router = express.Router();


// Route xử lý tạo URL thanh toán VNPay
router.post('/vnpay', (req, res) => {
    try {
        const { selectedRooms, hotelId, totalPrice } = req.body;

        // Kiểm tra tham số đầu vào
        if (!selectedRooms || !hotelId || !totalPrice) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Tạo các giá trị cần thiết
        const createDate = moment().format('YYYYMMDDHHmmss');
        const orderId = moment().format('DDHHmmss');

        // Tham số gửi tới VNPay
        const vnp_Params = {

            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: config.get('vnp_TmnCode'),
            vnp_Amount: totalPrice * 100, // Nhân 100 để chuyển sang đơn vị nhỏ nhất
            vnp_CreateDate: createDate,
            vnp_CurrCode: 'VND',
            vnp_IpAddr: req.headers['x-forwarded-for'] || req.ip,
            vnp_Locale: 'vn',
            vnp_OrderInfo: `Payment for rooms in hotel ${hotelId}`,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: config.get('vnp_ReturnUrl'),
            vnp_TxnRef: orderId,
        };

        // Tạo URL và chữ ký
        const { paymentUrl, secureHash, sortedParams } = generatePaymentUrl(vnp_Params, config.get('vnp_HashSecret'));

        console.log("Generated Secure Hash:", secureHash);
        console.log("Sorted Params:", sortedParams);

        res.json({ url: paymentUrl });
    } catch (error) {
        console.error("Error generating payment URL:", error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/create_payment_url', function (req, res, next) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let tmnCode = config.get('vnp_TmnCode');
    let secretKey = config.get('vnp_HashSecret');
    let vnpUrl = config.get('vnp_Url');
    let returnUrl = config.get('vnp_ReturnUrl');
    let orderId = moment(date).format('DDHHmmss');
    let amount = req.body.amount;

    let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: req.body.orderInfo || 'Thanh toan don hang: ' + orderId,
        vnp_OrderType: 'billpayment',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_BankCode: 'NCB' // Thêm mặc định bank code là NCB
    };

    vnp_Params = sortObject(vnp_Params);


    let signData = querystring.stringify(vnp_Params, { encode: false });

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    console.log('check vnpay')

    res.send(vnpUrl)
});

// Thêm route GET và sửa lại xử lý params
router.get('/create_payment_url', function (req, res, next) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    const { bookingId, amount } = req.query;
    
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    let orderId = moment(date).format('DDHHmmss');

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let tmnCode = config.get('vnp_TmnCode');
    let secretKey = config.get('vnp_HashSecret');
    let vnpUrl = config.get('vnp_Url');
    let returnUrl = config.get('vnp_ReturnUrl');

    let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: 'Thanh toan don hang: ' + bookingId,
        vnp_OrderType: 'billpayment',
        vnp_Amount: Number(amount) * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_BankCode: 'NCB'
    };

    vnp_Params = sortObject(vnp_Params);
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
    
    res.redirect(vnpUrl);
});

// Route xử lý phản hồi từ VNPay chỉ nên xuất hiện một lần
router.get('/vnpay_return', async function (req, res, next) {
    try {
        console.log("VNPay callback received", new Date().toISOString());
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];
        const bookingId = vnp_Params['vnp_OrderInfo'].split(': ')[1];
        const amount = vnp_Params['vnp_Amount'] / 100; // Chuyển về đơn vị gốc
        
        console.log("Processing payment for booking:", bookingId, "with amount:", amount);
        
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
        
        vnp_Params = sortObject(vnp_Params);
        
        let secretKey = config.get('vnp_HashSecret');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const responseCode = vnp_Params['vnp_ResponseCode'];
            const paymentStatus = responseCode === '00' ? 'success' : 'failed';
            
            console.log("Signature verified. Payment status:", paymentStatus);
            
            try {
                // Cập nhật trạng thái booking
                console.log("Updating booking status to:", paymentStatus);
                await axios.post('http://localhost:8800/api/booking/update', {
                    bookingId,
                    paymentStatus
                });
                
                console.log("Redirecting to frontend:", `${config.get('frontend_url')}/payment/${paymentStatus}?amount=${amount}`);
                // Thêm amount vào URL redirect
                res.redirect(`${config.get('frontend_url')}/payment/${paymentStatus}?amount=${amount}`);
            } catch (updateError) {
                console.error("Error updating booking status:", updateError);
                res.redirect(`${config.get('frontend_url')}/payment/failed`);
            }
        } else {
            console.error("Signature verification failed");
            res.redirect(`${config.get('frontend_url')}/payment/failed`);
        }
    } catch (error) {
        console.error("Error processing payment return:", error);
        res.redirect(`${config.get('frontend_url')}/payment/failed`);
    }
});

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

export default router;
