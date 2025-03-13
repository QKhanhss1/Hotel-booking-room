import React, { useEffect } from 'react';

const DialogflowChatbot = () => {
    useEffect(() => {
        
        if (!document.querySelector('script[src*="dialogflow-console/fast/messenger/bootstrap.js"]')) {
            const script = document.createElement('script');
            script.src = "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
            script.onload = () => {
                console.log('Dialogflow Messenger script loaded.');
            };
            script.onerror = () => {
                console.error('Failed to load Dialogflow Messenger script.');
            };
            document.body.appendChild(script); // Thêm script vào cuối body
        }
    }, []);
    return (
        <df-messenger
            chat-title="SecondBooking"  
            agent-id="d0fc0965-2bc0-436e-9fbb-c55e1cc925fe" 
            language-code="vi"
        ></df-messenger>
    );
};

export default DialogflowChatbot;