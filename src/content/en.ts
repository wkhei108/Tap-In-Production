/**
 * English copy for the whole site.
 *
 * This object is the *shape* contract: `src/content/zh-hk.ts` is typed
 * against `typeof en`, so a missing or renamed key in either language is a
 * compile error rather than a silently untranslated string.
 *
 * Structural data (services, capabilities, process steps, projects) lives in
 * `services.ts` and `projects.ts` and carries both languages inline, so the
 * two locales can never drift out of order.
 */
export const en = {
  nav: {
    work: 'Work',
    buildAClub: 'Build a Club',
    buildAGame: 'Build a Game',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy',
    home: 'Home',
    startProject: 'Start a Project',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menuTitle: 'Menu',
    skipToContent: 'Skip to content',
    languageLabel: 'Language',
    brandHome: 'TAP IN. — go to homepage',
    primaryLabel: 'Primary',
    footerLabel: 'Footer',
  },

  common: {
    startProject: 'Start a Project',
    viewWork: 'View Our Work',
    viewAllWork: 'View all work',
    emailUs: 'Email TAP IN.',
    followPrefix: 'Follow',
    enquire: 'Send an enquiry',
    explore: 'Explore',
    caseStudy: 'View case study',
    backToWork: 'Back to all work',
    relatedWork: 'Related work',
    servicesDelivered: 'Services delivered',
    deliverables: 'Deliverables',
    challenge: 'The challenge',
    approach: 'The TAP IN. approach',
    brief: 'Project brief',
    outcomes: 'Outcomes',
    gallery: 'Gallery',
    client: 'Client',
    year: 'Year',
    category: 'Category',
    credits: 'Credits',
    sampleBadge: 'Sample entry',
    sampleNote:
      'Sample entry — replace with a confirmed TAP IN. project in src/content/projects.ts.',
    mediaPending: 'Media pending',
    mediaPendingNote: 'Supplied media not yet added',
    openLightbox: 'Open larger view',
    closeLightbox: 'Close gallery',
    previousImage: 'Previous item',
    nextImage: 'Next item',
    lightboxPosition: 'Item {current} of {total}',
    playVideo: 'Play video',
    pauseVideo: 'Pause video',
    videoNoSupport: 'Your browser cannot play this video.',
    transcript: 'Transcript',
    externalLink: 'Opens in a new tab',
  },

  home: {
    meta: {
      title: 'TAP IN. | Hong Kong Football Production, Content & Events',
      description:
        'TAP IN. is a Hong Kong football production and consultancy team providing social media management, match photography, video production, branding, and complete football event execution.',
    },
    hero: {
      eyebrow: 'Hong Kong Football Production & Consultancy',
      headlineLineOne: 'Build the club.',
      headlineLineTwo: 'Build the game.',
      body: 'From matchday media and season-long social content to full-scale tournament production, TAP IN. turns football moments into identity, community, exposure, and commercial value.',
      primaryCta: 'Start a Project',
      secondaryCta: 'View Our Work',
      scrollHint: 'Scroll',
      mediaLabel: 'TAP IN. showreel — silent background footage',
    },
    ticker: [
      'Social Media',
      'Photography',
      'Video',
      'Branding',
      'Events',
      'Sponsorship Activation',
    ],
    intro: {
      eyebrow: 'Our view',
      headline: 'Football is more than 90 minutes.',
      body: 'Every step-over, tackle, setback, celebration, walk-in, trophy and supporter reaction contributes to the story. TAP IN. captures those moments and builds the creative system around them.',
      secondary:
        'We work the way football works — planned in advance, delivered under pressure, reviewed after the whistle.',
      captionPrimary: 'Matchday capture · Hong Kong',
      captionSecondary: 'Post-match edit · same-night turnaround',
    },
    pillars: {
      eyebrow: 'Two ways to work with us',
      headline: 'Two programmes. One standard.',
      body: 'Whether you are running a club through a full season or staging a single tournament, the process, the crew and the level of finish stay the same.',
      club: {
        name: 'BUILD-A-CLUB',
        meta: 'For clubs, teams & academies',
        tagline:
          'Build identity, content, community, and sponsor value around a football club or team.',
        services: [
          'Social media management',
          'Match photography',
          'Video production',
          'Brand and campaign design',
          'Player photoshoots',
          'Merchandise',
          'Fan engagement',
          'Sponsorship content',
        ],
        cta: 'Explore Build a Club',
      },
      game: {
        name: 'BUILD-A-GAME',
        meta: 'For organisers, corporates & brands',
        tagline:
          'Turn a football event into a professionally planned, promoted, and memorable experience.',
        services: [
          'Competition planning',
          'Marketing and promotion',
          'Sponsorship partnerships',
          'Awards and merchandise',
          'Venue and logistics',
          'Matchday production',
          'Fan experiences',
          'Event content',
        ],
        cta: 'Explore Build a Game',
      },
    },
    featured: {
      eyebrow: 'Selected work',
      headline: 'From the first whistle to the final post.',
      body: 'A look at how a club season, a cup competition and a matchday campaign come together.',
      cta: 'View all work',
    },
    capabilities: {
      eyebrow: 'Capabilities',
      headline: 'What we actually do.',
      body: 'Four disciplines, one team. Most projects use a combination rather than a single service.',
    },
    process: {
      eyebrow: 'Process',
      headline: 'The game plan.',
      body: 'Five phases, from the first conversation to the review that shapes the next one.',
    },
    commercial: {
      eyebrow: 'Commercial value',
      headline: 'From exposure to commercial value',
      body: 'Consistent storytelling helps a club look credible, gives supporters more reasons to engage, and provides sponsors with better visibility and stronger activation opportunities.',
      points: [
        {
          title: 'A public image that holds up',
          body: 'One visual language across matchday graphics, social posts, kit launches and presentations.',
        },
        {
          title: 'Reasons for supporters to stay close',
          body: 'Content that follows the season rather than appearing only when results are good.',
        },
        {
          title: 'Assets a sponsor can use',
          body: 'Branded touchpoints, activation visuals and recap material packaged for a partner conversation.',
        },
      ],
      disclaimer:
        'We do not promise sponsorship revenue or audience numbers. We build the material and the consistency that make those conversations easier to have.',
    },
    clients: {
      eyebrow: 'Clubs & collaborators',
      headline: 'Who we work with',
      body: 'Logos appear here once written approval and vector files are supplied. Until then this section stays off.',
    },
    social: {
      eyebrow: 'Instagram',
      headline: 'From the touchline',
      body: 'A curated selection of recent frames. The full feed lives on Instagram.',
      cta: 'Follow',
    },
    finalCta: {
      headline: 'Let’s build your next season, campaign, or event.',
      body: 'Tell us about the team, the date, and the ambition. We will help shape the game plan.',
      primaryCta: 'Start a Project',
      secondaryCta: 'Email TAP IN.',
    },
  },

  club: {
    meta: {
      title: 'Build a Club | Football content, branding & season production',
      description:
        'BUILD-A-CLUB by TAP IN. — social media management, match photography, video production, brand identity, player shoots, merchandise and sponsorship content for Hong Kong football clubs and teams.',
    },
    hero: {
      eyebrow: 'BUILD-A-CLUB',
      headline: 'Build a club people want to follow.',
      body: 'Modern football is more than 90 minutes. It is identity, connection, and legacy. TAP IN. captures the moments that shape a club and turns them into a consistent brand and content system — on and off the pitch.',
      primaryCta: 'Start a Project',
      secondaryCta: 'See club work',
    },
    intro: {
      eyebrow: 'Why it matters',
      headline: 'A club is remembered for how it shows up.',
      body: 'Results change week to week. The way a club presents itself is the part you control — the crest, the tone, the photography, the way a signing is announced, the way supporters are spoken to.',
      pillars: [
        { label: 'Capture the Magic', note: 'Matchday, training, travel, celebration.' },
        { label: 'Define Your Identity', note: 'A visual system that works everywhere.' },
        { label: 'Photoshoots', note: 'Portraits, team sets, media day.' },
        { label: 'Merchandise Design', note: 'Products supporters actually wear.' },
        { label: 'Connect Deeply', note: 'Content that includes the people watching.' },
        { label: 'Ignite Engagement', note: 'Campaigns built to be joined in.' },
      ],
    },
    services: {
      eyebrow: 'What’s inside',
      headline: 'Seven services, one system.',
      body: 'Take the full programme across a season, or a single service for a specific push.',
    },
    workflow: {
      eyebrow: 'Season workflow',
      headline: 'A season, start to finish.',
      body: 'A sample operating rhythm for a club on a full-season programme. Scope and cadence are set with you at kick-off.',
    },
    calendar: {
      eyebrow: 'Content calendar',
      headline: 'A matchweek, planned.',
      body: 'An illustrative matchweek. Real calendars are built around your fixture list, training schedule and sponsor commitments.',
      note: 'Illustrative example — not a fixed package.',
    },
    gallery: {
      eyebrow: 'Club work',
      headline: 'Selected club projects',
    },
    cta: {
      headline: 'Ready to build the club?',
      body: 'Send us the season ahead — fixtures, ambitions, sponsors, and what you want supporters to feel.',
    },
  },

  game: {
    meta: {
      title: 'Build a Game | Football tournament & event production in Hong Kong',
      description:
        'BUILD-A-GAME by TAP IN. — competition planning, venue and logistics, event identity, marketing, sponsorship packages, awards, merchandise and full matchday execution for football events in Hong Kong.',
    },
    hero: {
      eyebrow: 'BUILD-A-GAME',
      headline: 'Turn a fixture into an experience.',
      body: 'Football is more than the contest on the pitch. The walk-ins, presentation, souvenirs, supporter reactions, awards, and shared celebrations are what make an event memorable. TAP IN. turns a tournament idea into a professionally planned and buzzworthy football experience.',
      primaryCta: 'Start a Project',
      secondaryCta: 'See event work',
    },
    intro: {
      eyebrow: 'Why it matters',
      headline: 'The match is the centre. It isn’t the whole thing.',
      body: 'Players remember the walk-in, the trophy, the photo they were sent afterwards. Sponsors remember whether their brand was visible and whether they were given anything to post. Both are planned, not lucky.',
      pillars: [
        { label: 'Event Planning', note: 'Format, regulations, timetable.' },
        { label: 'Marketing & Promotion', note: 'Launch, countdown, coverage.' },
        { label: 'Sponsorship Partnerships', note: 'Packages and touchpoints.' },
        { label: 'Custom Awards & Merchandise', note: 'Trophies, medals, kit, gifts.' },
        { label: 'Full Event Execution', note: 'Crew, coordination, contingency.' },
        { label: 'Immersive Experiences', note: 'Photo areas, challenges, fan zones.' },
      ],
    },
    services: {
      eyebrow: 'What’s inside',
      headline: 'Eight workstreams, one operation.',
      body: 'Run the full event with us, or bring us in for the parts your team does not cover.',
    },
    journey: {
      eyebrow: 'Event journey',
      headline: 'From idea to final whistle.',
      body: 'A typical run of play for a tournament. Timings flex with the size of the competition and the venue calendar.',
    },
    deliverablesBoard: {
      eyebrow: 'Deliverables board',
      headline: 'What lands on the day.',
      body: 'A sample deliverables board for an invitational cup. Every event is scoped individually.',
      note: 'Illustrative example — not a fixed package.',
    },
    gallery: {
      eyebrow: 'Event work',
      headline: 'Selected event projects',
    },
    cta: {
      headline: 'Ready to build the game?',
      body: 'Send us the format, the date and the number of teams. We will come back with a plan and a realistic scope.',
    },
  },

  work: {
    meta: {
      title: 'Work | Football content, photography, video & event production',
      description:
        'Selected football work by TAP IN. — club season campaigns, match photography, video production, branding and tournament production in Hong Kong.',
    },
    eyebrow: 'Work',
    headline: 'Every club has a story. Every game deserves a stage.',
    body: 'Club programmes, matchday media and event production. Filter by what you need.',
    filtersLabel: 'Filter work by category',
    filters: {
      all: 'All',
      club: 'Club',
      game: 'Game',
      social: 'Social Media',
      photography: 'Photography',
      video: 'Video',
      branding: 'Branding',
      events: 'Event Production',
    },
    count: '{count} projects',
    countOne: '1 project',
    empty: 'No projects in this category yet.',
    emptyHint: 'Try another filter, or send us a brief and we will talk it through.',
  },

  project: {
    metaSuffix: 'Case study',
    notFoundTitle: 'Project not found',
    heroLabel: 'Case study',
    briefLabel: 'Project brief',
    noOutcomesNote: 'Verified results for this project have not been published.',
  },

  about: {
    meta: {
      title: 'About | Hong Kong football production & consultancy team',
      description:
        'TAP IN. is a Hong Kong football production and consultancy team combining football understanding, visual storytelling, production and event execution.',
    },
    hero: {
      eyebrow: 'About',
      headline: 'Football people. Creative thinkers. Reliable operators.',
      body: 'TAP IN. is a Hong Kong football production and consultancy team built around a simple belief: every club and every game deserves to be presented with purpose. We combine football understanding, visual storytelling, production, and event execution to help teams and organisers create work that supporters remember and partners value.',
    },
    pov: {
      eyebrow: 'Point of view',
      headline: 'Presentation is part of the sport.',
      body: 'Hong Kong football is full of teams doing serious work with limited resources. What is often missing is not effort or talent — it is a consistent way of showing it. That is the gap we work in.',
      secondary:
        'We would rather build something a club can keep using than deliver a folder of files that nobody opens twice.',
    },
    whyFootball: {
      eyebrow: 'Why football-specific',
      headline: 'A general crew misses the moment.',
      body: 'Knowing where the second ball is going, when the substitution is coming, which celebration the supporters will want, and which frame a sponsor needs — that is football knowledge, not camera knowledge. It is the difference between covering a match and telling its story.',
      points: [
        'We read the game, so the camera is already pointed the right way.',
        'We know what a club needs published tonight and what can wait until Tuesday.',
        'We plan sponsor visibility before kick-off, not in the edit.',
      ],
    },
    difference: {
      eyebrow: 'How we’re different',
      headline: 'What you get with TAP IN.',
      items: [
        {
          title: 'Football-first understanding',
          body: 'We follow the local game. Fixtures, formats and matchday realities are the starting point, not an afterthought.',
        },
        {
          title: 'Content and operations under one team',
          body: 'The people planning the event are the people capturing it. Fewer briefings, fewer gaps.',
        },
        {
          title: 'Bilingual Hong Kong communication',
          body: 'English and Traditional Chinese written properly for a Hong Kong audience — not translated at the last minute.',
        },
        {
          title: 'Social-first production',
          body: 'Shot and framed for where it will actually be seen, vertical and horizontal, from the start.',
        },
        {
          title: 'Flexible for clubs of any size',
          body: 'A single matchday shoot or a full season programme. The standard does not change with the budget.',
        },
        {
          title: 'Sponsor-conscious planning',
          body: 'Partner visibility is built into the shot list, the graphics and the recap.',
        },
        {
          title: 'Hands-on matchday execution',
          body: 'We are on site, in the tunnel, at the trophy table. Plans survive contact with the day because someone is there to adjust them.',
        },
      ],
    },
    working: {
      eyebrow: 'How we work',
      headline: 'Straightforward, and on time.',
      steps: [
        {
          title: 'One point of contact',
          body: 'A named lead who knows your fixtures, your people and your sponsors.',
        },
        {
          title: 'Agreed scope before we start',
          body: 'Deliverables, dates and turnaround times in writing at the game-plan stage.',
        },
        {
          title: 'Turnaround you can publish around',
          body: 'Selects and short-form first, full sets after. Agreed at kick-off, not improvised.',
        },
        {
          title: 'Files you own and can find',
          body: 'Organised, named, and delivered in the formats your channels need.',
        },
      ],
    },
    hongKong: {
      eyebrow: 'Hong Kong',
      headline: 'Rooted in the local game.',
      body: 'We have supported local league teams and football clubs competing under the Hong Kong Football Association, helping them improve exposure, strengthen their public image, connect with supporters, and create more value for sponsors.',
      secondary:
        'Pitches, permits, kick-off times, weather calls and last-minute venue changes — the practical side of Hong Kong football is part of what we plan around.',
    },
    team: {
      eyebrow: 'The team',
      headline: 'Names and biographies to follow.',
      body: 'Team profiles will be published here once TAP IN. supplies real names, roles, portraits and biographies. We do not publish invented profiles.',
    },
    cta: {
      headline: 'Let’s talk about your season or your event.',
      body: 'Send a short brief and we will tell you honestly whether we are the right team for it.',
    },
  },

  contact: {
    meta: {
      title: 'Contact | Start a football project with TAP IN.',
      description:
        'Tell TAP IN. about your club, team or football event. Social media management, match photography, video production, branding and event production enquiries.',
    },
    hero: {
      eyebrow: 'Contact',
      headline: 'Tell us what you’re building.',
      body: 'Whether it is a season-long club programme, a one-off matchday shoot, or a complete tournament, send us the brief and we will help shape the next move.',
    },
    direct: {
      heading: 'Direct',
      emailLabel: 'Email',
      instagramLabel: 'Instagram',
      whatsappLabel: 'WhatsApp',
      responseNote: 'We read every enquiry. Please include a date if your project has one.',
      basedLabel: 'Based in',
      basedValue: 'Hong Kong',
    },
    form: {
      heading: 'Project enquiry',
      required: 'Required',
      optional: 'Optional',
      name: 'Name',
      organisation: 'Organisation, club or team',
      email: 'Email',
      phone: 'Phone or WhatsApp',
      serviceInterest: 'Service interest',
      serviceInterestPlaceholder: 'Select a service',
      projectType: 'Project type',
      projectTypePlaceholder: 'Select a project type',
      preferredDate: 'Preferred project date',
      preferredDateHint: 'Approximate is fine.',
      budget: 'Estimated budget',
      budgetPlaceholder: 'Select a range',
      referral: 'How did you hear about TAP IN.?',
      referralPlaceholder: 'Select an option',
      details: 'Project details',
      detailsHint: 'Teams involved, dates, venue, what you want people to feel.',
      consent:
        'I agree that TAP IN. may use the details above to respond to this enquiry.',
      consentLink: 'Privacy',
      honeypotLabel: 'Leave this field empty',
      submit: 'Send enquiry',
      submitting: 'Sending…',
      successTitle: 'Enquiry received.',
      successBody:
        'Thanks — we have your brief. We usually reply within two working days. If it is urgent, email us directly.',
      successAgain: 'Send another enquiry',
      errorTitle: 'That didn’t send.',
      errorBody:
        'Something went wrong on our side and your enquiry was not delivered. Your answers are still here — try again, or email us directly.',
      validationTitle: 'Please check the highlighted fields.',
      fieldError: 'Error:',
    },
    options: {
      service: {
        'build-a-club': 'Build a Club',
        'build-a-game': 'Build a Game',
        'social-media': 'Social Media Management',
        photography: 'Photography',
        video: 'Video Production',
        branding: 'Branding',
        'event-production': 'Event Production',
        'sponsorship-activation': 'Sponsorship Activation',
        'not-sure': 'Not Sure Yet',
      },
      projectType: {
        club: 'Club or team',
        league: 'League or tournament organiser',
        corporate: 'Corporate or company team',
        school: 'School or youth programme',
        brand: 'Brand or sponsor',
        other: 'Something else',
      },
      budget: {
        undisclosed: 'Prefer not to say',
        exploring: 'Still exploring',
        'single-shoot': 'Single shoot or matchday',
        'short-campaign': 'Short campaign',
        'season-or-event': 'Full season or full event',
      },
      referral: {
        instagram: 'Instagram',
        referral: 'Referral or word of mouth',
        matchday: 'Saw you at a match or event',
        search: 'Search',
        other: 'Other',
      },
    },
    validation: {
      nameRequired: 'Please tell us your name.',
      nameTooLong: 'Please keep your name under 80 characters.',
      organisationRequired: 'Please tell us which club, team or organisation you represent.',
      organisationTooLong: 'Please keep this under 120 characters.',
      emailRequired: 'Please enter an email address.',
      emailInvalid: 'That email address doesn’t look right.',
      phoneTooLong: 'Please keep this under 40 characters.',
      serviceRequired: 'Please choose a service so we can route your enquiry.',
      projectTypeRequired: 'Please choose the closest project type.',
      dateInvalid: 'Please use the date picker or leave this blank.',
      detailsRequired: 'Please tell us a little about the project.',
      detailsTooShort: 'A sentence or two is enough to get started.',
      detailsTooLong: 'Please keep this under 4000 characters.',
      consentRequired: 'Please confirm we can use these details to reply.',
      referralTooLong: 'Please keep this under 80 characters.',
      serverError: 'We could not send your enquiry. Please try again or email us directly.',
      rateLimited: 'That’s a few enquiries in a short time. Please try again in a minute.',
    },
  },

  privacy: {
    meta: {
      title: 'Privacy',
      description:
        'How TAP IN. handles information submitted through the enquiry form and basic website analytics.',
    },
    eyebrow: 'Privacy',
    headline: 'Privacy',
    updated: 'Last updated',
    reviewNotice:
      'Draft for review. This wording has been prepared as a starting point and must be reviewed and approved by TAP IN. before launch.',
    sections: [
      {
        title: 'What this page covers',
        body: 'This page explains what happens to the information you send through the enquiry form on this website, and what is measured when you visit.',
      },
      {
        title: 'Information you send us',
        body: 'The enquiry form asks for your name, organisation, email address, and details about your project. Phone or WhatsApp, preferred date, budget range and how you heard about us are optional. We use these details only to respond to your enquiry and to plan the work you are asking about.',
      },
      {
        title: 'How enquiries are handled',
        body: 'Enquiries are delivered to the TAP IN. enquiry inbox by email. They are kept in that inbox so we can follow up on the conversation. We do not sell enquiry information or share it for marketing.',
      },
      {
        title: 'Analytics',
        body: 'If website analytics are enabled, they are used only to understand which pages are visited and how people arrive at the site. No analytics tool is loaded when no analytics ID is configured, and this site does not use advertising or cross-site tracking cookies.',
      },
      {
        title: 'Third parties',
        body: 'Email delivery and website hosting are handled by third-party providers. Links to Instagram and other external platforms are governed by those platforms’ own policies.',
      },
      {
        title: 'Your choices',
        body: 'You can ask us what enquiry information we hold about you, ask for it to be corrected, or ask us to delete it. Email us and we will action the request.',
      },
      {
        title: 'Contact',
        body: 'For any question about this page or your information, email TAP IN. at the address below.',
      },
    ],
  },

  footer: {
    blurb:
      'A Hong Kong football production and consultancy team working with clubs, organisers and brands.',
    sitemapHeading: 'Site',
    contactHeading: 'Contact',
    followHeading: 'Follow',
    rights: 'All rights reserved.',
    builtLine: 'Hong Kong',
  },

  notFound: {
    meta: { title: 'Page not found', description: 'This page could not be found.' },
    code: '404',
    headline: 'Out of play.',
    body: 'That page isn’t here. It may have moved, or the link may be out of date.',
    cta: 'Back to homepage',
    secondary: 'View our work',
  },

  a11y: {
    breadcrumb: 'Breadcrumb',
    projectFilters: 'Project categories',
    galleryLabel: 'Project gallery',
    currentPage: 'Current page',
    newTab: '(opens in a new tab)',
  },
};

/**
 * The contract every other locale must satisfy.
 *
 * Deliberately *not* `as const`: values widen to `string`, so another locale
 * has to supply the same keys and the same shape, but obviously not the same
 * text. Add a key here and `zh-hk.ts` stops compiling until it is translated.
 */
export type Dictionary = typeof en;
