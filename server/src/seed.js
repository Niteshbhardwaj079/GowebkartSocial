// Ye script ek baar chalao — superadmin + default plans banane ke liye
// Command: node src/seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Models
    const { User, Company } = require('./models');
    const Plan = require('./models/Plan.model');

    // ─── 1. Default Plans banao ───
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.insertMany([
        {
          name: 'free', displayName: 'Free', description: 'Perfect to get started',
          price: { monthly: 0, yearly: 0 },
          limits: { postsPerMonth: 30, socialAccounts: 3, aiCallsPerDay: 5, teamMembers: 1, adsAccess: false, bulkUpload: false },
          isActive: true, sortOrder: 1
        },
        {
          name: 'basic', displayName: 'Basic', description: 'For growing businesses',
          price: { monthly: 999, yearly: 799 },
          limits: { postsPerMonth: 100, socialAccounts: 10, aiCallsPerDay: 20, teamMembers: 3, adsAccess: true, bulkUpload: true, analyticsAdvanced: true },
          isActive: true, isPopular: true, sortOrder: 2
        },
        {
          name: 'pro', displayName: 'Pro', description: 'For agencies & power users',
          price: { monthly: 2499, yearly: 1999 },
          limits: { postsPerMonth: 999999, socialAccounts: 999, aiCallsPerDay: 999999, teamMembers: 999, adsAccess: true, bulkUpload: true, analyticsAdvanced: true, whiteLabel: true, apiAccess: true },
          isActive: true, sortOrder: 3
        }
      ]);
      console.log('✅ Default plans created');
    } else {
      console.log('ℹ️  Plans already exist, skipping');
    }

    // ─── 2. Super Admin banao ───
    const existingAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingAdmin) {
      const company = await Company.create({
        name: 'GowebkartSocial HQ',
        planLimits: { maxUsers: 999999, maxSocialAccounts: 999999, postsPerMonth: 999999, aiCallsPerDay: 999999, adsAccess: true }
      });

      const admin = await User.create({
        name:     'Super Admin',
        email:    'admin@socialsaas.com',
        password: 'Admin@12345',
        role:     'superadmin',
        plan:     'pro',
        company:  company._id,
        isEmailVerified: true
      });

      company.owner = admin._id;
      await company.save();

      console.log('✅ Super Admin created!');
      console.log('   Email:    admin@socialsaas.com');
      console.log('   Password: Admin@12345');
      console.log('   ⚠️  Please change password after first login!');
    } else {
      console.log('ℹ️  Super Admin already exists');
      console.log(`   Email: ${existingAdmin.email}`);
    }

    // ─── 3. Demo User banao ───
    const existingDemo = await User.findOne({ email: 'demo@socialsaas.com' });
    if (!existingDemo) {
      const demoCompany = await Company.create({ name: 'Demo Company' });
      const demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@socialsaas.com',
        password: 'Demo@12345',
        role: 'user',
        plan: 'basic',
        company: demoCompany._id,
        isDemo: true
      });
      demoCompany.owner = demoUser._id;
      await demoCompany.save();
      console.log('✅ Demo user created');
    } else {
      console.log('ℹ️  Demo user already exists');
    }

    console.log('\n🎉 Seed complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seed();
