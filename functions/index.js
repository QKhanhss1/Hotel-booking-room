// import * as functions from 'firebase-functions';
import { WebhookClient } from "dialogflow-fulfillment";
import moment from "moment";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import fulfillmentPkgJson from "dialogflow-fulfillment/package.json" with { type: "json" };
const fulfillmentVersion = fulfillmentPkgJson.version;
logger.info(`Phiên bản dialogflow-fulfillment đang sử dụng: ${fulfillmentVersion}`);

function bookHotel(agent) {
  logger.info("Function bookHotel được gọi!");

  // **LOGGING THÊM - BẮT ĐẦU**
  logger.info("--- BẮT ĐẦU XỬ LÝ FUNCTION bookHotel ---");

  // **Get parameters from agent.parameters (current turn)**
  const destination = agent.parameters["des"];
  const numberOfPeople = agent.parameters["number"];
  const checkInDate = agent.parameters["check-in"];
  const duration = agent.parameters["duration"];
  const datePeriod = agent.parameters["date-period"];
  const dayOfWeekPeriod = agent.parameters["day-range"];

  logger.info(
      "Parameters nhận được từ Dialogflow (agent.parameters):", JSON.stringify(agent.parameters, null, 2));

  // **Get parameters from context (previous turns)**
  const contextParams = agent.getContext("bookhotel-context")?.parameters || {};
  const contextDestination = contextParams.des;
  const contextNumberOfPeople = contextParams.number;

  logger.info(
      "Parameters từ Context (bookhotel-context):", JSON.stringify(contextParams, null, 2));

  // **LOGGING THÊM - GIÁ TRỊ BIẾN TRƯỚC IF**
  logger.info("Giá trị biến TRƯỚC kiểm tra if:", {
      destination: destination,
      numberOfPeople: numberOfPeople,
      contextDestination: contextDestination,
      contextNumberOfPeople: contextNumberOfPeople
  });


  let calculatedDatePeriod = null;
  let responseText = ""; // Khởi tạo responseText rỗng ban đầu
  let askForInfo = false; // Flag để kiểm soát việc hỏi thông tin

  // **Kiểm tra và hỏi nếu thiếu destination (des)**
  if (!destination) {
      logger.info("--> THIẾU destination, hỏi lại."); // LOGGING THÊM
      responseText = "Vui lòng cho biết thành phố hoặc khu vực bạn muốn đặt phòng.";
      askForInfo = true;
  } else if (!numberOfPeople) {
      logger.info("--> THIẾU numberOfPeople, hỏi lại."); // LOGGING THÊM
      responseText = `Bạn muốn đặt phòng ở ${destination}. Xin hỏi bạn đi bao nhiêu người?`;
      askForInfo = true;
  } else {
      logger.info("--> ĐÃ CÓ destination và numberOfPeople, xử lý date."); // LOGGING THÊM
      responseText = `Bạn muốn đặt phòng ở ${destination} cho ${numberOfPeople} người. `;

      if (datePeriod && datePeriod.startDate && datePeriod.endDate) {
          logger.info("Sử dụng date-period hiện có từ Dialogflow: ", datePeriod);
          calculatedDatePeriod = `${datePeriod.startDate}/${datePeriod.endDate}`;
      } else if (checkInDate && duration) {
          logger.info("Bắt đầu tính toán date-period từ check-in và duration...");
          const checkInMoment = moment(checkInDate);
          const durationNumber = parseInt(duration);
          const checkOutMoment = checkInMoment.clone().add(durationNumber, "days");
          calculatedDatePeriod = `${checkInMoment.format("YYYY-MM-DD")}/${checkOutMoment.format("YYYY-MM-DD")}`;
          logger.info("Date-period đã tính toán (từ check-in/duration):", {calculatedDatePeriod: calculatedDatePeriod});
      } else if (dayOfWeekPeriod) {
          logger.info("Bắt đầu tính toán date-period từ dayOfWeekPeriod:", dayOfWeekPeriod);
          calculatedDatePeriod = calculateDatePeriodFromDayOfWeek(dayOfWeekPeriod);
          logger.info("Date-period đã tính toán (từ dayOfWeekPeriod):", {calculatedDatePeriod: calculatedDatePeriod});
      } else {
          logger.info("--> THIẾU thông tin date, hỏi lại."); // LOGGING THÊM
          responseText += "Xin hỏi bạn muốn đặt phòng vào ngày nào? Ví dụ: 'ngày mai', '25/05', hoặc 'từ thứ 6 đến chủ nhật'.";
          askForInfo = true; // Vẫn cần hỏi thêm thông tin
      }

      if (calculatedDatePeriod) {
          const [startDate, endDate] = calculatedDatePeriod.split("/");
          responseText += `Ngày nhận phòng dự kiến ${startDate}, trả phòng ngày ${endDate}.`;
      }
  }

  if (askForInfo) {
      // Nếu cần hỏi thêm thông tin, set output context để duy trì trạng thái
      agent.setContext({
          name: "bookhotel-context",
          lifespan: 2, // Tăng lifespan để context tồn tại lâu hơn nếu cần hỏi nhiều lượt
          parameters: {
              "des": destination || contextDestination, // **GIỮ NGUYÊN - Ưu tiên contextDestination**
              "number": numberOfPeople || contextNumberOfPeople,
              // ...
          },
      });
      logger.info("--> Set context (askForInfo=true):", JSON.stringify(agent.getContext("bookhotel-context"), null, 2)); // LOGGING THÊM
  } else if (calculatedDatePeriod) {
      // Nếu đã có đủ thông tin date, set context với date-period (nếu cần cho lượt sau)
      agent.setContext({
          name: "bookhotel-context",
          lifespan: 1,
          parameters: {
              "date-period": calculatedDatePeriod,
              "des": destination || contextDestination,
              "number": numberOfPeople || contextNumberOfPeople
          },
      });
      logger.info("--> Set context (calculatedDatePeriod):", JSON.stringify(agent.getContext("bookhotel-context"), null, 2)); // LOGGING THÊM
  }

  logger.info("Response chatbot:", {responseText: responseText});
  agent.add(responseText);
  logger.info("agent.add(responseText) đã gọi");
  logger.info("--- KẾT THÚC XỬ LÝ FUNCTION bookHotel ---"); // LOGGING THÊM

  // **LOGGING ĐÃ CHUYỂN VÀO ĐÂY - TRƯỚC KHI KẾT THÚC FUNCTION bookHotel**
  logger.info("--- LOG TRƯỚC KHI FUNCTION bookHotel KẾT THÚC ---");
  logger.info("Giá trị biến destination TRƯỚC KHI KẾT THÚC bookHotel:", destination); // Log biến destination
  logger.info("Giá trị biến numberOfPeople TRƯỚC KHI KẾT THÚC bookHotel:", numberOfPeople); // Log biến numberOfPeople

  logger.info("Kết thúc function bookHotel");
}


function calculateDatePeriodFromDayOfWeek(dayOfWeekPeriod) {
  const today = moment().startOf("day");
  let startDateMoment; let endDateMoment;

  if (dayOfWeekPeriod === "saturday_to_sunday" || dayOfWeekPeriod === "weekend") {
      startDateMoment = today.clone().day(6);
      endDateMoment = today.clone().day(7);
      if (today.day() >= 6) {
          startDateMoment.add(7, "days");
          endDateMoment.add(7, "days");
      }
  }
  // Add cases for other dayOfWeekPeriod values if needed

  if (startDateMoment && endDateMoment) {
      return `${startDateMoment.format("YYYY-MM-DD")}/${endDateMoment.format("YYYY-MM-DD")}`;
  } else {
      return null;
  }
}

export const dialogflowFulfillment = onRequest(dialogflowFulfillmentHandler);

function dialogflowFulfillmentHandler(request, response) {
  logger.info(
      "Webhook dialogflowFulfillment function được gọi! (logger.info)",
  );
  const agent = new WebhookClient({request, response});
  /**
 * Xử lý logic cho intent "BookHotel".
 *
 * Hàm này trích xuất thông tin về điểm đến, ngày check-in, thời lượng lưu trú,
 * số lượng người và khoảng thời gian đặt phòng từ parameters của Dialogflow Agent.
 * Nếu có check-in và duration nhưng thiếu date-period, nó sẽ tự động
 * tính toán date-period và set parameter này trong Dialogflow context.
 *
 * @param {WebhookClient} agent Dialogflow WebhookClient agent object.
 */

  
  const intentMap = new Map();
  intentMap.set("BookHotel", bookHotel);
  agent.handleRequest(intentMap);
  logger.info("agent.handleRequest() đã gọi");
  logger.info("Kết thúc function dialogflowFulfillment");
}
