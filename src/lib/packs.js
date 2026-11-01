export const FREE_CREDITS = 500;
export const FREE_SCRAPES = 20;
export const LEADS_PER_RUN = 5;
export const MAX_BRIEFS = 5;
export const SCRAPE_COST_PER_LEAD = 1;
export const COST_AI_MESSAGE = 15;
export const COST_SAMPLE_DRAFT = 25;

export const CREDIT_PACKS = [
  {
    id: 'free',
    name: 'Free',
    credits: FREE_CREDITS,
    scrapes: FREE_SCRAPES,
    price: 0,
    currency: 'EUR',
    blurb: 'Try the engine on your own pipeline.',
    features: ['500 credits', '20 customer scrapes', 'Lead scoring + AI drafts'],
    cta: 'Start free',
    free: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 1000,
    scrapes: 300,
    price: 19,
    currency: 'EUR',
    popular: true,
    blurb: 'A steady week-to-week pipeline.',
    features: ['1,000 credits', '300 customer scrapes', 'Lead scoring + AI drafts'],
  },
  {
    id: 'scale',
    name: 'Scale',
    credits: 5000,
    scrapes: 500,
    price: 49,
    currency: 'EUR',
    blurb: 'For teams scouting every working day.',
    features: ['5,000 credits', '500 customer scrapes', 'Priority drafting model'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 10000,
    scrapes: 1000,
    price: null,
    currency: 'EUR',
    blurb: 'Heavy outbound teams and agencies.',
    features: ['10,000 credits', '1,000 customer scrapes', 'Set up with our team'],
    contact: true,
  },
];

// Packs that can go through self-serve checkout (Enterprise is arranged with the team).
export const CHECKOUT_PACKS = CREDIT_PACKS.filter((pack) => !pack.free);

export const getPack = (id) => CREDIT_PACKS.find((pack) => pack.id === id);

export const formatCredits = (value) =>
  typeof value === 'number' ? value.toLocaleString('en-IE') : '0';

export const formatPrice = (pack) => {
  if (!pack || pack.price === null || pack.price === undefined) return 'Talk to us';
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: pack.currency,
    maximumFractionDigits: 0,
  }).format(pack.price);
};