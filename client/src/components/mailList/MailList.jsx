import "./mailList.css"

const MailList = () => {
  return (
    <div className="mail">
      <h1 className="mailTitle">Tiết kiệm thời gian và tiền</h1>
      <span className="mailDesc">Đăng ký để có ưu đãi cho bạn</span>
      <div className="mailInputContainer">
        <input type="text" placeholder="Your Email" />
        <button>Đăng ký</button>
      </div>
    </div>
  )
}

export default MailList