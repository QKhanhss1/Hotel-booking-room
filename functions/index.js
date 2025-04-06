import { WebhookClient } from "dialogflow-fulfillment";
import moment from "moment";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import faqDataJson from "./faq_data.json" with { type: "json" };
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";

const app = express();
app.use(bodyParser.json());

const uri = "mongodb+srv://nqkhanh020804nvtroi1922:zCGutIg9Li8pt8Ej@cloudcluster.2atcc.mongodb.net/?retryWrites=true&w=majority&appName=CloudCluster";
const dbName = "hotel-room-booking";
let mongoClient;
let db;
async function connectToDatabase() {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        try {
            await mongoClient.connect();
            console.log("Đã kết nối MongoDB Atlas thành công!");
            db = mongoClient.db(dbName);
        } catch (err) {
            console.error("Lỗi kết nối MongoDB Atlas:", err);
            throw err;
        }
    }
    return db;
}

async function testDatabaseQuery() {
    try {
        const database = await connectToDatabase();
        const roomsCollection = database.collection("rooms"); // **Đảm bảo collection 'rooms' tồn tại trong database của bạn**
        const roomCount = await roomsCollection.countDocuments({});
        console.log(`Số lượng phòng trong collection 'rooms': ${roomCount}`);
        const rooms = await roomsCollection.find({}).limit(5).toArray();
        console.log("\n5 Phòng đầu tiên trong collection 'rooms':");
        console.log(rooms);
        return { success: true, message: `Kết nối và truy vấn database thành công. Tìm thấy ${roomCount} phòng.` };
    } catch (error) {
        console.error("Lỗi truy vấn database:", error);
        return { success: false, message: `Lỗi truy vấn database: ${error}` };
    }
}

async function handleTestDatabaseIntent(agent) {
    logger.info("--- BẮT ĐẦU XỬ LÝ FUNCTION handleTestDatabaseIntent ---");
    const testResult = await testDatabaseQuery();
    if (testResult.success) {
        agent.add(`✅ Kiểm tra database thành công! ${testResult.message}`);
        logger.info(`✅ Kiểm tra database thành công: ${testResult.message}`);
    } else {
        agent.add(`❌ Kiểm tra database thất bại. Lỗi: ${testResult.message}`);
        logger.error(`❌ Kiểm tra database thất bại: ${testResult.message}`);
    }
    logger.info("--- KẾT THÚC XỬ LÝ FUNCTION handleTestDatabaseIntent ---");
}
let faqData = faqDataJson;

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

async function bookHotel(agent) {
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
    const askedDestination = contextParams["askedDestination"] || false;
    const askedPeople = contextParams["askedPeople"] || false;

    // Log dữ liệu
    logger.info("🔍 Dữ liệu từ Dialogflow:", JSON.stringify(parameters, null, 2));
    logger.info("🔍 Dữ liệu từ context:", JSON.stringify(contextParams, null, 2));
    logger.info("📌 Tổng hợp thông tin:");
    logger.info(`📍 Điểm đến: ${destination || "❌ Không có"}`);
    logger.info(`👥 Số người: ${numberOfPeople || "❌ Không có"}`);
    logger.info(`📅 Check-in date: ${checkInDate || "❌ Không có"}`);
    logger.info(`🕒 Duration: ${duration || "❌ Không có"}`);
    logger.info(`📆 Date-period: ${JSON.stringify(datePeriod) || "❌ Không có"}`);
    logger.info(`📅 Day-range: ${JSON.stringify(dayOfWeekPeriod) || "❌ Không có"}`);
    logger.info(`❓ Đã hỏi ngày chưa: ${askedDate}`);
    logger.info(`❓ Đã hỏi địa điểm chưa: ${askedDestination}`);
    logger.info(`❓ Đã hỏi nơi đến chưa: ${askedPeople}`);

    let calculatedDatePeriod = "";

    // --- XỬ LÝ DATE-PERIOD ---
    if (datePeriod && datePeriod.startDate && datePeriod.endDate) { // Ưu tiên datePeriod từ Dialogflow
        logger.info("✅ Ưu tiên dùng datePeriod từ Dialogflow:", JSON.stringify(datePeriod));
        calculatedDatePeriod = `${datePeriod.startDate}/${datePeriod.endDate}`;
        checkInDate = datePeriod.startDate; // Gán checkInDate để sử dụng sau nếu cần
    } else if (checkInDate) { 
        logger.info("✅ Ưu tiên dùng checkInDate:", checkInDate);
        // Dùng moment.parseZone để giữ lại thông tin múi giờ
        const checkInMoment = moment.parseZone(checkInDate);
        if (duration) {
            logger.info("🔄 Tính toán datePeriod từ check-in & duration...");
            const durationNumber = parseInt(duration, 10);
            const checkOutMoment = checkInMoment.clone().add(durationNumber, "days");
            calculatedDatePeriod = `${checkInMoment.format("YYYY-MM-DD")}/${checkOutMoment.format("YYYY-MM-DD")}`;
            checkInDate = checkInMoment.format("YYYY-MM-DD");
            logger.info("📅 DatePeriod đã tính toán (YYYY-MM-DD):", { calculatedDatePeriod });
        } else {
            logger.warn("⚠️ Chỉ có checkInDate, không có duration. Mặc định đặt 1 đêm.");
            const checkOutMoment = checkInMoment.clone().add(1, "days");
            calculatedDatePeriod = `${checkInMoment.format("YYYY-MM-DD")}/${checkOutMoment.format("YYYY-MM-DD")}`;
            checkInDate = checkInMoment.format("YYYY-MM-DD");
            logger.info("📅 DatePeriod mặc định 1 đêm (YYYY-MM-DD):", { calculatedDatePeriod });
        }
    } else if (dayOfWeekPeriod) { // Xử lý dayOfWeekPeriod nếu không có datePeriod và checkInDate
        logger.info("🔄 Tính toán datePeriod từ dayOfWeekPeriod:", JSON.stringify(dayOfWeekPeriod));
        calculatedDatePeriod = calculateDatePeriodFromDayOfWeek(dayOfWeekPeriod);
        if (calculatedDatePeriod) {
            logger.info("📅 DatePeriod từ dayOfWeekPeriod:", { calculatedDatePeriod });
        } else {
            logger.warn("⚠️ Không thể tính toán datePeriod từ dayOfWeekPeriod:", JSON.stringify(dayOfWeekPeriod));
            agent.add("Xin lỗi, tôi chưa hỗ trợ đặt phòng theo khoảng thời gian này. Vui lòng chọn ngày cụ thể.");
            agent.context.set({
                name: "bookhotel-context",
                lifespan: 10,
                parameters: { destination, numberOfPeople, datePeriod: calculatedDatePeriod || "" }
            });
            return;
        }
    } else { // Nếu không có datePeriod, checkInDate và dayOfWeekPeriod, hỏi lại ngày
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
    if (!destination) {
        agent.add(`Bạn có thể cung cấp thêm điểm đến không?`);
        agent.context.set({
            name: "bookhotel-context",
            lifespan: 10,
            parameters: {
                destination: destination || contextParams["destination"] || "",
                numberOfPeople: numberOfPeople || contextParams["numberOfPeople"] || "",
                checkIn: checkInDate || contextParams["checkIn"] || "",
                duration: duration || contextParams["duration"] || "",
                datePeriod: calculatedDatePeriod || contextParams["datePeriod"] || datePeriod || "",
                dayRange: dayOfWeekPeriod || contextParams["dayRange"] || "",
                askedDestination: true
            }
        });
        return;
    }
    
    if (!numberOfPeople) {
        agent.add(`Bạn có thể cung cấp thêm số lượng người ở không?`);
        agent.context.set({
            name: "bookhotel-context",
            lifespan: 10,
            parameters: {
                destination: destination || contextParams["destination"] || "",
                numberOfPeople: numberOfPeople || contextParams["numberOfPeople"] || "",
                checkIn: checkInDate || contextParams["checkIn"] || "",
                duration: contextParams["duration"] || "",
                datePeriod: calculatedDatePeriod || contextParams["datePeriod"] || datePeriod || "",
                dayRange: dayOfWeekPeriod || contextParams["dayRange"] || "",
                askedPeople: true
            }
        });
        return;
    }
    try {
        const database = await connectToDatabase();
        const bookingCollection = database.collection("bookings");
        const hotelCollection = database.collection("hotels");

        const [startDateString, endDateString] = calculatedDatePeriod.split("/");

        // Parse chuỗi ISO có chứa thông tin múi giờ, sử dụng moment.parseZone để giữ offset ban đầu
        const startDateMoment = moment.parseZone(startDateString);
        const endDateMoment = moment.parseZone(endDateString);

        // Dùng clone() để chuyển đổi sang UTC cho mục đích truy vấn, mà không làm thay đổi đối tượng gốc
        const startDateUTC = startDateMoment.clone().utc().toDate();
        const endDateUTC = endDateMoment.clone().utc().toDate();

        // Sử dụng đối tượng gốc (không bị chuyển đổi sang UTC) để format ngày hiển thị cho người dùng
        const startDateFormatted = startDateMoment.format("YYYY-MM-DD");
        const endDateFormatted = endDateMoment.format("YYYY-MM-DD");

        logger.info(`📅 Ngày check-in (UTC Date object): ${startDateUTC}`);
        logger.info(`📅 Ngày check-out (UTC Date object): ${endDateUTC}`);

        const hotelsInCity = await hotelCollection.find({ city: destination }).toArray();
        if (hotelsInCity.length === 0) {
            logger.warn(`⚠️ Không tìm thấy khách sạn nào ở thành phố ${destination}`);
            agent.add(`Xin lỗi, hiện tại chúng tôi không có khách sạn nào ở ${destination}. Bạn có muốn tìm ở thành phố khác không?`);
            return;
        }
        const availableHotels = [];
        for (const hotel of hotelsInCity) {
            logger.info("🔍 Truy vấn MongoDB sắp thực hiện:", JSON.stringify({
                query: {
                    "paymentInfo.hotelId": hotel._id,
                    "$expr": {
                        "$and": [
                            { "$lte": ["$paymentInfo.checkinDate", endDateUTC] },
                            { "$gte": ["$paymentInfo.checkoutDate", startDateUTC] }
                        ]
                    }
                },
                startDateUTC: startDateUTC,
                endDateUTC: endDateUTC,
                hotelId: hotel._id
            }, null, 2));
            const overlappingBookings = await bookingCollection.find({
                "paymentInfo.hotelId": hotel._id,
                "$expr": {
                    "$and": [
                        { "$lte": ["$paymentInfo.checkinDate", endDateUTC] },
                        { "$gte": ["$paymentInfo.checkoutDate", startDateUTC] }
                    ]
                }
            }).toArray();
            if (overlappingBookings.length === 0) {
                availableHotels.push(hotel);
            }
        }
        if (availableHotels.length > 0) {
            logger.info(`✅ Tìm thấy ${availableHotels.length} khách sạn trống ở ${destination}`);
            const hotelNames = availableHotels.map((hotel) => hotel.name).join(", ");
            agent.add(`Tuyệt vời! Tại ${destination}, chúng tôi có các khách sạn sau còn phòng trống từ ${startDateFormatted} đến ${endDateFormatted}: ${hotelNames}. Bạn muốn xem chi tiết khách sạn nào không?`);
        } else {
            logger.info(`🚫 Không tìm thấy khách sạn trống nào ở ${destination}`);
            agent.add(`Rất tiếc, tất cả khách sạn ở ${destination} đã kín phòng trong khoảng thời gian từ ${startDateFormatted} đến ${endDateFormatted}. Bạn có muốn chọn ngày khác hoặc địa điểm khác không?`);
        }
    } catch (error) {
        console.error("Lỗi truy vấn database (liệt kê khách sạn trống - UTC):", error);
        agent.add("Xin lỗi, có lỗi xảy ra khi kiểm tra khách sạn trống. Vui lòng thử lại sau.");
    }

    // Lưu lại context với dữ liệu cập nhật
    agent.context.set({
        name: "bookhotel-context",
        lifespan: 10,
        parameters: {
            destination: destination || contextParams["destination"] || "",
            numberOfPeople: numberOfPeople || contextParams["numberOfPeople"] || "",
            checkIn: checkInDate || contextParams["checkIn"] || "",
            duration: duration || contextParams["duration"] || "",
            datePeriod: calculatedDatePeriod || contextParams["datePeriod"] || datePeriod || "",
            dayRange: dayOfWeekPeriod || contextParams["dayRange"] || "",
            askedDate: true,
            askedPeople: true,
            askedDestination: true
        }
    });
    logger.info("📌 Context sau khi cập nhật:", JSON.stringify(agent.context.get("bookhotel-context"), null, 2));
    logger.info("--- KẾT THÚC XỬ LÝ FUNCTION bookHotel ---");
}

function calculateDatePeriodFromDayOfWeek(dayOfWeekPeriod) {
    const today = moment().startOf("day");
    let startDateMoment;
    let endDateMoment;
    if (dayOfWeekPeriod === "saturday_to_sunday" || dayOfWeekPeriod === "weekend") {
        startDateMoment = today.clone().day(6);
        endDateMoment = today.clone().day(7);
        if (today.day() >= 6) {
            startDateMoment.add(7, "days");
            endDateMoment.add(7, "days");
        }
    } else if (dayOfWeekPeriod === "monday_to_friday" || dayOfWeekPeriod === "weekdays") {
        startDateMoment = today.clone().day(1);
        endDateMoment = today.clone().day(5);
        if (today.day() >= 5) {
            startDateMoment.add(7, "days");
            endDateMoment.add(7, "days");
        }
    }
    if (startDateMoment && endDateMoment) {
        return `${startDateMoment.format("YYYY-MM-DD")}/${endDateMoment.format("YYYY-MM-DD")}`;
    } else {
        return null;
    }
}

export const dialogflowFulfillment = onRequest(async (request, response) => {
    logger.info("Webhook dialogflowFulfillment function được gọi! (logger.info)");
    const userAgent = request.headers["user-agent"];
    if (userAgent && userAgent.includes("UptimeRobot")) {
        logger.info("✅ Request từ Uptime Robot (keep-alive). Trả về 200 OK.");
        response.sendStatus(200);
        return;
    }
    try {
        const agent = new WebhookClient({ request, response });
        if (faqData.length === 0) {
            faqData = faqDataJson;
            logger.info(`✅ Đã tải ${faqData.length} câu hỏi FAQ từ file JSON.`);
        }
        const intentMap = new Map();
        intentMap.set("BookHotel", bookHotel);
        intentMap.set("FAQ_Intent", handleFaqIntent);
        intentMap.set("TestDatabaseConnection", handleTestDatabaseIntent);
        await agent.handleRequest(intentMap);
        logger.info("agent.handleRequest() đã gọi");
    } catch (error) {
        logger.error("❌ Lỗi khi xử lý request Dialogflow:", error);
        response.sendStatus(500);
    }
    logger.info("Kết thúc function dialogflowFulfillment");
});
