/**
 * ROSCA Articles / Blog Content
 *
 * To add a new article:
 * 1. Add an entry to the ARTICLES array below
 * 2. Give it a unique `id` (used in the URL)
 * 3. Fill in metadata (title, excerpt, category, readTime, iconName, iconBg)
 * 4. Write the `body` array — each item is a content block rendered in order
 *
 * Body block types:
 *   { type: 'paragraph', text: '...' }           — regular paragraph
 *   { type: 'heading',   text: '...' }           — section heading (h2)
 *   { type: 'subheading', text: '...' }          — sub-section heading (h3)
 *   { type: 'list',      items: ['...', '...'] } — bulleted list
 *   { type: 'numbered',  items: ['...', '...'] } — numbered list
 *   { type: 'callout',   text: '...' }           — highlighted info box
 *   { type: 'quote',     text: '...' }           — block quote
 */

export type Category = 'Getting Started' | 'Features' | 'Safety' | 'FAQs'

export type BodyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'callout'; text: string }
  | { type: 'quote'; text: string }

export interface Article {
  id: string
  title: string
  excerpt: string
  category: Category
  readTime: string
  iconName: string
  iconBg: string
  /** Gradient used as cover visual: [from, to] */
  coverGradient: [string, string]
  featured?: boolean
  body: BodyBlock[]
}

export const ARTICLES: Article[] = [
  {
    id: 'what-is-rosca',
    title: 'What is ROSCA and How Does it Work?',
    excerpt:
      'Learn the basics of Rotating Savings and Credit Associations — how members contribute, how payouts work, and why millions of people trust this system.',
    category: 'Getting Started',
    readTime: '5 min read',
    iconName: 'users',
    iconBg: '#D1FAE5',
    coverGradient: ['#02A36E', '#00C853'],
    featured: true,
    body: [
      {
        type: 'paragraph',
        text: 'A Rotating Savings and Credit Association (ROSCA) is one of the oldest and most trusted forms of communal savings worldwide. In a ROSCA, a group of individuals agree to contribute a fixed amount of money to a common pool at regular intervals — weekly, bi-weekly, or monthly.',
      },
      {
        type: 'heading',
        text: 'How It Works',
      },
      {
        type: 'numbered',
        items: [
          'A group of members agree on a contribution amount and schedule (e.g., ₦50,000 per month).',
          'Each period, every member contributes the agreed amount to the pool.',
          'The total pool is paid out to one member each cycle on a rotating basis.',
          'This continues until every member has received one payout.',
        ],
      },
      {
        type: 'callout',
        text: 'Example: In a 6-member group contributing ₦50,000 monthly, each member receives ₦300,000 once during the 6-month cycle.',
      },
      {
        type: 'heading',
        text: 'Why People Trust ROSCA',
      },
      {
        type: 'paragraph',
        text: 'ROSCA has been practiced for centuries across Africa, Asia, and Latin America. It works because of mutual accountability — every member benefits, and social trust keeps the system running smoothly.',
      },
      {
        type: 'list',
        items: [
          'No interest charges — unlike bank loans',
          'Forced savings discipline — regular contributions build your savings habit',
          'Community support — you save alongside people you know and trust',
          'Access to lump sums — receive a large payout without taking on debt',
        ],
      },
      {
        type: 'heading',
        text: 'ROSCA on Ajoti',
      },
      {
        type: 'paragraph',
        text: 'On Ajoti, we bring the traditional ROSCA model into a modern, secure digital platform. Groups are managed by verified admins, contributions are tracked automatically, and your money is protected with escrow-level security. Whether you\'re saving for a business, education, or an emergency fund — ROSCA on Ajoti makes it simple and safe.',
      },
    ],
  },
  {
    id: 'join-first-group',
    title: 'How to Join Your First ROSCA Group',
    excerpt:
      'A step-by-step guide to finding the right group, submitting a request, and making your first contribution on Ajoti.',
    category: 'Getting Started',
    readTime: '4 min read',
    iconName: 'arrow-right',
    iconBg: '#DBEAFE',
    coverGradient: ['#3B82F6', '#60A5FA'],
    body: [
      {
        type: 'paragraph',
        text: 'Joining your first ROSCA group on Ajoti is straightforward. Here\'s everything you need to know to get started.',
      },
      {
        type: 'heading',
        text: 'Step 1: Browse Available Groups',
      },
      {
        type: 'paragraph',
        text: 'Navigate to the ROSCA page from your dashboard. You\'ll see a list of available groups organized by tabs — All Groups, Open Groups, Invite-Only, and more. Use the search bar to find groups by name or admin.',
      },
      {
        type: 'heading',
        text: 'Step 2: Review Group Details',
      },
      {
        type: 'paragraph',
        text: 'Click on any group card to see its full details — contribution amount, duration, payout schedule, group rules, and admin information. Take your time to find a group that matches your savings goals.',
      },
      {
        type: 'heading',
        text: 'Step 3: Submit a Join Request',
      },
      {
        type: 'paragraph',
        text: 'For open groups, click "Request to Join" and fill out the short application form. Tell the admin why you\'d like to join and provide any referral codes you may have.',
      },
      {
        type: 'heading',
        text: 'Step 4: Wait for Approval',
      },
      {
        type: 'paragraph',
        text: 'Your request will be reviewed by the group admin. You can track the status of all your requests from the "My Group Requests" page. Once accepted, you\'ll be notified and added to the group.',
      },
      {
        type: 'heading',
        text: 'Step 5: Make Your First Contribution',
      },
      {
        type: 'paragraph',
        text: 'Ensure your Ajoti wallet is funded before the first contribution date. Payments are automatically collected from your wallet on the scheduled date.',
      },
      {
        type: 'callout',
        text: 'Tip: Fund your wallet a day early to avoid any delays. You can set up auto-funding to keep your wallet topped up automatically.',
      },
    ],
  },
  {
    id: 'payout-cycles',
    title: 'Understanding Payout Cycles',
    excerpt:
      'How payout order is determined, when you receive your funds, and what happens if a member misses a payment.',
    category: 'Features',
    readTime: '6 min read',
    iconName: 'calendar-event',
    iconBg: '#EDE9FE',
    coverGradient: ['#8B5CF6', '#A78BFA'],
    body: [
      {
        type: 'paragraph',
        text: 'The payout cycle is the heart of every ROSCA group. Understanding how it works ensures you know exactly when to expect your payout and what your obligations are.',
      },
      {
        type: 'heading',
        text: 'How Payout Order Works',
      },
      {
        type: 'paragraph',
        text: 'When a ROSCA group is formed, the admin determines the payout order. This can be based on join date, random selection, or mutual agreement. Each member is assigned a position in the cycle.',
      },
      {
        type: 'callout',
        text: 'In a 6-month group, Member 1 receives the pool in Month 1, Member 2 in Month 2, and so on until Month 6.',
      },
      {
        type: 'heading',
        text: 'What Happens on Payout Day',
      },
      {
        type: 'numbered',
        items: [
          'All members\' contributions are collected from their wallets.',
          'The total pool is calculated and verified.',
          'The designated member for that cycle receives the full pool amount.',
          'The cycle advances to the next member.',
        ],
      },
      {
        type: 'heading',
        text: 'Missed Payments & Penalties',
      },
      {
        type: 'paragraph',
        text: 'If a member misses a payment, penalties apply. The specific penalty depends on the group\'s rules set by the admin. Common penalties include late fees, Trust Score deductions, and in severe cases, removal from the group.',
      },
      {
        type: 'list',
        items: [
          'Late payment: Small fee deducted, Trust Score reduced by 5 points',
          'Missed payment: Larger penalty, Trust Score reduced by 15 points',
          'Repeated defaults: Risk of removal and forfeiture of future payouts',
        ],
      },
    ],
  },
  {
    id: 'trust-score',
    title: 'Your Trust Score Explained',
    excerpt:
      'Discover how your Trust Score is calculated, why it matters, and tips to maintain a high score for better group access.',
    category: 'Features',
    readTime: '4 min read',
    iconName: 'shield-check',
    iconBg: '#FEF3C7',
    coverGradient: ['#F59E0B', '#FBBF24'],
    body: [
      {
        type: 'paragraph',
        text: 'Your Trust Score is a measure of your reliability as a ROSCA group member. It\'s visible to group admins and influences your ability to join premium groups.',
      },
      {
        type: 'heading',
        text: 'How Your Score Is Calculated',
      },
      {
        type: 'paragraph',
        text: 'Your Trust Score starts at 50% when you join Ajoti and is updated based on your payment behaviour across all ROSCA groups you participate in.',
      },
      {
        type: 'list',
        items: [
          'On-time payments: +5 points per payment',
          'Completed ROSCA cycle: +10 bonus points',
          'Late payment: -5 points',
          'Missed payment: -15 points',
          'Leaving a group early: -20 points',
        ],
      },
      {
        type: 'heading',
        text: 'Why It Matters',
      },
      {
        type: 'paragraph',
        text: 'Admins review Trust Scores when approving join requests. A higher score gives you access to more groups, especially higher-value ones. Think of it as your savings group reputation.',
      },
      {
        type: 'callout',
        text: 'Pro tip: Maintain a score above 80% to unlock access to premium ROSCA groups with higher contribution amounts.',
      },
      {
        type: 'heading',
        text: 'Tips to Keep Your Score High',
      },
      {
        type: 'numbered',
        items: [
          'Always fund your wallet before contribution dates.',
          'Set up auto-funding to avoid missed payments.',
          'Only join groups you can commit to for the full cycle.',
          'Communicate with your admin if you anticipate any issues.',
        ],
      },
    ],
  },
  {
    id: 'money-safety',
    title: 'How We Keep Your Money Safe',
    excerpt:
      'Learn about the security measures, escrow protections, and verification processes that safeguard every ROSCA group on Ajoti.',
    category: 'Safety',
    readTime: '5 min read',
    iconName: 'shield-check-green',
    iconBg: '#D1FAE5',
    coverGradient: ['#059669', '#34D399'],
    body: [
      {
        type: 'paragraph',
        text: 'At Ajoti, the security of your money is our top priority. We\'ve built multiple layers of protection to ensure every contribution and payout is safe.',
      },
      {
        type: 'heading',
        text: 'Escrow Protection',
      },
      {
        type: 'paragraph',
        text: 'All ROSCA contributions are held in secure escrow accounts — not in any individual\'s personal account. Funds are only released to the designated member on the scheduled payout date.',
      },
      {
        type: 'heading',
        text: 'Admin Verification',
      },
      {
        type: 'paragraph',
        text: 'Every ROSCA admin goes through a thorough verification process before they can create and manage groups. This includes identity verification, phone verification, and activity history review.',
      },
      {
        type: 'heading',
        text: 'Platform Safeguards',
      },
      {
        type: 'list',
        items: [
          'Bank-grade encryption for all transactions',
          'Two-factor authentication for account access',
          'Real-time fraud monitoring and detection',
          'Automated contribution collection — no manual transfers',
          'Complete audit trail for every transaction',
        ],
      },
      {
        type: 'callout',
        text: 'Your funds are protected even if an admin account is compromised. Payouts require system-level verification that no single person can override.',
      },
    ],
  },
  {
    id: 'member-defaults',
    title: 'What Happens if Someone Defaults?',
    excerpt:
      'Understand the penalty system, how defaults are handled, and the protections in place for contributing members.',
    category: 'Safety',
    readTime: '4 min read',
    iconName: 'alert-triangle',
    iconBg: '#FEE2E2',
    coverGradient: ['#EF4444', '#F87171'],
    body: [
      {
        type: 'paragraph',
        text: 'Defaults are rare on Ajoti thanks to our Trust Score system and automated payments, but we have robust protections in place for when they do occur.',
      },
      {
        type: 'heading',
        text: 'What Counts as a Default',
      },
      {
        type: 'list',
        items: [
          'Insufficient wallet balance on contribution date',
          'Failure to fund wallet within the 48-hour grace period',
          'Voluntarily leaving a group mid-cycle after receiving a payout',
        ],
      },
      {
        type: 'heading',
        text: 'How Defaults Are Handled',
      },
      {
        type: 'numbered',
        items: [
          'The member receives an immediate notification and a 48-hour grace period.',
          'If not resolved, a penalty fee is charged and Trust Score is reduced.',
          'The admin is notified and can take further action (warning or removal).',
          'For repeated defaults, the member may be suspended from joining new groups.',
        ],
      },
      {
        type: 'heading',
        text: 'How Other Members Are Protected',
      },
      {
        type: 'paragraph',
        text: 'If a default disrupts a payout cycle, Ajoti\'s reserve fund covers the shortfall to ensure the designated member still receives their full payout on time. The defaulting member\'s penalty is used to replenish this reserve.',
      },
      {
        type: 'callout',
        text: 'No contributing member will ever lose money because of another member\'s default. Our reserve system guarantees every scheduled payout.',
      },
    ],
  },
  {
    id: 'becoming-admin',
    title: 'Becoming a ROSCA Admin',
    excerpt:
      'Everything you need to know about managing your own savings group — from requirements to responsibilities and rewards.',
    category: 'Features',
    readTime: '7 min read',
    iconName: 'trending-up',
    iconBg: '#D1FAE5',
    coverGradient: ['#0D9488', '#2DD4BF'],
    body: [
      {
        type: 'paragraph',
        text: 'As a ROSCA Admin on Ajoti, you have the power to create and manage savings groups, help your community save, and earn rewards for your efforts.',
      },
      {
        type: 'heading',
        text: 'Requirements',
      },
      {
        type: 'list',
        items: [
          'Verified phone number',
          'Valid government-issued ID',
          'At least 1 successfully completed ROSCA cycle as a member',
          'No flagged activity on your account',
          'Trust Score of 70% or above',
        ],
      },
      {
        type: 'heading',
        text: 'Admin Responsibilities',
      },
      {
        type: 'numbered',
        items: [
          'Set up group parameters: contribution amount, duration, slots, and rules.',
          'Review and approve join requests from members.',
          'Monitor group activity and ensure smooth operation.',
          'Communicate with members about schedules and any issues.',
          'Handle disputes fairly and in accordance with group rules.',
        ],
      },
      {
        type: 'heading',
        text: 'Admin Rewards',
      },
      {
        type: 'paragraph',
        text: 'Admins earn a small service fee from each completed cycle. The more groups you successfully manage, the higher your admin rating and the more opportunities you unlock.',
      },
      {
        type: 'callout',
        text: 'Ready to become an admin? Apply directly from the ROSCA page by clicking "Request Access" on the admin banner.',
      },
    ],
  },
  {
    id: 'wallets-payments',
    title: 'Contributions, Wallets & Payments',
    excerpt:
      'How to fund your wallet, set up auto-pay, and track your contribution history across all your ROSCA groups.',
    category: 'Features',
    readTime: '5 min read',
    iconName: 'cash',
    iconBg: '#FEF3C7',
    coverGradient: ['#D97706', '#F59E0B'],
    body: [
      {
        type: 'paragraph',
        text: 'Your Ajoti wallet is the central hub for all ROSCA contributions and payouts. Keeping it funded ensures you never miss a contribution.',
      },
      {
        type: 'heading',
        text: 'Funding Your Wallet',
      },
      {
        type: 'paragraph',
        text: 'You can fund your Ajoti wallet through bank transfer, card payment, or USSD. Funds are credited instantly and available for ROSCA contributions immediately.',
      },
      {
        type: 'heading',
        text: 'How Contributions Work',
      },
      {
        type: 'numbered',
        items: [
          'On your group\'s contribution date, the system checks your wallet balance.',
          'If sufficient, the contribution amount is automatically deducted.',
          'The amount is moved to the group\'s escrow pool.',
          'You receive a confirmation notification.',
        ],
      },
      {
        type: 'heading',
        text: 'Receiving Payouts',
      },
      {
        type: 'paragraph',
        text: 'When it\'s your turn in the cycle, the full pool amount is automatically credited to your Ajoti wallet. You can then transfer it to your bank account or keep it in your wallet for future contributions.',
      },
      {
        type: 'heading',
        text: 'Tracking Your History',
      },
      {
        type: 'paragraph',
        text: 'View your complete contribution and payout history from the Growth & Activities tab in any group you\'re part of. This includes dates, amounts, status, and Trust Score impact for every transaction.',
      },
      {
        type: 'callout',
        text: 'Tip: Keep a buffer in your wallet beyond your contribution amounts. This protects you from missed payments due to timing issues.',
      },
    ],
  },
  {
    id: 'faqs',
    title: 'Frequently Asked Questions',
    excerpt:
      'Answers to the most common questions about ROSCA groups, payments, admin roles, and using the Ajoti platform.',
    category: 'FAQs',
    readTime: '8 min read',
    iconName: 'help-circle',
    iconBg: '#DBEAFE',
    coverGradient: ['#6366F1', '#818CF8'],
    body: [
      {
        type: 'heading',
        text: 'Can I be in multiple ROSCA groups at once?',
      },
      {
        type: 'paragraph',
        text: 'Yes! You can join as many groups as you like, as long as you can commit to the contribution schedule for each one. Your wallet needs to have enough funds to cover all contributions.',
      },
      {
        type: 'heading',
        text: 'What if I can\'t make a payment on time?',
      },
      {
        type: 'paragraph',
        text: 'You have a 48-hour grace period after the scheduled date. Fund your wallet within this window to avoid penalties. If you anticipate issues, contact your group admin as early as possible.',
      },
      {
        type: 'heading',
        text: 'Can I leave a group after joining?',
      },
      {
        type: 'paragraph',
        text: 'You can leave a group that hasn\'t started its cycle yet. Once contributions have begun, leaving will result in forfeiting your payout position and a Trust Score penalty.',
      },
      {
        type: 'heading',
        text: 'How do I know the admin is trustworthy?',
      },
      {
        type: 'paragraph',
        text: 'All admins are verified by Ajoti with identity checks and must have a positive track record. You can view any admin\'s profile, including their verification status and group history, before joining.',
      },
      {
        type: 'heading',
        text: 'Is my money safe if an admin leaves?',
      },
      {
        type: 'paragraph',
        text: 'Absolutely. Admins don\'t hold any funds — all contributions are in secure escrow. If an admin becomes unavailable, Ajoti\'s support team can appoint a replacement or manage the group directly.',
      },
      {
        type: 'heading',
        text: 'How are disputes resolved?',
      },
      {
        type: 'paragraph',
        text: 'Minor disputes are handled by the group admin. If you feel a resolution is unfair, you can escalate to Ajoti\'s support team through the "Report Group" feature on any group details page.',
      },
      {
        type: 'heading',
        text: 'Can I get my money back if I change my mind?',
      },
      {
        type: 'paragraph',
        text: 'Before the cycle starts, you can withdraw with no penalty. Once the cycle has begun and contributions are in the pool, withdrawals follow the group\'s rules and may incur penalties.',
      },
    ],
  },
]
