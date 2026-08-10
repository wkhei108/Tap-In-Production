import type { Locale } from '@/lib/i18n';
import type { Localised } from './services';

/* ==========================================================================
   Types
   ========================================================================== */

/** Filter buttons on /work. Must stay in sync with `work.filters` in the
 *  dictionaries — the test suite asserts this. */
export const workFilters = [
  'all',
  'club',
  'game',
  'social',
  'photography',
  'video',
  'branding',
  'events',
] as const;
export type WorkFilter = (typeof workFilters)[number];

/** Display category shown on the card and case-study header. */
export const projectCategories = {
  'season-campaign': { en: 'Season Campaign', 'zh-hk': '球季企劃' },
  'social-media': { en: 'Social Media', 'zh-hk': '社交媒體' },
  'match-photography': { en: 'Match Photography', 'zh-hk': '比賽攝影' },
  'video-production': { en: 'Video Production', 'zh-hk': '影片製作' },
  'club-branding': { en: 'Club Branding', 'zh-hk': '球會品牌' },
  'tournament-production': { en: 'Tournament Production', 'zh-hk': '賽事製作' },
  'corporate-football': { en: 'Corporate Football', 'zh-hk': '企業足球' },
  'fan-activation': { en: 'Fan Activation', 'zh-hk': '球迷推廣' },
} satisfies Record<string, Localised>;

export type ProjectCategory = keyof typeof projectCategories;

/** Controls the crop in the editorial grid. */
export type MediaAspect = 'portrait' | 'landscape' | 'square';

export type MediaItem = {
  type: 'image' | 'video';
  /**
   * Path under /public, e.g. `/media/projects/<slug>/gallery-01.webp`.
   * Leave undefined until the real asset is supplied — the UI renders a
   * branded placeholder panel of the right shape instead of breaking.
   */
  src?: string;
  /** Poster frame for videos. Required whenever `type` is 'video'. */
  poster?: string;
  /** Extra source for broader codec support. */
  srcWebm?: string;
  aspect: MediaAspect;
  altText: string;
  altTextZh: string;
  caption?: Localised;
  /** Text alternative for meaningful video. */
  transcript?: Localised;
};

export type Project = {
  slug: string;
  title: string;
  titleZh: string;
  client: Localised;
  /** Omitted until a real project year is confirmed. */
  year?: string;
  category: ProjectCategory;
  /** Which filter buttons this project answers to. */
  filters: WorkFilter[];
  services: Localised<string[]>;
  summary: string;
  summaryZh: string;
  /** Path under /public. Undefined renders a branded placeholder panel. */
  coverImage?: string;
  coverVideo?: string;
  coverAspect: MediaAspect;
  altText: string;
  altTextZh: string;
  brief: Localised;
  challenge: Localised;
  approach: Localised;
  deliverables: Localised<string[]>;
  /** Only ever populated with results TAP IN. has verified. Omitted here. */
  outcomes?: Localised<string[]>;
  credits?: Localised<string[]>;
  gallery: MediaItem[];
  featured: boolean;
  /**
   * True for placeholder entries written to demonstrate the template.
   * The UI labels them so nothing reads as a real client engagement.
   */
  sample: boolean;
};

/* ==========================================================================
   Projects
   --------------------------------------------------------------------------
   EVERY ENTRY BELOW IS A SAMPLE (`sample: true`).

   They exist so the grid, filters, and case-study template can be reviewed
   with realistic structure. They describe the kind of work TAP IN. does —
   they do not claim a specific client, result or engagement.

   To publish a real project: replace the fields, add media under
   `public/media/projects/<slug>/`, set `sample: false`, and add `year`.
   See docs/asset-guide.md.
   ========================================================================== */

export const projects: Project[] = [
  {
    slug: 'club-season-content-programme',
    title: 'Club Season Content Programme',
    titleZh: '球會全季內容企劃',
    client: { en: 'Club to be confirmed', 'zh-hk': '球會待確認' },
    category: 'season-campaign',
    filters: ['club', 'social', 'photography', 'video'],
    services: {
      en: [
        'Social media management',
        'Match photography',
        'Video production',
        'Matchday graphics',
        'Sponsor content',
      ],
      'zh-hk': ['社交媒體管理', '比賽攝影', '影片製作', '比賽日圖像', '贊助內容'],
    },
    summary:
      'A full-season content programme for a local league club: one visual system, a weekly publishing rhythm, and matchday coverage from arrival to final whistle.',
    summaryZh:
      '為本地聯賽球會而設的全季內容企劃：一套視覺系統、每週穩定的發佈節奏，以及由到場到完場的比賽日拍攝。',
    coverAspect: 'landscape',
    altText:
      'Placeholder for the cover image of a club season content programme case study.',
    altTextZh: '球會全季內容企劃個案封面圖片位置。',
    brief: {
      en: 'Cover a full league season for a Hong Kong club across photography, video and social, with one recognisable look from the first fixture graphic to the season review.',
      'zh-hk':
        '為一支香港球會完整覆蓋整個聯賽球季，涵蓋攝影、影片與社交內容，由第一張賽程圖到球季回顧都維持同一套識別。',
    },
    challenge: {
      en: 'Club content was produced by different volunteers each week. Quality moved up and down, the look changed between posts, and sponsors had no consistent presence.',
      'zh-hk':
        '球會的內容每星期由不同義工負責，質素起伏，帖文風格不一，贊助商亦沒有穩定的露出。',
    },
    approach: {
      en: 'We set one template system and one weekly cycle: preview mid-week, capture on matchday, deliver selects the same night, highlights and result graphics the next day. Sponsor placements were written into the shot list before kick-off rather than found afterwards.',
      'zh-hk':
        '我們訂立一套模板系統與固定的每週循環：週中出預告、比賽日拍攝、即晚交付精選、翌日出精華及賽果圖。贊助露出在開賽前已寫入拍攝清單，而不是事後才找。',
    },
    deliverables: {
      en: [
        'Matchday photo set per fixture',
        'Same-night selects for social',
        'Weekly highlights edit',
        'Fixture, line-up and result graphic templates',
        'Monthly content calendar',
        'Season review film',
      ],
      'zh-hk': [
        '每場比賽的相片集',
        '即晚社交平台精選相片',
        '每週精華剪輯',
        '賽程、正選及賽果圖模板',
        '每月內容日曆',
        '球季回顧影片',
      ],
    },
    gallery: [
      {
        type: 'image',
        aspect: 'landscape',
        altText: 'Placeholder for a wide matchday action photograph.',
        altTextZh: '比賽日動作橫向相片位置。',
        caption: { en: 'Matchday · second half', 'zh-hk': '比賽日 · 下半場' },
      },
      {
        type: 'image',
        aspect: 'portrait',
        altText: 'Placeholder for a portrait photograph of a player before kick-off.',
        altTextZh: '球員開賽前直度相片位置。',
      },
      {
        type: 'image',
        aspect: 'portrait',
        altText: 'Placeholder for a portrait photograph of supporters in the stand.',
        altTextZh: '看台球迷直度相片位置。',
      },
      {
        type: 'image',
        aspect: 'square',
        altText: 'Placeholder for a square social media result graphic.',
        altTextZh: '方形社交平台賽果圖位置。',
        caption: { en: 'Result graphic template', 'zh-hk': '賽果圖模板' },
      },
    ],
    featured: true,
    sample: true,
  },

  {
    slug: 'invitational-cup-production',
    title: 'Invitational Cup Production',
    titleZh: '邀請盃賽事製作',
    client: { en: 'Organiser to be confirmed', 'zh-hk': '主辦單位待確認' },
    category: 'tournament-production',
    filters: ['game', 'events', 'branding', 'video'],
    services: {
      en: [
        'Competition planning',
        'Event identity',
        'Registration',
        'Matchday production',
        'Awards and merchandise',
      ],
      'zh-hk': ['賽事規劃', '賽事形象', '報名安排', '比賽日製作', '獎項及週邊'],
    },
    summary:
      'A one-day invitational cup taken from format to final whistle — identity, registration, schedule, on-site operations, awards and recap content.',
    summaryZh:
      '一日制邀請盃，由賽制到完場哨聲全程負責 — 包括形象、報名、賽程、現場營運、頒獎及賽後內容。',
    coverAspect: 'landscape',
    altText: 'Placeholder for the cover image of an invitational cup production case study.',
    altTextZh: '邀請盃賽事製作個案封面圖片位置。',
    brief: {
      en: 'Run a single-day invitational tournament that feels organised for the teams taking part and looks presentable for the partners supporting it.',
      'zh-hk':
        '籌辦一項一日制邀請賽，讓參賽隊伍感受到安排妥當，亦讓支持的合作夥伴覺得有體面。',
    },
    challenge: {
      en: 'A compressed schedule, several pitches running in parallel, and teams arriving across a two-hour window with no central point of information.',
      'zh-hk':
        '賽程緊密、多個場地同時進行，加上球隊在兩小時內陸續到場，卻缺乏統一的資訊發放點。',
    },
    approach: {
      en: 'The format was built around the hours actually available, then everything else followed it: staggered check-in, printed and digital schedules, signage at each pitch, and a crew brief that named who owns each decision on the day.',
      'zh-hk':
        '我們先按實際可用時間設計賽制，其餘安排再跟着走：分時段報到、印刷及電子賽程、每個場地的指示牌，以及列明當日每個決定由誰負責的工作簡報。',
    },
    deliverables: {
      en: [
        'Competition format and regulations',
        'Event identity and signage',
        'Registration flow and team packs',
        'Match schedule and results board',
        'Trophies, medals and player awards',
        'Event recap film and photo delivery',
      ],
      'zh-hk': [
        '賽制及比賽規程',
        '賽事形象及指示牌',
        '報名流程及參賽資料包',
        '賽程表及成績板',
        '獎盃、獎牌及球員獎項',
        '賽事回顧影片及相片交付',
      ],
    },
    gallery: [
      {
        type: 'image',
        aspect: 'landscape',
        altText: 'Placeholder for a wide photograph of teams lining up before a cup match.',
        altTextZh: '盃賽開賽前球隊列隊橫向相片位置。',
        caption: { en: 'Walk-in · group stage', 'zh-hk': '進場 · 分組賽' },
      },
      {
        type: 'image',
        aspect: 'square',
        altText: 'Placeholder for a square photograph of the trophy and medals table.',
        altTextZh: '獎盃及獎牌陳列方形相片位置。',
      },
      {
        type: 'image',
        aspect: 'portrait',
        altText: 'Placeholder for a portrait photograph of the award presentation.',
        altTextZh: '頒獎環節直度相片位置。',
      },
      {
        type: 'image',
        aspect: 'landscape',
        altText: 'Placeholder for a wide photograph of the pitch-side signage and fan zone.',
        altTextZh: '場邊指示牌及球迷區橫向相片位置。',
      },
    ],
    featured: true,
    sample: true,
  },

  {
    slug: 'matchday-media-campaign',
    title: 'Matchday Media Campaign',
    titleZh: '比賽日媒體企劃',
    client: { en: 'Club to be confirmed', 'zh-hk': '球會待確認' },
    category: 'match-photography',
    filters: ['club', 'photography', 'social'],
    services: {
      en: ['Match photography', 'Short-form video', 'Social copywriting', 'Sponsor visibility'],
      'zh-hk': ['比賽攝影', '短片製作', '社交文案', '贊助露出'],
    },
    summary:
      'A single-fixture media push built for speed: full coverage on the day and a publish-ready set in the club’s hands the same night.',
    summaryZh: '針對單場比賽的快速媒體企劃：當日全程拍攝，即晚將可直接發佈的素材交到球會手上。',
    coverAspect: 'portrait',
    altText: 'Placeholder for the cover image of a matchday media campaign case study.',
    altTextZh: '比賽日媒體企劃個案封面圖片位置。',
    brief: {
      en: 'Cover one fixture end to end and hand over social-ready material fast enough for the club to post while the result is still being talked about.',
      'zh-hk':
        '完整覆蓋單場比賽，並在賽果仍是話題時，及早交出可直接發佈的社交素材給球會。',
    },
    challenge: {
      en: 'Attention on a result fades within hours, but selecting, editing and captioning usually took days.',
      'zh-hk': '賽果的關注度只有數小時，但以往揀相、修圖與撰寫文案往往需時數日。',
    },
    approach: {
      en: 'Two shooters with a divided brief, an agreed shot list covering the moments the club always needs, and an on-site edit station so the first set goes out before the players have left the ground.',
      'zh-hk':
        '兩名攝影師分工拍攝，並預先訂立涵蓋球會必備畫面的拍攝清單，加上現場剪輯位，讓第一批素材在球員離場前已經出街。',
    },
    deliverables: {
      en: [
        'Full matchday photo set',
        'Same-night social selects',
        'Two short-form vertical edits',
        'Bilingual captions',
        'Sponsor visibility frames',
      ],
      'zh-hk': [
        '完整比賽日相片集',
        '即晚社交精選相片',
        '兩條直度短片',
        '中英文文案',
        '贊助露出畫面',
      ],
    },
    gallery: [
      {
        type: 'image',
        aspect: 'portrait',
        altText: 'Placeholder for a portrait photograph of a player during the match.',
        altTextZh: '比賽期間球員直度相片位置。',
      },
      {
        type: 'image',
        aspect: 'landscape',
        altText: 'Placeholder for a wide photograph of a goal celebration.',
        altTextZh: '入球慶祝橫向相片位置。',
        caption: { en: 'Celebration · 78’', 'zh-hk': '慶祝 · 78分鐘' },
      },
      {
        type: 'image',
        aspect: 'square',
        altText: 'Placeholder for a square crop prepared for an Instagram post.',
        altTextZh: '為 Instagram 帖文預備的方形裁剪相片位置。',
      },
    ],
    featured: true,
    sample: true,
  },

  {
    slug: 'club-rebrand-and-kit-launch',
    title: 'Club Rebrand & Kit Launch',
    titleZh: '球會形象重塑及球衣發佈',
    client: { en: 'Club to be confirmed', 'zh-hk': '球會待確認' },
    category: 'club-branding',
    filters: ['club', 'branding', 'photography'],
    services: {
      en: ['Visual identity', 'Campaign art direction', 'Studio shoot', 'Launch content'],
      'zh-hk': ['視覺形象', '企劃美術指導', '影樓拍攝', '發佈內容'],
    },
    summary:
      'A refreshed club identity and the campaign that introduced it — templates, studio portraits, and a launch sequence built for social.',
    summaryZh:
      '更新球會視覺形象，並以企劃形式推出 — 包括設計模板、影樓人像，以及為社交平台而設的發佈流程。',
    coverAspect: 'square',
    altText: 'Placeholder for the cover image of a club rebrand and kit launch case study.',
    altTextZh: '球會形象重塑及球衣發佈個案封面圖片位置。',
    brief: {
      en: 'Give a club one coherent look it can run itself, and launch the new kit with a sequence that builds rather than a single post.',
      'zh-hk':
        '為球會建立一套自己也維持得到的統一視覺，並以有層次的發佈流程推出新球衣，而不是只發一篇帖文。',
    },
    challenge: {
      en: 'The crest, the typography and the social templates had all drifted apart over several seasons, and each new graphic started from scratch.',
      'zh-hk': '隊徽、字體與社交模板在幾個球季之間逐漸走樣，每次做新圖都要由零開始。',
    },
    approach: {
      en: 'We rebuilt the system from the crest outward — type, colour, framing, and a template set the club can fill in without design help — then shot the kit in studio and released it over a planned week.',
      'zh-hk':
        '我們由隊徽出發重建整套系統 — 字體、色彩、構圖，以及球會無需設計師也能自行套用的模板 — 再在影樓拍攝球衣，並按計劃分階段在一週內發佈。',
    },
    deliverables: {
      en: [
        'Visual identity guidelines',
        'Matchday graphic template set',
        'Studio kit photography',
        'Launch campaign sequence',
        'Sponsor lock-up artwork',
      ],
      'zh-hk': [
        '視覺形象指引',
        '比賽日圖像模板',
        '影樓球衣拍攝',
        '發佈企劃流程',
        '贊助標誌組合素材',
      ],
    },
    gallery: [
      {
        type: 'image',
        aspect: 'square',
        altText: 'Placeholder for a square image of the refreshed club identity system.',
        altTextZh: '球會全新視覺系統方形圖片位置。',
      },
      {
        type: 'image',
        aspect: 'portrait',
        altText: 'Placeholder for a studio portrait of a player in the new kit.',
        altTextZh: '球員穿着新球衣的影樓人像位置。',
      },
      {
        type: 'image',
        aspect: 'portrait',
        altText: 'Placeholder for a studio detail shot of the new kit.',
        altTextZh: '新球衣細節影樓相片位置。',
      },
    ],
    featured: true,
    sample: true,
  },

  {
    slug: 'youth-football-activation',
    title: 'Youth Football Activation',
    titleZh: '青少年足球推廣活動',
    client: { en: 'Programme to be confirmed', 'zh-hk': '主辦計劃待確認' },
    category: 'fan-activation',
    filters: ['game', 'events', 'social', 'photography'],
    services: {
      en: ['Event production', 'Fan experience design', 'Photography', 'Recap content'],
      'zh-hk': ['活動製作', '球迷體驗設計', '攝影', '回顧內容'],
    },
    summary:
      'A youth football day built around participation — challenge stations, a photo area, and a recap set families could actually keep.',
    summaryZh:
      '以參與為核心的青少年足球日 — 設有挑戰站、打卡影相區，以及家長真的會保存的賽後相片。',
    coverAspect: 'landscape',
    altText: 'Placeholder for the cover image of a youth football activation case study.',
    altTextZh: '青少年足球推廣活動個案封面圖片位置。',
    brief: {
      en: 'Design a youth football day where every participant leaves with something — a moment, a photograph, and a reason to come back.',
      'zh-hk': '設計一個青少年足球日，讓每位參加者都帶走一些東西 — 一個時刻、一張相片，以及再來的理由。',
    },
    challenge: {
      en: 'Wide age range, mixed ability, and parents watching from the side with nothing to do and nothing to take home.',
      'zh-hk': '參加者年齡與能力差距大，家長在旁觀看卻沒有參與，亦沒有東西可以帶走。',
    },
    approach: {
      en: 'Short rotating stations kept every group moving, a photo area gave parents a reason to be involved, and every participant was photographed by name so the recap gallery was easy to find yourself in.',
      'zh-hk':
        '以短時間輪換的站點讓每組保持節奏，打卡區讓家長有參與感，並按名字為每位參加者拍照，令賽後相簿容易找到自己。',
    },
    deliverables: {
      en: [
        'Activation format and station design',
        'Signage and wayfinding',
        'Photo area setup',
        'Participant photo gallery',
        'Recap reel',
      ],
      'zh-hk': ['活動流程及站點設計', '指示牌及場地導向', '打卡區佈置', '參加者相簿', '回顧短片'],
    },
    gallery: [
      {
        type: 'image',
        aspect: 'landscape',
        altText: 'Placeholder for a wide photograph of a youth football challenge station.',
        altTextZh: '青少年足球挑戰站橫向相片位置。',
      },
      {
        type: 'image',
        aspect: 'square',
        altText: 'Placeholder for a square photograph of the photo area backdrop.',
        altTextZh: '打卡影相區背板方形相片位置。',
      },
    ],
    featured: true,
    sample: true,
  },

  {
    slug: 'corporate-football-day',
    title: 'Corporate Football Day',
    titleZh: '企業足球日',
    client: { en: 'Company to be confirmed', 'zh-hk': '公司待確認' },
    category: 'corporate-football',
    filters: ['game', 'events', 'video'],
    services: {
      en: ['Event planning', 'Logistics', 'Video production', 'Awards'],
      'zh-hk': ['活動策劃', '物流統籌', '影片製作', '獎項'],
    },
    summary:
      'A company football day run as a proper competition — seeded groups, a real schedule, and a recap film staff wanted to share internally.',
    summaryZh:
      '以正式賽事規格籌辦的公司足球日 — 有分組編排、有真正賽程，賽後回顧影片同事樂意在公司內分享。',
    coverAspect: 'landscape',
    altText: 'Placeholder for the cover image of a corporate football day case study.',
    altTextZh: '企業足球日個案封面圖片位置。',
    brief: {
      en: 'Take a company sports day beyond a casual kickabout, with enough structure to feel like an event and enough flexibility for mixed ability.',
      'zh-hk': '讓公司運動日超越隨意踢波，既有賽事的結構感，亦能照顧不同水平的參加者。',
    },
    challenge: {
      en: 'Teams of very different standards, a fixed venue booking, and a finish time that could not move.',
      'zh-hk': '各隊水平差距大、場地時段固定，而且完場時間不能延遲。',
    },
    approach: {
      en: 'Groups were seeded after a short round of warm-up matches so games stayed competitive, and the schedule was built backwards from the hard finish time with buffer built in.',
      'zh-hk':
        '先安排短輪熱身賽再分組，令對賽較為勢均力敵；賽程則由不可更改的完場時間倒推編排，並預留緩衝時間。',
    },
    deliverables: {
      en: [
        'Tournament format and seeding',
        'Run sheet and venue plan',
        'On-site coordination',
        'Recap film and photo set',
        'Award presentation',
      ],
      'zh-hk': ['賽制及分組編排', '流程表及場地規劃', '現場統籌', '回顧影片及相片集', '頒獎環節'],
    },
    gallery: [
      {
        type: 'image',
        aspect: 'landscape',
        altText: 'Placeholder for a wide photograph of a corporate football match in progress.',
        altTextZh: '企業足球比賽進行中橫向相片位置。',
      },
      {
        type: 'image',
        aspect: 'portrait',
        altText: 'Placeholder for a portrait photograph of the winning team celebrating.',
        altTextZh: '冠軍隊伍慶祝直度相片位置。',
      },
    ],
    featured: false,
    sample: true,
  },
];

/* ==========================================================================
   Helpers
   ========================================================================== */

export function getAllProjects(): Project[] {
  return projects;
}

export function getFeaturedProjects(limit = 6): Project[] {
  return projects.filter((project) => project.featured).slice(0, limit);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Pure, so it can be unit tested and reused on the client. */
export function filterProjects(list: Project[], filter: WorkFilter): Project[] {
  if (filter === 'all') return list;
  return list.filter((project) => project.filters.includes(filter));
}

/** Projects sharing at least one filter, excluding the current one. */
export function getRelatedProjects(slug: string, limit = 3): Project[] {
  const current = getProjectBySlug(slug);
  if (!current) return [];

  const scored = projects
    .filter((project) => project.slug !== slug)
    .map((project) => ({
      project,
      score: project.filters.filter((f) => current.filters.includes(f)).length,
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.project);
}

/** Locale-aware accessors keep `titleZh`-style fields out of components. */
export function projectTitle(project: Project, locale: Locale): string {
  return locale === 'zh-hk' ? project.titleZh : project.title;
}

export function projectSummary(project: Project, locale: Locale): string {
  return locale === 'zh-hk' ? project.summaryZh : project.summary;
}

export function projectAlt(project: Project, locale: Locale): string {
  return locale === 'zh-hk' ? project.altTextZh : project.altText;
}

export function mediaAlt(item: MediaItem, locale: Locale): string {
  return locale === 'zh-hk' ? item.altTextZh : item.altText;
}

export function categoryLabel(category: ProjectCategory, locale: Locale): string {
  return projectCategories[category][locale];
}
