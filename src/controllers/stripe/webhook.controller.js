import stripePackage from 'stripe';
import * as webhookService from "../../services/webhook.service.js"

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // 1. Controller ทำหน้าที่ตรวจสอบความถูกต้องของ Request
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // 2. ส่งต่อ event ที่ถูกต้องแล้วไปให้ Service Layer จัดการ
    await webhookService.handleWebhookEvent(event);
    
    // 3. Controller ทำหน้าที่ส่ง Response กลับไปหา Stripe
    res.status(200).json({ received: true });

  } catch (error) {
    // 4. Controller ทำหน้าที่จัดการ Error ที่อาจเกิดขึ้นใน Service Layer
    console.error("Error handling webhook event:", error);
    // ส่ง 500 เพื่อให้ Stripe อาจจะลองส่ง event นี้มาใหม่
    res.status(500).json({ error: 'Internal server error while handling webhook.' });
  }
};