/**
 * Frequently Asked Questions about Indian Elections.
 *
 * Covers eligibility, registration, EVMs, NOTA, postal voting,
 * and common voter concerns — with answers sourced from ECI guidelines.
 *
 * @module data/faq
 */

import type { FAQItem } from '../types/index';
import { JourneyStageId } from '../types/index';

/**
 * Complete FAQ catalogue for voter education.
 * Each item is tagged with a category and optionally linked to a journey stage.
 */
export const ELECTION_FAQ: readonly FAQItem[] = [
  /* ---- Eligibility ---- */
  {
    id: 'faq-age',
    question: 'What is the minimum age to vote in India?',
    answer:
      'You must be 18 years of age or older on the qualifying date (1st January of the year of revision of the electoral roll). For example, if the roll is revised in 2026, you must turn 18 on or before January 1, 2026.',
    category: 'Eligibility',
    relatedStageId: JourneyStageId.ELIGIBILITY,
  },
  {
    id: 'faq-nri-voting',
    question: 'Can NRIs (Non-Resident Indians) vote in Indian elections?',
    answer:
      'Yes. Since 2011, NRIs who hold Indian passports can register as overseas electors. They must be present in their constituency on polling day to vote in person. The ECI has been exploring postal ballot and e-voting options for NRIs, but as of 2025 in-person voting remains the only method.',
    category: 'Eligibility',
    relatedStageId: JourneyStageId.ELIGIBILITY,
  },
  {
    id: 'faq-criminal-record',
    question: 'Can a person with a criminal record vote?',
    answer:
      'A person in lawful custody of the police or serving a prison sentence cannot vote. However, undertrial prisoners (not yet convicted) retain their right to vote, though logistical access may be limited. A past criminal record, after sentence completion, does not disqualify a person from voting.',
    category: 'Eligibility',
    relatedStageId: JourneyStageId.ELIGIBILITY,
  },

  /* ---- Registration ---- */
  {
    id: 'faq-registration-online',
    question: 'How do I register to vote online?',
    answer:
      'Visit the National Voter Service Portal (nvsp.in) and fill out Form 6. You will need: Aadhaar number, address proof, age proof, and a passport-sized photo. You can also register through the Voter Helpline mobile app available on Google Play Store and Apple App Store.',
    category: 'Registration',
    relatedStageId: JourneyStageId.REGISTRATION,
  },
  {
    id: 'faq-multiple-registrations',
    question: 'Can I be registered in two constituencies?',
    answer:
      'No. A person can be registered in only one constituency at a time. If you move to a new address, you must transfer your registration using Form 6A (for shifting within the same constituency or to a new one). Dual registration is a punishable offence under Section 17 of the Representation of the People Act, 1950.',
    category: 'Registration',
    relatedStageId: JourneyStageId.REGISTRATION,
  },
  {
    id: 'faq-voter-id-lost',
    question: 'What if I lose my Voter ID card (EPIC)?',
    answer:
      'Apply for a duplicate EPIC through the NVSP portal or your local Electoral Registration Office. You can also vote using any of the 12 alternative ID proofs approved by the ECI, including Aadhaar, passport, driving licence, PAN card, and others.',
    category: 'Registration',
    relatedStageId: JourneyStageId.REGISTRATION,
  },

  /* ---- Voting Process ---- */
  {
    id: 'faq-evm-security',
    question: 'Are EVMs tamper-proof? Can they be hacked?',
    answer:
      'Indian EVMs are standalone machines with no network connectivity (no Wi-Fi, Bluetooth, or internet). They use one-time programmable (OTP) chips that cannot be reprogrammed. The source code is never shared externally. Additionally, the VVPAT paper trail allows physical verification of votes. The Supreme Court has upheld the reliability of EVMs in multiple rulings.',
    category: 'Voting Process',
    relatedStageId: JourneyStageId.VOTING_METHODS,
  },
  {
    id: 'faq-nota',
    question: 'What happens if NOTA gets the most votes in a constituency?',
    answer:
      'As per the current rules, even if NOTA receives the highest number of votes, the candidate with the most votes among actual candidates wins. NOTA does not lead to re-election or rejection of all candidates. The Supreme Court has recommended that the ECI consider rules for such scenarios, but no law has been enacted yet.',
    category: 'Voting Process',
    relatedStageId: JourneyStageId.VOTING_METHODS,
  },
  {
    id: 'faq-postal-ballot',
    question: 'Who can vote by postal ballot?',
    answer:
      "Postal ballot (Electronically Transmitted Postal Ballot System — ETPBS) is available to: (a) service voters (armed forces, paramilitary, diplomats); (b) voters on election duty; (c) voters above 80 years of age; (d) persons with disabilities (PwD); (e) voters under preventive detention; and (f) COVID-19 positive/quarantined persons (as per ECI's COVID protocols).",
    category: 'Voting Process',
    relatedStageId: JourneyStageId.VOTING_METHODS,
  },

  /* ---- Polling Day ---- */
  {
    id: 'faq-booth-find',
    question: 'How do I find my assigned polling booth?',
    answer:
      'You can find your polling booth through: (a) the Voter Helpline App; (b) the NVSP portal (nvsp.in) by searching with your EPIC number or personal details; (c) SMS — send "EPIC <your voter ID number>" to 1950; or (d) the voter information slip delivered to your home by the Booth Level Officer (BLO) before election day.',
    category: 'Polling Day',
    relatedStageId: JourneyStageId.POLLING_DAY,
  },
  {
    id: 'faq-id-proofs',
    question: 'What ID proofs can I use at the polling booth?',
    answer:
      'The ECI accepts 12 photo ID proofs: (1) EPIC/Voter ID; (2) Aadhaar; (3) Passport; (4) Driving Licence; (5) PAN Card; (6) Service ID (Govt./PSU employees); (7) Bank/Post Office Passbook with Photo; (8) MNREGA Job Card; (9) Health Insurance Smart Card (RSBY); (10) Pension Document with Photo; (11) NPR Smart Card; (12) Official ID issued by MP/MLA/MLC.',
    category: 'Polling Day',
    relatedStageId: JourneyStageId.POLLING_DAY,
  },
  {
    id: 'faq-voting-time',
    question: 'What are the voting hours?',
    answer:
      'Polling booths are typically open from 7:00 AM to 6:00 PM. In some regions (like the Northeast), booths may close at 4:00 PM or 5:00 PM due to security or logistical reasons. If you are in the queue before the closing time, you will be allowed to vote even after the official closing hour.',
    category: 'Polling Day',
    relatedStageId: JourneyStageId.POLLING_DAY,
  },
  {
    id: 'faq-employer-leave',
    question: 'Can my employer refuse to give me leave on polling day?',
    answer:
      'No. Under Section 135B of the Representation of the People Act, 1951, every employer must grant paid leave to employees on polling day. Denying leave is a punishable offence with imprisonment up to 500 days or a fine. The leave applies to all employees — public and private sector.',
    category: 'Polling Day',
    relatedStageId: JourneyStageId.POLLING_DAY,
  },

  /* ---- Post-Vote ---- */
  {
    id: 'faq-results-where',
    question: 'Where can I see election results?',
    answer:
      "Official results are published in real-time on results.eci.gov.in and through the ECI's social media channels. Major news channels (Doordarshan, NDTV, Times Now, etc.) also provide live coverage. Constituency-wise results are declared throughout counting day.",
    category: 'After Voting',
    relatedStageId: JourneyStageId.POST_VOTE,
  },
  {
    id: 'faq-election-petition',
    question: 'Can I challenge election results?',
    answer:
      'Yes. Any voter or defeated candidate can file an election petition in the High Court within 45 days of the result. Grounds include corrupt practices (bribery, undue influence), non-compliance with election law, or improper acceptance/rejection of nominations. The High Court can order a recount or declare the election void.',
    category: 'After Voting',
    relatedStageId: JourneyStageId.POST_VOTE,
  },

  /* ---- Election Types ---- */
  {
    id: 'faq-panchayat-who',
    question: 'Who conducts Panchayat elections?',
    answer:
      'Panchayat elections are conducted by the State Election Commission (SEC) of each state, not the ECI. This is mandated by Article 243K of the Constitution (73rd Amendment, 1992). Each state has its own SEC with an independent State Election Commissioner.',
    category: 'Election Types',
  },
  {
    id: 'faq-rajya-sabha-vote',
    question: 'Can ordinary citizens vote in Rajya Sabha elections?',
    answer:
      'No. Rajya Sabha members are elected by the elected members of State Legislative Assemblies (MLAs) using the Single Transferable Vote system with proportional representation. Citizens do not vote directly in Rajya Sabha elections. However, the 12 nominated members are appointed by the President.',
    category: 'Election Types',
  },
  {
    id: 'faq-by-election-when',
    question: 'When is a by-election held?',
    answer:
      'A by-election must be held within 6 months of a vacancy arising in a Lok Sabha or State Assembly seat (due to death, resignation, disqualification, or court order). The exception: if the remaining term of the house is less than one year, a by-election is not mandatory (Section 151A, Representation of the People Act, 1951).',
    category: 'Election Types',
  },
  {
    id: 'faq-model-code-conduct',
    question: 'What is the Model Code of Conduct (MCC)?',
    answer:
      'The MCC is a set of guidelines issued by the ECI for political parties and candidates during elections. It governs speeches, polling day conduct, portfolios, and election manifestos to ensure free and fair elections. It comes into force immediately after the election schedule is announced.',
    category: 'Election Rules',
  },
  {
    id: 'faq-star-campaigners',
    question: 'Who are Star Campaigners?',
    answer:
      "Star Campaigners are individuals nominated by political parties (up to 40 for recognized parties) whose election expenses are not added to the individual candidate's spending limit, provided they campaign only for the party generally and not for a specific candidate.",
    category: 'Election Rules',
  },
  {
    id: 'faq-voter-slip-valid',
    question: 'Is a Voter Information Slip sufficient for voting?',
    answer:
      'No. While the Voter Information Slip (voter slip) helps you find your booth and serial number, it is not an identity proof. You must carry your EPIC (Voter ID) or one of the 12 other ECI-approved photo identity documents to the polling station.',
    category: 'Polling Day',
  },
  {
    id: 'faq-voter-id-lost-replacement',
    question: 'What to do if I lost my Voter ID card?',
    answer:
      'If your Voter ID is lost, you can apply for a replacement (Form 001) online via the Voter Helpline App or NVSP. You can also vote using other approved IDs like Aadhaar or Passport if your name is in the current electoral roll.',
    category: 'Registration',
  },
  {
    id: 'faq-election-expense-limit',
    question: 'What is the election expenditure limit for candidates?',
    answer:
      'For Lok Sabha, the limit is ₹95 lakh for larger states and ₹75 lakh for smaller states. For Assembly elections, it is ₹40 lakh for larger states and ₹28 lakh for smaller ones. These limits are periodically revised by the government based on ECI recommendations.',
    category: 'Election Rules',
  },
  {
    id: 'faq-tendered-vote',
    question: 'What is a Tendered Vote?',
    answer:
      'If you find that someone has already voted in your name, you can alert the Presiding Officer. After verifying your identity, you will be allowed to cast a "Tendered Vote" using a ballot paper (not the EVM). These are kept in a separate cover.',
    category: 'Polling Day',
  },
  {
    id: 'faq-challenge-vote',
    question: 'What is a Challenged Vote?',
    answer:
      'A polling agent can challenge your identity by depositing a small fee. The Presiding Officer then conducts a summary inquiry. If the challenge is not proven, you are allowed to vote. If it is proven, you may be handed over to the police.',
    category: 'Polling Day',
  },
  {
    id: 'faq-exit-polls-ban',
    question: 'Are exit polls allowed during multi-phase elections?',
    answer:
      'Exit polls are banned from the start of the first phase until the conclusion of the final phase of voting in all states involved. This prevents early results from influencing voters in later phases. Opinion polls are also restricted near polling dates.',
    category: 'Election Rules',
  },
  {
    id: 'faq-voter-turnout-app',
    question: 'How can I check real-time voter turnout?',
    answer:
      'The ECI provides the "Voter Turnout App" which displays real-time estimated turnout percentages for various constituencies and phases of the election as updated by the Returning Officers.',
    category: 'Digital Tools',
  },
  {
    id: 'faq-braille-evm',
    question: 'Do EVMs have Braille features?',
    answer:
      'Yes, every EVM has Braille signage (numbers 1 to 16) on the right side of the blue button for visually impaired voters. The ECI also provides Braille-printed dummy ballot papers and allows a companion if requested.',
    category: 'Accessibility',
  },
  {
    id: 'faq-companion-vote',
    question: 'Can a disabled voter take a companion to the booth?',
    answer:
      'Yes. Rule 49N allows a blind or infirm voter who cannot record a vote alone to take a companion (aged 18+) to the voting compartment. The companion must sign a declaration of secrecy.',
    category: 'Accessibility',
  },
  {
    id: 'faq-voter-helpline-1950',
    question: 'What is the 1950 helpline?',
    answer:
      "1950 is the ECI's toll-free National Voter Helpline number. You can call it to check your registration status, get information on polling booths, or register complaints. You can also SMS your EPIC number to 1950.",
    category: 'Digital Tools',
  },
  {
    id: 'faq-election-duty-vote',
    question: 'How do polling officials vote?',
    answer:
      'Officials on election duty can vote via an "Election Duty Certificate" (EDC) if they are posted in their own constituency, allowing them to vote at the booth where they are working. Otherwise, they use a Postal Ballot.',
    category: 'Election Types',
  },
  {
    id: 'faq-overseas-voter-registration',
    question: 'How do NRIs register to vote?',
    answer:
      'NRIs can register online using Form 6A on the NVSP portal. They must upload a copy of their passport showing the valid visa/residence status and Indian address. Once verified, they appear in the "Overseas Electors" section of the roll.',
    category: 'Registration',
  },
  {
    id: 'faq-candidate-qualify',
    question: 'What are the qualifications to be an MP?',
    answer:
      'To be a Lok Sabha MP, one must be a citizen of India, at least 25 years old, and a registered voter. For Rajya Sabha, the minimum age is 30 years. They must not hold an office of profit or be disqualified under any law.',
    category: 'Election Rules',
  },
  {
    id: 'faq-recount-request',
    question: 'Can a candidate ask for a recount?',
    answer:
      'Yes. A candidate or their agent can apply in writing to the Returning Officer for a recount of votes before the result is officially declared. The RO decides if the request is valid and may order a full or partial recount.',
    category: 'Election Rules',
  },
  {
    id: 'faq-symbol-allotment',
    question: 'How are election symbols allotted?',
    answer:
      'Recognized national and state parties have reserved symbols (e.g., Lotus, Hand, Elephant). Independent candidates and unrecognized parties choose from a list of "free symbols" provided by the ECI.',
    category: 'Election Rules',
  },
  {
    id: 'faq-voter-id-correction',
    question: 'How do I correct errors in my Voter ID?',
    answer:
      'Use Form 8 on the NVSP portal or Voter Helpline App for any "Correction of Entries" like name, age, or address. You will need to upload supporting documents for the changes requested.',
    category: 'Registration',
  },
  {
    id: 'faq-booth-level-officer',
    question: 'Who is a Booth Level Officer (BLO)?',
    answer:
      'The BLO is a local government/semi-government official (like a teacher) designated by the ECI for a specific polling area. They maintain the voter list, verify registrations, and distribute voter slips.',
    category: 'Registration',
  },
  {
    id: 'faq-electronic-proxy',
    question: 'Can I vote online in India?',
    answer:
      'Currently, there is no online voting for general citizens. You must visit your designated polling booth. However, "Classified Service Voters" (Armed Forces) can use the Electronically Transmitted Postal Ballot System (ETPBS).',
    category: 'Digital Tools',
  },
  {
    id: 'faq-c-vigil-app',
    question: 'What is the cVIGIL app?',
    answer:
      'cVIGIL is an ECI app that allows citizens to report violations of the Model Code of Conduct (like bribery or loud music) by taking a photo or video. The ECI aims to act on reports within 100 minutes.',
    category: 'Digital Tools',
  },
  {
    id: 'faq-voter-id-transfer',
    question: 'How do I move my Voter ID to a new city?',
    answer:
      'If you move, do NOT apply for a new card. Use Form 8 (Shifting) to transfer your existing registration to your new constituency. This ensures your name is removed from the old location and added to the new one.',
    category: 'Registration',
  },
  {
    id: 'faq-proxy-voting-who',
    question: 'Who is eligible for Proxy Voting?',
    answer:
      'Proxy voting is only available to "Classified Service Voters" (Armed Forces and specific central paramilitary forces). They can appoint a proxy (a resident of their constituency) to vote on their behalf.',
    category: 'Election Types',
  },
  {
    id: 'faq-delimitation-meaning',
    question: 'What is Delimitation?',
    answer:
      'Delimitation is the process of redrawing boundaries of Lok Sabha and Assembly constituencies based on the latest census to ensure each seat represents a roughly equal population. It is done by a Delimitation Commission.',
    category: 'Election Rules',
  },
  {
    id: 'faq-voting-time',
    question: 'What are the typical voting hours?',
    answer:
      'Poll timings are usually from 7:00 AM to 6:00 PM, though they may vary by region (e.g., in sensitive areas or based on weather). Anyone in the queue by the closing time is allowed to vote.',
    category: 'Polling Day',
  },
  {
    id: 'faq-ink-purpose',
    question: 'What is the purpose of the indelible ink?',
    answer:
      'Indelible ink (silver nitrate based) is applied to the left forefinger to prevent multiple voting. It stays for several days and cannot be removed by chemicals or soap, serving as a visual proof of having voted.',
    category: 'Polling Day',
  },
  {
    id: 'faq-voter-slip-missing',
    question: "Can I vote if I didn't receive a voter slip?",
    answer:
      'Yes! As long as your name is in the electoral roll, you can vote. You can find your serial number using the ECI website and carry any approved photo ID to the booth.',
    category: 'Polling Day',
  },
  {
    id: 'faq-criminal-records-candidate',
    question: "Where can I see a candidate's criminal records?",
    answer:
      'Candidates must file an affidavit (Form 26) disclosing their assets, liabilities, and criminal records. These are available on the ECI website under "Know Your Candidate" (KYC) section and the KYC app.',
    category: 'Election Rules',
  },
  {
    id: 'faq-presiding-officer-role',
    question: 'What is the role of the Presiding Officer?',
    answer:
      'The Presiding Officer is in charge of a single polling station. They supervise the entire voting process, ensure secrecy, handle challenges/tendered votes, and seal the EVMs after the poll.',
    category: 'Polling Day',
  },
  {
    id: 'faq-returning-officer-role',
    question: 'What is the role of the Returning Officer (RO)?',
    answer:
      'The RO is responsible for the conduct of elections in a specific constituency. They receive nominations, scrutinize them, manage the polling personnel, and declare the final result after counting.',
    category: 'Election Rules',
  },
  {
    id: 'faq-voter-id-digilocker',
    question: 'Is e-EPIC on DigiLocker valid?',
    answer:
      'Yes, the digital version of your Voter ID (e-EPIC) downloaded from NVSP or accessed via DigiLocker is an officially valid identity document for voting, provided your name is in the roll.',
    category: 'Digital Tools',
  },
  {
    id: 'faq-voter-id-photo-change',
    question: 'Can I change my photo on the Voter ID?',
    answer:
      'Yes. Use Form 8 for "Correction of entries" on the NVSP portal or Voter Helpline App. You can upload a new passport-size photograph to update the image on your EPIC.',
    category: 'Registration',
  },
  {
    id: 'faq-compulsory-voting',
    question: 'Is voting compulsory in India?',
    answer:
      "No, voting is a democratic right but not a legal compulsion in India. However, the ECI actively encourages maximum participation through SVEEP (Systematic Voters' Education and Electoral Participation) programs.",
    category: 'Election Rules',
  },
  {
    id: 'faq-voter-education-sveep',
    question: 'What is SVEEP?',
    answer:
      'SVEEP is the flagship program of the ECI for voter education and awareness. It aims to increase voter turnout and bridge gaps in registration through community outreach, media campaigns, and school programs.',
    category: 'Digital Tools',
  },
  {
    id: 'faq-voter-id-smart-card',
    question: 'What is the new PVC Voter ID card?',
    answer:
      'The ECI has transitioned to high-quality PVC cards with security features like a hologram and ghost image. You can request a replacement for your old paper card using Form 8 (without any changes) or Form 001.',
    category: 'Registration',
  },
  {
    id: 'faq-election-observer',
    question: 'Who are Election Observers?',
    answer:
      'Election Observers are senior civil servants (usually IAS/IRS) appointed by the ECI to oversee elections in a constituency. There are General, Expenditure, and Police observers to ensure fairness.',
    category: 'Election Rules',
  },
  {
    id: 'faq-voter-id-aadhaar-link',
    question: 'Is linking Aadhaar to Voter ID mandatory?',
    answer:
      'The ECI encourages voluntary linking of Aadhaar with Voter ID (using Form 6B) to remove duplicate entries and strengthen the roll, but it is not mandatory for exercising your right to vote.',
    category: 'Registration',
  },
  {
    id: 'faq-test-vote-meaning',
    question: 'What is a Test Vote?',
    answer:
      'If a voter claims the VVPAT showed a different symbol than the one they pressed, they can file a declaration. A "test vote" is conducted in front of agents. If the claim is false, the voter faces legal action (Rule 49MA).',
    category: 'Polling Day',
  },
  {
    id: 'faq-webcasting-booth',
    question: 'What is webcasting in polling stations?',
    answer:
      'The ECI uses live webcasting from sensitive polling stations to monitor the process in real-time at the District and State Election Offices, ensuring no booth capturing or irregularities occur.',
    category: 'Polling Day',
  },
] as const;

/**
 * Get FAQ items by category.
 *
 * @param category - Category name to filter by.
 * @returns Matching FAQ items.
 */
export function getFaqByCategory(category: string): readonly FAQItem[] {
  return ELECTION_FAQ.filter((f) => f.category === category);
}

/**
 * Get FAQ items related to a specific journey stage.
 *
 * @param stageId - The journey stage ID.
 * @returns FAQ items linked to that stage.
 */
export function getFaqByStage(stageId: JourneyStageId): readonly FAQItem[] {
  return ELECTION_FAQ.filter((f) => f.relatedStageId === stageId);
}

/**
 * Get all unique FAQ categories.
 *
 * @returns Sorted array of unique category names.
 */
export function getFaqCategories(): readonly string[] {
  const categories = new Set(ELECTION_FAQ.map((f) => f.category));
  return [...categories].sort();
}

/**
 * Search FAQs by keyword in question or answer text.
 *
 * @param query - Search query string (case-insensitive).
 * @returns Matching FAQ items.
 */
export function searchFaq(query: string): readonly FAQItem[] {
  const normalised = query.toLowerCase().trim();
  if (!normalised) {
    return [];
  }
  return ELECTION_FAQ.filter(
    (f) =>
      f.question.toLowerCase().includes(normalised) || f.answer.toLowerCase().includes(normalised),
  );
}
