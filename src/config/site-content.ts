export type FaqItem = {
  question: string;
  answer: string;
};

export const homeFaqs: FaqItem[] = [
  {
    question: "What is HillCrest?",
    answer:
      "HillCrest is a platform that brings together caregiver training, supervised practical experience, employment pathways and care operations. Caregivers learn, build verified competency records and connect with employers, while care homes and agencies run their day-to-day operations in the same system.",
  },
  {
    question: "How does caregiver training work?",
    answer:
      "Training is delivered through structured programmes made up of modules and lessons, with assessments and practical competency checks. Progress is recorded against each learner so that completion reflects demonstrated understanding and practice — not just attendance.",
  },
  {
    question: "Do I need prior experience to start?",
    answer:
      "No prior experience is required to begin foundation training. Programmes start with core care principles and build up to more specialised topics. Practical placements are supervised and matched to your stage of training.",
  },
  {
    question: "How are caregivers verified?",
    answer:
      "Competency and training records are held in the platform, and employer and placement verification is carried out through defined review workflows. Verification status is shown clearly so that employers and families can make informed decisions. We only display verification that has actually been completed.",
  },
  {
    question: "How do care homes and employers use HillCrest?",
    answer:
      "Care homes use HillCrest for resident and staff records, shifts and scheduling, daily care records, care plans, incidents, inventory, purchases, expenses and invoices. Employers and recruiters use it to post vacancies, review verified candidates, and manage applications, interviews and offers.",
  },
  {
    question: "What is the referral programme?",
    answer:
      "The referral programme lets partners introduce learners and organisations to HillCrest. Eligible referrals are tracked against a published commission policy, and commissions become payable only when they qualify under that policy. Financial records are append-only and changes are never applied silently to already-earned amounts.",
  },
  {
    question: "How does the charity and scholarship work?",
    answer:
      "Charity campaigns raise funds for training access and scholarships. Scholarship applications are reviewed through a defined process, and awards and fund allocation are recorded so that donations can be reported on transparently. Charity funds are kept separate from commercial operations.",
  },
  {
    question: "Which countries and currencies are supported?",
    answer:
      "HillCrest launches in Nigeria, with pricing in Nigerian Naira (NGN) and support for local payment methods. The platform is built so that additional regions can be supported over time.",
  },
];

export type ValueProp = {
  title: string;
  body: string;
  icon: string;
};

export const homepageSteps = [
  {
    step: "1",
    title: "Learn",
    body: "Enrol in structured caregiver programmes and work through modules, lessons and assessments at a supported pace.",
  },
  {
    step: "2",
    title: "Practise",
    body: "Build supervised practical experience through internships and placements, with competency recorded as you go.",
  },
  {
    step: "3",
    title: "Work",
    body: "Connect with verified employers and care homes for employment, backed by records that show what you can do.",
  },
] as const;

export const trainingProgrammes = [
  {
    title: "Care Foundations",
    summary:
      "Core principles of person-centred care, dignity, communication, safeguarding and infection control.",
    topics: ["Person-centred care", "Safeguarding", "Infection control", "Communication"],
  },
  {
    title: "Elderly Care",
    summary:
      "Supporting older adults with daily living, mobility, nutrition, medication support and wellbeing.",
    topics: ["Mobility support", "Nutrition", "Medication support", "Dementia awareness"],
  },
  {
    title: "Home and Community Care",
    summary:
      "Delivering safe, respectful care in a person's own home and within the wider community.",
    topics: ["Home safety", "Personal care", "Family liaison", "Record keeping"],
  },
  {
    title: "Child and Family Care",
    summary:
      "Foundations for supporting children and families with safeguarding at the centre.",
    topics: ["Child development", "Safeguarding", "Play and learning", "Working with families"],
  },
] as const;

export const organisationFeatures = [
  {
    title: "Resident and staff records",
    body: "Keep structured, access-controlled records for the people you support and the people who care for them.",
    icon: "Users",
  },
  {
    title: "Shifts and scheduling",
    body: "Plan rotas, assign staff to shifts and keep a clear operational view of coverage.",
    icon: "CalendarClock",
  },
  {
    title: "Daily care and care plans",
    body: "Record daily care and maintain care plans that reflect each resident's needs and preferences.",
    icon: "ClipboardList",
  },
  {
    title: "Incidents and safeguarding",
    body: "Log incidents with a defined escalation path and a complete review history.",
    icon: "ShieldAlert",
  },
  {
    title: "Inventory and purchases",
    body: "Track supplies, purchases and expenses so operations stay visible and accountable.",
    icon: "Package",
  },
  {
    title: "Invoices and reporting",
    body: "Produce invoices and reports, with financial history kept append-only and auditable.",
    icon: "FileText",
  },
] as const;
