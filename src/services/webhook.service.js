import stripePackage from "stripe";
import prisma from "../config/prisma.config.js";

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

const manageSubscription = async ({ subscriptionId, customerId, status }) => {
  // 1. หา userId จาก customerId
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.userId;
  if (!userId) {
    throw new Error(
      `Webhook Error: User ID not found in customer metadata for customerId: ${customerId}`
    );
  }

  // 2. ดึงข้อมูล Price ID จาก Subscription object จริงๆ ใน Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // 3. ดึงข้อมูล period จาก subscription items (ใน Stripe บางครั้งข้อมูลอยู่ที่นี่)
  let currentPeriodStart, currentPeriodEnd;

  if (subscription.current_period_start && subscription.current_period_end) {
    // ถ้ามีข้อมูลใน subscription object หลัก
    currentPeriodStart = subscription.current_period_start;
    currentPeriodEnd = subscription.current_period_end;
  } else if (subscription.items?.data?.[0]) {
    // ถ้าไม่มี ให้ดูจาก subscription items
    const firstItem = subscription.items.data[0];
    currentPeriodStart = firstItem.current_period_start;
    currentPeriodEnd = firstItem.current_period_end;
  } else {
    throw new Error(
      `Webhook Error: Cannot find period data for subscription ${subscriptionId}`
    );
  }

  console.log("Period data found:", {
    currentPeriodStart,
    currentPeriodEnd,
    source: subscription.current_period_start
      ? "subscription"
      : "subscription_item",
  });

  // ตรวจสอบว่าข้อมูล period มีหรือไม่
  if (!currentPeriodStart || !currentPeriodEnd) {
    throw new Error(
      `Webhook Error: Missing period data for subscription ${subscriptionId}. ` +
        `current_period_start: ${currentPeriodStart}, ` +
        `current_period_end: ${currentPeriodEnd}`
    );
  }

  const priceId = subscription.items.data[0].price.id;

  // 3. หา Tier จาก Price ID
  const tier = await prisma.subscriptionTier.findUnique({
    where: { stripePriceId: priceId },
  });
  if (!tier) {
    throw new Error(`Webhook Error: Tier not found for priceId: ${priceId}`);
  }

  // 4. เตรียมข้อมูล โดยใช้ข้อมูลวันที่ที่ส่งเข้ามาโดยตรง
  const subscriptionData = {
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    status: status,
    currentPeriodStart: new Date(currentPeriodStart * 1000),
    currentPeriodEnd: new Date(currentPeriodEnd * 1000),
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    endedAt: subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : null,
    tierId: tier.id,
    userId: userId,
  };

  // Debug: ตรวจสอบว่า Date objects ถูกต้องหรือไม่
  console.log("Subscription Data:", {
    currentPeriodStart: subscriptionData.currentPeriodStart,
    currentPeriodEnd: subscriptionData.currentPeriodEnd,
    isValidStart: !isNaN(subscriptionData.currentPeriodStart.getTime()),
    isValidEnd: !isNaN(subscriptionData.currentPeriodEnd.getTime()),
  });

  // 5. Upsert ข้อมูล
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    update: subscriptionData,
    create: subscriptionData,
  });

  console.log(
    `Subscription [${subscriptionId}] for user [${userId}] successfully managed.`
  );
};

export const handleWebhookEvent = async (event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(
        `Handling checkout.session.completed for session: ${session.id}`
      );

      if (session.mode === "subscription") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );

        // Debug: แสดงข้อมูลที่ได้จาก Stripe
        console.log("Stripe subscription data:", {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
        });

        // ส่งข้อมูลทั้งหมดที่จำเป็นไปให้ฟังก์ชันจัดการ
        await manageSubscription({
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          // periodStart: subscription.current_period_start,
          // periodEnd: subscription.current_period_end,
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log(
        `Handling customer.subscription event for subscription: ${subscription.id}`
      );

      // Debug: แสดงข้อมูลที่ได้จาก webhook event
      console.log("Webhook subscription data:", {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      });

      await manageSubscription({
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        // periodStart: subscription.current_period_start,
        // periodEnd: subscription.current_period_end,
      });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};



