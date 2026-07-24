export const navItems = [
  { href: "/dashboard", label: "Home", icon: "Home" },
  { href: "/challenges", label: "Challenges", icon: "Sparkles" },
  { href: "/shlokas", label: "Shlokas", icon: "BookOpen" },
  { href: "/leaderboard", label: "Leaderboard", icon: "Trophy" },
  { href: "/community", label: "Community", icon: "Users" },
  { href: "/achievements", label: "Achievements", icon: "Award" },
  { href: "/invite", label: "Invite", icon: "UserPlus" },
  { href: "/profile", label: "Profile", icon: "User" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export const quotes = [
  {
    text: "Man-manā bhava mad-bhakto mad-yājī māṁ namaskuru",
    source: "Bhagavad Gita 18.65",
    meaning: "Always think of Me, become My devotee, worship Me and offer your homage unto Me.",
  },
  {
    text: "Hare Krishna means, 'O energy of the Lord, O Lord, please engage me in Your service.'",
    source: "Srila Prabhupada",
    meaning: "The mahamantra is a prayer for pure devotional service.",
  },
  {
    text: "Chanting, dancing and feasting — this is the simple process.",
    source: "Srila Prabhupada",
    meaning: "Bhakti is joyful and natural.",
  },
  {
    text: "Yogaḥ karmasu kauśalam",
    source: "Bhagavad Gita 2.50",
    meaning: "Yoga is skill in action.",
  },
  {
    text: "The supreme occupation for all humanity is that by which men can attain to loving devotional service unto the transcendent Lord.",
    source: "Srimad Bhagavatam 1.2.6",
    meaning: "Bhakti is the highest dharma.",
  },
];

/** Main challenge types offered in the hub */
export const challenges = [
  {
    id: "custom",
    title: "Custom Challenge",
    subtitle: "Create your own sadhana path with activities you choose",
    days: null as number | null,
    badge: "Divine Path",
    color: "from-amber-300 to-yellow-500",
    tasks: [] as string[],
    progress: 0,
    cta: "Create Custom",
  },
  {
    id: "shloka",
    title: "Shloka Challenge",
    subtitle: "Memorize sacred verses — book, chapter & selected shlokas",
    days: null as number | null,
    badge: "Sacred Verse",
    color: "from-pink-300 to-rose-400",
    tasks: [] as string[],
    progress: 0,
    cta: "Create Shloka Challenge",
  },
];

export const hearingCategories = [
  { id: "bg", name: "Bhagavad Gita", count: 48, color: "#1A4FA3", progress: 62 },
  { id: "sb", name: "Srimad Bhagavatam", count: 120, color: "#FFD54F", progress: 28 },
  { id: "mw", name: "Morning Walk", count: 85, color: "#6FBF73", progress: 41 },
  { id: "lec", name: "Lectures", count: 340, color: "#006D77", progress: 15 },
  { id: "kirtan", name: "Kirtans", count: 96, color: "#FFC0CB", progress: 73 },
  { id: "sem", name: "Seminars", count: 42, color: "#FFB347", progress: 20 },
];

export const tracks = [
  {
    id: 1,
    title: "BG 2.13 — Dehino 'smin",
    speaker: "HH Radhanath Swami",
    duration: "42:18",
    category: "Bhagavad Gita",
  },
  {
    id: 2,
    title: "SB 1.1.1 — Oṁ namo bhagavate",
    speaker: "HG Amogh Lila Prabhu",
    duration: "58:02",
    category: "Srimad Bhagavatam",
  },
  {
    id: 3,
    title: "Morning Walk — Juhu Beach 1975",
    speaker: "Srila Prabhupada",
    duration: "24:45",
    category: "Morning Walk",
  },
  {
    id: 4,
    title: "Nitai Gauranga Kirtan",
    speaker: "Mayapur Kirtan Mela",
    duration: "18:30",
    category: "Kirtans",
  },
  {
    id: 5,
    title: "The Art of Chanting",
    speaker: "HG Vaisesika Prabhu",
    duration: "1:12:00",
    category: "Lectures",
  },
  {
    id: 6,
    title: "Bhakti Yoga Seminar — Day 1",
    speaker: "HH Bhakti Charu Swami",
    duration: "1:05:22",
    category: "Seminars",
  },
];

export const shlokas = [
  {
    id: 1,
    chapter: "BG 2.47",
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    transliteration:
      "karmaṇy-evādhikāras te mā phaleṣu kadācana\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
    translation:
      "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.",
    meaning:
      "Krishna teaches Arjuna to act without attachment to results — pure service without selfish motive.",
    completed: false,
    favorite: false,
  },
  {
    id: 2,
    chapter: "BG 9.26",
    sanskrit:
      "पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति।\nतदहं भक्त्युपहृतमश्नामि प्रयतात्मनः॥",
    transliteration:
      "patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati\ntad ahaṁ bhakty-upahṛtam aśnāmi prayatātmanaḥ",
    translation:
      "If one offers Me with love and devotion a leaf, a flower, fruit or water, I will accept it.",
    meaning: "The Lord accepts even the simplest offering when given with pure devotion.",
    completed: false,
    favorite: false,
  },
  {
    id: 3,
    chapter: "BG 18.66",
    sanskrit:
      "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
    transliteration:
      "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ",
    translation:
      "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
    meaning: "The ultimate instruction — complete surrender to Krishna.",
    completed: false,
    favorite: false,
  },
  {
    id: 4,
    chapter: "SB 1.2.6",
    sanskrit:
      "स वै पुंसां परो धर्मो यतो भक्तिरधोक्षजे।\nअहैतुक्यप्रतिहता ययात्मा सुप्रसीदति॥",
    transliteration:
      "sa vai puṁsāṁ paro dharmo yato bhaktir adhokṣaje\nahaituky apratihatā yayātmā suprasīdati",
    translation:
      "The supreme occupation for all humanity is that by which men can attain to loving devotional service unto the transcendent Lord.",
    meaning: "Unmotivated, uninterrupted bhakti brings the soul complete satisfaction.",
    completed: false,
    favorite: false,
  },
];

export const books = [
  { id: "bg", title: "Bhagavad Gita As It Is", progress: 0, chapters: 18, color: "#1A4FA3" },
  { id: "sb", title: "Srimad Bhagavatam", progress: 0, chapters: 12, color: "#FFD54F" },
  { id: "nod", title: "Nectar of Devotion", progress: 0, chapters: 51, color: "#FFC0CB" },
  { id: "tlc", title: "Teachings of Lord Chaitanya", progress: 0, chapters: 32, color: "#6FBF73" },
  { id: "cc", title: "Sri Caitanya-caritamrta", progress: 0, chapters: 62, color: "#006D77" },
];

export const achievements = [
  { id: 1, name: "108 Rounds", icon: "🕉️", rarity: "epic", unlocked: false, desc: "Completed 108 rounds in a day" },
  { id: 2, name: "Golden Flute", icon: "🎶", rarity: "legendary", unlocked: false, desc: "30-day japa streak" },
  { id: 3, name: "30 Days Reading", icon: "📖", rarity: "rare", unlocked: false, desc: "Read for 30 consecutive days" },
  { id: 4, name: "Sacred Book", icon: "📿", rarity: "rare", unlocked: false, desc: "Complete Bhagavad Gita" },
  { id: 5, name: "100 Hours Hearing", icon: "🎧", rarity: "epic", unlocked: false, desc: "100 hours of lectures" },
  { id: 6, name: "Conch Shell", icon: "🐚", rarity: "common", unlocked: false, desc: "First challenge completed" },
  { id: 7, name: "100 Shlokas", icon: "📜", rarity: "epic", unlocked: false, desc: "Memorize 100 shlokas" },
  { id: 8, name: "Lotus Crown", icon: "👑", rarity: "legendary", unlocked: false, desc: "Lead a team to victory" },
  { id: 9, name: "365 Day Streak", icon: "🔥", rarity: "legendary", unlocked: false, desc: "One full year of sadhana" },
  { id: 10, name: "Vaikuntha Medal", icon: "✨", rarity: "mythic", unlocked: false, desc: "Lifetime mastery award" },
];

/** Fresh user — only you at 0 points */
export const leaderboard = [
  { rank: 1, name: "Harsha (You)", temple: "ISKCON Bangalore", points: 0, avatar: "🙏", isYou: true },
];

/** Community feed starts empty — posts are user-created in the UI. */
export const communityPosts: {
  id: number;
  author: string;
  avatar: string;
  time: string;
  type: string;
  content: string;
  reactions: { haribol: number; jaiPrabhupada: number };
  comments: number;
}[] = [];

export const temples = [
  { name: "ISKCON Bangalore", city: "Bangalore", country: "India", distance: "2.4 km", programs: "Mangala Arati 4:30 AM · Sunday Feast 12:30 PM" },
  { name: "ISKCON Mayapur", city: "Mayapur", country: "India", distance: "1,820 km", programs: "Full morning program · TOVP tours" },
  { name: "ISKCON Vrindavan", city: "Vrindavan", country: "India", distance: "1,640 km", programs: "Krishna Balaram Mandir · Parikrama" },
  { name: "ISKCON Mumbai (Juhu)", city: "Mumbai", country: "India", distance: "840 km", programs: "Sunday Feast · Book distribution" },
];

export const teams = [
  { name: "Team Radha", members: 0, points: 0, emoji: "🌸" },
  { name: "Team Govinda", members: 0, points: 0, emoji: "🐄" },
  { name: "Team Gauranga", members: 0, points: 0, emoji: "💛" },
  { name: "Team Vrindavan", members: 0, points: 0, emoji: "🌳" },
  { name: "Team Jagannath", members: 0, points: 0, emoji: "🛕" },
  { name: "Team Mayapur", members: 0, points: 0, emoji: "✨" },
];

export const activityHubs = [
  { name: "Chanting", icon: "🕉️", href: "/challenges", color: "bg-white text-krishna" },
  { name: "Reading", icon: "📖", href: "/reading", color: "bg-white text-krishna" },
  { name: "Shlokas", icon: "📜", href: "/shlokas", color: "bg-white text-krishna" },
  { name: "Service", icon: "🙏", href: "/community", color: "bg-white text-krishna" },
  { name: "Meditation", icon: "🧘", href: "/challenges", color: "bg-white text-krishna" },
  { name: "Prayers", icon: "🪔", href: "/challenges", color: "bg-white text-krishna" },
];

export const countries = [
  "India",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "Russia",
  "Brazil",
  "Other",
];

export const favoriteBooks = [
  "Bhagavad Gita",
  "Srimad Bhagavatam",
  "Nectar of Devotion",
  "Sri Caitanya-caritamrta",
];
