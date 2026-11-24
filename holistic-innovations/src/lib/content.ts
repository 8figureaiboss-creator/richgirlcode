export type Region = "sacramento" | "bayarea";
export type CategoryId = "maternal" | "newborn" | "education";

export const INSTAGRAM_URL = "https://www.instagram.com/doulajamie_/";
export const INSTAGRAM_HANDLE = "@doulajamie_";

export const categories: { id: CategoryId; title: string; blurb: string }[] = [
  {
    id: "maternal",
    title: "Maternal Wellness & Postpartum Care",
    blurb: "Lactation, postpartum recovery, meal support and family education, so the person who gave birth gets cared for too.",
  },
  {
    id: "newborn",
    title: "Specialized Newborn & Private Family Care",
    blurb: "Overnight, live-in and rotational newborn care for families who need steady, skilled hands, including multiples.",
  },
  {
    id: "education",
    title: "Professional Development & Education",
    blurb: "Mentorship for emerging doulas, maternal health guides, and workshops planned for the future.",
  },
];

export type Service = {
  n: string;
  slug: string;
  title: string;
  category: CategoryId;
  price: (region: Region, twins: boolean) => string;
  unit: string;
  summary: string;
  includes: string[];
  format: string;
  pending?: boolean;
  regional?: boolean;
  twinsOption?: boolean;
};

export const services: Service[] = [
  {
    n: "01",
    slug: "lactation",
    title: "Lactation Support",
    category: "maternal",
    price: () => "$150",
    unit: "initial 90-min consult · $100 follow-up (60 min)",
    summary:
      "One-on-one breastfeeding and pumping education with a Certified Lactation Counselor, from prenatal preparation through postpartum follow-up.",
    includes: ["Feeding positions & latch", "Pumping, milk expression & storage", "Common feeding concerns", "Prenatal & postpartum visits"],
    format: "Prenatal consultations and postpartum follow-up visits",
    pending: true,
  },
  {
    n: "02",
    slug: "overnight",
    title: "Overnight Newborn Care",
    category: "newborn",
    price: (r, twins) => (twins ? (r === "sacramento" ? "$75" : "$80") : r === "sacramento" ? "$65" : "$75"),
    unit: "per hour",
    summary:
      "Professional night care so parents can sleep while the baby keeps a steady, gentle routine.",
    includes: ["Feeding & diaper changes", "Soothing & safe sleep practices", "Care documentation each night", "Newborn-related tasks"],
    format: "8–12 hour overnight shifts · multi-week contracts",
    regional: true,
    twinsOption: true,
  },
  {
    n: "03",
    slug: "postpartum",
    title: "Postpartum Recovery Support",
    category: "maternal",
    price: () => "$65",
    unit: "per hour",
    summary:
      "Personalized, nonmedical support while you recover from birth, for your body, your emotions and your home.",
    includes: ["Rest planning", "Emotional support", "Recovery education", "Infant care guidance & light household help"],
    format: "Daytime visits or ongoing postpartum arrangements",
    pending: true,
  },
  {
    n: "04",
    slug: "meals",
    title: "Postpartum Meal Support",
    category: "maternal",
    price: () => "$65",
    unit: "per hour · groceries billed separately",
    summary:
      "Practical nourishment for recovery: simple, warm, portioned meals and a clean kitchen afterward.",
    includes: ["Grocery planning", "Simple meal preparation", "Portioning for the week", "Light kitchen cleanup"],
    format: "Part of postpartum support or scheduled meal visits",
    pending: true,
  },
  {
    n: "05",
    slug: "live-in",
    title: "Temporary Live-In Support",
    category: "newborn",
    price: () => "$55",
    unit: "per hour + applicable overtime",
    summary:
      "Short-term, intensive newborn and family support with your specialist staying in the home.",
    includes: ["Defined working hours", "Protected rest periods", "Individualized responsibilities", "Several days to multiple weeks"],
    format: "Short-term contracts with suitable accommodations",
  },
  {
    n: "06",
    slug: "rota",
    title: "Rotational (ROTA) Support",
    category: "newborn",
    price: () => "$65",
    unit: "per hour + applicable overtime",
    summary:
      "Continuous care in alternating blocks (for example, seven days on and seven off) with coordinated handoffs.",
    includes: ["Extended coverage", "Travel flexibility", "Coordinated handoffs", "Private family or agency contracts"],
    format: "Ongoing engagements with other childcare professionals",
  },
  {
    n: "07",
    slug: "mentorship",
    title: "Mentorship for Emerging Doulas",
    category: "education",
    price: () => "$150",
    unit: "per 60-min session · 3 sessions for $400",
    summary:
      "Practical mentorship from a doula who has guided new professionals for years, covering the business side and the bedside.",
    includes: ["Client intake & contracts", "Pricing & interviewing", "Documentation & agency relationships", "Boundaries & confidence"],
    format: "Individual sessions or a three-session package",
    pending: true,
  },
];

export const credentials = [
  "Postpartum Doula",
  "Newborn Care Specialist",
  "Certified Lactation Counselor",
  "Founder & President, WOMB Collective",
];

export const expertise = [
  "Postpartum recovery",
  "Newborn development",
  "Lactation education",
  "Overnight infant care",
  "Multiples & twins",
  "Live-in & rotational care",
];

export const journey = [
  {
    phase: "Pregnancy",
    when: "Third trimester",
    title: "Prepare the nest",
    body: "Prenatal lactation consult, a postpartum plan, and an overnight or live-in care schedule set up before baby arrives.",
    services: ["Lactation Support", "Mentorship & planning"],
  },
  {
    phase: "Arrival",
    when: "Days 1–14",
    title: "Rest is the priority",
    body: "Overnight care protects your sleep. Live-in support covers the most intense days. Feeding questions get answered early.",
    services: ["Overnight Newborn Care", "Temporary Live-In"],
  },
  {
    phase: "Recovery",
    when: "Weeks 2–6",
    title: "Heal and settle in",
    body: "Daytime recovery visits, nourishing meals, emotional support and steady routines as your family finds its rhythm.",
    services: ["Postpartum Recovery", "Meal Support"],
  },
  {
    phase: "Rhythm",
    when: "Weeks 6–12+",
    title: "Find your footing",
    body: "Lactation follow-ups, a gradual handoff of night care, or longer rotational coverage for families who need it.",
    services: ["Lactation Follow-up", "Rotational (ROTA)"],
  },
];

export const guides = [
  {
    n: 1,
    title: "Preparing for the Fourth Trimester",
    topics: "Postpartum planning, recovery expectations & support systems",
    from: "#E86B9D",
    to: "#F3CAD7",
  },
  {
    n: 2,
    title: "Understanding Your Newborn",
    topics: "Infant behavior, feeding cues, safe sleep foundations & everyday care",
    from: "#168E91",
    to: "#7cc7c4",
  },
  {
    n: 3,
    title: "Breastfeeding & Pumping Essentials",
    topics: "Lactation preparation & feeding education",
    from: "#c94a7f",
    to: "#E86B9D",
  },
  {
    n: 4,
    title: "Postpartum Nourishment & Recovery",
    topics: "Practical nourishment & recovery support",
    from: "#0e6466",
    to: "#168E91",
  },
];

export const workshopTopics = [
  "Postpartum preparation",
  "Newborn care",
  "Breastfeeding & pumping",
  "Postpartum nourishment",
  "Professional doula development",
];

export const mentorshipTopics = [
  { t: "Client intake", d: "Discovery calls, intake forms and setting expectations from the first conversation." },
  { t: "Contracts", d: "Scope, hours, overtime and cancellation terms that protect you and your families." },
  { t: "Pricing", d: "Setting overnight, live-in and ROTA rates that reflect your skill." },
  { t: "Interviewing", d: "Presenting yourself well to private families and placement agencies." },
  { t: "Documentation", d: "Clear care logs and handoff notes that build trust." },
  { t: "Agency relationships", d: "Working with agencies while keeping your standards and your sanity." },
  { t: "Boundaries", d: "Rest periods, scope of practice, and saying no professionally." },
  { t: "Confidence", d: "Trusting your training and growing into the work." },
];

export const wellnessPillars = [
  { key: "Physical", body: "Rest, recovery, nourishment and feeding support for the body that just did something extraordinary." },
  { key: "Emotional", body: "Room to feel all of it, with a calm, compassionate presence beside you through the transition." },
  { key: "Mental", body: "Evidence-informed education so you can make decisions with clarity instead of guesswork." },
  { key: "Spiritual", body: "Honoring birth and new parenthood as a sacred life transition, not a checklist." },
];

export const faqs = [
  {
    q: "Which areas do you serve?",
    a: "Families across Sacramento and the San Francisco Bay Area. Overnight care rates differ slightly by region. Travel for live-in or rotational contracts is covered in individual agreements.",
  },
  {
    q: "What does an overnight shift look like?",
    a: "Shifts usually run 8–12 hours. Your specialist handles feeding (bottle feeds, or bringing baby to you for nursing), diaper changes, soothing and safe sleep, and keeps a written log so you wake up knowing exactly how the night went.",
  },
  {
    q: "Do you care for twins and multiples?",
    a: "Yes. Multiples are one of Jamie's specialties. Twin overnight care is $75/hour in Sacramento and $80/hour in the Bay Area.",
  },
  {
    q: "What is the difference between live-in and rotational (ROTA) care?",
    a: "Live-in is short-term, intensive support with your specialist staying in your home for several days to a few weeks. ROTA is longer-term coverage in alternating blocks, such as seven days on and seven off, with coordinated handoffs between professionals.",
  },
  {
    q: "Is this medical care?",
    a: "No. All services are nonmedical. Lactation support is provided within Certified Lactation Counselor scope, and any medical concerns are referred to appropriately qualified healthcare providers.",
  },
  {
    q: "How are overtime, travel and expenses handled?",
    a: "Overtime, travel, expenses and any employment requirements are spelled out in your individual client agreement before care begins, so there are no surprises.",
  },
  {
    q: "When should we book?",
    a: "Overnight, live-in and rotational care are commonly arranged during pregnancy, and the second or early third trimester is ideal. Reach out anyway if baby is already here. Lactation and postpartum support can often start quickly.",
  },
];
