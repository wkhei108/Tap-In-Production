import type { Locale } from '@/lib/i18n';

/** A value that exists in both locales. Keeps ordering identical by design. */
export type Localised<T = string> = Record<Locale, T>;

export type ServiceDetail = {
  /** Stable anchor id — used for in-page links. */
  id: string;
  /** Two-digit index shown in substitution-board style. */
  number: string;
  /** Short bilingual signature label, e.g. "Capture the Magic / 捕捉時刻". */
  label: Localised;
  title: Localised;
  summary: Localised;
  items: Localised<string[]>;
};

export type CapabilityGroup = {
  id: string;
  number: string;
  title: Localised;
  items: Localised<string[]>;
};

export type ProcessStep = {
  id: string;
  number: string;
  title: Localised;
  body: Localised;
};

export type TimelineStage = {
  id: string;
  marker: Localised;
  title: Localised;
  body: Localised;
};

export type BoardColumn = {
  id: string;
  title: Localised;
  items: Localised<string[]>;
};

/* ==========================================================================
   BUILD-A-CLUB — seven services
   ========================================================================== */

export const clubServices: ServiceDetail[] = [
  {
    id: 'social-media',
    number: '01',
    label: { en: 'Connect Deeply', 'zh-hk': '建立聯繫' },
    title: {
      en: 'Social Media Strategy & Management',
      'zh-hk': '社交媒體策略及管理',
    },
    summary: {
      en: 'A channel plan the club can keep to, written in both languages and posted on a schedule supporters can rely on.',
      'zh-hk': '一套球會維持得到的頻道規劃，中英文撰寫，按固定節奏發佈，讓球迷有跡可循。',
    },
    items: {
      en: [
        'Channel strategy',
        'Content planning',
        'Posting schedule',
        'Bilingual copywriting',
        'Community engagement',
        'Campaign reporting',
      ],
      'zh-hk': [
        '頻道策略',
        '內容規劃',
        '發佈時間表',
        '中英文文案',
        '社群互動',
        '成效回顧',
      ],
    },
  },
  {
    id: 'match-photography',
    number: '02',
    label: { en: 'Capture the Magic', 'zh-hk': '捕捉時刻' },
    title: { en: 'Match Photography', 'zh-hk': '比賽攝影' },
    summary: {
      en: 'Full matchday coverage — not only the goals. Arrivals, the bench, the away end, the moment after the whistle.',
      'zh-hk': '完整的比賽日拍攝 — 不只入球。進場、後備席、客隊看台，以及完場哨聲之後那一刻。',
    },
    items: {
      en: [
        'Match action',
        'Team arrivals',
        'Coaching staff',
        'Supporters',
        'Celebrations',
        'Sponsor visibility',
        'Rapid turnaround selections',
      ],
      'zh-hk': [
        '比賽動作',
        '球隊進場',
        '教練團隊',
        '球迷',
        '慶祝時刻',
        '贊助露出',
        '精選相片快速交付',
      ],
    },
  },
  {
    id: 'video-production',
    number: '03',
    label: { en: 'Tell the Story', 'zh-hk': '講好故事' },
    title: { en: 'Video Production', 'zh-hk': '影片製作' },
    summary: {
      en: 'Highlights for the record, short-form for the feed, and longer pieces that carry the season.',
      'zh-hk': '精華片段留作紀錄，短片配合平台，長片承載整個球季的故事。',
    },
    items: {
      en: [
        'Match highlights',
        'Reels and short-form video',
        'Interviews',
        'Behind-the-scenes content',
        'Player features',
        'Season stories',
        'Sponsor integrations',
      ],
      'zh-hk': [
        '賽事精華',
        'Reels 及短片',
        '球員訪問',
        '幕後花絮',
        '球員專題',
        '球季故事',
        '贊助內容整合',
      ],
    },
  },
  {
    id: 'brand-identity',
    number: '04',
    label: { en: 'Define Your Identity', 'zh-hk': '塑造形象' },
    title: {
      en: 'Brand Identity & Campaign Design',
      'zh-hk': '品牌形象及企劃設計',
    },
    summary: {
      en: 'One visual system that survives contact with a real season — fixtures, results, signings, launches, sponsor artwork.',
      'zh-hk': '一套經得起整個球季考驗的視覺系統 — 賽程、賽果、簽約、發佈以至贊助素材，全部一致。',
    },
    items: {
      en: [
        'Visual direction',
        'Matchday graphics',
        'Player announcements',
        'Fixture and result graphics',
        'Signing announcements',
        'Campaign templates',
        'Sponsor-ready artwork',
      ],
      'zh-hk': [
        '視覺方向',
        '比賽日圖像',
        '球員介紹',
        '賽程及賽果圖',
        '簽約公佈',
        '企劃設計模板',
        '贊助專用素材',
      ],
    },
  },
  {
    id: 'photoshoots',
    number: '05',
    label: { en: 'Photoshoots', 'zh-hk': '形象拍攝' },
    title: { en: 'Player & Team Photoshoots', 'zh-hk': '球員及球隊形象拍攝' },
    summary: {
      en: 'A media day that produces a full season of assets in one controlled session.',
      'zh-hk': '一個媒體日，在可控環境下完成全季所需的形象素材。',
    },
    items: {
      en: [
        'Studio portraits',
        'Team photographs',
        'Media-day production',
        'Player cut-outs',
        'Profile assets',
        'Campaign images',
      ],
      'zh-hk': [
        '影樓人像',
        '球隊合照',
        '媒體日統籌',
        '球員去背素材',
        '個人檔案圖像',
        '企劃形象照',
      ],
    },
  },
  {
    id: 'merchandise',
    number: '06',
    label: { en: 'Merchandise Design', 'zh-hk': '週邊設計' },
    title: { en: 'Merchandise & Fan Engagement', 'zh-hk': '週邊商品及球迷互動' },
    summary: {
      en: 'Products supporters actually want to wear, and reasons for them to take part rather than only scroll.',
      'zh-hk': '球迷真的願意穿戴的產品，以及讓他們參與其中、而不只是滑過的理由。',
    },
    items: {
      en: [
        'Shirts and apparel',
        'Scarves and memorabilia',
        'Gameday items',
        'Limited-edition products',
        'Fan interaction concepts',
        'Social participation campaigns',
      ],
      'zh-hk': [
        '球衣及服飾',
        '頸巾及紀念品',
        '比賽日用品',
        '限量產品',
        '球迷互動構思',
        '社交參與企劃',
      ],
    },
  },
  {
    id: 'sponsorship-content',
    number: '07',
    label: { en: 'Ignite Engagement', 'zh-hk': '提高互動' },
    title: { en: 'Sponsorship Content', 'zh-hk': '贊助內容' },
    summary: {
      en: 'Partner visibility planned before kick-off and packaged afterwards into something a sponsor can present internally.',
      'zh-hk': '贊助露出在開賽前已規劃好，賽後整理成贊助商可以在內部交代的材料。',
    },
    items: {
      en: [
        'Sponsor visibility planning',
        'Branded content concepts',
        'Activation visuals',
        'Recap media',
        'Proposal and presentation assets',
        'Deliverable tracking',
      ],
      'zh-hk': [
        '贊助露出規劃',
        '品牌內容構思',
        '活動視覺設計',
        '回顧影像',
        '提案及簡報素材',
        '交付進度跟進',
      ],
    },
  },
];

/* ==========================================================================
   BUILD-A-GAME — eight workstreams
   ========================================================================== */

export const gameServices: ServiceDetail[] = [
  {
    id: 'competition-planning',
    number: '01',
    label: { en: 'Event Planning', 'zh-hk': '賽事規劃' },
    title: { en: 'Competition Planning', 'zh-hk': '賽事規劃' },
    summary: {
      en: 'The format decides the day. We build one that fits your teams, your pitches and your available hours.',
      'zh-hk': '賽制決定當日的節奏。我們按參賽隊數、場地與可用時間，設計合適的賽制。',
    },
    items: {
      en: [
        'League or cup structure',
        'Team numbers',
        'Group formats',
        'Knockout formats',
        'Match regulations',
        'Timetables',
        'Participant journey',
      ],
      'zh-hk': [
        '聯賽或盃賽制度',
        '參賽隊數',
        '分組賽制',
        '淘汰賽制',
        '比賽規程',
        '賽程時間表',
        '參加者流程',
      ],
    },
  },
  {
    id: 'venue-logistics',
    number: '02',
    label: { en: 'Venue & Logistics', 'zh-hk': '場地與物流' },
    title: { en: 'Venue, Scheduling & Logistics', 'zh-hk': '場地、賽程及物流' },
    summary: {
      en: 'Pitches, kit, crew and check-in, mapped hour by hour — including what happens if the weather turns.',
      'zh-hk': '場地、器材、人手與報到安排，逐小時編排 — 連天氣轉變的應變方案一併準備。',
    },
    items: {
      en: [
        'Venue sourcing',
        'Pitch allocation',
        'Equipment planning',
        'Staff scheduling',
        'Team check-in',
        'Match operations',
        'Contingency planning',
      ],
      'zh-hk': [
        '場地物色',
        '球場編配',
        '器材規劃',
        '人手編更',
        '球隊報到',
        '賽事營運',
        '應變安排',
      ],
    },
  },
  {
    id: 'event-identity',
    number: '03',
    label: { en: 'Identity & Registration', 'zh-hk': '形象與報名' },
    title: { en: 'Event Identity & Registration', 'zh-hk': '賽事形象及報名安排' },
    summary: {
      en: 'A name, a look and a sign-up process that make the competition feel real before a ball is kicked.',
      'zh-hk': '一個名字、一套視覺，加上順暢的報名流程，令賽事在開波前已經成形。',
    },
    items: {
      en: [
        'Event naming',
        'Visual identity',
        'Registration materials',
        'Team information packs',
        'Signage',
        'Digital schedules',
        'On-site wayfinding',
      ],
      'zh-hk': [
        '賽事命名',
        '視覺形象',
        '報名資料',
        '參賽隊伍資料包',
        '現場指示牌',
        '電子賽程',
        '現場導向指引',
      ],
    },
  },
  {
    id: 'marketing-promotion',
    number: '04',
    label: { en: 'Marketing & Promotion', 'zh-hk': '市場推廣與宣傳' },
    title: { en: 'Marketing & Promotion', 'zh-hk': '市場推廣與宣傳' },
    summary: {
      en: 'From launch to recap — the content that fills the teams sheet and gets people to turn up.',
      'zh-hk': '由公佈到賽後回顧 — 用內容填滿參賽名單，也讓人願意到場。',
    },
    items: {
      en: [
        'Launch campaign',
        'Social content',
        'Team announcements',
        'KOL collaboration',
        'Countdown content',
        'Matchday coverage',
        'Post-event recap',
      ],
      'zh-hk': [
        '啟動宣傳',
        '社交內容',
        '參賽隊伍公佈',
        'KOL 合作',
        '倒數內容',
        '比賽日報導',
        '賽後回顧',
      ],
    },
  },
  {
    id: 'sponsorship-partnerships',
    number: '05',
    label: { en: 'Sponsorship Partnerships', 'zh-hk': '贊助合作' },
    title: { en: 'Sponsorship Partnerships', 'zh-hk': '贊助合作' },
    summary: {
      en: 'Clear packages, defined inventory and a recap pack — so a partner knows what they are getting and what they got.',
      'zh-hk': '清晰的贊助方案、明確的權益清單，加上賽後回顧資料 — 讓合作夥伴知道得到甚麼，也交代得到成果。',
    },
    items: {
      en: [
        'Sponsor package structure',
        'Inventory planning',
        'Branded touchpoints',
        'Digital visibility',
        'On-site activation',
        'Sponsor recap assets',
      ],
      'zh-hk': [
        '贊助方案架構',
        '權益清單規劃',
        '品牌接觸點',
        '數碼曝光',
        '現場推廣',
        '贊助回顧素材',
      ],
    },
  },
  {
    id: 'awards-merchandise',
    number: '06',
    label: { en: 'Custom Awards & Merchandise', 'zh-hk': '專屬獎項及週邊' },
    title: { en: 'Awards & Merchandise', 'zh-hk': '獎項及週邊商品' },
    summary: {
      en: 'The things players keep. Designed as part of the event, not ordered the week before.',
      'zh-hk': '球員會留下來的東西。由賽事形象一併設計，而不是開賽前一星期才落單。',
    },
    items: {
      en: [
        'Trophies',
        'Medals',
        'Player awards',
        'Team gifts',
        'Event shirts',
        'Commemorative merchandise',
        'Presentation design',
      ],
      'zh-hk': [
        '獎盃',
        '獎牌',
        '球員獎項',
        '球隊禮品',
        '賽事球衣',
        '紀念週邊',
        '頒獎環節設計',
      ],
    },
  },
  {
    id: 'event-execution',
    number: '07',
    label: { en: 'Full Event Execution', 'zh-hk': '全面活動執行' },
    title: { en: 'Full Event Execution', 'zh-hk': '全面活動執行' },
    summary: {
      en: 'On the day, someone is responsible for every moving part — and for the parts that stop moving.',
      'zh-hk': '比賽當日，每個環節都有人負責 — 包括突然出問題的那些。',
    },
    items: {
      en: [
        'Event staffing',
        'Matchday coordination',
        'Announcements',
        'Content capture',
        'Award presentation',
        'Supplier coordination',
        'Issue management',
      ],
      'zh-hk': [
        '活動人手',
        '比賽日統籌',
        '現場司儀及公佈',
        '內容拍攝',
        '頒獎執行',
        '供應商協調',
        '突發事件處理',
      ],
    },
  },
  {
    id: 'fan-experiences',
    number: '08',
    label: { en: 'Immersive Experiences', 'zh-hk': '沉浸式體驗' },
    title: { en: 'Immersive Fan Experiences', 'zh-hk': '沉浸式球迷體驗' },
    summary: {
      en: 'Reasons to arrive early and stay late — and something worth posting while they are there.',
      'zh-hk': '讓人願意早到、遲走的理由 — 而且在場時有值得分享的內容。',
    },
    items: {
      en: [
        'Photo areas',
        'Interactive challenges',
        'Sponsor booths',
        'Player interview zones',
        'Fan voting',
        'Social sharing moments',
        'Celebration staging',
      ],
      'zh-hk': [
        '打卡影相區',
        '互動挑戰',
        '贊助商攤位',
        '球員訪問區',
        '球迷投票',
        '社交分享位',
        '慶祝環節佈置',
      ],
    },
  },
];

/* ==========================================================================
   Capabilities — four disciplines
   ========================================================================== */

export const capabilityGroups: CapabilityGroup[] = [
  {
    id: 'content',
    number: '01',
    title: { en: 'Content', 'zh-hk': '內容' },
    items: {
      en: [
        'Social media strategy',
        'Content calendars',
        'Copywriting',
        'Matchday coverage',
        'Short-form video',
        'Campaign concepts',
      ],
      'zh-hk': [
        '社交媒體策略',
        '內容日曆',
        '文案撰寫',
        '比賽日報導',
        '短片內容',
        '企劃構思',
      ],
    },
  },
  {
    id: 'production',
    number: '02',
    title: { en: 'Production', 'zh-hk': '製作' },
    items: {
      en: [
        'Match photography',
        'Match video',
        'Interviews',
        'Player portraits',
        'Studio shoots',
        'Event documentation',
      ],
      'zh-hk': [
        '比賽攝影',
        '比賽影片',
        '球員訪問',
        '球員形象照',
        '影樓拍攝',
        '活動紀錄',
      ],
    },
  },
  {
    id: 'brand',
    number: '03',
    title: { en: 'Brand', 'zh-hk': '品牌' },
    items: {
      en: [
        'Club visual identity',
        'Campaign art direction',
        'Matchday graphics',
        'Merchandise',
        'Sponsor assets',
        'Presentation materials',
      ],
      'zh-hk': [
        '球會視覺形象',
        '企劃美術指導',
        '比賽日圖像',
        '週邊商品',
        '贊助素材',
        '簡報文件',
      ],
    },
  },
  {
    id: 'events',
    number: '04',
    title: { en: 'Events', 'zh-hk': '賽事' },
    items: {
      en: [
        'Competition planning',
        'Venue sourcing',
        'Registration',
        'Scheduling',
        'Logistics',
        'Awards',
        'Fan-zone activation',
      ],
      'zh-hk': [
        '賽事規劃',
        '場地物色',
        '報名安排',
        '賽程編排',
        '物流統籌',
        '獎項',
        '球迷區推廣',
      ],
    },
  },
];

/* ==========================================================================
   Process — five phases
   ========================================================================== */

export const processSteps: ProcessStep[] = [
  {
    id: 'kick-off',
    number: '01',
    title: { en: 'Kick-off', 'zh-hk': '開波' },
    body: {
      en: 'Understand the club, event, audience, and goals.',
      'zh-hk': '了解球隊、賽事、受眾與目標。',
    },
  },
  {
    id: 'game-plan',
    number: '02',
    title: { en: 'Game Plan', 'zh-hk': '制定戰術' },
    body: {
      en: 'Define scope, creative direction, schedule, and deliverables.',
      'zh-hk': '確立範圍、創意方向、時間表及交付內容。',
    },
  },
  {
    id: 'production',
    number: '03',
    title: { en: 'Production', 'zh-hk': '製作執行' },
    body: {
      en: 'Shoot, design, edit, organise, and prepare.',
      'zh-hk': '拍攝、設計、剪輯、統籌與準備。',
    },
  },
  {
    id: 'matchday',
    number: '04',
    title: { en: 'Matchday / Launch', 'zh-hk': '比賽日／上線' },
    body: {
      en: 'Publish content or execute the event.',
      'zh-hk': '發佈內容或正式執行活動。',
    },
  },
  {
    id: 'review',
    number: '05',
    title: { en: 'Review', 'zh-hk': '賽後檢討' },
    body: {
      en: 'Evaluate delivery, learn, and plan the next phase.',
      'zh-hk': '回顧成果，優化下一階段。',
    },
  },
];

/* ==========================================================================
   BUILD-A-CLUB — sample season workflow and matchweek calendar
   ========================================================================== */

export const clubSeasonWorkflow: TimelineStage[] = [
  {
    id: 'pre-season',
    marker: { en: 'Pre-season', 'zh-hk': '季前' },
    title: { en: 'Identity and media day', 'zh-hk': '形象與媒體日' },
    body: {
      en: 'Visual system agreed, templates built, squad photographed, season campaign shot.',
      'zh-hk': '確立視覺系統、製作設計模板、拍攝球員相片，並完成球季企劃拍攝。',
    },
  },
  {
    id: 'opening',
    marker: { en: 'Opening weeks', 'zh-hk': '球季初' },
    title: { en: 'Launch and rhythm', 'zh-hk': '啟動與節奏' },
    body: {
      en: 'Season announcement, fixture graphics live, posting rhythm established with the club.',
      'zh-hk': '公佈球季內容、賽程圖上線，與球會一同建立發佈節奏。',
    },
  },
  {
    id: 'matchweeks',
    marker: { en: 'Matchweeks', 'zh-hk': '比賽週' },
    title: { en: 'Repeatable weekly cycle', 'zh-hk': '每週循環' },
    body: {
      en: 'Preview, matchday capture, same-night selects, highlights, result graphics, sponsor recap.',
      'zh-hk': '賽前預告、比賽日拍攝、即晚精選、精華片段、賽果圖與贊助回顧。',
    },
  },
  {
    id: 'mid-season',
    marker: { en: 'Mid-season', 'zh-hk': '季中' },
    title: { en: 'Campaign and review', 'zh-hk': '企劃與檢討' },
    body: {
      en: 'Feature content, a campaign moment, and a review of what supporters responded to.',
      'zh-hk': '推出專題內容與企劃亮點，並檢視球迷反應最好的方向。',
    },
  },
  {
    id: 'season-end',
    marker: { en: 'Season end', 'zh-hk': '季尾' },
    title: { en: 'Awards and archive', 'zh-hk': '頒獎與存檔' },
    body: {
      en: 'Season film, awards content, sponsor recap pack, and an organised archive handed over.',
      'zh-hk': '球季回顧影片、頒獎內容、贊助回顧資料，以及整理好的素材存檔交付。',
    },
  },
];

export const clubMatchweekCalendar: BoardColumn[] = [
  {
    id: 'build-up',
    title: { en: 'Mon – Thu · Build-up', 'zh-hk': '一至四 · 賽前' },
    items: {
      en: ['Last match recap', 'Training frames', 'Player feature', 'Sponsor placement'],
      'zh-hk': ['上仗回顧', '操練片段', '球員專題', '贊助露出'],
    },
  },
  {
    id: 'matchday-minus-one',
    title: { en: 'Fri – Sat · Preview', 'zh-hk': '五至六 · 預告' },
    items: {
      en: ['Fixture graphic', 'Matchday info', 'Squad news', 'Countdown story'],
      'zh-hk': ['賽程圖', '比賽日資訊', '球隊消息', '倒數限時動態'],
    },
  },
  {
    id: 'matchday',
    title: { en: 'Matchday', 'zh-hk': '比賽日' },
    items: {
      en: ['Arrival and warm-up', 'Live stories', 'Full match capture', 'Same-night selects'],
      'zh-hk': ['到場及熱身', '即時限時動態', '全場拍攝', '即晚精選相片'],
    },
  },
  {
    id: 'after',
    title: { en: 'Sun – Mon · Delivery', 'zh-hk': '日至一 · 交付' },
    items: {
      en: ['Result graphic', 'Highlights edit', 'Reel or short-form', 'Full gallery handover'],
      'zh-hk': ['賽果圖', '精華剪輯', 'Reels 或短片', '完整相簿交付'],
    },
  },
];

/* ==========================================================================
   BUILD-A-GAME — event journey and sample deliverables board
   ========================================================================== */

export const gameEventJourney: TimelineStage[] = [
  {
    id: 'concept',
    marker: { en: 'Week 0', 'zh-hk': '第 0 週' },
    title: { en: 'Concept and format', 'zh-hk': '構思與賽制' },
    body: {
      en: 'Objectives, audience, budget shape, team numbers and the competition format.',
      'zh-hk': '確立目標、受眾、預算方向、參賽隊數與賽制。',
    },
  },
  {
    id: 'identity',
    marker: { en: 'Build', 'zh-hk': '籌備' },
    title: { en: 'Identity and registration', 'zh-hk': '形象與報名' },
    body: {
      en: 'Event name and look, registration opens, information packs to entered teams.',
      'zh-hk': '確定賽事名稱及視覺，開放報名，向參賽隊伍發出資料包。',
    },
  },
  {
    id: 'promotion',
    marker: { en: 'Countdown', 'zh-hk': '倒數' },
    title: { en: 'Promotion and partners', 'zh-hk': '宣傳與夥伴' },
    body: {
      en: 'Launch campaign, team announcements, sponsor packages confirmed and produced.',
      'zh-hk': '啟動宣傳、公佈參賽隊伍，確認及製作贊助方案。',
    },
  },
  {
    id: 'matchday',
    marker: { en: 'Matchday', 'zh-hk': '比賽日' },
    title: { en: 'Execution', 'zh-hk': '現場執行' },
    body: {
      en: 'Check-in, match operations, content capture, fan zone, awards and presentation.',
      'zh-hk': '報到、賽事營運、內容拍攝、球迷區、頒獎及典禮環節。',
    },
  },
  {
    id: 'recap',
    marker: { en: 'After', 'zh-hk': '賽後' },
    title: { en: 'Recap and handover', 'zh-hk': '回顧與交付' },
    body: {
      en: 'Event film, photo delivery, sponsor recap pack and an operational debrief.',
      'zh-hk': '賽事回顧影片、相片交付、贊助回顧資料，以及營運檢討。',
    },
  },
];

export const gameDeliverablesBoard: BoardColumn[] = [
  {
    id: 'pre-event',
    title: { en: 'Before', 'zh-hk': '賽前' },
    items: {
      en: [
        'Event identity kit',
        'Registration form and pack',
        'Fixture and group graphics',
        'Launch and countdown content',
      ],
      'zh-hk': ['賽事視覺套裝', '報名表格及資料包', '賽程及分組圖', '啟動及倒數內容'],
    },
  },
  {
    id: 'on-site',
    title: { en: 'On site', 'zh-hk': '現場' },
    items: {
      en: [
        'Signage and wayfinding',
        'Check-in and team liaison',
        'Photo and video crew',
        'Fan zone and sponsor booths',
      ],
      'zh-hk': ['指示牌及場地導向', '報到及球隊聯絡', '攝影及攝錄團隊', '球迷區及贊助攤位'],
    },
  },
  {
    id: 'awards',
    title: { en: 'Awards', 'zh-hk': '頒獎' },
    items: {
      en: [
        'Trophies and medals',
        'Player award set',
        'Presentation running order',
        'Team gift packs',
      ],
      'zh-hk': ['獎盃及獎牌', '球員獎項', '頒獎流程編排', '球隊禮品包'],
    },
  },
  {
    id: 'after-event',
    title: { en: 'After', 'zh-hk': '賽後' },
    items: {
      en: [
        'Same-week photo delivery',
        'Event recap film',
        'Sponsor recap pack',
        'Operational debrief',
      ],
      'zh-hk': ['一週內交付相片', '賽事回顧影片', '贊助回顧資料', '營運檢討報告'],
    },
  },
];

/** Small helper so components read `pick(item.title, locale)`. */
export function pick<T>(value: Localised<T>, locale: Locale): T {
  return value[locale];
}
