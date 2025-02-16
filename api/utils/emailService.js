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

export const sendBookingConfirmation = async (booking, recipientEmail) => {
  try {
    // Đảm bảo booking đã được populate đầy đủ
    const populatedBooking = await booking.populate([
      {
        path: 'hotelId',
        select: 'name address' 
      },
      {
        path: 'selectedRooms.roomId',
        select: 'roomNumber' 
      }
    ]);

    const checkinDate = new Date(booking.paymentInfo.checkinDate).toLocaleDateString('vi-VN');
    const checkoutDate = new Date(booking.paymentInfo.checkoutDate).toLocaleDateString('vi-VN');

    const mailOptions = {
      from: '"Hotel Booking" <your-email@gmail.com>', 
      to: recipientEmail,
      subject: 'Xác nhận đặt phòng thành công',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0071c2;">Xác nhận đặt phòng thành công</h2>
          <p>Cảm ơn bạn đã đặt phòng tại khách sạn của chúng tôi!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333;">Chi tiết đặt phòng:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>Mã đặt phòng: ${populatedBooking._id}</li>
              <li>Khách sạn: ${populatedBooking.hotelId.name}</li>
              <li>Địa chỉ: ${populatedBooking.hotelId.address}</li>
              <li>Ngày check-in: ${checkinDate}</li>
              <li>Ngày check-out: ${checkoutDate}</li>
              <li>Tổng tiền: ${populatedBooking.totalPrice.toLocaleString('vi-VN')} VND</li>
            </ul>

            <h3 style="color: #333;">Phòng đã đặt:</h3>
            <ul style="list-style: none; padding: 0;">
              ${populatedBooking.selectedRooms.map(room => `
                <li>Số phòng: ${room.roomNumber}</li>
              `).join('')}
            </ul>
          </div>

          <p style="color: #666;">Vui lòng giữ email này để tham khảo.</p>
          <p style="color: #666;">Nếu bạn có bất kỳ câu hỏi nào, xin vui lòng liên hệ với chúng tôi.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888;">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', recipientEmail);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 