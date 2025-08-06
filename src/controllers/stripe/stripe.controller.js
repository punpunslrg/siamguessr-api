import * as stripeService from "../../services/stripe.service.js";
import createError from "../../utils/create-error.util.js";

export const createCheckoutSession = async (req, res) => {
  // 1. Controller ทำหน้าที่ตรวจสอบและดึงข้อมูลจาก Request
  const { priceId, userId } = req.body;

  if (!priceId || !userId) {
    createError(400, "priceId and userId are required.");
  }

  try {
    // 2. เรียกใช้ Business Logic จาก Service Layer
    const sessionUrl = await stripeService.createSubscriptionCheckout(
      userId,
      priceId
    );

    // 3. Controller ทำหน้าที่ส่ง Response กลับไปหา Client
    res.status(200).json({ url: sessionUrl });
  } catch (error) {
    // 4. Controller ทำหน้าที่จัดการ Error และส่ง HTTP Status ที่เหมาะสม
    console.error("Controller Error:", error.message);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
};
