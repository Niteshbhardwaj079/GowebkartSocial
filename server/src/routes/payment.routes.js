const router         = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const paymentService = require('../services/payment/payment.service');
const expiryService  = require('../services/expiry/expiry.service');
const emailService   = require('../services/email/email.service');
const expiryTemplates = require('../services/email/expiry.templates');
const Payment        = require('../models/Payment.model');
const logger         = require('../utils/logger');

// ── Get Razorpay public key ──
router.get('/config', protect, (req, res) => {
  res.json({
    success:      true,
    keyId:        paymentService.getPublicKey(),
    isConfigured: paymentService.isConfigured(),
  });
});

// ── Get plan pricing ──
router.get('/pricing/:plan/:cycle', protect, (req, res) => {
  try {
    const { plan, cycle } = req.params;
    const pricing = paymentService.getPlanPricing(plan, cycle);
    res.json({ success: true, pricing });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ── Create Order ──
router.post('/order', protect, async (req, res) => {
  try {
    const { plan, billingCycle } = req.body;

    if (!['basic', 'pro'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    if (!paymentService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: '⚠️ Payment gateway configured nahi hai. Admin se contact karein.',
        notConfigured: true
      });
    }

    const pricing = paymentService.getPlanPricing(plan, billingCycle || 'monthly');

    const order = await paymentService.createOrder({
      userId:      req.user._id,
      userName:    req.user.name,
      userEmail:   req.user.email,
      plan,
      billingCycle: billingCycle || 'monthly',
      amount:      pricing.totalAmount,
    });

    // Order DB mein save karo
    await Payment.create({
      user:            req.user._id,
      company:         req.user.company?._id,
      plan,
      billingCycle:    billingCycle || 'monthly',
      amount:          pricing.totalAmount,
      razorpayOrderId: order.id,
      receipt:         order.receipt,
      status:          'created',
    });

    res.json({
      success: true,
      order: {
        id:       order.id,
        amount:   order.amount,
        currency: order.currency,
      },
      pricing,
      userInfo: {
        name:  req.user.name,
        email: req.user.email,
      }
    });

  } catch (e) {
    logger.error(`Create order error: ${e.message}`);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Verify Payment & Activate Plan ──
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan, billingCycle } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment details incomplete' });
    }

    // Signature verify karo
    const isValid = paymentService.verifySignature({
      orderId:   razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      await Payment.findOneAndUpdate({ razorpayOrderId }, { status: 'failed' });
      return res.status(400).json({ success: false, message: '❌ Payment verification failed. Please contact support.' });
    }

    // Payment record update karo
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // ✅ Subscription activate karo
    const sub = await expiryService.activateSubscription({
      userId:      req.user._id,
      plan:        payment.plan,
      billingCycle: payment.billingCycle,
      amount:      payment.amount,
      paymentId:   razorpayPaymentId,
      orderId:     razorpayOrderId,
    });

    // Payment success email bhejo
    const template = expiryTemplates.paymentSuccess({
      name:      req.user.name,
      plan:      payment.plan,
      amount:    payment.amount,
      orderId:   razorpayOrderId,
      startDate: sub.startDate,
      endDate:   sub.endDate,
      company:   req.user.company,
    });
    await emailService.sendEmail({ to: req.user.email, ...template });

    logger.info(`✅ Payment verified & plan activated: ${req.user.email} → ${plan}`);

    res.json({
      success:   true,
      message:   `🎉 ${plan.toUpperCase()} Plan activate ho gaya!`,
      plan,
      endDate:   sub.endDate,
      paymentId: razorpayPaymentId,
    });

  } catch (e) {
    logger.error(`Verify payment error: ${e.message}`);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Get subscription info ──
router.get('/subscription', protect, async (req, res) => {
  try {
    const info = await expiryService.getExpiryInfo(req.user._id);
    const sub  = await expiryService.getSubscription(req.user._id);
    res.json({ success: true, subscription: info, history: sub?.history || [] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Payment history ──
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id, status: 'paid' }).sort({ paidAt: -1 });
    res.json({ success: true, payments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN: All payments ──
router.get('/admin/payments', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const payments = await Payment.find({ status: 'paid' })
      .populate('user', 'name email')
      .sort({ paidAt: -1 })
      .limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    const total = await Payment.countDocuments({ status: 'paid' });
    const revenue = await Payment.aggregate([{ $match: { status:'paid' } }, { $group: { _id:null, total:{ $sum:'$amount' } } }]);
    res.json({ success: true, payments, total, revenue: revenue[0]?.total || 0 });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN: Expiry Alert Settings ──
router.get('/admin/expiry-settings', protect, async (req, res) => {
  try {
    const settings = await expiryService.getSettings();
    res.json({ success: true, settings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/admin/expiry-settings', protect, async (req, res) => {
  try {
    const settings = await expiryService.updateSettings(req.body, req.user._id);
    res.json({ success: true, message: '✅ Settings saved!', settings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN: Manually trigger expiry check ──
router.post('/admin/check-expiry', protect, async (req, res) => {
  try {
    const count = await expiryService.checkAndSendAlerts();
    res.json({ success: true, message: `✅ Check complete — ${count} alerts sent` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN: Manual plan activate/extend ──
router.post('/admin/activate', protect, async (req, res) => {
  try {
    const { userId, plan, months = 1 } = req.body;
    const sub = await expiryService.activateSubscription({
      userId, plan, billingCycle: 'monthly',
      amount: 0, paymentId: 'manual_by_admin', orderId: `ADMIN_${Date.now()}`,
    });
    // Manual activation mein endDate ko months se adjust karo
    sub.endDate = new Date(sub.startDate);
    sub.endDate.setMonth(sub.endDate.getMonth() + months);
    await sub.save();
    res.json({ success: true, message: `✅ ${plan} plan activated for ${months} month(s)!`, sub });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
