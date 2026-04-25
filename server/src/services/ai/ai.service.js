// AI Service — Free rule-based system
// Baad mein OpenAI/Gemini add kar sakte ho — sirf ek function change karo

class AIService {

  // ✅ Caption Generate
  async generateCaption({ topic, platform = 'instagram', language = 'en', tone = 'professional' }) {
    const templates = this._getTemplates(platform, language, tone);
    const idx = Math.floor(Math.random() * templates.length);
    const caption = templates[idx].replace(/{topic}/g, topic);

    return {
      caption,
      suggestions: this._getAlternates(topic, platform, language),
      hashtags: this.generateHashtags(topic, platform),
      method: 'rule-based'
    };
  }

  // ✅ Hashtag Generate
  generateHashtags(topic, platform = 'instagram') {
    const words = topic.toLowerCase().split(' ').filter(w => w.length > 2);
    const topicTags = words.map(w => `#${w.replace(/[^a-z0-9]/g, '')}`);

    const platformTags = {
      instagram: ['#instagood', '#photooftheday', '#instadaily', '#repost', '#follow'],
      twitter:   ['#trending', '#viral', '#news'],
      linkedin:  ['#professional', '#networking', '#business', '#growth', '#leadership'],
      facebook:  ['#facebook', '#share', '#community'],
      youtube:   ['#youtube', '#video', '#subscribe', '#newvideo'],
      default:   ['#socialmedia', '#digital', '#online']
    };

    const extra = platformTags[platform] || platformTags.default;
    return [...new Set([...topicTags, ...extra])].slice(0, 20);
  }

  // ✅ Post Ideas Generate
  generatePostIdeas(niche = 'business', count = 5) {
    const ideas = {
      fashion:    ['Morning outfit routine','Styling tips for budget','Trending colors this season','Before & after look','Capsule wardrobe guide'],
      food:       ['Quick 5-minute recipe','Healthy breakfast ideas','Street food review','Cooking hack of the day','Restaurant vs homemade comparison'],
      tech:       ['App review of the week','Top 5 productivity tools','Phone speed tricks','Latest gadget review','AI tools for beginners'],
      fitness:    ['Morning workout routine','Diet plan for beginners','Workout mistake to avoid','Home exercise guide','Protein meal ideas'],
      business:   ['Client success story','Behind the scenes','Monday motivation','Industry news take','Team spotlight'],
      travel:     ['Budget travel tips','Hidden gems in India','Best time to visit','Packing checklist','Local food guide'],
      education:  ['Study tips that work','5 free learning platforms','Career advice for freshers','Skill you should learn in 2025','Daily learning habit'],
    };

    const list = ideas[niche] || ideas.business;
    return list.slice(0, count).map((idea, i) => ({ id: i + 1, idea, niche }));
  }

  // ✅ Content Rewrite
  rewriteContent(text, style = 'professional') {
    const rewrites = {
      professional: (t) => t.replace(/!/g, '.').replace(/\?!/g, '?').trim(),
      casual:       (t) => t + ' 😊 What do you think?',
      funny:        (t) => t + ' 😂 #LOL #Relatable',
      motivational: (t) => '💪 ' + t + '\n\nYou got this! Keep pushing forward! 🚀',
      hindi:        (t) => t + '\n\nआपकी राय क्या है? Comment करो 👇',
      hinglish:     (t) => t + '\n\nYaar, kya lagta hai? Batao na! 😄'
    };
    const fn = rewrites[style] || rewrites.professional;
    return { original: text, rewritten: fn(text), style };
  }

  // ─── PRIVATE HELPERS ───

  _getTemplates(platform, language, tone) {
    if (language === 'hi') {
      return [
        '✨ {topic} के बारे में आज कुछ खास share कर रहा हूँ! आपकी राय क्या है? 👇',
        '🚀 {topic} — जो आपकी जिंदगी बदल दे! Comment में बताओ 💬',
        '💡 क्या आप जानते हैं {topic} के बारे में ये बात? 🤔 Save करो यह post!',
        '🌟 {topic} आज का trending topic है! आप क्या सोचते हो?',
        '❤️ {topic} के साथ हर दिन बेहतर होता है। आपका experience share करो!'
      ];
    }

    const tonalTemplates = {
      professional: [
        'Sharing insights on {topic} that can transform your approach. What are your thoughts? 💼',
        '{topic} — a game changer in today\'s world. Here\'s what you need to know 👇',
        'Key learnings about {topic} from my experience. Save this for later! 📌'
      ],
      casual: [
        'Okay so {topic} is literally everything right now 😍 Who else agrees?',
        'Just discovered something amazing about {topic} and had to share! ✨',
        'Can we talk about {topic} for a sec? Because WOW 🤩'
      ],
      funny: [
        'Me explaining {topic} to my friends at 2am 😂 #relatable',
        '{topic} walked so we could run 😅 Change my mind.',
        'Nobody: ... Me: Let me tell you about {topic} 😆'
      ],
      motivational: [
        '💪 {topic} is your key to success! Start today, not tomorrow.',
        '🚀 Dream big, start with {topic}. Your journey begins NOW!',
        '✨ Every expert was once a beginner. Start with {topic} today!'
      ]
    };

    const platformExtra = {
      instagram: [
        '📸 {topic} vibes only ✨ Double tap if you agree! ❤️',
        'Swipe to see everything about {topic} 👉 #explore'
      ],
      twitter: [
        'Hot take on {topic}: [thread below] 🧵',
        '{topic} is trending and here\'s why it matters 👇'
      ],
      linkedin: [
        'I\'ve been thinking about {topic} and its impact on our industry.',
        'After years of experience, here\'s my take on {topic}:'
      ]
    };

    const base = tonalTemplates[tone] || tonalTemplates.professional;
    const extra = platformExtra[platform] || [];
    return [...base, ...extra];
  }

  _getAlternates(topic, platform, language) {
    return [
      `Discover the power of ${topic}! ✨`,
      `${topic} — what's your experience? 💬`,
      `Everything you need to know about ${topic} 🎯`,
    ];
  }
}

// 🔮 Future OpenAI/Gemini upgrade karne ke liye:
// 1. npm install openai
// 2. Is function ko uncomment karo aur upar wale ko replace karo:
/*
const OpenAI = require('openai');
async generateCaption({ topic, platform, language, tone }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: `Write a ${tone} ${platform} caption in ${language} about: ${topic}. Include hashtags.`
    }]
  });
  return { caption: res.choices[0].message.content, method: 'openai' };
}
*/

module.exports = new AIService();
