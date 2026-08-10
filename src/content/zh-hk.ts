import type { Dictionary } from './en';

/**
 * 繁體中文（香港）文案。
 *
 * Typed as `Dictionary`, so this file will not compile until every key in
 * `en.ts` has a Traditional Chinese counterpart. Copy is written for a Hong
 * Kong football audience — not a literal translation of the English.
 */
export const zhHK: Dictionary = {
  nav: {
    work: '作品',
    buildAClub: '打造球會',
    buildAGame: '籌辦賽事',
    about: '關於我們',
    contact: '聯絡',
    privacy: '私隱政策',
    home: '主頁',
    startProject: '開始合作',
    openMenu: '開啟選單',
    closeMenu: '關閉選單',
    menuTitle: '選單',
    skipToContent: '跳至主要內容',
    languageLabel: '語言',
    brandHome: 'TAP IN. — 返回主頁',
    primaryLabel: '主要導覽',
    footerLabel: '頁尾導覽',
  },

  common: {
    startProject: '開始合作',
    viewWork: '瀏覽作品',
    viewAllWork: '瀏覽全部作品',
    emailUs: '電郵聯絡 TAP IN.',
    followPrefix: '追蹤',
    enquire: '提交查詢',
    explore: '了解更多',
    caseStudy: '查看個案',
    backToWork: '返回作品一覽',
    relatedWork: '相關作品',
    servicesDelivered: '服務範疇',
    deliverables: '交付內容',
    challenge: '項目挑戰',
    approach: 'TAP IN. 的做法',
    brief: '項目簡介',
    outcomes: '成果',
    gallery: '圖片與影片',
    client: '客戶',
    year: '年份',
    category: '類別',
    credits: '合作單位',
    sampleBadge: '示範內容',
    sampleNote: '示範內容 — 請於 src/content/projects.ts 換上已確認的 TAP IN. 項目。',
    mediaPending: '素材待補',
    mediaPendingNote: '尚未加入客戶提供的素材',
    openLightbox: '放大檢視',
    closeLightbox: '關閉圖庫',
    previousImage: '上一項',
    nextImage: '下一項',
    lightboxPosition: '第 {current} 項，共 {total} 項',
    playVideo: '播放影片',
    pauseVideo: '暫停影片',
    videoNoSupport: '你的瀏覽器未能播放此影片。',
    transcript: '影片文字稿',
    externalLink: '於新分頁開啟',
  },

  home: {
    meta: {
      title: 'TAP IN.｜香港足球製作、內容及賽事顧問',
      description:
        'TAP IN. 提供社交媒體管理、比賽攝影、影片製作、品牌設計及足球賽事策劃與執行，協助球會、球隊與主辦單位提升形象及商業價值。',
    },
    hero: {
      eyebrow: '香港足球製作及顧問團隊',
      headlineLineOne: '打造球會。',
      headlineLineTwo: '成就賽事。',
      body: '從比賽日影像、全季社交媒體內容，到完整賽事策劃與執行，TAP IN. 將足球時刻轉化成品牌形象、社群連結、曝光度與商業價值。',
      primaryCta: '開始合作',
      secondaryCta: '瀏覽作品',
      scrollHint: '向下瀏覽',
      mediaLabel: 'TAP IN. 作品輯錄 — 無聲背景影片',
    },
    ticker: ['社交媒體', '攝影', '影片製作', '品牌設計', '賽事執行', '贊助推廣'],
    intro: {
      eyebrow: '我們的看法',
      headline: '足球，從來不只90分鐘。',
      body: '每次過人、攔截、失誤、慶祝、進場、捧盃與球迷反應，都是故事的一部分。TAP IN. 捕捉這些時刻，並將它們轉化成完整而一致的內容與品牌體驗。',
      secondary: '我們用足球的方式工作 — 事前部署，臨場執行，賽後檢討。',
      captionPrimary: '比賽日拍攝 · 香港',
      captionSecondary: '賽後剪輯 · 即日交付',
    },
    pillars: {
      eyebrow: '兩種合作方式',
      headline: '兩個方向，同一水準。',
      body: '無論是陪伴球會走完整個球季，還是籌辦一場賽事，流程、團隊與完成度都是同一標準。',
      club: {
        name: 'BUILD-A-CLUB',
        meta: '適合球會、球隊及青訓',
        tagline: '圍繞球會或球隊，建立形象、內容、社群與贊助價值。',
        services: [
          '社交媒體管理',
          '比賽攝影',
          '影片製作',
          '品牌及企劃設計',
          '球員形象拍攝',
          '週邊商品',
          '球迷互動',
          '贊助內容',
        ],
        cta: '了解打造球會',
      },
      game: {
        name: 'BUILD-A-GAME',
        meta: '適合主辦單位、企業及品牌',
        tagline: '將一場足球活動，變成有規劃、有宣傳、令人記得的體驗。',
        services: [
          '賽事規劃',
          '市場推廣與宣傳',
          '贊助合作',
          '獎項及週邊',
          '場地與物流',
          '比賽日製作',
          '球迷體驗',
          '賽事內容',
        ],
        cta: '了解籌辦賽事',
      },
    },
    featured: {
      eyebrow: '精選作品',
      headline: '從第一聲哨子，到最後一篇帖文。',
      body: '看看一個球季、一項盃賽，以及一場比賽日企劃是怎樣完成的。',
      cta: '瀏覽全部作品',
    },
    capabilities: {
      eyebrow: '服務能力',
      headline: '我們實際負責的事。',
      body: '四個範疇，同一隊人。大部分項目都是幾個範疇一起運作，而非單一服務。',
    },
    process: {
      eyebrow: '合作流程',
      headline: '我們的戰術板。',
      body: '由第一次傾談，到賽後檢討，一共五個階段。',
    },
    commercial: {
      eyebrow: '商業價值',
      headline: '由曝光走向商業價值',
      body: '持續而一致的故事內容，能提升球會的專業形象、加深球迷互動，亦為贊助商創造更清晰的曝光及合作機會。',
      points: [
        {
          title: '撐得住場面的形象',
          body: '比賽日圖像、社交帖文、球衣發佈以至提案文件，都用同一套視覺語言。',
        },
        {
          title: '讓球迷留下來的理由',
          body: '內容跟着球季走，而不是只在贏波的時候才出現。',
        },
        {
          title: '贊助商用得着的素材',
          body: '品牌露出、活動視覺與賽後回顧，整理成可以直接傾合作的資料。',
        },
      ],
      disclaimer:
        '我們不會保證贊助收入或流量數字。我們負責的，是把素材與一致性做好，讓這些合作傾得更順暢。',
    },
    clients: {
      eyebrow: '合作球會及夥伴',
      headline: '合作單位',
      body: '待取得書面同意及向量檔案後，標誌會在此展示。在此之前，此區塊會保持隱藏。',
    },
    social: {
      eyebrow: 'Instagram',
      headline: '在場邊',
      body: '精選近期作品。完整內容請看我們的 Instagram。',
      cta: '追蹤',
    },
    finalCta: {
      headline: '一起打造你的下一個球季、企劃或賽事。',
      body: '告訴我們你的球隊、日期與目標，我們會為你制定合適的方案。',
      primaryCta: '開始合作',
      secondaryCta: '電郵聯絡 TAP IN.',
    },
  },

  club: {
    meta: {
      title: '打造球會｜足球內容、品牌設計及全季製作',
      description:
        'TAP IN. BUILD-A-CLUB — 為香港球會及球隊提供社交媒體管理、比賽攝影、影片製作、品牌形象、球員拍攝、週邊商品及贊助內容。',
    },
    hero: {
      eyebrow: 'BUILD-A-CLUB',
      headline: '打造一支令人想追隨的球隊。',
      body: '現代足球早已不只是90分鐘的比賽，更是身份認同、連繫與傳承。TAP IN. 捕捉塑造球會的每個瞬間，並將它們轉化成場內場外一致而有力量的品牌與內容系統。',
      primaryCta: '開始合作',
      secondaryCta: '查看球會作品',
    },
    intro: {
      eyebrow: '為甚麼重要',
      headline: '球隊給人的印象，來自你怎樣呈現自己。',
      body: '成績每星期都會變，但球會如何呈現自己，是你可以掌握的部分 — 隊徽、語氣、相片、宣佈新兵的方式，以至跟球迷說話的方式。',
      pillars: [
        { label: '捕捉時刻', note: '比賽日、操練、旅程與慶祝。' },
        { label: '塑造形象', note: '一套走到哪裏都成立的視覺系統。' },
        { label: '形象拍攝', note: '個人照、球隊合照、媒體日。' },
        { label: '週邊設計', note: '球迷真的願意穿戴的產品。' },
        { label: '建立聯繫', note: '讓球迷成為內容一部分。' },
        { label: '提高互動', note: '為參與而設計的企劃。' },
      ],
    },
    services: {
      eyebrow: '服務內容',
      headline: '七項服務，一套系統。',
      body: '可以整季全套跟進，也可以只做單一項目，針對某個階段發力。',
    },
    workflow: {
      eyebrow: '球季流程',
      headline: '一個球季，由頭到尾。',
      body: '這是全季合作的示範節奏。實際範圍與頻率會在開波階段一起訂立。',
    },
    calendar: {
      eyebrow: '內容日曆',
      headline: '一個比賽週的部署。',
      body: '以下為示範比賽週。實際日曆會按你的賽程、操練時間及贊助安排編排。',
      note: '示範例子，並非固定套餐。',
    },
    gallery: {
      eyebrow: '球會作品',
      headline: '精選球會項目',
    },
    cta: {
      headline: '準備好打造你的球會？',
      body: '告訴我們新一季的賽程、目標、贊助安排，以及你希望球迷感受到甚麼。',
    },
  },

  game: {
    meta: {
      title: '籌辦賽事｜香港足球賽事策劃及活動製作',
      description:
        'TAP IN. BUILD-A-GAME — 提供賽事規劃、場地與物流、活動形象、市場推廣、贊助方案、獎項週邊及比賽日全面執行。',
    },
    hero: {
      eyebrow: 'BUILD-A-GAME',
      headline: '將一場比賽，變成一段體驗。',
      body: '足球不僅是場上的較量。球員進場、現場佈置、紀念品、球迷反應、頒獎與共同慶祝，才令一場賽事真正令人難忘。TAP IN. 將你的賽事構想，轉化成一場專業、有話題性而且值得記住的足球體驗。',
      primaryCta: '開始合作',
      secondaryCta: '查看賽事作品',
    },
    intro: {
      eyebrow: '為甚麼重要',
      headline: '比賽是核心，但不是全部。',
      body: '球員記得的是進場一刻、捧起獎盃，以及事後收到的那張相。贊助商記得的是品牌有沒有出現，以及有沒有東西可以發佈。這兩件事都要事先規劃，不能靠運氣。',
      pillars: [
        { label: '賽事規劃', note: '賽制、規程、時間表。' },
        { label: '市場推廣與宣傳', note: '公佈、倒數、現場報導。' },
        { label: '贊助合作', note: '贊助方案與品牌接觸點。' },
        { label: '專屬獎項及週邊', note: '獎盃、獎牌、球衣、禮品。' },
        { label: '全面活動執行', note: '人手、統籌、應變安排。' },
        { label: '沉浸式體驗', note: '打卡位、互動挑戰、球迷區。' },
      ],
    },
    services: {
      eyebrow: '服務內容',
      headline: '八條工作線，一個團隊執行。',
      body: '可以由我們負責整個賽事，也可以只補上你團隊未覆蓋的部分。',
    },
    journey: {
      eyebrow: '賽事流程',
      headline: '由構想到完場哨聲。',
      body: '這是一項賽事的典型流程。實際時間會按賽事規模及場地檔期調整。',
    },
    deliverablesBoard: {
      eyebrow: '交付清單',
      headline: '比賽日會出現的東西。',
      body: '以下為邀請賽的示範交付清單。每項賽事都會單獨評估。',
      note: '示範例子，並非固定套餐。',
    },
    gallery: {
      eyebrow: '賽事作品',
      headline: '精選賽事項目',
    },
    cta: {
      headline: '準備好籌辦你的賽事？',
      body: '告訴我們賽制、日期與參賽隊數，我們會回覆一份計劃與實際可行的範圍。',
    },
  },

  work: {
    meta: {
      title: '作品｜足球內容、攝影、影片及賽事製作',
      description:
        'TAP IN. 精選足球作品 — 球會全季企劃、比賽攝影、影片製作、品牌設計及香港賽事製作。',
    },
    eyebrow: '作品',
    headline: '每支球隊都有故事，每場賽事都值得被看見。',
    body: '球會企劃、比賽日影像與賽事製作。可按你需要的類別篩選。',
    filtersLabel: '按類別篩選作品',
    filters: {
      all: '全部',
      club: '球會',
      game: '賽事',
      social: '社交媒體',
      photography: '攝影',
      video: '影片',
      branding: '品牌設計',
      events: '活動製作',
    },
    count: '{count} 個項目',
    countOne: '1 個項目',
    empty: '此類別暫時未有項目。',
    emptyHint: '可以試試其他類別，或直接把你的構想告訴我們。',
  },

  project: {
    metaSuffix: '個案',
    notFoundTitle: '找不到此項目',
    heroLabel: '個案',
    briefLabel: '項目簡介',
    noOutcomesNote: '此項目未有已確認的公開成果數據。',
  },

  about: {
    meta: {
      title: '關於我們｜香港足球製作及顧問團隊',
      description:
        'TAP IN. 是紮根香港的足球製作及顧問團隊，結合足球觸覺、視覺敘事、內容製作與活動執行。',
    },
    hero: {
      eyebrow: '關於我們',
      headline: '懂足球的創作團隊，也是可靠的執行夥伴。',
      body: 'TAP IN. 是一支紮根香港的足球製作及顧問團隊。我們相信，每支球隊與每場賽事，都值得以清晰而有目的的方式呈現。我們結合足球觸覺、視覺敘事、內容製作及活動執行，協助球隊與主辦單位創造球迷記得、合作夥伴重視的作品。',
    },
    pov: {
      eyebrow: '我們的立場',
      headline: '呈現方式，本身就是比賽的一部分。',
      body: '香港有很多球隊，在有限資源下依然認真做事。往往欠缺的不是努力或才華，而是一套持續而一致的呈現方式。我們正正在這個空隙裏工作。',
      secondary: '比起交一堆之後沒人再打開的檔案，我們更想建立一套球會可以長期沿用的系統。',
    },
    whyFootball: {
      eyebrow: '為甚麼要懂足球',
      headline: '不熟悉這項運動，就會錯過那一刻。',
      body: '知道第二點波會落在哪裏、換人快將出現、球迷最想看到哪個慶祝動作、贊助商需要哪一格畫面 — 這是足球的理解，不只是攝影技術。這就是「影完一場波」與「講好一個故事」的分別。',
      points: [
        '我們看得懂比賽，鏡頭早就指向正確方向。',
        '我們分得清哪些內容今晚要出，哪些可以留待星期二。',
        '贊助露出在開賽前已規劃好，而不是在剪片時才補救。',
      ],
    },
    difference: {
      eyebrow: '我們的分別',
      headline: '與 TAP IN. 合作，你會得到甚麼',
      items: [
        {
          title: '以足球為本的理解',
          body: '我們一直關注本地足球。賽程、賽制與比賽日的實際情況，是我們的起點，而不是事後補上的考慮。',
        },
        {
          title: '內容與執行同一團隊',
          body: '策劃活動的人，就是現場拍攝的人。溝通更少誤差，也更少空隙。',
        },
        {
          title: '中英雙語，貼近香港',
          body: '中英文都由懂本地語境的人撰寫，不是臨門一腳才翻譯。',
        },
        {
          title: '以社交平台為先的製作',
          body: '由構圖開始就考慮最終出街的平台，直度、橫度同時兼顧。',
        },
        {
          title: '規模大小都做得到',
          body: '單場拍攝或全季企劃都可以。預算不同，但標準不會變。',
        },
        {
          title: '為贊助商着想的規劃',
          body: '合作夥伴的露出，會寫進拍攝清單、圖像設計與賽後回顧之中。',
        },
        {
          title: '親身落場執行',
          body: '我們會在現場、在通道、在頒獎台旁邊。計劃能夠應付突發狀況，是因為有人在場即時調整。',
        },
      ],
    },
    working: {
      eyebrow: '合作方式',
      headline: '簡單直接，準時交付。',
      steps: [
        {
          title: '單一對接窗口',
          body: '一位負責人跟進到底，熟悉你的賽程、你的人與你的贊助商。',
        },
        {
          title: '開工前先講清楚範圍',
          body: '交付內容、日期與完成時間，在制定戰術階段以文字確認。',
        },
        {
          title: '配合你發佈節奏的交付',
          body: '先出精選相片與短片，其後補上完整版本。時間在開波階段已談好。',
        },
        {
          title: '整理好、你擁有的檔案',
          body: '分類清晰、命名一致，並以各平台需要的格式交付。',
        },
      ],
    },
    hongKong: {
      eyebrow: '香港',
      headline: '紮根本地足球。',
      body: '我們曾支援本地聯賽球隊及香港足球總會轄下的球會，協助他們提升曝光、強化公眾形象、拉近與球迷的距離，並為贊助商創造更多價值。',
      secondary:
        '場地、申請、開賽時間、天氣安排以至臨時改場 — 香港足球的實際操作，本身就是我們規劃的一部分。',
    },
    team: {
      eyebrow: '團隊',
      headline: '成員介紹稍後公佈。',
      body: '待 TAP IN. 提供真實姓名、職位、相片及簡介後，團隊資料會在此發佈。我們不會刊登虛構的成員介紹。',
    },
    cta: {
      headline: '一起傾你的球季或賽事。',
      body: '給我們一份簡短的構想，我們會坦白告訴你，我們是否合適的團隊。',
    },
  },

  contact: {
    meta: {
      title: '聯絡｜與 TAP IN. 展開足球項目',
      description:
        '把你的球會、球隊或足球賽事構想告訴 TAP IN.。歡迎查詢社交媒體管理、比賽攝影、影片製作、品牌設計及賽事製作。',
    },
    hero: {
      eyebrow: '聯絡',
      headline: '告訴我們，你想打造甚麼。',
      body: '無論是全季球會內容、單場比賽拍攝，還是一個完整賽事，將你的構想告訴我們，我們會協助你規劃下一步。',
    },
    direct: {
      heading: '直接聯絡',
      emailLabel: '電郵',
      instagramLabel: 'Instagram',
      whatsappLabel: 'WhatsApp',
      responseNote: '每封查詢我們都會看。如果項目已有日期，請一併告訴我們。',
      basedLabel: '據點',
      basedValue: '香港',
    },
    form: {
      heading: '項目查詢',
      required: '必填',
      optional: '選填',
      name: '姓名',
      organisation: '機構、球會或球隊',
      email: '電郵',
      phone: '電話或 WhatsApp',
      serviceInterest: '有興趣的服務',
      serviceInterestPlaceholder: '請選擇服務',
      projectType: '項目類型',
      projectTypePlaceholder: '請選擇類型',
      preferredDate: '期望項目日期',
      preferredDateHint: '大約日期已足夠。',
      budget: '預算範圍',
      budgetPlaceholder: '請選擇範圍',
      referral: '你從哪裏認識 TAP IN.？',
      referralPlaceholder: '請選擇',
      details: '項目詳情',
      detailsHint: '參與球隊、日期、場地，以及你希望大家感受到甚麼。',
      consent: '我同意 TAP IN. 使用以上資料回覆這次查詢。',
      consentLink: '私隱政策',
      honeypotLabel: '請留空此欄',
      submit: '提交查詢',
      submitting: '傳送中…',
      successTitle: '已收到你的查詢。',
      successBody: '多謝你，我們已收到資料，一般於兩個工作天內回覆。如屬緊急，歡迎直接電郵我們。',
      successAgain: '再提交一次查詢',
      errorTitle: '未能傳送。',
      errorBody: '我們這邊出了問題，查詢未有送出。你填寫的內容仍然保留，可以再試一次，或直接電郵我們。',
      validationTitle: '請檢查標示的欄位。',
      fieldError: '錯誤：',
    },
    options: {
      service: {
        'build-a-club': '打造球會',
        'build-a-game': '籌辦賽事',
        'social-media': '社交媒體管理',
        photography: '攝影',
        video: '影片製作',
        branding: '品牌設計',
        'event-production': '活動製作',
        'sponsorship-activation': '贊助推廣',
        'not-sure': '未決定',
      },
      projectType: {
        club: '球會或球隊',
        league: '聯賽或賽事主辦單位',
        corporate: '企業或公司球隊',
        school: '學校或青訓計劃',
        brand: '品牌或贊助商',
        other: '其他',
      },
      budget: {
        undisclosed: '暫不透露',
        exploring: '仍在了解',
        'single-shoot': '單次拍攝或單場比賽',
        'short-campaign': '短期企劃',
        'season-or-event': '全季或完整賽事',
      },
      referral: {
        instagram: 'Instagram',
        referral: '朋友或同行介紹',
        matchday: '在比賽或活動見過',
        search: '搜尋引擎',
        other: '其他',
      },
    },
    validation: {
      nameRequired: '請填寫你的姓名。',
      nameTooLong: '姓名請控制在 80 字元以內。',
      organisationRequired: '請填寫你代表的球會、球隊或機構。',
      organisationTooLong: '請控制在 120 字元以內。',
      emailRequired: '請填寫電郵地址。',
      emailInvalid: '這個電郵地址似乎不正確。',
      phoneTooLong: '請控制在 40 字元以內。',
      serviceRequired: '請選擇服務，方便我們安排跟進。',
      projectTypeRequired: '請選擇最接近的項目類型。',
      dateInvalid: '請使用日期選擇器，或留空此欄。',
      detailsRequired: '請簡單介紹一下你的項目。',
      detailsTooShort: '一兩句已經足夠開始。',
      detailsTooLong: '請控制在 4000 字元以內。',
      consentRequired: '請確認我們可以使用這些資料回覆你。',
      referralTooLong: '請控制在 80 字元以內。',
      serverError: '未能傳送查詢，請再試一次，或直接電郵我們。',
      rateLimited: '短時間內收到多次查詢，請稍候一分鐘再試。',
    },
  },

  privacy: {
    meta: {
      title: '私隱政策',
      description: 'TAP IN. 如何處理透過查詢表格收集的資料及基本網站分析。',
    },
    eyebrow: '私隱政策',
    headline: '私隱政策',
    updated: '最後更新',
    reviewNotice: '此為草擬版本，僅作起點之用，須經 TAP IN. 審閱及確認後才可正式發佈。',
    sections: [
      {
        title: '本頁涵蓋範圍',
        body: '本頁說明你透過本網站查詢表格提交的資料會如何處理，以及瀏覽本網站時會記錄甚麼。',
      },
      {
        title: '你提交的資料',
        body: '查詢表格會收集你的姓名、機構、電郵地址及項目詳情。電話或 WhatsApp、期望日期、預算範圍及認識我們的途徑均為選填。這些資料只會用於回覆你的查詢，以及規劃你所查詢的工作。',
      },
      {
        title: '查詢如何處理',
        body: '查詢會以電郵送到 TAP IN. 的查詢信箱，並保留於該信箱以便跟進。我們不會出售查詢資料，亦不會將其用作市場推廣用途分享予他人。',
      },
      {
        title: '網站分析',
        body: '如已啟用網站分析，只會用於了解哪些頁面被瀏覽，以及訪客從哪裏進入網站。若未設定分析編號，網站不會載入任何分析工具；本網站亦不使用廣告或跨網站追蹤 cookie。',
      },
      {
        title: '第三方服務',
        body: '電郵傳送及網站寄存由第三方服務供應商處理。連結至 Instagram 或其他外部平台後，將受該平台本身的政策規範。',
      },
      {
        title: '你的選擇',
        body: '你可以查詢我們持有你哪些資料、要求更正，或要求刪除。電郵我們，我們會處理你的要求。',
      },
      {
        title: '聯絡',
        body: '如對本頁或你的資料有任何疑問，歡迎電郵以下地址聯絡 TAP IN.。',
      },
    ],
  },

  footer: {
    blurb: '紮根香港的足球製作及顧問團隊，與球會、主辦單位及品牌合作。',
    sitemapHeading: '網站地圖',
    contactHeading: '聯絡',
    followHeading: '追蹤',
    rights: '版權所有。',
    builtLine: '香港',
  },

  notFound: {
    meta: { title: '找不到頁面', description: '無法找到此頁面。' },
    code: '404',
    headline: '越位了。',
    body: '這個頁面不存在，可能已經搬遷，或連結已經失效。',
    cta: '返回主頁',
    secondary: '瀏覽作品',
  },

  a11y: {
    breadcrumb: '導覽路徑',
    projectFilters: '項目類別',
    galleryLabel: '項目圖庫',
    currentPage: '目前頁面',
    newTab: '（於新分頁開啟）',
  },
};
