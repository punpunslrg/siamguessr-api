import * as stripeService from "../../services/stripe.service.js";

// Controller สำหรับดึงสถานะ Subscription ของผู้ใช้ที่ login อยู่
export const getMySubscriptionStatus = async (req, res) => {
  try {
    // req.user.id จะมีอยู่ถ้าเราใส่ middleware `authCheck` ไว้ที่ Route
    const userId = req.user.id;

    // เรียกใช้ฟังก์ชันจาก Service Layer
    const subscriptionStatus = await stripeService.checkUserSubscriptionStatus(
      userId
    );

    // ส่งผลลัพธ์กลับไปให้ Frontend
    res.status(200).json(subscriptionStatus);
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Failed to get subscription status." });
  }
};

// Controller สำหรับรับคำขอยกเลิก Subscription
export const cancelMySubscription = async (req, res) => {
  try {
    const userId = req.user.id; // ID จาก authCheck middleware

    await stripeService.cancelSubscription(userId);

    res
      .status(200)
      .json({
        message: "Your subscription has been scheduled for cancellation.",
      });
  } catch (error) {
    console.error("Error in cancelMySubscription controller:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to cancel subscription." });
  }
};
