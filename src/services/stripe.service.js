import stripePackage from "stripe";
import prisma from "../config/prisma.config.js";
import createError from "../utils/create-error.util.js";

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

// ค้นหา Stripe Customer ID ของผู้ใช้ใน DB, ถ้าไม่มีจะสร้างใหม่ใน Stripe
const findOrCreateStripeCustomer = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
   throw new Error("User not found.");
  }

  if (user.subscription?.stripeCustomerId) {
    return user.subscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.username,
    metadata: {
      userId: user.id,
    },
  });

  // หมายเหตุ: เราจะยังไม่บันทึก customer.id ลง DB ตรงนี้
  // เราจะรอทำทีเดียวใน Webhook เพื่อความถูกต้องของข้อมูล
  return customer.id;
};

// สร้าง Checkout Session สำหรับการสมัครสมาชิก
export const createSubscriptionCheckout = async (userId, priceId) => {
  try {
    const YOUR_DOMAIN = process.env.YOUR_DOMAIN;
    const stripeCustomerId = await findOrCreateStripeCustomer(userId);

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/canceled`,
      metadata: { userId: userId },
    });

    // Service จะคืนค่าเป็นข้อมูลที่จำเป็นเท่านั้น ไม่ใช่ res object
    return session.url;
  } catch (error) {
    console.error("Error in stripeService:", error);
    // โยน error ต่อไปให้ Controller จัดการ
    throw error;
  }
};

// ตรวจสอบสถานะ Subscription ของผู้ใช้
export const checkUserSubscriptionStatus = async (userId) => {
  // 1. ค้นหา Subscription ล่าสุดที่เชื่อมกับ userId
  // เรา include 'tier' เข้ามาด้วยเพื่อจะได้ชื่อของ tier
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId: userId,
    },
    include: {
      tier: {
        select: {
          name: true, // ดึงมาแค่ field 'name' จากตาราง SubscriptionTier
        },
      },
    },
  });

  // 2. ถ้าไม่เจอ record เลย แปลว่าไม่เคยสมัคร
  if (!subscription) {
    return { isActive: false, tierName: null };
  }

  // 3. เช็คเงื่อนไข: status ต้องเป็น 'active' และยังไม่หมดอายุ
  const now = new Date();
  const isActive =
    subscription.status === "active" && subscription.currentPeriodEnd > now;

  // --- เพิ่ม Logic นี้เข้าไป ---
  // ตรวจสอบว่า Subscription นี้ถูกตั้งค่าให้ยกเลิก ณ สิ้นรอบบิลหรือไม่
  const willCancel = !!subscription.canceledAt; // `!!` แปลงค่า (วันที่ หรือ null) ให้เป็น boolean (true หรือ false)

    
  return {
    isActive: isActive,
    tierName: isActive ? subscription.tier.name : null, // ถ้า active ให้ส่งชื่อ tier, ถ้าไม่ก็ส่ง null
        willCancel: willCancel, // <-- ส่งสถานะการยกเลิกกลับไปด้วย
    periodEndDate: subscription.currentPeriodEnd, // <-- ส่งวันหมดอายุไปด้วย
  };
};

// ยกเลิก Subscription ของผู้ใช้ใน Stripe
export const cancelSubscription = async (userId) => {
  // 1. ค้นหา Subscription ที่ active อยู่ของผู้ใช้ใน DB ของเรา
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId: userId,
    },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error("No active subscription found for this user to cancel.");
  }

  try {
    // 2. เรียก Stripe API เพื่อยกเลิก Subscription
    // Stripe จะตั้งค่าให้ Subscription ยังคงใช้งานได้จนถึงวันสุดท้ายของรอบบิล (cancel_at_period_end: true)
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // 3. คืนค่า subscription ที่อัปเดตแล้ว
    // Webhook จะจัดการอัปเดต DB ของเราโดยอัตโนมัติ
    return canceledSubscription;
  } catch (error) {
    console.error("Error canceling subscription in Stripe:", error);
    throw error;
  }
};
