const express        = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const apiSettingsCtrl  = require('../controllers/apiSettings.controller');
const superAdminCtrl   = require('../controllers/superAdmin.controller');

const isSuperAdmin = authorize('superadmin');

// API SETTINGS
const apiSettingsRouter = express.Router();
apiSettingsRouter.get('/',                 protect, apiSettingsCtrl.getSettings);
apiSettingsRouter.post('/facebook',        protect, apiSettingsCtrl.saveFacebookKeys);
apiSettingsRouter.post('/twitter',         protect, apiSettingsCtrl.saveTwitterKeys);
apiSettingsRouter.post('/linkedin',        protect, apiSettingsCtrl.saveLinkedInKeys);
apiSettingsRouter.post('/youtube',         protect, apiSettingsCtrl.saveYouTubeKeys);
apiSettingsRouter.delete('/:platform',     protect, apiSettingsCtrl.deleteKeys);
apiSettingsRouter.get('/oauth/:platform',  protect, apiSettingsCtrl.getOAuthUrl);

// SUPER ADMIN
const superAdminRouter = express.Router();
superAdminRouter.get('/stats',             protect, isSuperAdmin, superAdminCtrl.getSuperAdminStats);
superAdminRouter.get('/users',             protect, isSuperAdmin, superAdminCtrl.getAllUsers);
superAdminRouter.put('/users/:id/plan',    protect, isSuperAdmin, superAdminCtrl.updateUserPlan);
superAdminRouter.put('/users/:id/status',  protect, isSuperAdmin, superAdminCtrl.updateUserStatus);
superAdminRouter.put('/users/:id/promote', protect, isSuperAdmin, superAdminCtrl.promoteToAdmin);
superAdminRouter.put('/users/:id/demote',  protect, isSuperAdmin, superAdminCtrl.demoteToUser);
superAdminRouter.get('/admins',            protect, isSuperAdmin, superAdminCtrl.getAllAdmins);
superAdminRouter.post('/admins',           protect, isSuperAdmin, superAdminCtrl.createAdmin);
superAdminRouter.get('/plans',             protect, isSuperAdmin, superAdminCtrl.getPlans);
superAdminRouter.post('/plans',            protect, isSuperAdmin, superAdminCtrl.createPlan);
superAdminRouter.put('/plans/:id',         protect, isSuperAdmin, superAdminCtrl.updatePlan);
superAdminRouter.delete('/plans/:id',      protect, isSuperAdmin, superAdminCtrl.deletePlan);
superAdminRouter.post('/plans/seed',       protect, isSuperAdmin, superAdminCtrl.seedPlans);

// PUBLIC PLANS
const publicPlansRouter = express.Router();
publicPlansRouter.get('/plans/public', async (req, res) => {
  try {
    const Plan  = require('../models/Plan.model');
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
    if (plans.length === 0) {
      return res.json({ success: true, plans: [
        { name:'free',  displayName:'Free',  price:{monthly:0},    limits:{postsPerMonth:30,    socialAccounts:3,   aiCallsPerDay:5      }, isPopular:false },
        { name:'basic', displayName:'Basic', price:{monthly:999},  limits:{postsPerMonth:100,   socialAccounts:10,  aiCallsPerDay:20     }, isPopular:true  },
        { name:'pro',   displayName:'Pro',   price:{monthly:2499}, limits:{postsPerMonth:999999,socialAccounts:999, aiCallsPerDay:999999 }, isPopular:false },
      ]});
    }
    res.json({ success: true, plans });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = { apiSettingsRouter, superAdminRouter, publicPlansRouter };
