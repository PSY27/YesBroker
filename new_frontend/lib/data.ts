export type Verdict = 'SAFE' | 'CAUTION' | 'RISK'
export type ReportVerdict = 'SAFE' | 'CAUTION' | 'HIGH_RISK'
export type AgentName = 'price' | 'text' | 'photo' | 'web' | 'commute'
export type AgentVerdict = 'CLEAN' | 'SUSPICIOUS' | 'BAIT' | 'LIE'

export type RankedListing = {
  rank: number
  id: string
  title: string
  rent: number
  score: number
  verdict: Verdict
  one_liner: string
  imageUrl: string
  bhk: string
  area: string
  pincode: string
}

export type AgentResult = {
  agent: AgentName
  verdict: AgentVerdict
  detail: string
  evidence: string[]
  confidence: number
  weight: number
}

export type TrustReport = {
  listing_id: string
  score: number
  verdict: ReportVerdict
  flags: AgentResult[]
  reasoning: string[]
  questions_to_ask: string[]
}

const IMG = {
  a: '/flats/flat-1.png',
  b: '/flats/flat-2.png',
  c: '/flats/flat-3.png',
  d: '/flats/flat-4.png',
  e: '/flats/flat-5.png',
}

export const LISTINGS: RankedListing[] = [
  {
    rank: 1,
    id: 'BLR-0087',
    title: 'Spacious 2BHK · 100ft Road, Indiranagar',
    rent: 34000,
    score: 87,
    verdict: 'SAFE',
    one_liner: 'Verified owner, market-rate rent, original photos, consistent history.',
    imageUrl: IMG.a,
    bhk: '2 BHK',
    area: 'Indiranagar',
    pincode: '560038',
  },
  {
    rank: 2,
    id: 'BLR-0081',
    title: 'Bright 2BHK near Metro · Domlur',
    rent: 32000,
    score: 81,
    verdict: 'SAFE',
    one_liner: 'Registered broker, photos match site visit, priced within 6% of area median.',
    imageUrl: IMG.b,
    bhk: '2 BHK',
    area: 'Domlur',
    pincode: '560071',
  },
  {
    rank: 3,
    id: 'BLR-0076',
    title: 'Semi-furnished 2BHK · CMH Road',
    rent: 30000,
    score: 74,
    verdict: 'SAFE',
    one_liner: 'Genuine listing, minor photo reuse across portals but same property.',
    imageUrl: IMG.c,
    bhk: '2 BHK',
    area: 'Indiranagar',
    pincode: '560038',
  },
  {
    rank: 4,
    id: 'BLR-0069',
    title: '2BHK with balcony · HAL 2nd Stage',
    rent: 28000,
    score: 63,
    verdict: 'CAUTION',
    one_liner: 'Listing text mildly exaggerated; ask for a live video walkthrough.',
    imageUrl: IMG.d,
    bhk: '2 BHK',
    area: 'HAL 2nd Stage',
    pincode: '560008',
  },
  {
    rank: 5,
    id: 'BLR-0058',
    title: 'Cozy 2BHK · Old Airport Road',
    rent: 26000,
    score: 55,
    verdict: 'CAUTION',
    one_liner: 'Rent slightly below market and broker unverified on 1 portal.',
    imageUrl: IMG.e,
    bhk: '2 BHK',
    area: 'Old Airport Road',
    pincode: '560017',
  },
  {
    rank: 6,
    id: 'BLR-0050',
    title: '2BHK "urgent rent" · Jeevan Bima Nagar',
    rent: 24000,
    score: 48,
    verdict: 'CAUTION',
    one_liner: 'Urgency language and a token-advance request raise mild concern.',
    imageUrl: IMG.b,
    bhk: '2 BHK',
    area: 'Jeevan Bima Nagar',
    pincode: '560075',
  },
  {
    rank: 7,
    id: 'BLR-0042',
    title: '2BHK fully furnished · CV Raman Nagar',
    rent: 22000,
    score: 41,
    verdict: 'CAUTION',
    one_liner: 'Photos appear staged/stock; commute claim to Whitefield is optimistic.',
    imageUrl: IMG.a,
    bhk: '2 BHK',
    area: 'CV Raman Nagar',
    pincode: '560093',
  },
  {
    rank: 8,
    id: 'BLR-0031',
    title: 'Luxury 2BHK · No brokerage!',
    rent: 20000,
    score: 33,
    verdict: 'RISK',
    one_liner: '"No brokerage, direct owner" but bank details requested before visit.',
    imageUrl: IMG.e,
    bhk: '2 BHK',
    area: 'Indiranagar',
    pincode: '560038',
  },
  {
    rank: 9,
    id: 'BLR-0024',
    title: '2BHK · Owner relocating, quick deal',
    rent: 19000,
    score: 24,
    verdict: 'RISK',
    one_liner: 'Same photos as 3 other cities; refuses in-person visit.',
    imageUrl: IMG.c,
    bhk: '2 BHK',
    area: 'Indiranagar',
    pincode: '560038',
  },
  {
    rank: 10,
    id: 'BLR-0018',
    title: '2BHK · Owner going abroad, keys by courier',
    rent: 18000,
    score: 18,
    verdict: 'RISK',
    one_liner: 'Stolen photos, 49% below market, wants deposit via UPI before viewing.',
    imageUrl: IMG.c,
    bhk: '2 BHK',
    area: 'Indiranagar',
    pincode: '560038',
  },
]

function report(
  id: string,
  score: number,
  verdict: ReportVerdict,
  flags: AgentResult[],
  reasoning: string[],
  questions: string[],
): TrustReport {
  return { listing_id: id, score, verdict, flags, reasoning, questions_to_ask: questions }
}

export const REPORTS: Record<string, TrustReport> = {
  'BLR-0087': report(
    'BLR-0087',
    87,
    'SAFE',
    [
      {
        agent: 'price',
        verdict: 'CLEAN',
        detail: 'Rent ₹34,000 is within 3% of the Indiranagar 2BHK median.',
        evidence: ['Area median: ₹35,000', 'This listing: ₹34,000', 'Deviation: -2.9% (normal)'],
        confidence: 0.94,
        weight: 0.25,
      },
      {
        agent: 'text',
        verdict: 'CLEAN',
        detail: 'No urgency, pressure, or off-platform payment language detected.',
        evidence: ['0 urgency phrases', 'No advance-payment request', 'Neutral, factual tone'],
        confidence: 0.9,
        weight: 0.2,
      },
      {
        agent: 'photo',
        verdict: 'CLEAN',
        detail: 'Reverse image search returns no duplicates; EXIF consistent with Bangalore.',
        evidence: ['0 duplicate matches online', 'Geotag: Bangalore', 'Original resolution intact'],
        confidence: 0.88,
        weight: 0.2,
      },
      {
        agent: 'web',
        verdict: 'CLEAN',
        detail: 'Broker is KYC-verified and active on 2 reputable portals.',
        evidence: ['RERA agent id found', '4.6★ across 38 reviews', 'Consistent listing history'],
        confidence: 0.91,
        weight: 0.2,
      },
      {
        agent: 'commute',
        verdict: 'CLEAN',
        detail: 'Stated 25-min commute to MG Road matches maps data.',
        evidence: ['Claimed: 25 min', 'Verified: 23–28 min', 'Metro 600m away'],
        confidence: 0.85,
        weight: 0.15,
      },
    ],
    [
      '[init] Launching 5-agent investigation for BLR-0087…',
      '[price] Cross-checking rent against 214 comparable leases.',
      '[price] Deviation -2.9% → consistent with market.',
      '[text] Scanning description for manipulation patterns.',
      '[text] No red-flag phrases. Tone consistent.',
      '[photo] Reverse image search across 6 portals…',
      '[photo] 0 duplicates. EXIF geotag = Bangalore. Resolved.',
      '[web] Verifying broker identity and reputation.',
      '[web] RERA id + 4.6★ reviews. Identity confirmed.',
      '[commute] Validating commute claims via routing.',
      '[commute] Claim within margin. Consistent.',
      '[verdict] All agents CLEAN → SAFE. Composite score 87.',
    ],
    [
      'Can we schedule an in-person visit this week?',
      'Is the RERA registration number available for the agreement?',
      'What is included in the semi-furnished setup?',
    ],
  ),
  'BLR-0018': report(
    'BLR-0018',
    18,
    'HIGH_RISK',
    [
      {
        agent: 'photo',
        verdict: 'BAIT',
        detail: 'Primary photo is stolen — appears in 4 unrelated listings across cities.',
        evidence: [
          'Match found: Pune listing (2023)',
          'Match found: Hyderabad listing (2022)',
          'Match found: stock photo site',
          'EXIF stripped — no geotag',
        ],
        confidence: 0.96,
        weight: 0.2,
      },
      {
        agent: 'price',
        verdict: 'BAIT',
        detail: 'Rent ₹18,000 is 49% below the area median — classic bait pricing.',
        evidence: ['Area median: ₹35,000', 'This listing: ₹18,000', 'Deviation: -49% (extreme)'],
        confidence: 0.93,
        weight: 0.25,
      },
      {
        agent: 'text',
        verdict: 'LIE',
        detail: '"Owner going abroad, keys by courier" + UPI deposit before viewing.',
        evidence: [
          '"going abroad" pattern',
          'Demands UPI advance',
          'Refuses in-person viewing',
          'Courier-key scam template',
        ],
        confidence: 0.95,
        weight: 0.2,
      },
      {
        agent: 'web',
        verdict: 'SUSPICIOUS',
        detail: 'No verifiable broker identity; phone number flagged on scam forums.',
        evidence: ['No RERA id', 'Number reported 3× online', 'Account age < 5 days'],
        confidence: 0.87,
        weight: 0.2,
      },
      {
        agent: 'commute',
        verdict: 'SUSPICIOUS',
        detail: 'Address vague; pin drops on a commercial plot, not a residence.',
        evidence: ['Pin = commercial zone', 'No building name', 'Commute claim unverifiable'],
        confidence: 0.72,
        weight: 0.15,
      },
    ],
    [
      '[init] Launching 5-agent investigation for BLR-0018…',
      '[photo] Reverse image search across 6 portals…',
      '[photo] CONFLICT: 4 duplicate matches in other cities.',
      '[photo] EXIF stripped. Flagging as BAIT.',
      '[price] Rent 49% below median → escalating.',
      '[price] Bait-pricing pattern confirmed.',
      '[text] Detected "owner going abroad" scam template.',
      '[text] UPI advance + no viewing → LIE.',
      '[web] Broker identity unverifiable.',
      '[web] Phone number reported on scam forums.',
      '[commute] Address resolves to commercial plot.',
      '[verdict] Multiple agents flag fraud → HIGH RISK. Score 18.',
    ],
    [
      'Why is a deposit required over UPI before any viewing?',
      'Can you share the RERA registration and a live video call from inside the flat?',
      'Why do these photos appear in listings from other cities?',
    ],
  ),
  'BLR-0024': report(
    'BLR-0024',
    24,
    'HIGH_RISK',
    [
      {
        agent: 'photo',
        verdict: 'BAIT',
        detail: 'Same interior photos found in 3 other city listings.',
        evidence: ['Match: Chennai listing', 'Match: Delhi listing', 'Reused hero image'],
        confidence: 0.9,
        weight: 0.2,
      },
      {
        agent: 'text',
        verdict: 'LIE',
        detail: '"Owner relocating, quick deal" with refusal of in-person visits.',
        evidence: ['Urgency framing', 'No visits allowed', 'Push to close fast'],
        confidence: 0.88,
        weight: 0.2,
      },
      {
        agent: 'price',
        verdict: 'SUSPICIOUS',
        detail: 'Rent ₹19,000 is ~46% under market.',
        evidence: ['Area median: ₹35,000', 'Deviation: -46%'],
        confidence: 0.86,
        weight: 0.25,
      },
      {
        agent: 'web',
        verdict: 'SUSPICIOUS',
        detail: 'New account, no reviews, unverifiable identity.',
        evidence: ['Account age < 1 week', '0 reviews', 'No RERA id'],
        confidence: 0.8,
        weight: 0.2,
      },
      {
        agent: 'commute',
        verdict: 'CLEAN',
        detail: 'Commute figures are plausible for the stated area.',
        evidence: ['Claim within maps margin'],
        confidence: 0.7,
        weight: 0.15,
      },
    ],
    [
      '[init] Launching 5-agent investigation for BLR-0024…',
      '[photo] CONFLICT: photos reused across 3 cities.',
      '[text] "Owner relocating" + no visits → LIE.',
      '[price] 46% below market → escalating.',
      '[web] New account, no reviews.',
      '[commute] Commute plausible. Consistent.',
      '[verdict] Photo + text fraud dominate → HIGH RISK. Score 24.',
    ],
    [
      'Can we visit before any payment?',
      'Why are the same photos on listings in other cities?',
      'Is there a registered rental agreement available?',
    ],
  ),
  'BLR-0031': report(
    'BLR-0031',
    33,
    'HIGH_RISK',
    [
      {
        agent: 'text',
        verdict: 'LIE',
        detail: '"No brokerage, direct owner" yet bank details requested pre-visit.',
        evidence: ['Contradiction: "direct owner"', 'Asks bank details', 'Pre-visit payment'],
        confidence: 0.9,
        weight: 0.2,
      },
      {
        agent: 'price',
        verdict: 'BAIT',
        detail: '"Luxury 2BHK" at ₹20,000 is far below luxury market rate.',
        evidence: ['Luxury median: ₹42,000', 'This listing: ₹20,000', 'Deviation: -52%'],
        confidence: 0.89,
        weight: 0.25,
      },
      {
        agent: 'photo',
        verdict: 'SUSPICIOUS',
        detail: 'Photos look like showroom/stock imagery.',
        evidence: ['Studio lighting', 'No personal items', '1 partial duplicate'],
        confidence: 0.78,
        weight: 0.2,
      },
      {
        agent: 'web',
        verdict: 'SUSPICIOUS',
        detail: 'Owner unverifiable; contact only via chat app.',
        evidence: ['No portal history', 'Chat-only contact'],
        confidence: 0.76,
        weight: 0.2,
      },
      {
        agent: 'commute',
        verdict: 'CLEAN',
        detail: 'Location and commute claims check out.',
        evidence: ['Verified within margin'],
        confidence: 0.71,
        weight: 0.15,
      },
    ],
    [
      '[init] Launching 5-agent investigation for BLR-0031…',
      '[text] "Direct owner" but asks bank details → LIE.',
      '[price] Luxury tag at 52% below market → BAIT.',
      '[photo] Stock-like imagery, 1 partial duplicate.',
      '[web] Chat-only contact, no history.',
      '[commute] Location consistent.',
      '[verdict] Payment-before-visit pattern → HIGH RISK. Score 33.',
    ],
    [
      'If it is direct-owner, why request bank details before a visit?',
      'Can you show ID and property ownership documents?',
      'Can we meet at the flat and pay only after signing?',
    ],
  ),
}

// Fallback generator for listings without a hand-authored report.
export function getReport(listing: RankedListing): TrustReport {
  if (REPORTS[listing.id]) return REPORTS[listing.id]

  const isSafe = listing.verdict === 'SAFE'
  const isCaution = listing.verdict === 'CAUTION'
  const rv: ReportVerdict = isSafe ? 'SAFE' : isCaution ? 'CAUTION' : 'HIGH_RISK'

  const priceV: AgentVerdict = isSafe ? 'CLEAN' : isCaution ? 'SUSPICIOUS' : 'BAIT'
  const textV: AgentVerdict = isSafe ? 'CLEAN' : isCaution ? 'SUSPICIOUS' : 'LIE'

  return report(
    listing.id,
    listing.score,
    rv,
    [
      {
        agent: 'price',
        verdict: priceV,
        detail: isSafe
          ? 'Rent is aligned with the local market median.'
          : 'Rent deviates from the local median enough to warrant a check.',
        evidence: ['Area median: ₹35,000', `This listing: ₹${listing.rent.toLocaleString('en-IN')}`],
        confidence: 0.82,
        weight: 0.25,
      },
      {
        agent: 'text',
        verdict: textV,
        detail: isSafe
          ? 'Description tone is neutral and factual.'
          : 'Description uses mild urgency or pressure language.',
        evidence: isSafe ? ['No urgency phrases'] : ['Urgency framing detected'],
        confidence: 0.8,
        weight: 0.2,
      },
      {
        agent: 'photo',
        verdict: isSafe ? 'CLEAN' : 'SUSPICIOUS',
        detail: isSafe ? 'No duplicate images found online.' : 'Some photos may be reused elsewhere.',
        evidence: isSafe ? ['0 duplicate matches'] : ['1–2 partial matches'],
        confidence: 0.79,
        weight: 0.2,
      },
      {
        agent: 'web',
        verdict: isSafe ? 'CLEAN' : 'SUSPICIOUS',
        detail: isSafe ? 'Broker identity verified.' : 'Broker identity partially unverified.',
        evidence: isSafe ? ['Verified profile'] : ['Limited history'],
        confidence: 0.78,
        weight: 0.2,
      },
      {
        agent: 'commute',
        verdict: 'CLEAN',
        detail: 'Commute claims are within plausible range.',
        evidence: ['Verified within margin'],
        confidence: 0.75,
        weight: 0.15,
      },
    ],
    [
      `[init] Launching 5-agent investigation for ${listing.id}…`,
      '[price] Cross-checking rent against comparable leases.',
      '[text] Scanning description for manipulation patterns.',
      '[photo] Reverse image search across portals…',
      '[web] Verifying broker identity and reputation.',
      '[commute] Validating commute claims via routing.',
      `[verdict] Composite score ${listing.score} → ${rv.replace('_', ' ')}.`,
    ],
    [
      'Can we schedule an in-person visit before any payment?',
      'Is a registered rental agreement available?',
      'Can you verify your identity on a live video call?',
    ],
  )
}
