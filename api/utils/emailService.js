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
    const populatedBooking = await booking.populate([
      { path: 'hotelId', select: 'name address' },
      { path: 'selectedRooms.roomId', select: 'title maxPeople' }
    ]);
    
    // Tạo danh sách phòng với thông tin số người
    const roomsList = populatedBooking.selectedRooms.map(room => {
      const roomInfo = room.roomId;
      return `Phòng ${room.roomNumber} (${roomInfo?.title || 'Phòng khách sạn'}) - Tối đa ${roomInfo?.maxPeople || 2} người`;
    }).join('<br>');
    
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
          <li>Phòng đã đặt:</li>
        </ul>
        <div style="margin-left: 20px;">
          ${roomsList}
        </div>
        <ul>
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
    const populatedBooking = await booking.populate([
      { path: 'hotelId', select: 'name address' },
      { path: 'selectedRooms.roomId', select: 'title maxPeople' }
    ]);
    
    // Tạo danh sách phòng với thông tin số người
    const roomsList = populatedBooking.selectedRooms.map(room => {
      const roomInfo = room.roomId;
      return `Phòng ${room.roomNumber} (${roomInfo?.title || 'Phòng khách sạn'}) - Tối đa ${roomInfo?.maxPeople || 2} người`;
    }).join('<br>');

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
          <li>Phòng đã đặt:</li>
        </ul>
        <div style="margin-left: 20px;">
          ${roomsList}
        </div>
        <ul>
          <li>Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</li>
          <li>Ngày nhận phòng: ${new Date(booking.paymentInfo.checkinDate).toLocaleDateString('vi-VN')}</li>
          <li>Ngày trả phòng: ${new Date(booking.paymentInfo.checkoutDate).toLocaleDateString('vi-VN')}</li>
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
    const populatedBooking = await booking.populate([
      { path: 'hotelId', select: 'name address' },
      { path: 'selectedRooms.roomId', select: 'title maxPeople' }
    ]);
    
    // Tạo danh sách phòng với thông tin số người
    const roomsList = populatedBooking.selectedRooms.map(room => {
      const roomInfo = room.roomId;
      return `Phòng ${room.roomNumber} (${roomInfo?.title || 'Phòng khách sạn'}) - Tối đa ${roomInfo?.maxPeople || 2} người`;
    }).join('<br>');

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
          <li>Phòng đã đặt:</li>
        </ul>
        <div style="margin-left: 20px;">
          ${roomsList}
        </div>
        <ul>
          <li>Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</li>
          <li>Ngày nhận phòng: ${new Date(booking.paymentInfo.checkinDate).toLocaleDateString('vi-VN')}</li>
          <li>Ngày trả phòng: ${new Date(booking.paymentInfo.checkoutDate).toLocaleDateString('vi-VN')}</li>
        </ul>
        <p>Vui lòng thực hiện đặt phòng mới nếu bạn vẫn muốn đặt phòng.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending timeout email:', error);
  }
};

export const sendPaymentSuccess = async (booking, email) => {
  try {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('Invalid email for payment success notification:', email);
      return;
    }

    console.log(`Sending payment success email to ${email} for booking ${booking._id}`);

    // Populate thông tin khách sạn và phòng
    const populatedBooking = await booking.populate([
      { path: 'hotelId', select: 'name address' },
      { path: 'selectedRooms.roomId', select: 'title maxPeople' }
    ]);
    
    // Tạo danh sách phòng với thông tin số người
    const roomsList = populatedBooking.selectedRooms.map(room => {
      const roomInfo = room.roomId;
      return `Phòng ${room.roomNumber} (${roomInfo?.title || 'Phòng khách sạn'}) - Tối đa ${roomInfo?.maxPeople || 2} người`;
    }).join('<br>');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận đặt phòng của bạn',
      html: `
        <h2>Xác nhận đặt phòng của bạn</h2>
        <p>Cảm ơn bạn đã đặt phòng. Chi tiết đặt phòng:</p>
        <ul>
          <li>Mã đặt phòng: ${booking._id}</li>
          <li>Khách sạn: ${populatedBooking.hotelId.name}</li>
          <li>Địa chỉ: ${populatedBooking.hotelId.address}</li>
          <li>Phòng đã đặt:</li>
        </ul>
        <div style="margin-left: 20px;">
          ${roomsList}
        </div>
        <ul>
          <li>Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VND</li>
          <li>Ngày nhận phòng: ${new Date(booking.paymentInfo.checkinDate).toLocaleDateString('vi-VN')}</li>
          <li>Ngày trả phòng: ${new Date(booking.paymentInfo.checkoutDate).toLocaleDateString('vi-VN')}</li>
        </ul>
        <p>Vui lòng mang theo thông tin xác nhận này khi đến nhận phòng.</p>
        <p>Mọi thắc mắc xin vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment success email sent to:', email);
  } catch (error) {
    console.error('Error sending payment success email:', error);
  }
};

export const sendBookingCancellation = async (booking, email) => {
  try {
    // Populate thông tin khách sạn và phòng
    const populatedBooking = await booking.populate([
      { path: 'hotelId', select: 'name address' },
      { path: 'selectedRooms.roomId', select: 'title maxPeople' }
    ]);
    
    // Tạo danh sách phòng với thông tin số người
    const roomsList = populatedBooking.selectedRooms.map(room => {
      const roomInfo = room.roomId;
      return `Phòng ${room.roomNumber} (${roomInfo?.title || 'Phòng khách sạn'}) - Tối đa ${roomInfo?.maxPeople || 2} người`;
    }).join('<br>');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thông báo hủy đặt phòng',
      html: `
        <h2>Thông báo hủy đặt phòng</h2>
        <p>Đặt phòng của bạn đã bị hủy. Chi tiết đặt phòng:</p>
        <ul>
          <li>Mã đặt phòng: ${booking._id}</li>
          <li>Khách sạn: ${populatedBooking.hotelId.name}</li>
          <li>Địa chỉ: ${populatedBooking.hotelId.address}</li>
          <li>Phòng đã hủy:</li>
        </ul>
        <div style="margin-left: 20px;">
          ${roomsList}
        </div>
        <ul>
          <li>Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VND</li>
          <li>Ngày nhận phòng dự kiến: ${new Date(booking.paymentInfo.checkinDate).toLocaleDateString('vi-VN')}</li>
          <li>Ngày trả phòng dự kiến: ${new Date(booking.paymentInfo.checkoutDate).toLocaleDateString('vi-VN')}</li>
        </ul>
        <p>Nếu bạn có bất kỳ thắc mắc nào về việc hủy đặt phòng này, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Booking cancellation email sent to:', email);
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
  }
};