import { WebhookClient } from "dialogflow-fulfillment";
import moment from "moment";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import faqDataJson from "./faq_data.json" with { type: "json" };

let faqData = faqDataJson; // ✅ Gán trực tiếp dữ liệu FAQ từ JSON

// --- FUNCTION TO FIND FAQ ANSWER (KEYWORD MATCHING) ---
function findFaqAnswer(userQuestion) {
    if (faqData.length === 0) {
        return "Xin lỗi, chức năng FAQ hiện không khả dụng."; 
    }
    let bestMatchAnswer = "Xin lỗi, tôi không tìm thấy câu trả lời phù hợp cho câu hỏi này.";
    let maxSimilarity = -1;

    for (const faqItem of faqData) {
        const similarityScore = calculateKeywordSimilarity(userQuestion, faqItem.question);
        if (similarityScore > maxSimilarity) {
            maxSimilarity = similarityScore;
            bestMatchAnswer = faqItem.answer;
        }
    }
    return bestMatchAnswer;
}

// --- FUNCTION TO CALCULATE KEYWORD SIMILARITY (SIMPLE) ---
function calculateKeywordSimilarity(question1, question2) {
    const keywords1 = question1.toLowerCase().split(/\s+/);
    const keywords2 = question2.toLowerCase().split(/\s+/);
    let commonKeywords = 0;
    for (const keyword1 of keywords1) {
        if (keywords2.includes(keyword1)) {
            commonKeywords++;
        }
    }
    return commonKeywords;
}

// --- INTENT HANDLER FOR FAQ ---
function handleFaqIntent(agent) {
    logger.info("--- BẮT ĐẦU XỬ LÝ FUNCTION handleFaqIntent ---");
    const userQuestion = agent.query;
    logger.info(`🔍 Câu hỏi người dùng: ${userQuestion}`);

    if (faqData.length === 0) {
        agent.add("Xin lỗi, chức năng FAQ hiện không khả dụng. Vui lòng thử lại sau.");
        logger.warn("⚠️ Dữ liệu FAQ chưa được tải hoặc tải lỗi.");
        return;
    }

    const faqAnswer = findFaqAnswer(userQuestion);
    agent.add(faqAnswer);
    logger.info(`🤖 Trả lời FAQ: ${faqAnswer}`);
    logger.info("--- KẾT THÚC XỬ LÝ FUNCTION handleFaqIntent ---");
}

function bookHotel(agent) {
    logger.info("--- BẮT ĐẦU XỬ LÝ FUNCTION bookHotel ---");

    // Lấy context hiện tại
    const bookHotelContext = agent.context.get("bookhotel-context") || { parameters: {} };
    const contextParams = bookHotelContext.parameters;


    // Lấy thông tin từ Dialogflow hoặc context cũ
    const parameters = agent.parameters || {};
    const destination = parameters["des"] || contextParams["destination"] || "";
    const numberOfPeople = parameters["number"] || contextParams["numberOfPeople"] || "";
    let checkInDate = parameters["check-in"] || contextParams["checkIn"] || "";
    const duration = parameters["duration"] || contextParams["duration"] || "";
    const datePeriod = agent.parameters["dateperiod"] || contextParams["datePeriod"];
    const dayOfWeekPeriod = parameters["day-range"] || contextParams["dayRange"] || "";
    const askedDate = contextParams["askedDate"] || false;

    // ✅ Log dữ liệu đầy đủ
    logger.info("🔍 Dữ liệu từ Dialogflow:", JSON.stringify(parameters, null, 2));
    logger.info("🔍 Dữ liệu từ context:", JSON.stringify(contextParams, null, 2));

    // Log riêng từng biến để dễ kiểm tra
    logger.info("📌 Tổng hợp thông tin:");
    logger.info(`📍 Điểm đến: ${destination || "❌ Không có"}`);
    logger.info(`👥 Số người: ${numberOfPeople || "❌ Không có"}`);
    logger.info(`📅 Check-in date: ${checkInDate || "❌ Không có"}`);
    logger.info(`🕒 Duration: ${duration || "❌ Không có"}`);
    logger.info(`📆 Date-period: ${JSON.stringify(datePeriod) || "❌ Không có"}`);
    logger.info(`📅 Day-range: ${JSON.stringify(dayOfWeekPeriod) || "❌ Không có"}`);
    logger.info(`❓ Đã hỏi ngày chưa: ${askedDate}`);

    let calculatedDatePeriod = "";

    // --- XỬ LÝ DATE-PERIOD ---

    if (datePeriod && datePeriod.startDate && datePeriod.endDate) {
        logger.info("✅ Dùng datePeriod từ Dialogflow:", JSON.stringify(datePeriod));
        calculatedDatePeriod = `${datePeriod.startDate}/${datePeriod.endDate}`;
        checkInDate = datePeriod.startDate;
    } else if (checkInDate && duration) {
        logger.info("🔄 Tính toán datePeriod từ check-in & duration...");
        const checkInMoment = moment(checkInDate);
        const durationNumber = parseInt(duration, 10);
        const checkOutMoment = checkInMoment.clone().add(durationNumber, "days");
        calculatedDatePeriod = `${checkInMoment.format("DD-MM-YYYY")}/${checkOutMoment.format("DD-MM-YYYY")}`;
        logger.info("📅 DatePeriod đã tính toán:", { calculatedDatePeriod });
    } else if (dayOfWeekPeriod) {
        logger.info("🔄 Tính toán datePeriod từ dayOfWeekPeriod:", JSON.stringify(dayOfWeekPeriod));
        calculatedDatePeriod = calculateDatePeriodFromDayOfWeek(dayOfWeekPeriod);
        if (calculatedDatePeriod) {
            logger.info("📅 DatePeriod từ dayOfWeekPeriod:", { calculatedDatePeriod });
        } else {
            logger.warn("⚠️ Không thể tính toán datePeriod từ dayOfWeekPeriod:", JSON.stringify(dayOfWeekPeriod));
            agent.add("Xin lỗi, tôi chưa hỗ trợ đặt phòng theo khoảng thời gian này. Vui lòng chọn ngày cụ thể.");
            agent.context.set({
                name: "bookhotel-context",
                lifespan: 3,
                parameters: { destination, numberOfPeople, datePeriod: calculatedDatePeriod || "" }
            });
            return;
        }
    } else {
        // Nếu không có thông tin ngày trong request, ưu tiên lấy từ context nếu có
        const effectiveDatePeriod = contextParams["datePeriod"] || "";
        if (effectiveDatePeriod) {
            calculatedDatePeriod = effectiveDatePeriod;
        } else {
            if (askedDate) {
                logger.warn("⚠️ Người dùng đã được hỏi về ngày nhưng chưa cung cấp.");
                agent.add("Bạn vui lòng cung cấp ngày đặt phòng để tiếp tục.");
            } else {
                logger.info("🛑 Thiếu thông tin date, hỏi lại.");
                agent.add("Bạn muốn đặt phòng vào ngày nào?");
                agent.context.set({
                    name: "bookhotel-context",
                    lifespan: 3,
                    parameters: { destination, numberOfPeople, askedDate: true }
                });
            }
            return;
        }
    }

    // Kiểm tra thiếu thông tin nào khác
    const missingInfo = [];
    if (!destination) missingInfo.push("điểm đến");
    if (!numberOfPeople) missingInfo.push("số người");

    if (missingInfo.length > 0) {
        logger.info("❓ Thiếu thông tin:", missingInfo);
        agent.add(`Bạn có thể cung cấp thêm ${missingInfo.join(", ")} không?`);
    } else {
        const [startDate, endDate] = calculatedDatePeriod.split("/");
        agent.add(`Xác nhận đặt phòng cho ${numberOfPeople} người tại ${destination} từ ${startDate} đến ${endDate}. Bạn có muốn tiếp tục không?`);
    }

    // Lưu lại context với dữ liệu cập nhật
    agent.context.set({
        name: "bookhotel-context",
        lifespan: 5,
        parameters: {
            destination: destination || contextParams["destination"] || "",
            numberOfPeople: numberOfPeople || contextParams["numberOfPeople"] || "",
            checkIn: checkInDate || contextParams["checkIn"] || "",
            duration: duration || contextParams["duration"] || "",
            datePeriod: calculatedDatePeriod || contextParams["datePeriod"] || datePeriod || "",
            dayRange: dayOfWeekPeriod || contextParams["dayRange"] || "",
            askedDate: true
        }

    });

    // ✅ Log context sau khi cập nhật
    logger.info("📌 Context sau khi cập nhật:", JSON.stringify(agent.context.get("bookhotel-context"), null, 2));
    logger.info("--- KẾT THÚC XỬ LÝ FUNCTION bookHotel ---");
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
    } else if (dayOfWeekPeriod === "monday_to_friday" || dayOfWeekPeriod === "weekdays") { // Ví dụ mở rộng cho "weekdays"
        startDateMoment = today.clone().day(1);
        endDateMoment = today.clone().day(5);
        if (today.day() >= 5) { // Nếu hôm nay đã là thứ 6 hoặc cuối tuần, đặt cho tuần tới
            startDateMoment.add(7, "days");
            endDateMoment.add(7, "days");
        }
    }
    // Thêm các trường hợp khác cho dayOfWeekPeriod nếu cần

    if (startDateMoment && endDateMoment) {
        return `${startDateMoment.format("DD-MM-YYYY")}/${endDateMoment.format("DD-MM-YYYY")}`;
    } else {
        return null;
    }
}
export const dialogflowFulfillment = onRequest(async (request, response) => {
    logger.info(
        "Webhook dialogflowFulfillment function được gọi! (logger.info)",
    );
    const agent = new WebhookClient({ request, response });

    if (faqData.length === 0) {
        faqData = faqDataJson;
        logger.info(`✅ Đã tải ${faqData.length} câu hỏi FAQ từ file JSON.`);
    }
    const intentMap = new Map();
    intentMap.set("BookHotel", bookHotel);
    intentMap.set("FAQ_Intent", handleFaqIntent);
    agent.handleRequest(intentMap);
    logger.info("agent.handleRequest() đã gọi");
    logger.info("Kết thúc function dialogflowFulfillment");
});
