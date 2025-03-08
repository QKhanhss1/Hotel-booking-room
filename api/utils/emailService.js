import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('Email config:', {
  user: process.env.EMAIL_USER ? 'Configured' : 'Missing',
  pass: process.env.EMAIL_APP_PASSWORD ? 'Configured' : 'Missing'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

export const sendBookingConfirmation = async (booking, email) => {
  try {
    // Populate thông tin khách sạn và phòng
    const populatedBooking = await booking.populate('hotelId', 'name address');
    const rooms = booking.selectedRooms.map(room => `Phòng ${room.roomNumber}`).join(', ');
    
    const paymentUrl = `http://localhost:8800/api/vnpay/create_payment_url?bookingId=${booking._id}&amount=${booking.totalPrice}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận đặt phòng',
      html: `
        <h2>Xác nhận đặt phòng của bạn</h2>
        <p>Cảm ơn bạn đã đặt phòng. Chi tiết đặt phòng:</p>
        <ul>
          <li>Mã đặt phòng: ${booking._id}</li>
          <li>Khách sạn: ${populatedBooking.hotelId.name}</li>
          <li>Địa chỉ: ${populatedBooking.hotelId.address}</li>
          <li>Phòng đã đặt: ${rooms}</li>
          <li>Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VND</li>
          <li>Ngày nhận phòng: ${new Date(booking.paymentInfo.checkinDate).toLocaleDateString('vi-VN')}</li>
          <li>Ngày trả phòng: ${new Date(booking.paymentInfo.checkoutDate).toLocaleDateString('vi-VN')}</li>
        </ul>
        <p>Vui lòng thanh toán trong vòng 1 phút.</p>
        <a href="${paymentUrl}" 
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Xác nhận và Thanh toán
        </a>
        <p>Nếu không thanh toán trong thời gian quy định, đơn đặt phòng sẽ tự động hủy.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

export const sendPaymentReminder = async (booking, email) => {
  try {
    const populatedBooking = await booking.populate('hotelId', 'name address');
    const rooms = booking.selectedRooms.map(room => `Phòng ${room.roomNumber}`).join(', ');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Nhắc nhở thanh toán',
      html: `
        <h2>Nhắc nhở thanh toán</h2>
        <p>Bạn còn 1 phút để hoàn tất thanh toán</p>
        <p>Chi tiết đặt phòng:</p>
        <ul>
          <li>Mã đặt phòng: ${booking._id}</li>
          <li>Khách sạn: ${populatedBooking.hotelId.name}</li>
          <li>Địa chỉ: ${populatedBooking.hotelId.address}</li>
          <li>Phòng đã đặt: ${rooms}</li>
          <li>Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</li>
        </ul>
        <a href="${process.env.CLIENT_URL}/booking/payment/${booking._id}">Nhấn vào đây để thanh toán</a>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
};

export const sendPaymentTimeout = async (booking, email) => {
  try {
    const populatedBooking = await booking.populate('hotelId', 'name address');
    const rooms = booking.selectedRooms.map(room => `Phòng ${room.roomNumber}`).join(', ');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Đặt phòng đã hết hạn',
      html: `
        <h2>Đặt phòng đã hết hạn</h2>
        <p>Rất tiếc, thời gian thanh toán đã hết hạn</p>
        <p>Chi tiết đặt phòng:</p>
        <ul>
          <li>Mã đặt phòng: ${booking._id}</li>
          <li>Khách sạn: ${populatedBooking.hotelId.name}</li>
          <li>Địa chỉ: ${populatedBooking.hotelId.address}</li>
          <li>Phòng đã đặt: ${rooms}</li>
          <li>Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</li>
        </ul>
        <p>Vui lòng thực hiện đặt phòng mới nếu bạn vẫn muốn đặt phòng.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending timeout email:', error);
  }
};