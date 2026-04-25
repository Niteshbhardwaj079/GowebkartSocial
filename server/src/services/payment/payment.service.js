const crypto  = require('crypto');
const logger  = require('../../utils/logger');

// Razorpay lazy load — tabhi load ho jab use ho
const getRazorpay = () => {
  try {
    const Razorpay = require('razorpay');
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key') {
      throw new Error('Razorpay not configured. Add RAZORPAY_KEY_ID aur RAZORPAY_KEY_SECRET to .env');
    }
    return new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    throw new Error(err.message);
  }
};

class PaymentService {

  // ── Create Razorpay Order ──
  async createOrder({ userId, userName, userEmail, plan, billingCycle, amount }) {
    const razorpay = getRazorpay();

    const receipt   = `rcpt_${userId.toString().slice(-6)}_${Date.now()}`;
    const amountPaise = amount * 100; // Razorpay paise mein kaam karta hai

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId:       userId.toString(),
        userName,
        userEmail,
        plan,
        billingCycle,
      }
    });

    logger.info(`Razorpay order created: ${order.id} for ${userEmail}`);
    return order;
  }

  // ── Verify Payment Signature ──
  verifySignature({ orderId, paymentId, signature }) {
    const body    = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expected === signature;
    if (!isValid) logger.warn(`Invalid Razorpay signature for order ${orderId}`);
    return isValid;
  }

  // ── Get Plan Pricing ──
  getPlanPricing(plan, billingCycle) {
    const prices = {
      basic: { monthly: 999,  yearly: 799  },  // per month
      pro:   { monthly: 2499, yearly: 1999 },
    };

    const base  = prices[plan]?.[billingCycle];
    const total = billingCycle === 'yearly' ? base * 12 : base;

    return {
      plan,
      billingCycle,
      pricePerMonth: base,
      totalAmount:   total,
      savings:       billingCycle === 'yearly' ? (prices[plan].monthly * 12) - total : 0,
      currency:      'INR',
    };
  }

  // ── Razorpay configured hai? ──
  isConfigured() {
    return !!(process.env.RAZORPAY_KEY_ID &&
              process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key' &&
              process.env.RAZORPAY_KEY_SECRET &&
              process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_secret');
  }

  // ── Get public key (frontend ke liye) ──
  getPublicKey() {
    return process.env.RAZORPAY_KEY_ID;
  }
}

module.exports = new PaymentService();
