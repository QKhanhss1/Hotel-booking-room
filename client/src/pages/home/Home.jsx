import React from "react";
import DialogflowChatbot from "../../components/chatbot/chatbot";
import Featured from "../../components/featured/Featured";
import FeaturedProperties from "../../components/featuredProperties/FeaturedProperties";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import MailList from "../../components/mailList/MailList";
import Navbar from "../../components/navbar/Navbar";
import PropertyList from "../../components/propertyList/PropertyList";
import "./home.css";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Header />
      <div className="homeContainer">
        
        
        <Featured />
        
        <div className="homeSection">
          <h2 className="sectionTitle">Các loại khách sạn</h2>
          <PropertyList />
        </div>
        
        <div className="homeSection">
          <h2 className="sectionTitle">Khách sạn được khách yêu thích</h2>
          <FeaturedProperties />
        </div>
        
        <div className="homeSection partnersSection">
          <h2 className="sectionTitle">Đối tác khách sạn trong nước và quốc tế</h2>
          <p className="partnerDescription">Chúng tôi hợp tác với các chuỗi khách sạn trên toàn thế giới để bảo đảm mang lại kỳ nghỉ tuyệt vời nhất tại mọi điểm đến trong mơ của bạn!</p>
          <div className="hotelPartners">
            <div className="partnerLogo"><img src="/assets/images/logo_fusion.jpg" alt="Fusion" /></div>
            <div className="partnerLogo"><img src="/assets/images/logo_minor.png" alt="Minor" /></div>
            <div className="partnerLogo"><img src="/assets/images/logo_muongthanh.jpg" alt="Mường Thanh" /></div>
            <div className="partnerLogo"><img src="/assets/images/logo_vinpearl.png" alt="Vinpearl" /></div>
            <div className="partnerLogo"><img src="/assets/images/logo_tmg.png" alt="TMG" /></div>
          </div>
        </div>
        
        <div className="homeSection partnersSection">
          <h2 className="sectionTitle">Đối tác thanh toán</h2>
          <p className="partnerDescription">Những đối tác thanh toán đáng tin cậy của chúng tôi sẽ giúp cho bạn luôn an tâm thực hiện mọi giao dịch một cách thuận lợi nhất!</p>
          <div className="paymentPartners">
            <div className="partnerLogo"><img src="/assets/images/logo_vnpay.png" alt="VNPay" /></div>
            <div className="partnerLogo"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/1200px-MasterCard_Logo.svg.png" alt="MasterCard" /></div>
            <div className="partnerLogo"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg" alt="Visa" /></div>
            <div className="partnerLogo"><img src="/assets/images/logo_jcb.jpg" alt="JCB" /></div>
            <div className="partnerLogo"><img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Transparent.png" alt="MoMo" /></div>
          </div>
        </div>
        
        <div className="homeSection whyChooseUs">
          <h2 className="sectionTitle">Tại sao nên đặt chỗ với VAA?</h2>
          <div className="benefitsContainer">
            <div className="benefitItem">
              <div className="benefitIcon">🏆</div>
              <h3>Giá rẻ mỗi ngày</h3>
              <p>Đặt phòng qua ứng dụng để nhận giá tốt nhất với các khuyến mãi tuyệt vời!</p>
            </div>
            <div className="benefitItem">
              <div className="benefitIcon">💰</div>
              <h3>Thanh toán an toàn</h3>
              <p>Giao dịch trực tuyến an toàn với nhiều lựa chọn như VNPay, thẻ tín dụng, và nhiều hình thức khác.</p>
            </div>
            <div className="benefitItem">
              <div className="benefitIcon">⏰</div>
              <h3>Hỗ trợ 24/7</h3>
              <p>Đội ngũ nhân viên hỗ trợ khách hàng luôn sẵn sàng giúp đỡ bạn trong từng bước của quá trình đặt vé.</p>
            </div>
            <div className="benefitItem">
              <div className="benefitIcon">⭐</div>
              <h3>Đánh giá thực</h3>
              <p>Hàng nghìn đánh giá, bình chọn đã được xác thực từ du khách sẽ giúp bạn đưa ra lựa chọn đúng đắn.</p>
            </div>
          </div>
        </div>
        <DialogflowChatbot/>
        <MailList />
        <Footer />
      </div>
    </div>
  );
};

export default Home;
