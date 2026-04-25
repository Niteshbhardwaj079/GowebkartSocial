const axios = require('axios');
const { AdCampaign } = require('../../models');
const logger = require('../../utils/logger');
const META = 'https://graph.facebook.com/v18.0';

class AdsService {
  async getAdAccounts(token) {
    const r = await axios.get(`${META}/me/adaccounts`, {
      params: { fields: 'id,name,currency,account_status', access_token: token }
    });
    return r.data.data;
  }

  async createCampaign(adAccountId, { name, objective }, token) {
    const objMap = { ENGAGEMENT: 'POST_ENGAGEMENT', TRAFFIC: 'LINK_CLICKS', LEAD_GENERATION: 'LEAD_GENERATION', REACH: 'REACH' };
    const r = await axios.post(`${META}/act_${adAccountId}/campaigns`, {
      name, objective: objMap[objective] || 'POST_ENGAGEMENT',
      status: 'PAUSED', special_ad_categories: []
    }, { params: { access_token: token } });
    return r.data.id;
  }

  async createAdSet(adAccountId, campaignId, { name, audience, budget, duration, placements }, token) {
    const targeting = {
      age_min: audience.ageMin || 18,
      age_max: audience.ageMax || 65,
      geo_locations: { countries: audience.locations?.map(l => l.country) || ['IN'] }
    };
    if (audience.gender === 'MALE')   targeting.genders = [1];
    if (audience.gender === 'FEMALE') targeting.genders = [2];

    const budgetParam = budget.type === 'DAILY'
      ? { daily_budget: Math.round(budget.amount * 100) }
      : { lifetime_budget: Math.round(budget.amount * 100) };

    const r = await axios.post(`${META}/act_${adAccountId}/adsets`, {
      name, campaign_id: campaignId,
      ...budgetParam,
      start_time: new Date(duration.startDate).toISOString(),
      targeting, billing_event: 'IMPRESSIONS',
      optimization_goal: 'POST_ENGAGEMENT', status: 'PAUSED'
    }, { params: { access_token: token } });
    return r.data.id;
  }

  async createAd(adAccountId, adSetId, { name, pageId, postId }, token) {
    const r = await axios.post(`${META}/act_${adAccountId}/ads`, {
      name, adset_id: adSetId,
      creative: { object_story_id: `${pageId}_${postId}` },
      status: 'PAUSED'
    }, { params: { access_token: token } });
    return r.data.id;
  }

  async publishCampaign(campaignDbId, campaign, token) {
    await Promise.all([
      axios.post(`${META}/${campaign.metaCampaignId}`, { status: 'ACTIVE' }, { params: { access_token: token } }),
      axios.post(`${META}/${campaign.metaAdSetId}`,    { status: 'ACTIVE' }, { params: { access_token: token } }),
      axios.post(`${META}/${campaign.metaAdId}`,       { status: 'ACTIVE' }, { params: { access_token: token } }),
    ]);
    await AdCampaign.findByIdAndUpdate(campaignDbId, { status: 'active' });
    logger.info(`✅ Ad Campaign ${campaignDbId} published`);
  }

  async pauseCampaign(metaCampaignId, token) {
    await axios.post(`${META}/${metaCampaignId}`, { status: 'PAUSED' }, { params: { access_token: token } });
  }

  async fetchCampaignAnalytics(metaCampaignId, token) {
    try {
      const r = await axios.get(`${META}/${metaCampaignId}/insights`, {
        params: { fields: 'impressions,clicks,ctr,cpc,spend,reach', date_preset: 'lifetime', access_token: token }
      });
      return r.data.data[0] || {};
    } catch { return {}; }
  }
}

module.exports = new AdsService();
