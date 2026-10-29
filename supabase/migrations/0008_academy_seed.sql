-- =============================================================================
-- CareBridge - Phase 4: seed the platform Academy catalogue
-- Migration: 0008_academy_seed.sql
--
-- This is authored course content, not fabricated analytics or partnerships.
-- It gives the Academy a real, publishable foundation course that learners can
-- enrol in while institution-owned courses are added by training providers.
-- =============================================================================

insert into public.programmes (
  id,
  organisation_id,
  title,
  slug,
  summary,
  description,
  status
)
values (
  'a1000000-0000-4000-8000-000000000001',
  null,
  'Care Foundations',
  'care-foundations',
  'The core knowledge and safe practice every caregiver needs before specialist training.',
  'Care Foundations is the starting point for new caregivers. It covers person-centred practice, dignity and consent, safeguarding, infection prevention, communication and accurate record keeping. The programme is delivered through short lessons and is followed by supervised practical competency.',
  'active'
)
on conflict (id) do nothing;

insert into public.courses (
  id,
  programme_id,
  organisation_id,
  title,
  slug,
  summary,
  description,
  category,
  learning_outcomes,
  prerequisites,
  difficulty,
  estimated_minutes,
  status,
  published_at,
  price_minor_units,
  currency,
  scholarship_eligible,
  certificate_enabled,
  certificate_issuer,
  version,
  is_public
)
values (
  'a2000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  null,
  'Foundation in Person-Centred Care',
  'foundation-in-person-centred-care',
  'Learn the principles, safeguards and communication skills that underpin safe, respectful care.',
  'This foundation course introduces person-centred care as a practical approach rather than a slogan. You will learn how dignity, choice and consent shape everyday care tasks, how to recognise and report safeguarding concerns, how to reduce the spread of infection, and how to communicate and record care accurately. Completion requires all six lessons. The course certificate records course completion only; it is not a government licence or external professional accreditation.',
  'Care foundations',
  array[
    'Explain what person-centred care means in daily practice',
    'Support dignity, choice and consent in routine care tasks',
    'Recognise safeguarding concerns and follow the correct reporting route',
    'Apply the core principles of infection prevention',
    'Communicate clearly with the person, their family and colleagues',
    'Record care accurately and factually'
  ],
  array['No prior care experience is required'],
  'foundation',
  90,
  'published',
  now(),
  0,
  'NGN',
  true,
  true,
  'CareBridge Academy',
  1,
  true
)
on conflict (id) do nothing;

-- Module 1 -------------------------------------------------------------------

insert into public.course_modules (id, course_id, title, summary, position, is_required)
values
  (
    'a3000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000001',
    'Principles of person-centred care',
    'What person-centred care is, and how dignity, choice and consent show up in everyday work.',
    1,
    true
  ),
  (
    'a3000000-0000-4000-8000-000000000002',
    'a2000000-0000-4000-8000-000000000001',
    'Safe practice foundations',
    'Safeguarding and infection prevention: the non-negotiables of safe care.',
    2,
    true
  ),
  (
    'a3000000-0000-4000-8000-000000000003',
    'a2000000-0000-4000-8000-000000000001',
    'Communication and recording',
    'Listening well, handing over clearly and writing records others can rely on.',
    3,
    true
  )
on conflict (id) do nothing;

-- Module 1 lessons ------------------------------------------------------------

insert into public.lessons (
  id,
  module_id,
  title,
  slug,
  content,
  estimated_minutes,
  position,
  is_required,
  is_preview
)
values
  (
    'a4000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'What person-centred care means',
    'what-person-centred-care-means',
    $lesson$## A way of working, not a slogan

Person-centred care starts with a simple question: what matters to this person, today?

It means treating the person as an individual with a history, preferences, relationships and goals. Two people with the same diagnosis may need very different support. Good care adapts to the person rather than asking the person to fit a fixed routine.

## The four practical habits

- **Ask before you act.** Explain what you are going to do and why.
- **Offer real choices.** Choice can be small, such as which cup to use, or larger, such as how to spend the afternoon.
- **Protect dignity.** Close doors and curtains, use a calm voice, and avoid discussing private matters in public areas.
- **Notice and respond.** Pay attention to changes in mood, appetite, movement or behaviour, and report what you notice.

## Reflection

Think of a routine task you perform, such as helping someone eat or wash. Identify one step where the person could be given more control without reducing safety. Write it down and discuss it with your supervisor during practical placement.$lesson$,
    15,
    1,
    true,
    true
  ),
  (
    'a4000000-0000-4000-8000-000000000002',
    'a3000000-0000-4000-8000-000000000001',
    'Dignity, choice and consent',
    'dignity-choice-and-consent',
    $lesson$## Dignity in everyday moments

Dignity is often protected or lost in small moments: how you speak, who you speak in front of, and whether you ask before touching someone. Knock before entering, introduce yourself, and explain what will happen next.

## Choice within safe limits

Choice is not the same as abandoning responsibility. You offer options that are safe and realistic. For example, a person may choose between two outfits, or between breakfast now and breakfast after a short rest. If a choice carries risk, explain the risk, involve the right people, and record the decision.

## Consent

Consent must be informed and voluntary. It can be withdrawn at any time. For personal care, explain the task, check that the person understands, and stop if they refuse. Refusal is information, not disobedience. Report and record it, and seek guidance when the person lacks capacity or when safety is at risk.

## What to do

- Explain the task before you begin.
- Ask permission before physical contact.
- Respect a refusal and escalate appropriately.
- Record significant decisions and refusals factually.
- Never discuss a person's care in public areas.$lesson$,
    15,
    2,
    true,
    false
  )
on conflict (id) do nothing;

-- Module 2 lessons ------------------------------------------------------------

insert into public.lessons (
  id,
  module_id,
  title,
  slug,
  content,
  estimated_minutes,
  position,
  is_required,
  is_preview
)
values
  (
    'a4000000-0000-4000-8000-000000000003',
    'a3000000-0000-4000-8000-000000000002',
    'Safeguarding essentials',
    'safeguarding-essentials',
    $lesson$## Everyone's responsibility

Safeguarding means protecting a person's right to live safely, free from abuse and neglect. Abuse can be physical, emotional, sexual, financial, discriminatory or organisational. Neglect and self-neglect also require action.

## Recognising a concern

You do not need proof to report a concern. Record what you saw or heard, when it happened, and what you did. Warning signs may include unexplained injuries, fear of a particular person, sudden withdrawal, poor hygiene, missing money, or changes in behaviour.

## Reporting

Follow your organisation's safeguarding procedure immediately. Tell the named safeguarding lead or manager. If someone is in immediate danger, contact the appropriate emergency service. Never investigate alone, and never promise secrecy you cannot keep.

## Recording

- Use the person's own words in quotation marks where possible.
- Record facts, not opinions or assumptions.
- Include the date, time, location and who was present.
- Sign and date the record.
- Keep the record confidential and share only with those who need it.$lesson$,
    15,
    1,
    true,
    false
  ),
  (
    'a4000000-0000-4000-8000-000000000004',
    'a3000000-0000-4000-8000-000000000002',
    'Infection prevention basics',
    'infection-prevention-basics',
    $lesson$## Why it matters

Care settings bring people with different health needs into close contact. Good infection prevention protects the person, their family, your colleagues and you.

## Hand hygiene

Wash your hands with soap and water, or use alcohol-based hand rub when appropriate. Clean your hands:

- before and after contact with a person;
- after removing gloves;
- after using the toilet;
- before preparing food or handling medication;
- after cleaning equipment or body fluids.

## Gloves are not a substitute

Wear gloves where contact with blood, body fluids or broken skin is expected. Remove them immediately afterwards and clean your hands. Gloves must not be worn from one person to another.

## Safe routines

- Keep equipment clean and stored correctly.
- Handle sharps safely and dispose of them in the approved container.
- Clean spills promptly using the correct procedure.
- Separate clean and dirty items.
- Report needlestick injuries and exposure incidents immediately.$lesson$,
    15,
    2,
    true,
    false
  )
on conflict (id) do nothing;

-- Module 3 lessons ------------------------------------------------------------

insert into public.lessons (
  id,
  module_id,
  title,
  slug,
  content,
  estimated_minutes,
  position,
  is_required,
  is_preview
)
values
  (
    'a4000000-0000-4000-8000-000000000005',
    'a3000000-0000-4000-8000-000000000003',
    'Listening and clear communication',
    'listening-and-clear-communication',
    $lesson$## Communication is part of care

Clear communication helps people feel safe and helps colleagues provide consistent care. It includes how you listen, what you say, and how you confirm understanding.

## Listening well

Give the person your attention. Avoid interrupting. Use open questions such as 'How have you been feeling today?' rather than questions that can only be answered yes or no. Check that you have understood: 'So the pain is worse in the morning, is that right?'

## Adapting your communication

Consider hearing loss, language, cognitive impairment, pain, fear or distress. Speak clearly and at a normal pace. Use plain words. Where appropriate, involve a colleague, interpreter or family member with the person's agreement.

## Handover

A good handover is structured and focused on what the next person needs to know. Include the person's current condition, what changed, what was done, and what still needs attention. Avoid blame and speculation. Use the written record to support the handover.$lesson$,
    15,
    1,
    true,
    false
  ),
  (
    'a4000000-0000-4000-8000-000000000006',
    'a3000000-0000-4000-8000-000000000003',
    'Recording care accurately',
    'recording-care-accurately',
    $lesson$## If it is not recorded, it is difficult to rely on

Records show what happened and why decisions were made. They support continuity of care and protect the person and the worker. Write at the time of the event, or as soon as possible afterwards.

## A good record

- Is factual, clear and legible.
- Uses the person's own words where relevant.
- States what you observed, what you did and what you reported.
- Avoids abbreviations that others may not understand.
- Avoids opinions, labels and speculation.
- Is signed, dated and timed.
- Is corrected properly: cross out, write the correction, sign and date. Never erase or overwrite an entry.

## Confidentiality

Record only what is needed for care. Do not share records with people who do not need them. Store paper records securely and use approved systems for electronic records. Discussing a person's information outside work is a breach of confidentiality.

## Reflection

Review one record you write during placement with your supervisor. Check whether another caregiver could understand what happened without asking you.$lesson$,
    15,
    2,
    true,
    false
  )
on conflict (id) do nothing;
