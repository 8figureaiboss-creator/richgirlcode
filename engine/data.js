/* ===========================================================================
   RICH GIRL CODE — Content Engine
   data.js  ·  Survey taxonomy + content libraries
   ---------------------------------------------------------------------------
   Everything in here is DATA, not logic. Edit freely — the engine re-reads it.
   =========================================================================== */
window.RGC = window.RGC || {};

/* --- The surveyed account ------------------------------------------------ */
RGC.profile = {
  handle: 'richgirlcode',
  url: 'https://www.pinterest.com/richgirlcode/',
  name: 'RICH GIRL CODE',
  bio: 'Rich Girl Code is an Ai powered tech company that specializes in ' +
       'creating software, frameworks, and systems that help underserved women WIN!',
  followers: '~20.5k',
  surveyedOn: '2026-10-11',
  surveyNote:
    'Boards below were recovered from indexed Pinterest board pages. Pin counts are ' +
    'point-in-time snapshots and some came from regional mirrors, so they drift. ' +
    'Anything marked "inferred" is my read, not a confirmed board — edit it.'
};

/* --- Surveyed boards -----------------------------------------------------
   confidence: 'confirmed'  = board page or profile snapshot seen
               'partial'    = board seen, pin count unknown
               'inferred'   = my categorization, verify before trusting
   ------------------------------------------------------------------------ */
RGC.boards = [
  { slug: 'business-tips',               name: 'Business Tips',                 pins: 953, pillar: 'business',  confidence: 'confirmed' },
  { slug: 'content-creator',             name: 'Faceless / Content Creator',    pins: 349, pillar: 'faceless',  confidence: 'confirmed' },
  { slug: 'rich-girl',                   name: 'RICH GIRL',                     pins: 347, pillar: 'identity',  confidence: 'confirmed' },
  { slug: 'black-owned',                 name: 'Black Owned',                   pins: 72,  pillar: 'identity',  confidence: 'confirmed' },
  { slug: 'the-stay-at-home-millionaire-mom', name: 'The Stay at Home Millionaire Mom', pins: 37, pillar: 'sahm', confidence: 'confirmed' },
  { slug: 'decor',                       name: 'Decor',                         pins: 34,  pillar: 'lifestyle', confidence: 'confirmed' },
  { slug: 'rich-girl-decor',             name: 'Rich Girl Decor',               pins: 23,  pillar: 'lifestyle', confidence: 'confirmed' },
  { slug: 'rich-girl-code-academy',      name: 'Rich Girl Code Academy',        pins: 0,   pillar: 'options',   confidence: 'partial',
    note: '"Level up your business, body, mindset and bank accounts." Tagged #WealthBuilding #StockMarket #MakingMoney — this is the Options Trader Academy doorway.' },
  { slug: 'financial-literacy',          name: 'Financial Literacy',            pins: 0,   pillar: 'literacy',  confidence: 'partial' },
  { slug: 'money-talk',                  name: 'Money Talk',                    pins: 0,   pillar: 'literacy',  confidence: 'partial' },
  { slug: 'entrepreneurship',            name: 'Entrepreneurship',              pins: 0,   pillar: 'business',  confidence: 'partial' },
  { slug: 'starting-a-business',         name: 'Starting a Business',           pins: 0,   pillar: 'business',  confidence: 'partial' },
  { slug: 'rich-girl-code',              name: 'Rich Girl Code',                pins: 0,   pillar: 'identity',  confidence: 'partial' },
  { slug: 'rgc-podcast',                 name: 'RGC Podcast',                   pins: 0,   pillar: 'podcast',   confidence: 'partial' }
];

/* --- Visual themes ------------------------------------------------------ */
RGC.themes = {
  academy: { name: 'Academy Gold',  bg: ['#0A0C10', '#181E2A'], accent: '#D4AF37', accent2: '#F0D060',
             ink: '#F4F7FF', sub: '#8899BB', pos: '#1DB954', neg: '#E53E3E', grid: 'rgba(212,175,55,0.10)' },
  rose:    { name: 'Rich Girl Rose', bg: ['#1A0E16', '#2E1526'], accent: '#E8A0B4', accent2: '#F7D4DE',
             ink: '#FFF4F8', sub: '#C89AAC', pos: '#5FD0A0', neg: '#F2748A', grid: 'rgba(232,160,180,0.10)' },
  ivory:   { name: 'Quiet Luxury',  bg: ['#F5F1EA', '#E6DED2'], accent: '#8A6A3B', accent2: '#B99356',
             ink: '#1C1813', sub: '#6A6055', pos: '#2E7D53', neg: '#B3433F', grid: 'rgba(138,106,59,0.12)' },
  noir:    { name: 'Noir Terminal', bg: ['#07090C', '#0E1318'], accent: '#5EE6A8', accent2: '#B7F5D8',
             ink: '#EAF4F0', sub: '#7C8C88', pos: '#5EE6A8', neg: '#FF6B6B', grid: 'rgba(94,230,168,0.10)' },
  violet:  { name: 'Executive Violet', bg: ['#120C22', '#1F1440'], accent: '#C4A3FF', accent2: '#E6D9FF',
             ink: '#F6F2FF', sub: '#9D90BE', pos: '#6EE7B7', neg: '#FB7185', grid: 'rgba(196,163,255,0.10)' }
};

/* --- Holidays -----------------------------------------------------------
   Days the engine will not run a teaching slot on. Dates are US market /
   cultural holidays; `extra` is yours to add to (launch weeks, travel, a
   funeral — anything you do not want a trading lesson landing on).
   ------------------------------------------------------------------------ */
RGC.holidays = {
  fixed: [
    { md: '01-01', name: 'New Year\'s Day' },
    { md: '06-19', name: 'Juneteenth' },
    { md: '07-04', name: 'Independence Day' },
    { md: '12-24', name: 'Christmas Eve' },
    { md: '12-25', name: 'Christmas Day' },
    { md: '12-31', name: 'New Year\'s Eve' }
  ],
  // computed each year — Good Friday is the one that matters most here,
  // because it is always a Friday and the US market is closed
  computed: ['good-friday', 'thanksgiving', 'black-friday',
             'memorial-day', 'labor-day', 'mlk-day', 'presidents-day'],
  extra: []            // e.g. '2026-11-30'
};

/* What runs instead when a teaching slot lands on a holiday. Pinterest
   traffic rises on holidays for lifestyle content, so the slot is handed to
   a reach pillar rather than left empty — and the skipped lesson is deferred,
   not lost. */
RGC.holidayPolicy = {
  replaceWith: 'lifestyle',        // whose voice, theme and boards the fill-in borrows
  format: 'identity',
  topics: {                        // holiday -> the post written for that day
    'Black Friday':     'black-friday-buy',
    'Thanksgiving':     'gratitude-ledger',
    'Christmas Eve':    'year-end-gift',
    'Christmas Day':    'year-end-gift',
    "New Year's Eve":   'new-year-floor',
    "New Year's Day":   'new-year-floor'
  },
  fallback: 'market-closed'        // Good Friday, Juneteenth, the 4th, your own blackouts
};

/* --- Content pillars ---------------------------------------------------- */
RGC.pillars = [
  { id: 'options',   name: 'Options Desk',        theme: 'academy', otaWeight: 1.00,
    boards: ['rich-girl-code-academy', 'money-talk'],
    // Monday teaches a mechanic, Friday applies one. Each slot runs its own
    // list in authored order; rotationOffset picks where the curriculum starts.
    rotationOffset: { teach: 0, applied: 4 },
    promise: 'Teach one options mechanic per post, in plain English, with the risk named.',
    audience: 'Women who have money in the market but have never sold a contract.',
    funnel: 'core' },
  { id: 'literacy',  name: 'Money Literacy',      theme: 'noir',    otaWeight: 0.85,
    boards: ['financial-literacy', 'money-talk'],
    promise: 'The vocabulary and math that make the Options Desk posts land.',
    audience: 'Beginners who feel behind and will not admit it publicly.',
    funnel: 'top' },
  { id: 'business',  name: 'Business Tips',       theme: 'ivory',   otaWeight: 0.45,
    boards: ['business-tips', 'entrepreneurship', 'starting-a-business'],
    promise: 'Operator-level moves for women running the business, not posting about it.',
    audience: 'Existing audience — this is the biggest board, it is your traffic engine.',
    funnel: 'top' },
  { id: 'faceless',  name: 'Faceless Systems',    theme: 'violet',  otaWeight: 0.40,
    boards: ['content-creator'],
    promise: 'Content systems that run without a face, a studio, or a good hair day.',
    audience: 'Creators who want the Academy model without being on camera.',
    funnel: 'mid' },
  { id: 'identity',  name: 'Rich Girl Identity',  theme: 'rose',    otaWeight: 0.55,
    boards: ['rich-girl', 'rich-girl-code', 'black-owned'],
    promise: 'The identity shift that has to happen before the strategy sticks.',
    audience: 'The emotional core of the brand. Highest saves, lowest clicks.',
    funnel: 'top' },
  { id: 'sahm',      name: 'Stay At Home Millionaire', theme: 'ivory', otaWeight: 0.60,
    boards: ['the-stay-at-home-millionaire-mom'],
    promise: 'Income built around a kid\'s nap schedule, not in spite of it.',
    audience: 'Mothers with fragmented time and real urgency.',
    funnel: 'mid' },
  { id: 'lifestyle', name: 'Rich Girl Lifestyle', theme: 'rose',    otaWeight: 0.20,
    boards: ['rich-girl-decor', 'decor'],
    promise: 'The aesthetic payoff. Pure reach — no teaching, no pitch.',
    audience: 'Cold Pinterest traffic that has never heard of you.',
    funnel: 'top' },
  { id: 'podcast',   name: 'RGC Podcast',         theme: 'violet',  otaWeight: 0.35,
    boards: ['rgc-podcast'],
    promise: 'Repurpose the episode into a quotable, saveable carousel.',
    audience: 'Warm audience who already listen.',
    funnel: 'mid' }
];

/* --- Weekly rotation ----------------------------------------------------
   One pillar + format per weekday so the feed has rhythm instead of mush.
   ------------------------------------------------------------------------ */
RGC.weekPlan = [
  { dow: 0, label: 'Sunday Reset',      pillar: 'podcast',   format: 'recap'    },
  { dow: 1, label: 'Mechanics Monday',  pillar: 'options',   format: 'teach'    },
  { dow: 2, label: 'Operator Tuesday',  pillar: 'business',  format: 'framework'},
  { dow: 3, label: 'Workflow Wednesday',pillar: 'faceless',  format: 'system'   },
  { dow: 4, label: 'Thesis Thursday',   pillar: 'literacy',  format: 'mythbust' },
  { dow: 5, label: 'Friday Close',      pillar: 'options',   format: 'proof', skipHolidays: true },
  { dow: 6, label: 'Soft Saturday',     pillar: 'identity',  format: 'identity' }
];

/* Pillars that rotate in as secondary slots (sahm, lifestyle get worked in) */
RGC.swapIns = ['sahm', 'lifestyle'];

/* --- Formats: the slide skeleton --------------------------------------- */
RGC.formats = {
  teach:     { name: 'Teach',         roles: ['hook','why','beat','beat','beat','beat','cta'],
               note: 'One mechanic, built up in order. The workhorse for Academy content.' },
  framework: { name: 'Framework',     roles: ['hook','frame','beat','beat','beat','cta'],
               note: 'A named, numbered system they can screenshot.' },
  system:    { name: 'System / SOP',  roles: ['hook','frame','beat','beat','beat','proof','cta'],
               note: 'A repeatable workflow. Highest save rate on Pinterest.' },
  mythbust:  { name: 'Myth Bust',     roles: ['hook','myth','truth','beat','beat','cta'],
               note: 'Name the wrong belief, then dismantle it. Strong comment driver.' },
  proof:     { name: 'Proof / Recap', roles: ['hook','context','beat','beat','proof','cta'],
               note: 'Show the receipt. Requires a real number — never invent one.' },
  identity:  { name: 'Identity',      roles: ['hook','truth','beat','beat','cta'],
               note: 'Mindset, short lines, heavy visual. Saves, not clicks.' },
  recap:     { name: 'Quote Recap',   roles: ['hook','quote','beat','beat','cta'],
               note: 'Repurposed from an episode or a long post.' }
};

/* --- Hook patterns ------------------------------------------------------
   {t} = topic title · {promise} = topic promise · {n} = a beat count
   ------------------------------------------------------------------------ */
RGC.hookPatterns = [
  { id: 'plain',    label: 'Plain promise',    build: t => `${t.title}` },
  { id: 'nobody',   label: 'Nobody told you',  build: t => `Nobody explains ${t.short} like this` },
  { id: 'cost',     label: 'Cost of not knowing', build: t => `Not knowing this is costing you money` },
  { id: 'number',   label: 'Numbered',         build: (t, n) => `${n} things to know before you ${t.verb}` },
  { id: 'question', label: 'Direct question',  build: t => `Could you explain ${t.short} out loud right now?` },
  { id: 'confess',  label: 'Confession',       build: t => `I avoided ${t.short} for two years. Here's why that was expensive.` },
  { id: 'contrast', label: 'Before / after',   build: t => `${t.short}: what you think vs. what's true` },
  { id: 'permission',label: 'Permission',      build: t => `You're allowed to ${t.verb} before you feel ready` }
];

/* --- CTA bank ----------------------------------------------------------- */
RGC.ctas = [
  { id: 'academy',  label: 'Academy enroll',  text: 'The full walkthrough is Module {mod} inside Options Traders Academy.',
    sub: 'Free trial — link in bio.' },
  { id: 'save',     label: 'Save it',         text: 'Save this. You will need it the first time a trade goes against you.',
    sub: 'Follow @richgirlcode for the rest of the series.' },
  { id: 'comment',  label: 'Comment keyword', text: 'Comment GREEKS and I\'ll send you the one-page cheat sheet.',
    sub: 'No charge. No catch.' },
  { id: 'series',   label: 'Next in series',  text: 'Part {part} of the {pillar} series. Next: {next}.',
    sub: 'Follow so you don\'t lose the thread.' },
  { id: 'lesson',   label: 'Free lesson',     text: 'Watch the free lesson before you place a single contract.',
    sub: 'optionstradersacademy.com — 30-day guarantee.' },
  { id: 'audit',    label: 'Soft ask',        text: 'If you own 100 shares of anything, you are already qualified to do this.',
    sub: 'Start with the free module.' }
];

/* --- Disclaimer bank (options content is regulated-adjacent) ----------- */
RGC.disclaimers = [
  'Educational content. Not financial advice. Options involve risk of loss.',
  'For education only — not a recommendation. You can lose more than you expect.',
  'Teaching, not advising. Options carry risk; size positions accordingly.'
];

/* --- Topic library ------------------------------------------------------
   short : used inside hook patterns ("...explains {short} like this")
   verb  : used inside hook patterns ("before you {verb}")
   beats : the teaching sequence. The engine maps these onto slide roles.
   motif : canvas art for the slide — see paint.js
   ------------------------------------------------------------------------ */
RGC.topics = {

  options: [
    { id: 'covered-call', title: 'Covered Calls Are Just Rent', short: 'covered calls', verb: 'sell your first call',
      promise: 'Turn 100 shares you already own into a monthly rent check.', mod: 3, motif: 'payoff', slot: 'teach',
      beats: [
        { h: 'You own the asset', b: 'You hold 100 shares. Right now they pay you nothing while you wait.' },
        { h: 'You rent it out', b: 'Selling one call = agreeing to sell those shares at a set price, for a fee you keep today.' },
        { h: 'The fee is yours', b: 'That premium hits your account immediately. It does not come back out.' },
        { h: 'The trade-off', b: 'If the stock rockets past your strike, your shares get called away. You cap your upside, not your downside.', key: true },
        { h: 'Pick the strike like a landlord', b: 'A strike you would genuinely be happy to sell at. Not a strike you are praying never hits.' }
      ],
      proof: 'One contract on a $50 stock at a 2% premium = $100 collected on $5,000 of stock you already owned.',
      tags: ['#coveredcalls', '#optionstrading', '#passiveincome', '#investingforwomen'],
      imagePrompt: 'Minimal gold-on-black financial diagram, a house key resting on a rising stock chart, luxury editorial lighting, no text',
      videoAngle: 'Open on the key-on-chart image. The whole video is one metaphor: you are a landlord, the stock is the property, premium is rent.' },

    { id: 'theta', title: 'Time Decay Is Either Your Rent Or Your Clock', short: 'theta', verb: 'trade time decay',
      promise: 'Why the same day that helps a seller hurts a buyer.', mod: 2, motif: 'decay', slot: 'teach',
      beats: [
        { h: 'Every option has an expiry', b: 'Part of its price is pure time value. That part is going to zero no matter what.' },
        { h: 'Theta measures the bleed', b: 'It is the dollar amount an option loses per day, all else equal.' },
        { h: 'Buyers pay it', b: 'If you bought the contract, a quiet day is a losing day.' },
        { h: 'Sellers collect it', b: 'If you sold it, a quiet day is a paid day. Same market, opposite sign.' },
        { h: 'It accelerates', b: 'Decay is not linear. The last 30 days fall off a cliff — which is why sellers live there.', key: true }
      ],
      proof: 'A contract with 45 days left decays slowly. The same contract at 7 days out can lose half its remaining value in a week.',
      tags: ['#theta', '#thegreeks', '#optionsincome', '#financialliteracy'],
      imagePrompt: 'Elegant hourglass with gold sand, decaying exponential curve behind it, dark luxury background, no text',
      videoAngle: 'Hourglass on screen the whole time. Flip the sign halfway: "now you are the seller." Same hourglass, opposite feeling.' },

    { id: 'csp', title: 'Cash-Secured Puts: Get Paid To Wait For Your Price', short: 'cash-secured puts', verb: 'sell a put',
      promise: 'You wanted the stock cheaper anyway. Get paid for the patience.', mod: 3, motif: 'ladder', slot: 'teach',
      beats: [
        { h: 'Pick a stock you actually want', b: 'This only works if assignment is an outcome you would welcome.' },
        { h: 'Pick the price you want it at', b: 'That is your strike. Below where it trades today.' },
        { h: 'Set the cash aside', b: 'Strike x 100. It sits there, reserved. That is the "cash-secured" part.' },
        { h: 'Collect the premium now', b: 'You are paid today for the promise to buy at your price.' },
        { h: 'Two endings, both fine', b: 'It stays above your strike: you keep the cash and the premium. It drops below: you own the stock you wanted, at a discount.', key: true }
      ],
      proof: 'Wanting a $50 stock at $45? Sell the $45 put, collect $80, and you have cut your effective entry to $44.20.',
      tags: ['#cashsecuredputs', '#thewheel', '#optionsforbeginners', '#womenwhoinvest'],
      imagePrompt: 'Gold stair-step ladder descending into a soft glow, minimal editorial finance aesthetic, no text',
      videoAngle: 'Frame it as a limit order that pays you. Most beginners already understand limit orders — build from there.' },

    { id: 'delta', title: 'Delta Is Not Hard, It Is Just Two Things At Once', short: 'delta', verb: 'read delta',
      promise: 'Direction and probability, in one number.', mod: 2, motif: 'dial', slot: 'teach',
      beats: [
        { h: 'Reading one: speed', b: 'Delta 0.40 means the option moves about $0.40 for every $1 the stock moves.' },
        { h: 'Reading two: odds', b: 'That same 0.40 is roughly a 40% chance of finishing in the money.' },
        { h: 'Why that matters', b: 'You can pick a trade by how aggressive it is, or by how likely it is. Same dial.' },
        { h: 'Sellers go low', b: 'Selling at 0.20 delta means ~80% of the time, you keep the whole premium.' },
        { h: 'It moves on you', b: 'Delta is not fixed. It climbs as the trade works, which is gamma\'s job to describe.', key: true }
      ],
      proof: 'A 0.16 delta short put wins roughly 84% of the time. The 16% is why position sizing exists.',
      tags: ['#delta', '#thegreeks', '#optionsstrategy', '#tradingeducation'],
      imagePrompt: 'Single elegant brass dial gauge at 40 percent, dark background, shallow depth of field, no text',
      videoAngle: 'One dial on screen. Turn it. "This number is your aggression and your odds at the same time."' },

    { id: 'wheel', title: 'The Wheel: One Loop, Three Outcomes', short: 'the wheel', verb: 'run the wheel',
      promise: 'Cash-secured put, assignment, covered call. Repeat.', mod: 3, motif: 'cycle', slot: 'teach',
      beats: [
        { h: 'Step one: sell a put', b: 'On a stock you want, at a price you want. Collect premium.' },
        { h: 'If it expires worthless', b: 'Keep the premium. Sell another. This is the loop most weeks.' },
        { h: 'If you get assigned', b: 'You now own 100 shares at your chosen strike, minus the premium you kept.' },
        { h: 'Step two: sell a call', b: 'Against those shares. Collect again while you hold.' },
        { h: 'If the shares get called away', b: 'You are back to cash, having been paid three times. Start the loop over.', key: true }
      ],
      proof: 'Every leg of the wheel pays you. The risk is holding a stock you no longer want — which is why leg one is "a stock you want."',
      tags: ['#thewheelstrategy', '#optionsincome', '#coveredcalls', '#cashsecuredputs'],
      imagePrompt: 'Gold circular loop diagram with three nodes, minimal luxury infographic, dark background, no text',
      videoAngle: 'The flagship series video. Three outcomes = three chapters. Pin it to the channel.' },

    { id: 'iv-crush', title: 'Why You Were Right And Still Lost Money', short: 'IV crush', verb: 'trade earnings',
      promise: 'The earnings trap that catches every beginner exactly once.', mod: 4, motif: 'crush', slot: 'applied',
      beats: [
        { h: 'Before earnings, fear is expensive', b: 'Implied volatility rises. Every option gets pricier, calls and puts alike.' },
        { h: 'You bought at the top of that', b: 'You paid a premium inflated by uncertainty, not by direction.' },
        { h: 'The news lands', b: 'Uncertainty is gone. IV collapses within minutes of the report.' },
        { h: 'The stock moved your way — barely', b: 'Your directional gain was smaller than the volatility you lost. Net: red.' },
        { h: 'The fix', b: 'Either sell premium into earnings, or buy it weeks early. Do not buy the day before.', key: true }
      ],
      proof: 'A stock can gap up 4% and the calls you bought the night before can still open down 20%.',
      tags: ['#ivcrush', '#earningstrading', '#impliedvolatility', '#optionsmistakes'],
      imagePrompt: 'A gold balloon mid-deflation against a dark editorial background, dramatic single light source, no text',
      videoAngle: 'Literally deflate a balloon on camera while the chart plays. The gut-punch is the point.' },

    { id: 'iron-condor', title: 'An Iron Condor Is A Bet On Boring', short: 'iron condors', verb: 'open a condor',
      promise: 'Four contracts, one opinion: nothing much happens.', mod: 4, motif: 'condor', slot: 'applied',
      beats: [
        { h: 'You sell the middle', b: 'A put spread below the price, a call spread above it. You collect both premiums.' },
        { h: 'You buy the wings', b: 'The outer contracts cap your loss. This is what makes the risk defined instead of open-ended.' },
        { h: 'Your opinion is "flat"', b: 'You are not predicting up or down. You are predicting the price stays inside your range.' },
        { h: 'Max profit is known on day one', b: 'The premium you collected. That is the ceiling, and you know it before you enter.' },
        { h: 'Max loss is known too', b: 'Spread width minus premium. Smaller than the win rate suggests — that is the real trade-off.', key: true }
      ],
      proof: 'Collect $200 on a $500-wide condor: you risk $300 to make $200, and you need the stock to do nothing.',
      tags: ['#ironcondor', '#optionsstrategy', '#definedrisk', '#advancedoptions'],
      imagePrompt: 'Symmetrical geometric gold line diagram resembling outstretched wings over a flat horizon, minimal, no text',
      videoAngle: 'Draw it live in four strokes. The shape IS the explanation — do not talk over the drawing.' },

    { id: 'win-rate-lies', title: 'Your Win Rate Is Lying To You', short: 'win rate', verb: 'judge a strategy',
      promise: 'An 85% win rate can still lose money. Expectancy is the number that cannot.', mod: 5, motif: 'split', slot: 'applied',
      beats: [
        { h: 'Selling far out of the money wins often', b: 'A 0.10 delta short put finishes profitable roughly ninety percent of the time. That figure is seductive, and it is true.' },
        { h: 'Then look at the sizes', b: 'You collect $40 when you win. The occasional loss is $400. Nine wins do not cover one loss.' },
        { h: 'Expectancy is the only honest number', b: 'Win rate times average win, minus loss rate times average loss. If that is negative, the strategy loses money no matter how good the streak feels.' },
        { h: 'High win rates hide fat tails', b: 'The strategies that win most often tend to lose biggest when they finally lose. The comfort is the warning.' },
        { h: 'Track expectancy, not streaks', b: 'Log every trade with its credit and its real max loss. Twenty trades in, the true number appears, and it is rarely the one you assumed.', key: true }
      ],
      proof: '90% x $40 = $36. 10% x $400 = $40. That is negative four dollars per trade, on a strategy that wins nine times out of ten.',
      tags: ['#winrate', '#expectancy', '#tradingmath', '#riskmanagement'],
      imagePrompt: 'Brass balance scale, many small coins heaped on one side and a single large weight on the other, dark luxury still life, no text',
      videoAngle: 'Open with "I won nine trades in a row and lost money." Then do the arithmetic on screen. Nobody scrolls past that sentence.' },

    { id: 'close-early', title: 'The Last 50% Is Not Worth The Wait', short: 'closing early', verb: 'close a winner',
      promise: 'Half the premium in a third of the time beats the full premium held to zero.', mod: 3, motif: 'decay', slot: 'applied',
      beats: [
        { h: 'You sold a put for $200', b: 'Three weeks later it is worth $100. You are up $100 with eighteen days still on the clock.' },
        { h: 'The second half pays worse', b: 'You earned the first $100 in three weeks. Collecting the rest takes another three, at half the rate.' },
        { h: 'Return per day is the honest metric', b: 'Divide the credit by the days you held it. That number, not the total, tells you whether the trade was worth the capital.' },
        { h: 'Closing frees the collateral', b: 'Take the win, release the cash, and open something with a fresh forty-five days on it.' },
        { h: 'Risk does not shrink with the premium', b: 'The $100 still on the table carries the same assignment risk as the original $200 did. You are risking the whole position to collect the worst-paying half of it.', key: true }
      ],
      proof: '$200 collected over 42 days is $4.76 a day. Taking $100 in the first 18 days is $5.56 a day — on a position you are no longer carrying.',
      tags: ['#optionsmanagement', '#closeearly', '#optionsincome', '#tradingdiscipline'],
      imagePrompt: 'Gold exponential decay curve with the first half shaded and a clean vertical cut at the midpoint, dark editorial finance, no text',
      videoAngle: 'Put return-per-day on screen as one number and let it change as you hold. The arithmetic persuades; you do not have to.' },

    { id: 'position-sizing', title: 'The Only Rule That Keeps You In The Game', short: 'position sizing', verb: 'size a trade',
      promise: 'Your strategy does not matter if one trade can end you.', mod: 5, motif: 'grid', slot: 'applied',
      beats: [
        { h: 'Start from the loss', b: 'Not "how much can I make." How much can I lose on this one and still be fine Monday?' },
        { h: 'Pick a hard percentage', b: '1 to 2% of the account per position. Write it down before you are emotional.' },
        { h: 'Work backwards to the contracts', b: 'Max loss per contract divides into your dollar limit. That is your size. Not a vibe.' },
        { h: 'Correlation is hidden size', b: 'Five tech trades is one tech trade wearing five hats.' },
        { h: 'This is the whole edge', b: 'A 60% win rate makes money with discipline and loses money without it.', key: true }
      ],
      proof: 'On a $10,000 account at 2%, your max loss per trade is $200. That is one $500-wide spread, not five.',
      tags: ['#riskmanagement', '#positionsizing', '#tradingpsychology', '#protectyourcapital'],
      imagePrompt: 'Clean 4x4 gold grid with a single illuminated cell, architectural, dark background, no text',
      videoAngle: 'Hardest video to make interesting and the most important one. Lead with a blow-up story, then the math.' },

    { id: 'rolling-cost', title: 'What A Rolled Position Actually Costs You', short: 'rolling', verb: 'roll a trade',
      promise: 'Rolling is management when it is for a credit, and denial when it is not.', mod: 3, motif: 'chain', slot: 'applied',
      beats: [
        { h: 'A roll is two trades, not one', b: 'You buy back the losing contract and sell a new one further out. Both legs have a price and both show up in your account.' },
        { h: 'A net credit is management', b: 'If the new contract pays more than closing the old one cost, you were paid to buy time. That is a legitimate adjustment.' },
        { h: 'A net debit is paying to stay wrong', b: 'Now you are spending money to avoid booking a loss you have already taken. The position did not improve. Only the way it looks did.' },
        { h: 'Every roll adds duration', b: 'Further out means more time for a thesis to break again — on a trade that has already broken once.' },
        { h: 'Set the ceiling before you need it', b: 'Decide now how many times you will roll and at what loss you simply close. Two is a common limit. Deciding mid-drawdown is how small losses become large ones.', key: true }
      ],
      proof: 'Three rolls at a $40 debit each is $120 spent to postpone a loss you could have booked on day one — with the collateral locked the entire time.',
      tags: ['#rollingoptions', '#optionsmanagement', '#tradingmistakes', '#riskmanagement'],
      imagePrompt: 'Chain of heavy gold links receding into darkness, the final link visibly strained, single dramatic light source, no text',
      videoAngle: 'Show one real roll with both legs priced on screen. The credit-versus-debit distinction is the whole video — do not pad it.' }
  ],

  literacy: [
    { id: 'compounding', title: 'Compounding Is Boring For Nine Years', short: 'compounding', verb: 'start investing',
      promise: 'The curve everyone quotes and nobody waits for.', mod: 1, motif: 'curve',
      beats: [
        { h: 'The first years look broken', b: 'Your contributions dwarf your returns. It feels like nothing is working.' },
        { h: 'Then the returns start earning', b: 'Growth on growth. The line bends where most people have already quit.' },
        { h: 'Time beats amount', b: 'Starting ten years earlier usually outruns contributing twice as much.' },
        { h: 'Which is why fees matter', b: '1% skimmed annually removes a quarter of a lifetime of growth.' }
      ],
      proof: '$500/month at 8% is $92k after 10 years — and $745k after 30. The second 20 years did the work.',
      tags: ['#compoundinterest', '#financialliteracy', '#investingbasics', '#wealthbuilding'],
      imagePrompt: 'Elegant exponential curve in gold on deep navy, single inflection point marked, minimal, no text',
      videoAngle: 'Show the flat part first and sit in it uncomfortably long. Then reveal the rest of the chart.' },

    { id: 'good-debt', title: 'There Is No Such Thing As Good Debt', short: 'good debt', verb: 'borrow',
      promise: 'There is only debt that outearns its rate, and debt that does not.', mod: 1, motif: 'split',
      beats: [
        { h: 'The phrase hides the math', b: '"Good debt" is marketing. The only question is the spread.' },
        { h: 'Compare rate to return', b: 'Borrow at 6% to earn 11%? That is a spread. Borrow at 24% for anything? That is not.' },
        { h: 'Student loans are not automatically good', b: 'A degree that raises income clears the bar. One that does not, does not.' },
        { h: 'Certainty matters too', b: 'The rate is guaranteed. The return is not. Price that gap honestly.' }
      ],
      proof: 'A 24% credit card is a guaranteed 24% return to pay off. No investment offers that risk-free.',
      tags: ['#debtfree', '#financialliteracy', '#moneymindset', '#personalfinance'],
      imagePrompt: 'Split-screen minimal diagram, two diverging arrows in gold and muted red, editorial, no text',
      videoAngle: 'Confrontational hook, generous delivery. Do not shame anyone — just do the subtraction on screen.' },

    { id: 'emergency-fund', title: 'Your Emergency Fund Is Your Risk Tolerance', short: 'emergency funds', verb: 'take market risk',
      promise: 'Cash on hand is what lets you hold through a drawdown.', mod: 5, motif: 'stack',
      beats: [
        { h: 'Panic selling is a cash problem', b: 'People do not sell at the bottom because they lost faith. They sell because they need the money.' },
        { h: 'Three to six months, liquid', b: 'Not invested. Not in a CD you cannot touch. Boring and reachable.' },
        { h: 'Then you can be patient', b: 'A 30% drawdown is survivable when rent is already covered.' },
        { h: 'This comes before options', b: 'Selling premium with no cash buffer turns a normal loss into a forced exit.' }
      ],
      proof: 'The investors who held through 2008 and the ones who sold had similar portfolios. They had different bank balances.',
      tags: ['#emergencyfund', '#financialfoundation', '#moneytalk', '#investingforwomen'],
      imagePrompt: 'Stacked gold bars of ascending height on dark stone, soft directional light, minimal, no text',
      videoAngle: 'Position this as the prerequisite video. Link it from every strategy video as "watch this first."' },

    { id: 'inflation', title: 'Saving Money Is Not Keeping Money', short: 'inflation', verb: 'hold cash',
      promise: 'Why a savings account can be a slow loss.', mod: 1, motif: 'decay',
      beats: [
        { h: 'Your balance goes up', b: 'The number in the app grows. That part is real.' },
        { h: 'Your purchasing power goes down', b: '3% inflation against a 0.5% savings rate is a 2.5% annual loss in what the money buys.' },
        { h: 'The number lies', b: 'Nominal growth feels like progress. Real growth is what matters.' },
        { h: 'Cash still has a job', b: 'It buys time and optionality. It just is not a growth asset. Do not confuse the two.' }
      ],
      proof: '$10,000 under a mattress for 20 years at 3% inflation buys about $5,500 worth of goods.',
      tags: ['#inflation', '#purchasingpower', '#financialliteracy', '#moneytalk'],
      imagePrompt: 'A gold banknote slowly dissolving into particles, dark luxury background, macro detail, no text',
      videoAngle: 'Use a real price comparison from their own life — groceries, rent — not an abstract index.' },

    { id: 'tax-location', title: 'Where You Hold It Changes What You Keep', short: 'tax location', verb: 'open an account',
      promise: 'Same investment, different account, very different outcome.', mod: 3, motif: 'grid',
      beats: [
        { h: 'Account type is a strategy', b: 'Taxable, traditional, Roth — each taxes you at a different moment.' },
        { h: 'Options income is taxed hard', b: 'Short-term premium is ordinary income in a taxable account. That is the top of your bracket.' },
        { h: 'Tax-advantaged changes the math', b: 'The same premium inside a Roth avoids that bill entirely — with tighter rules on what you can trade.' },
        { h: 'Check the permissions', b: 'Many retirement accounts allow covered calls and cash-secured puts but not naked positions.' }
      ],
      proof: 'A 35% bracket turns $10,000 of premium into $6,500. The account you chose was worth $3,500.',
      tags: ['#taxstrategy', '#rothira', '#optionsincome', '#financialliteracy'],
      imagePrompt: 'Three minimal gold containers of different sizes on a dark surface, architectural lighting, no text',
      videoAngle: 'Say plainly that you are not a CPA, then teach the concept. The disclaimer buys you credibility.' }
  ],

  business: [
    { id: 'offer-ladder', title: 'You Do Not Need More Traffic, You Need A Second Offer', short: 'offer ladders', verb: 'raise your prices',
      promise: 'The same audience can pay you three times.', mod: 0, motif: 'ladder',
      beats: [
        { h: 'Most brands sell one thing', b: 'One price point, one buyer, one ceiling.' },
        { h: 'Your audience is not one buyer', b: 'Some want the $27 answer. Some want the $2,000 hand-holding. Same list.' },
        { h: 'Build three rungs', b: 'An entry product, a core program, and a high-touch tier. Each one feeds the next.' },
        { h: 'The top rung funds the bottom', b: 'High-ticket revenue is what lets you keep the entry offer cheap enough to be a doorway.' }
      ],
      proof: 'A list of 1,000 at a single $97 offer has one ceiling. The same list across $27 / $297 / $1,997 has three.',
      tags: ['#offerstrategy', '#businesstips', '#womeninbusiness', '#digitalproducts'],
      imagePrompt: 'Three ascending brass platforms on cream marble, quiet luxury product photography, no text',
      videoAngle: 'Use the Academy itself as the worked example. Transparency is the credibility.' },

    { id: 'one-metric', title: 'Pick The One Number You Actually Steer By', short: 'the one metric', verb: 'set a goal',
      promise: 'Dashboards do not make decisions. One number does.', mod: 0, motif: 'dial',
      beats: [
        { h: 'Vanity metrics feel like progress', b: 'Followers, impressions, likes. None of them pay a bill.' },
        { h: 'Pick the number closest to money', b: 'For a course: trial starts. For a service: booked calls. One number.' },
        { h: 'Everything else is diagnostic', b: 'Other metrics explain why the one number moved. They do not replace it.' },
        { h: 'Review weekly, not daily', b: 'Daily noise causes thrash. Weekly signal causes decisions.' }
      ],
      proof: 'Ten thousand impressions and two trial starts is a content problem. Two hundred impressions and twenty trials is a distribution problem.',
      tags: ['#businessmetrics', '#businesstips', '#entrepreneurship', '#femalefounders'],
      imagePrompt: 'Single analog gauge on cream background, brass bezel, editorial minimalism, no text',
      videoAngle: 'Ask viewers to name their number in the comments. Most will not be able to — that is the hook for part two.' },

    { id: 'pricing-floor', title: 'Your Price Is A Filter, Not A Guess', short: 'pricing', verb: 'price your offer',
      promise: 'Cheap attracts the clients who cost you the most.', mod: 0, motif: 'split',
      beats: [
        { h: 'Low prices filter for low commitment', b: 'The cheapest tier generates the most support tickets and the fewest results.' },
        { h: 'Price sets expectation', b: 'People assign value partly by cost. Underpricing reads as "probably does not work."' },
        { h: 'Compute your floor', b: 'Delivery cost + support time + the margin you need. Below that you are paying to work.' },
        { h: 'Raise it on new buyers only', b: 'Grandfather existing ones. You get the new margin without the churn.' }
      ],
      proof: 'Doubling price and losing 40% of volume is more revenue and less work. Run that subtraction before you discount.',
      tags: ['#pricingstrategy', '#businesstips', '#knowyourworth', '#womeninbusiness'],
      imagePrompt: 'Brass balance scale on cream linen, one side heavier, soft natural light, no text',
      videoAngle: 'Lead with the support-ticket insight. It is counterintuitive enough to stop the scroll.' },

    { id: 'systems-first', title: 'Hire The System Before You Hire The Person', short: 'systems', verb: 'hire',
      promise: 'An undocumented process does not get delegated, it gets duplicated badly.', mod: 0, motif: 'chain',
      beats: [
        { h: 'Write it while you do it', b: 'Record yourself doing the task once. That recording is the first draft of the SOP.' },
        { h: 'Then cut the decisions out', b: 'Replace "use your judgment" with an explicit rule wherever you can.' },
        { h: 'Then automate the mechanical parts', b: 'Whatever is left that a tool can do, give to the tool.' },
        { h: 'Now hire', b: 'You are hiring someone to run a defined system, not to guess what you meant.' }
      ],
      proof: 'The cost of a bad first hire is usually not the salary. It is the three months of unclear expectations.',
      tags: ['#systems', '#delegation', '#businessoperations', '#businesstips'],
      imagePrompt: 'Interlocking brass gears on cream stone, precise and minimal, overhead light, no text',
      videoAngle: 'Show a real SOP on screen. Specificity is what makes this believable.' },

    { id: 'audience-of-one', title: 'Write To One Woman, Not To An Audience', short: 'audience targeting', verb: 'write a post',
      promise: 'Specific beats broad, every single time.', mod: 0, motif: 'quote',
      beats: [
        { h: 'Broad content reaches nobody', b: '"Content for women entrepreneurs" describes forty million people and speaks to none of them.' },
        { h: 'Name her', b: 'Age, income, the exact sentence she said to herself at 11pm last night.' },
        { h: 'Write that sentence down', b: 'Her words, not your words. That is your hook, already written.' },
        { h: 'The others still come', b: 'Specificity does not shrink your reach. It earns the trust that makes people share.' }
      ],
      proof: '"How to invest" is a search term. "I have $3,000 and I am scared to lose it" is a customer.',
      tags: ['#contentstrategy', '#copywriting', '#businesstips', '#marketingtips'],
      imagePrompt: 'Single empty chair at a cream table, one place setting, soft editorial light, intimate, no text',
      videoAngle: 'Read three real DMs verbatim. Those are your hooks for the next month of content.' }
  ],

  faceless: [
    { id: 'batch-system', title: 'A Month Of Content In One Afternoon', short: 'batching', verb: 'batch content',
      promise: 'Stop making content daily. Make decisions daily instead.', mod: 0, motif: 'grid',
      beats: [
        { h: 'Separate the four jobs', b: 'Deciding, writing, designing, posting. Doing all four daily is why it feels endless.' },
        { h: 'Decide for the month once', b: 'Pillar per weekday. Topic per slot. Thirty decisions in one sitting.' },
        { h: 'Write in one pass', b: 'All thirty hooks back to back. Momentum makes the writing better, not worse.' },
        { h: 'Design from a template', b: 'One layout system, swapped text. Novelty in the words, consistency in the frame.' },
        { h: 'Schedule and walk away', b: 'Posting is the only daily job left, and a scheduler does it.' }
      ],
      proof: 'Thirty posts made one at a time is thirty context switches. Made in one sitting, it is one.',
      tags: ['#contentbatching', '#facelessmarketing', '#contentsystem', '#pinterestmarketing'],
      imagePrompt: 'Violet-lit grid of thirty identical blank cards, one lifted, overhead, minimal, no text',
      videoAngle: 'Film the actual afternoon as a time-lapse. The proof is watching it happen.' },

    { id: 'no-face-authority', title: 'You Can Build Authority Without Your Face', short: 'faceless authority', verb: 'go faceless',
      promise: 'Authority comes from being right repeatedly, not from being seen.', mod: 0, motif: 'stack',
      beats: [
        { h: 'Authority is accumulated specificity', b: 'Nobody trusts a face. They trust the fourth time you explained something correctly.' },
        { h: 'Use a consistent voice instead', b: 'Same vocabulary, same structure, same standards. That is the recognizable thing.' },
        { h: 'Show work, not self', b: 'Charts, screens, numbers, diagrams. Evidence reads as credibility.' },
        { h: 'Pick one visual signature', b: 'A palette and a layout people recognize mid-scroll. That is your face.' }
      ],
      proof: 'The most-followed finance accounts on Pinterest are diagrams and text. Almost none of them are people.',
      tags: ['#facelessbranding', '#contentcreator', '#personalbrand', '#facelessdigitalmarketing'],
      imagePrompt: 'Stacked translucent violet cards forming a column, soft rim light, dark background, no text',
      videoAngle: 'Screen recording plus voiceover only. The video format proves the thesis.' },

    { id: 'repurpose-chain', title: 'One Idea, Seven Posts', short: 'repurposing', verb: 'repurpose',
      promise: 'You do not need more ideas. You need to finish the ones you have.', mod: 0, motif: 'chain',
      beats: [
        { h: 'Start with the long thing', b: 'One real explanation — an episode, a lesson, a long post. That is the source.' },
        { h: 'Split it at the natural seams', b: 'Every section is a carousel. Every strong sentence is a quote card.' },
        { h: 'Change the format, not the idea', b: 'Carousel, quote, short video, checklist, myth-bust. Same content, five shapes.' },
        { h: 'Space them out', b: 'Two weeks apart reads as a theme. Same day reads as spam.' }
      ],
      proof: 'One 20-minute lesson contains about seven posts. You have probably published one of them.',
      tags: ['#repurposingcontent', '#contentstrategy', '#facelessmarketing', '#contentcreator'],
      imagePrompt: 'Single violet thread splitting into seven strands against dark background, elegant, no text',
      videoAngle: 'Take one Academy module and visibly break it into seven on a whiteboard.' },

    { id: 'pin-anatomy', title: 'The Anatomy Of A Pin That Still Works In 2026', short: 'pin design', verb: 'design a pin',
      promise: 'Pinterest is a search engine wearing a mood board.', mod: 0, motif: 'split',
      beats: [
        { h: 'Vertical, 2:3, always', b: '1000 x 1500. Anything else gets cropped or buried.' },
        { h: 'Text legible at thumbnail size', b: 'If the hook is unreadable on a phone in a feed, the pin does not exist.' },
        { h: 'Write the description for search', b: 'Natural sentences with the words people actually type. Not a hashtag dump.' },
        { h: 'One idea per pin', b: 'Pinterest is not a feed you scroll past. It is a result someone clicked. Deliver one thing.' },
        { h: 'Fresh pins beat repins', b: 'New images to the same URL is what the algorithm rewards. Design for volume.' }
      ],
      proof: 'The same article with twelve distinct pin designs outperforms the same article pinned twelve times.',
      tags: ['#pinterestmarketing', '#pinterestips', '#pindesign', '#pinteresttraffic'],
      imagePrompt: 'Two phone-sized vertical frames side by side, one crisp one blurred, violet accent, no text',
      videoAngle: 'Screen-record the actual design in Canva at 2x speed with the rules as captions.' }
  ],

  identity: [
    { id: 'first-generation', title: 'Nobody Taught You This On Purpose', short: 'financial exclusion', verb: 'learn this',
      promise: 'The gap is not a personal failing. It is a design.', mod: 0, motif: 'quote',
      beats: [
        { h: 'You are not behind', b: 'You were not in the room where this got explained. That is different from being slow.' },
        { h: 'The vocabulary is a gate', b: 'Jargon is not complexity. It is a membership test, and it is passable.' },
        { h: 'Learning late still counts', b: 'There is no age at which compounding stops working.' },
        { h: 'Then you become the room', b: 'Every woman you teach shortens the gap by a generation.' }
      ],
      proof: 'The first person in a family to invest is doing something harder than investing. She is doing it without a map.',
      tags: ['#generationalwealth', '#firstgenwealth', '#blackwomeninfinance', '#richgirlcode'],
      imagePrompt: 'A single open door with warm rose light spilling through into a dark room, cinematic, no text',
      videoAngle: 'Quietest video of the set. No charts. Talk to one woman and let it be slow.' },

    { id: 'money-shame', title: 'Shame Is Why You Have Not Checked The Balance', short: 'money shame', verb: 'look at your money',
      promise: 'Avoidance is expensive, and it is not laziness.', mod: 0, motif: 'split',
      beats: [
        { h: 'Avoidance is a feeling, not a flaw', b: 'You are not disorganized. You are protecting yourself from a number that hurts.' },
        { h: 'The number does not get better unwatched', b: 'Interest compounds in both directions while you look away.' },
        { h: 'Look once, with a witness', b: 'A friend, an advisor, a spreadsheet. The first look is the hardest and it is survivable.' },
        { h: 'Then it becomes data', b: 'Once it is information instead of a verdict, you can act on it.' }
      ],
      proof: 'The most common thing people say after finally checking: "it was less bad than I thought."',
      tags: ['#moneymindset', '#moneyshame', '#financialhealing', '#richgirlcode'],
      imagePrompt: 'A closed envelope on a rose-toned surface, soft shadow, intimate still life, no text',
      videoAngle: 'Confessional tone. Disclose your own avoidance first or this does not land.' },

    { id: 'quiet-competence', title: 'Rich Is Quieter Than You Think', short: 'quiet wealth', verb: 'build wealth',
      promise: 'The aesthetic is not the asset.', mod: 0, motif: 'stack',
      beats: [
        { h: 'Visible spending is not wealth', b: 'It is often debt with good lighting.' },
        { h: 'Wealth is boring on the outside', b: 'Automated contributions, unexciting index funds, decades.' },
        { h: 'The flex is optionality', b: 'Being able to say no is the thing money actually buys.' },
        { h: 'Build the balance sheet first', b: 'Let the lifestyle be a lagging indicator, not a leading one.' }
      ],
      proof: 'Two women with identical incomes: one has the bag, one has twelve years of contributions. Only one of them can quit.',
      tags: ['#quietluxury', '#wealthmindset', '#richgirlcode', '#financialfreedom'],
      imagePrompt: 'Single pearl on raw silk in rose light, extreme minimalism, macro, no text',
      videoAngle: 'Shoot this one beautifully. It is the reach post — it earns the audience for the teaching posts.' },

    { id: 'top-of-range', title: 'You Have Never Once Asked For The Top Of The Range', short: 'asking for more', verb: 'negotiate',
      promise: 'The cheapest money you will ever make is the money you ask for.', mod: 0, motif: 'ladder',
      beats: [
        { h: 'You priced yourself at the middle', b: 'Rate, salary, retainer — you picked a number you were sure would be accepted.' },
        { h: 'Acceptance is not the goal', b: 'A yes that comes instantly means the number was below what was available.' },
        { h: 'Ask at the top and stay quiet', b: 'Name the high number. Do not fill the silence or negotiate against yourself.' },
        { h: 'It compounds', b: 'Every future raise, offer, and rate is calculated from this number. Once is never once.' }
      ],
      proof: 'A $10,000 raise at 28 is worth far more than $10,000. Every subsequent percentage is computed from the higher base.',
      tags: ['#negotiation', '#knowyourworth', '#richgirlcode', '#womeninbusiness'],
      imagePrompt: 'Rose-lit ascending brass steps with one higher step illuminated, minimal editorial, no text',
      videoAngle: 'Script the exact sentence to say and then the silence. Give them words, not encouragement.' }
  ],

  sahm: [
    { id: 'nap-schedule', title: 'Building Income In 90-Minute Blocks', short: 'fragmented time', verb: 'start a business',
      promise: 'Your constraint is not ambition. It is contiguous time.', mod: 0, motif: 'grid',
      beats: [
        { h: 'Stop planning for four-hour blocks', b: 'You do not have them. Designing around them guarantees failure.' },
        { h: 'Find your real unit', b: 'For most mothers it is 60 to 90 minutes, once or twice a day.' },
        { h: 'Cut every task to fit the unit', b: 'If it does not fit in 90 minutes, it is not a task yet. It is a project.' },
        { h: 'Protect the start, not the finish', b: 'Leave each block mid-sentence so the next one starts instantly.' }
      ],
      proof: 'Ninety minutes a day, five days a week, is 390 hours a year. That is ten full work weeks.',
      tags: ['#stayathomemom', '#momboss', '#workingmom', '#momentrepreneur'],
      imagePrompt: 'Cream calendar grid with small blocks of warm light, overhead, quiet editorial, no text',
      videoAngle: 'Film during an actual nap. The ambient monitor sound is the credibility.' },

    { id: 'income-around-kids', title: 'Income That Does Not Need You Awake', short: 'passive income', verb: 'earn passively',
      promise: 'Separate your money from your hours, carefully and honestly.', mod: 3, motif: 'curve',
      beats: [
        { h: '"Passive" is mostly a lie', b: 'Everything needs maintenance. The honest question is the ratio.' },
        { h: 'Rank by hours per dollar', b: 'Client work is 1:1. A digital product is 100:1 after launch. Premium income is closer to 1000:1.' },
        { h: 'Build the active thing first', b: 'Active income funds the asset. Skipping this step is why most attempts stall.' },
        { h: 'Then convert hours into assets', b: 'Each month, move one recurring task into something that runs without you.' }
      ],
      proof: 'A covered call takes four minutes a month to manage. That is the actual ratio people mean by passive.',
      tags: ['#passiveincome', '#stayathomemillionaire', '#momincome', '#financialfreedom'],
      imagePrompt: 'Cream curve rising gently with a sleeping-house silhouette below, soft dawn light, no text',
      videoAngle: 'Be the one creator who admits passive income is not passive. That honesty is the differentiator.' },

    { id: 'invisible-labor', title: 'The Unpaid Job That Is Hiding Your Capacity', short: 'invisible labor', verb: 'find your hours',
      promise: 'You are not low on ambition. You are fully employed already.', mod: 0, motif: 'split',
      beats: [
        { h: 'Write down every unpaid task', b: 'Meals, laundry, appointments, the mental calendar nobody else holds. All of it, on paper.' },
        { h: 'Price it honestly', b: 'What would it cost to hire out? That number is your current unpaid salary.' },
        { h: 'Now the math changes', b: 'You are not starting from zero hours. You are negotiating for a reallocation.' },
        { h: 'Buy back one block', b: 'Outsource or drop the single cheapest hour to replace. That is your first business hour.' }
      ],
      proof: 'Most mothers find three to five reclaimable hours a week on the first pass. That is a business.',
      tags: ['#invisiblelabor', '#momlife', '#stayathomemom', '#timemanagement'],
      imagePrompt: 'Cream split-frame still life, a folded laundry stack beside an open laptop, soft daylight, no text',
      videoAngle: 'Start by reading your own list out loud. The recognition is the hook.' }
  ],

  lifestyle: [
    { id: 'desk-as-signal', title: 'Build The Desk You Would Respect', short: 'workspace', verb: 'set up your desk',
      promise: 'Environment is a decision you only make once.', mod: 0, motif: 'quote',
      beats: [
        { h: 'The space sets the standard', b: 'You will not run a serious operation from a corner you are embarrassed by.' },
        { h: 'One good surface', b: 'Clear, lit, and yours. Everything else is optional.' },
        { h: 'Make the work visible', b: 'The charts on the wall are not decoration. They are a commitment device.' },
        { h: 'Then leave it alone', b: 'Optimizing the desk is the most comfortable way to avoid the work.' }
      ],
      proof: 'A dedicated surface outperforms a dedicated planner. Place beats intention.',
      tags: ['#homeoffice', '#deskaesthetic', '#richgirldecor', '#workspaceinspo'],
      imagePrompt: 'Rose-toned minimal desk, one monitor with a soft chart glow, fresh peonies, morning light, no text',
      videoAngle: 'Pure b-roll with a voiceover. Lowest effort, highest reach. Use it to recruit for the teaching content.' },

    { id: 'sunday-money-ritual', title: 'The Twenty-Minute Sunday Money Ritual', short: 'money rituals', verb: 'review your money',
      promise: 'A weekly appointment beats a yearly panic.', mod: 0, motif: 'checklist',
      beats: [
        { h: 'Same time, every week', b: 'Twenty minutes. Make it pleasant on purpose — coffee, good light, no laptop chaos.' },
        { h: 'Read three numbers', b: 'Cash, invested, owed. Write them down by hand.' },
        { h: 'Make one decision', b: 'One move for the week. Not a restructure. One.' },
        { h: 'Close the laptop', b: 'The point is the streak, not the depth. Depth comes from the streak.' }
      ],
      proof: 'Fifty-two small reviews catch problems a single annual review never sees.',
      tags: ['#moneyritual', '#sundayreset', '#financialhabits', '#richgirlroutine'],
      imagePrompt: 'Rose-lit still life, notebook with handwritten figures, espresso cup, linen, overhead, no text',
      videoAngle: 'Film the real ritual in one unbroken take. Authenticity carries this format.' },

    { id: 'closet-audit', title: 'The Closet Audit That Funds Your First Contract', short: 'funding your start', verb: 'fund your account',
      promise: 'Your starting capital is probably already in your house.', mod: 0, motif: 'stack',
      beats: [
        { h: 'Pull everything unworn in a year', b: 'No negotiating with yourself. A year is a year.' },
        { h: 'Sell the top ten items only', b: 'The long tail is not worth your weekend. Ten pieces, listed in one sitting.' },
        { h: 'Move it straight to the brokerage', b: 'Same day. Money that sits in checking gets absorbed by the week.' },
        { h: 'That is a real position', b: 'A few hundred dollars is enough to sell one cash-secured put on something modest.' }
      ],
      proof: 'The gap between wanting to start and starting is usually a few hundred dollars that is sitting in a closet.',
      tags: ['#declutter', '#fundyouraccount', '#richgirlcode', '#moneymoves'],
      imagePrompt: 'Rose-lit flat lay, neatly folded garments beside a phone showing a rising chart, overhead, no text',
      videoAngle: 'Film the real audit and the real transfer. The transfer screen is the whole payoff.' },

    /* --- Holiday slot ---------------------------------------------------
       Drawn only when a teaching slot is skipped. Kept disjoint from the
       regular reach rotation so a fill-in can never repeat that week's post.
       -------------------------------------------------------------------- */
    { id: 'black-friday-buy', title: 'The Only Thing I Buy On Black Friday', short: 'buying assets', verb: 'spend today',
      promise: 'One day a year everything is discounted except the thing that pays you back.', mod: 0, motif: 'split', slot: 'holiday',
      beats: [
        { h: 'Today is engineered', b: 'The countdown, the stock counter, the doorbuster. All of it is design, not scarcity.' },
        { h: 'Most of it depreciates by Monday', b: 'Whatever you buy today is worth less tomorrow. That is what a consumer good is.' },
        { h: 'Buy the thing that appreciates instead', b: 'Take the number you were going to spend, move it to the brokerage, and buy one share of something you would hold for ten years.' },
        { h: 'You will not miss it', b: 'Nobody remembers what they bought on Black Friday three years ago. You will remember owning the share.', key: true }
      ],
      proof: 'Whatever you were about to spend today, multiply it by ten. At 8% that is roughly what it becomes in thirty years. Then decide.',
      tags: ['#blackfriday', '#antihaul', '#investingforwomen', '#richgirlcode'],
      imagePrompt: 'Rose-lit still life, an unopened shopping bag beside a phone showing a brokerage confirmation, overhead, no text',
      videoAngle: 'Film it on the day. Show the actual transfer instead of the actual purchase. No lecture.' },

    { id: 'gratitude-ledger', title: 'The Year You Stopped Apologising For Wanting More', short: 'wanting more', verb: 'want more',
      promise: 'Gratitude and ambition are not opposites.', mod: 0, motif: 'quote', slot: 'holiday',
      beats: [
        { h: 'You were taught to pick one', b: 'Be grateful for what you have, or be hungry for more. Women especially get told these cancel out.' },
        { h: 'They are different muscles', b: 'Gratitude is about what already happened. Ambition is about what has not. Neither disqualifies the other.' },
        { h: 'Name both out loud today', b: 'One thing you are genuinely glad of, and one number you are going after. Say them in the same breath.' },
        { h: 'Wanting more is not ingratitude', b: 'You can be thankful for the table you are sitting at and still intend to buy a bigger one. Both are allowed.', key: true }
      ],
      proof: 'The women who build wealth are rarely the least grateful ones. They are the ones who stopped treating the two as a choice.',
      tags: ['#thanksgiving', '#gratitude', '#ambition', '#richgirlcode'],
      imagePrompt: 'Rose-lit table after a meal, one chair pushed back, warm low light, intimate still life, no text',
      videoAngle: 'Voice only over b-roll of the day. Let it be slow. No charts.' },

    { id: 'year-end-gift', title: 'What I Give The Women In My Family Now', short: 'giving assets', verb: 'give a gift',
      promise: 'A gift worth more every year they do not spend it.', mod: 0, motif: 'curve', slot: 'holiday',
      beats: [
        { h: 'A gift that compounds', b: 'A share of something solid, given to a niece at ten, has decades to work before she needs it.' },
        { h: 'It teaches while it grows', b: 'She will check the price. She will ask why it moved. That curiosity is the actual present.' },
        { h: 'Custodial accounts are not complicated', b: 'Most brokers open one in under fifteen minutes. An adult manages it until she comes of age.' },
        { h: 'Say what it is for', b: 'A gift with no explanation is just a gesture. Tell her the plan, and tell her it is hers.', key: true }
      ],
      proof: '$100 given at ten and left alone until forty is roughly $1,000 at 8%. The card it came in cost more than the share did.',
      tags: ['#generationalwealth', '#custodialaccount', '#givingassets', '#richgirlcode'],
      imagePrompt: 'Rose-lit flat lay, a small wrapped box beside a handwritten certificate, warm holiday light, no text',
      videoAngle: 'Quiet and warm. Keep every chart off screen until the last ten seconds.' },

    { id: 'new-year-floor', title: 'Before You Set A Money Goal, Set A Money Floor', short: 'money floors', verb: 'set a goal',
      promise: 'Goals are what you reach for. Floors are what catch you.', mod: 0, motif: 'stack', slot: 'holiday',
      beats: [
        { h: 'Everyone sets a ceiling', b: 'A number to hit, a figure to reach. Ambitious, motivating, and abandoned by February.' },
        { h: 'Almost nobody sets a floor', b: 'The balance you will not go below. The bill paid first. The position size you will not exceed.' },
        { h: 'Floors survive bad months', b: 'A goal fails the moment you miss it. A floor still works when the year goes sideways.' },
        { h: 'Write both down today', b: 'One number you are reaching for, one you will not fall below. The second is what keeps you in the game long enough to reach the first.', key: true }
      ],
      proof: 'Pick one floor: an emergency fund you do not touch, a contribution you do not skip, or a loss limit you do not override. One is enough.',
      tags: ['#newyear', '#moneygoals', '#financialplanning', '#richgirlcode'],
      imagePrompt: 'Rose-lit notebook open to two handwritten numbers, one circled, morning light on linen, overhead, no text',
      videoAngle: 'Do it on camera. Write your own two numbers and show them. Specificity is the whole thing.' },

    { id: 'market-closed', title: 'The Market Is Closed And So Are You', short: 'resting', verb: 'take a day off',
      promise: 'There is no trade to miss today. That is the point.', mod: 0, motif: 'quote', slot: 'holiday',
      beats: [
        { h: 'Nothing is open', b: 'No fills, no expiries, no news that needs a response. The screen has nothing to tell you.' },
        { h: 'The urge to check is a habit', b: 'If you reach for the app today, notice it. That is a reflex, not analysis.' },
        { h: 'Positions do not need supervision', b: 'A well-sized position survives a day you are not watching. If it does not, the size was the problem.', key: true },
        { h: 'Come back Monday', b: 'The setups will still be there. They always are.' }
      ],
      proof: 'If one day away from the screen would change your outcome, the position is too big. That is the whole test.',
      tags: ['#marketholiday', '#tradingpsychology', '#rest', '#richgirlcode'],
      imagePrompt: 'Rose-lit still life, a closed laptop and a cup of tea by a window, soft daylight, calm, no text',
      videoAngle: 'Thirty seconds, no charts. The shortest post of the year and probably the most shared.' }
  ],

  podcast: [
    { id: 'episode-recap', title: 'Protecting Wealth With Real Assets', short: 'hard assets', verb: 'diversify',
      promise: 'The episode, cut down to what you can act on.', mod: 1, motif: 'quote',
      beats: [
        { h: 'Currency is a claim, not a thing', b: 'Its value rests on confidence. Confidence is not permanent.' },
        { h: 'Hard assets hold value differently', b: 'Metals, land, productive businesses. They do not depend on one issuer.' },
        { h: 'Diversify the kind, not just the number', b: 'Nine stocks is one asset class. That is not diversification.' },
        { h: 'Keep the boring core', b: 'Hedges are a slice. They are not the plan.' }
      ],
      proof: 'Every portfolio has a single point of failure. Most people have never named theirs out loud.',
      tags: ['#rgcpodcast', '#hardassets', '#wealthprotection', '#moneytalk'],
      imagePrompt: 'Violet-lit still life, a gold bar beside a microphone, dramatic single source, minimal, no text',
      videoAngle: 'Clip the strongest 45 seconds of audio and build the carousel around that exact quote.' },
    { id: 'dollar-trust', title: 'What Happens When Trust In The Dollar Slips', short: 'currency risk', verb: 'hedge',
      promise: 'The episode, cut down to the part you can act on.', mod: 1, motif: 'decay',
      beats: [
        { h: 'Money works on consensus', b: 'A dollar is worth something because everyone agrees it is. That agreement is a variable, not a constant.' },
        { h: 'Confidence shows up in prices', b: 'When trust thins, people move toward things that exist without an issuer. Metals usually move first.' },
        { h: 'You cannot time it', b: 'Nobody rings a bell. Which is why this is an allocation question, not a prediction question.' },
        { h: 'Hold a slice, not a thesis', b: 'A small permanent allocation beats a large emotional one made during a headline.' }
      ],
      proof: 'The question is not "will it collapse." It is "what percentage of my net worth depends on one issuer being fine."',
      tags: ['#rgcpodcast', '#currencyrisk', '#hardassets', '#wealthprotection'],
      imagePrompt: 'Violet-lit still life, a paper banknote beside a solid metal ingot, dramatic single light, no text',
      videoAngle: 'Pull the strongest 40 seconds of episode audio and build the whole carousel around that one quote.' },

    { id: 'first-100k', title: 'Why The First Hundred Thousand Is The Hardest', short: 'the first 100k', verb: 'build savings',
      promise: 'The episode, cut down to the part you can act on.', mod: 1, motif: 'curve',
      beats: [
        { h: 'Early on, you are the engine', b: 'Almost all the growth comes from what you put in. The market contributes very little.' },
        { h: 'There is no momentum yet', b: 'That is why it feels like pushing. Nothing is pushing back with you.' },
        { h: 'Then the balance starts working', b: 'Past a certain size, annual returns start to rival annual contributions.' },
        { h: 'It gets easier, not harder', b: 'Everyone who tells you the first chunk was the worst part is describing this exact curve.' }
      ],
      proof: 'At 8%, a $100k balance throws off roughly $8k a year on its own. That is a second contributor you did not have to hire.',
      tags: ['#rgcpodcast', '#first100k', '#wealthbuilding', '#compounding'],
      imagePrompt: 'Violet gradient with a steep rising curve and a marked threshold point, minimal editorial, no text',
      videoAngle: 'Honest and encouraging. The audience is in the hard part right now — say that out loud.' },

    { id: 'who-manages', title: 'Nobody Is Coming To Manage Your Money', short: 'financial self-reliance', verb: 'take control',
      promise: 'The episode, cut down to the part you can act on.', mod: 1, motif: 'quote',
      beats: [
        { h: 'Waiting is a decision', b: 'Deferring it to a future spouse, advisor, or better year is still choosing an outcome.' },
        { h: 'Delegation needs literacy first', b: 'You cannot evaluate an advisor in a language you do not speak. Learn enough to ask hard questions.' },
        { h: 'Competence is cheaper than it looks', b: 'The core of this is maybe twenty hours of real learning. Not a degree.' },
        { h: 'Then delegate on purpose', b: 'Hire help from a position of understanding, not of relief.' }
      ],
      proof: 'The women who do best with advisors are not the ones who know least. They are the ones who know enough to interview them.',
      tags: ['#rgcpodcast', '#financialindependence', '#moneytalk', '#womenandmoney'],
      imagePrompt: 'Violet-lit empty conference chair at the head of a table, cinematic, minimal, no text',
      videoAngle: 'Direct address, no b-roll. This one works because it is uncomfortable.' }
  ]
};
