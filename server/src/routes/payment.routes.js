const router         = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const adminOnly      = authorize('admin', 'superadmin');
const paymentService = require('../services/payment/payment.service');
const expiryService  = require('../services/expiry/expiry.service');
const emailService   = require('../services/email/email.service');
const expiryTemplates = require('../services/email/expiry.templates');
const Payment        = require('../models/Payment.model');
const audit          = require('../services/audit/audit.service');
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
      const failureReason = 'Razorpay signature mismatch';
      const failed = await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed', razorpayPaymentId, failureReason },
        { new: true }
      );
      audit.log({ req, action: 'payment.failed', category: 'payment',
        description: `Payment verification failed: ${failureReason}`,
        target: { type: 'payment', id: failed?._id, name: razorpayOrderId },
        metadata: { amount: failed?.amount, plan: failed?.plan, reason: failureReason } });
      // Notify user
      if (failed) {
        const tmpl = expiryTemplates.paymentFailed({
          name: req.user.name, plan: failed.plan, amount: failed.amount,
          orderId: razorpayOrderId, reason: failureReason, company: req.user.company,
        });
        emailService.sendEmail({ to: req.user.email, ...tmpl }).catch(() => {});
      }
      return res.status(400).json({ success: false, message: '❌ Payment verification failed. Please contact support.' });
    }

    // Payment record update karo (only if it belongs to the logged-in user & not already paid)
    const invoiceNumber = await Payment.generateInvoiceNumber();
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId, user: req.user._id, status: { $ne: 'paid' } },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
        paidAt: new Date(),
        invoiceNumber,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Order not found, already processed, or not yours' });
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

    // Send proper invoice email (rich HTML, GST breakdown, branded)
    emailService.sendInvoice(req.user.email, {
      name:           req.user.name,
      email:          req.user.email,
      plan:           payment.plan,
      billingCycle:   payment.billingCycle,
      amount:         payment.amount,
      invoiceNumber:  payment.invoiceNumber,
      paymentId:      razorpayPaymentId,
      orderId:        razorpayOrderId,
      paidAt:         payment.paidAt,
      startDate:      sub.startDate,
      endDate:        sub.endDate,
      company:        req.user.company,
    }).catch(() => {});

    logger.info(`✅ Payment verified & plan activated: ${req.user.email} → ${plan}`);
    audit.log({ req, action: 'payment.completed', category: 'payment',
      description: `Paid ₹${payment.amount} for ${payment.plan.toUpperCase()} plan (${payment.billingCycle})`,
      target: { type: 'payment', id: payment._id, name: razorpayOrderId },
      metadata: { amount: payment.amount, plan: payment.plan, billingCycle: payment.billingCycle, paymentId: razorpayPaymentId } });

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

// ── Payment history (own — paid + failed) ──
router.get('/history', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.status = status;
    else                            filter.status = { $in: ['paid', 'failed'] };
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Invoice HTML view (printable) ──
router.get('/invoice/:id', protect, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    // Non-superadmin can only view own invoice
    if (req.user.role !== 'superadmin') filter.user = req.user._id;

    const payment = await Payment.findOne(filter).populate('user', 'name email').populate('company', 'name');
    if (!payment) return res.status(404).send('<h2>Invoice not found</h2>');
    if (payment.status !== 'paid' || !payment.invoiceNumber) {
      return res.status(400).send('<h2>This payment has no invoice — only successful payments are invoiced.</h2>');
    }

    const sub = await expiryService.getSubscription(payment.user._id);
    const tmpl = expiryTemplates.invoice({
      name:          payment.user.name,
      email:         payment.user.email,
      plan:          payment.plan,
      billingCycle:  payment.billingCycle,
      amount:        payment.amount,
      invoiceNumber: payment.invoiceNumber,
      paymentId:     payment.razorpayPaymentId,
      orderId:       payment.razorpayOrderId,
      paidAt:        payment.paidAt,
      startDate:     sub?.startDate || payment.paidAt,
      endDate:       sub?.endDate   || payment.paidAt,
      company:       payment.company,
    });

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(tmpl.html);
  } catch (e) { logger.error(e.message); res.status(500).send('<h2>Error loading invoice</h2>'); }
});

// ── ADMIN/SUPERADMIN: All payments (filter by status, include failed) ──
router.get('/admin/payments', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    // SuperAdmin sees all; admin sees only their company
    if (req.user.role === 'admin') {
      filter.company = req.user.company?._id || req.user.company;
    }
    if (status && status !== 'all') filter.status = status;
    if (search) {
      const users = await require('../models').User.find({
        $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
      }).select('_id').lean();
      filter.user = { $in: users.map(u => u._id) };
    }

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    const total   = await Payment.countDocuments(filter);
    const revenue = await Payment.aggregate([
      { $match: { ...filter, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const failedCount = await Payment.countDocuments({ ...filter, status: 'failed' });

    res.json({ success: true, payments, total, revenue: revenue[0]?.total || 0, paidCount: revenue[0]?.count || 0, failedCount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN: Expiry Alert Settings ──
router.get('/admin/expiry-settings', protect, adminOnly, async (req, res) => {
  try {
    const settings = await expiryService.getSettings();
    res.json({ success: true, settings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/admin/expiry-settings', protect, adminOnly, async (req, res) => {
  try {
    const settings = await expiryService.updateSettings(req.body, req.user._id);
    res.json({ success: true, message: '✅ Settings saved!', settings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN: Manually trigger expiry check ──
router.post('/admin/check-expiry', protect, adminOnly, async (req, res) => {
  try {
    const count = await expiryService.checkAndSendAlerts();
    res.json({ success: true, message: `✅ Check complete — ${count} alerts sent` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN: Manual plan activate/extend ──
router.post('/admin/activate', protect, adminOnly, async (req, res) => {
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
