import React, { useEffect } from 'react';

const DialogflowChatbot = () => {
    useEffect(() => {
        // Kiểm tra xem script đã được load chưa để tránh load lại nhiều lần
        if (!document.querySelector('script[src*="dialogflow-console/fast/messenger/bootstrap.js"]')) {
            const script = document.createElement('script');
            script.src = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
            script.onload = () => {
                // Script đã load xong, có thể thực hiện các hành động sau khi load nếu cần
                console.log('Dialogflow Messenger script loaded.');
            };
            script.onerror = () => {
                console.error('Failed to load Dialogflow Messenger script.');
            };
            document.body.appendChild(script); // Thêm script vào cuối body
        }
    }, []); // [] dependency rỗng đảm bảo useEffect chỉ chạy một lần sau lần render đầu tiên

    return (
        <df-messenger
            chat-title="SecondBooking"  // Thay đổi tiêu đề chat nếu muốn
            agent-id="d0fc0965-2bc0-436e-9fbb-c55e1cc925fe" // **Quan trọng: Thay bằng Agent ID của bạn**
            language-code="vi"         // Mã ngôn ngữ, "vi" cho tiếng Việt
        ></df-messenger>
    );
};

export default DialogflowChatbot;