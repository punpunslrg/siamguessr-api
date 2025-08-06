import express from "express";
import { createCheckoutSession } from "../controllers/stripe/stripe.controller.js";
import { stripeWebhookHandler } from "../controllers/stripe/webhook.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";
import {
  cancelMySubscription,
  getMySubscriptionStatus,
} from "../controllers/stripe/user.controller.js";

const paymentRoute = express.Router();

paymentRoute.post("/create-checkout-session", createCheckoutSession);

// paymentRoute.post(
//   "/stripe-webhook",
//   express.raw({ type: "application/json" }),
//   stripeWebhookHandler
// );

paymentRoute.get("/my-subscription", authCheck, getMySubscriptionStatus);

paymentRoute.post("/subscriptions/cancel", authCheck, cancelMySubscription);

export default paymentRoute;
