// ============================================================
// KINSHIP — Mock Data Layer
// Replace these constants with API calls when connecting a backend.
// ============================================================

export const CURRENT_USER = {
  id: "u1",
  name: "Sarah Mitchell",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
  branch: "Mitchell Branch",
  location: "Portland, OR",
  email: "sarah@mitchell.family",
};

export const FAMILY_MEMBERS = [
  // Grandparents
  { id: "g1", name: "Eleanor Mitchell", avatar: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=120&h=120&fit=crop&crop=face", branch: "Mitchell Branch", generation: "grandparents", relation: "Grandmother", location: "Savannah, GA", email: "eleanor@mitchell.family", phone: "(912) 555-0142", birthYear: 1942, isDeceased: false },
  { id: "g2", name: "Robert Mitchell Sr.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face", branch: "Mitchell Branch", generation: "grandparents", relation: "Grandfather", location: "Savannah, GA", email: "robert@mitchell.family", phone: "(912) 555-0143", birthYear: 1938, isDeceased: true, deathYear: 2019 },
  { id: "g3", name: "Margaret Chen", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face", branch: "Chen Circle", generation: "grandparents", relation: "Grandmother (maternal)", location: "San Francisco, CA", email: "margaret@chen.family", phone: "(415) 555-0198", birthYear: 1944, isDeceased: false },

  // Parents & Uncles/Aunts
  { id: "p1", name: "David Mitchell", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face", branch: "Mitchell Branch", generation: "parents", relation: "Father", location: "Portland, OR", email: "david@mitchell.family", phone: "(503) 555-0167", birthYear: 1968, isDeceased: false },
  { id: "p2", name: "Linda Chen-Mitchell", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face", branch: "Chen Circle", generation: "parents", relation: "Mother", location: "Portland, OR", email: "linda@mitchell.family", phone: "(503) 555-0168", birthYear: 1970, isDeceased: false },
  { id: "p3", name: "Thomas Mitchell", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face", branch: "Mitchell Branch", generation: "parents", relation: "Uncle", location: "Austin, TX", email: "thomas@mitchell.family", phone: "(512) 555-0134", birthYear: 1972, isDeceased: false },
  { id: "p4", name: "Rebecca Mitchell-Harris", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face", branch: "Harris Family", generation: "parents", relation: "Aunt", location: "Chicago, IL", email: "rebecca@harris.family", phone: "(312) 555-0189", birthYear: 1975, isDeceased: false },

  // Siblings & Cousins
  { id: "s1", name: "James Mitchell", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face", branch: "Mitchell Branch", generation: "siblings", relation: "Brother", location: "Seattle, WA", email: "james@mitchell.family", phone: "(206) 555-0155", birthYear: 1993, isDeceased: false },
  { id: "s2", name: "Emily Harris", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face", branch: "Harris Family", generation: "siblings", relation: "Cousin", location: "Chicago, IL", email: "emily@harris.family", phone: "(312) 555-0177", birthYear: 1997, isDeceased: false },
  { id: "s3", name: "Marcus Mitchell", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face", branch: "Mitchell Branch", generation: "siblings", relation: "Cousin", location: "Austin, TX", email: "marcus@mitchell.family", phone: "(512) 555-0122", birthYear: 1999, isDeceased: false },

  // Children
  { id: "c1", name: "Lily Mitchell", avatar: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=120&h=120&fit=crop&crop=face", branch: "Mitchell Branch", generation: "children", relation: "Daughter", location: "Portland, OR", email: null, phone: null, birthYear: 2020, isDeceased: false },
];

export const FEED_POSTS = [
  {
    id: "post1",
    authorId: "p2",
    authorName: "Linda Chen-Mitchell",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face",
    authorBranch: "Chen Circle",
    type: "milestone",
    timestamp: "2026-05-20T14:30:00Z",
    content: "Our little Lily just said her first full sentence today: \"Grandma, I love pancakes!\" 🥞💕 Eleanor couldn't stop laughing on the video call. These are the moments that make everything worth it.",
    image: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&h=500&fit=crop",
    reactions: [
      { emoji: "❤️", count: 8 },
      { emoji: "😂", count: 3 },
    ],
    comments: [
      { id: "c1", authorName: "Eleanor Mitchell", authorAvatar: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=120&h=120&fit=crop&crop=face", text: "That's my great-granddaughter! I have the video saved forever. 💛", timestamp: "2026-05-20T15:10:00Z" },
      { id: "c2", authorName: "James Mitchell", authorAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face", text: "Lily is going to be a food critic. Mark my words 😄", timestamp: "2026-05-20T16:00:00Z" },
    ],
  },
  {
    id: "post2",
    authorId: "s1",
    authorName: "James Mitchell",
    authorAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face",
    authorBranch: "Mitchell Branch",
    type: "daily",
    timestamp: "2026-05-19T09:15:00Z",
    content: "Morning run along the Puget Sound. Training for the family reunion 5K in July — who's in? Dad, I'm looking at you 👀",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=500&fit=crop",
    reactions: [
      { emoji: "💪", count: 5 },
      { emoji: "🏃", count: 4 },
    ],
    comments: [
      { id: "c3", authorName: "David Mitchell", authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face", text: "You're on! Don't get too cocky, son.", timestamp: "2026-05-19T10:30:00Z" },
    ],
  },
  {
    id: "post3",
    authorId: "p4",
    authorName: "Rebecca Mitchell-Harris",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
    authorBranch: "Harris Family",
    type: "memory",
    timestamp: "2026-05-18T20:00:00Z",
    content: "Found this while cleaning out Mom's attic — a letter Dad wrote to Mom on their wedding day in 1966. \"To my Eleanor, the bravest woman I know...\" I'm going to scan the whole thing and add it to the Heritage Vault. These words deserve to live forever.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=500&fit=crop",
    reactions: [
      { emoji: "😢", count: 6 },
      { emoji: "❤️", count: 12 },
    ],
    comments: [
      { id: "c4", authorName: "Eleanor Mitchell", authorAvatar: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=120&h=120&fit=crop&crop=face", text: "Oh Rebecca... your father had such a way with words. Thank you for keeping this alive.", timestamp: "2026-05-18T21:00:00Z" },
      { id: "c5", authorName: "Thomas Mitchell", authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face", text: "Dad would be so proud that we're preserving these. Miss him every day.", timestamp: "2026-05-18T21:45:00Z" },
    ],
  },
  {
    id: "post4",
    authorId: "s2",
    authorName: "Emily Harris",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face",
    authorBranch: "Harris Family",
    type: "milestone",
    timestamp: "2026-05-17T11:00:00Z",
    content: "I officially passed the bar exam! 🎓⚖️ First lawyer in the Harris-Mitchell family. Grandpa Robert would have loved this — he always said \"education is the family's greatest inheritance.\"",
    image: null,
    reactions: [
      { emoji: "🎉", count: 15 },
      { emoji: "❤️", count: 9 },
      { emoji: "💪", count: 7 },
    ],
    comments: [
      { id: "c6", authorName: "Rebecca Mitchell-Harris", authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face", text: "My brilliant daughter! We are all SO proud of you, Emily. 🥺❤️", timestamp: "2026-05-17T11:30:00Z" },
    ],
  },
];

export const HERITAGE_EVENTS = [
  {
    id: "h1",
    year: 2019,
    title: "Remembering Robert Mitchell Sr.",
    branch: "Mitchell Branch",
    content: "Robert passed peacefully on March 14th, 2019, surrounded by his family in Savannah. A Korean War veteran, master carpenter, and the most devoted husband and father. He built the family cabin in Blue Ridge with his own hands in 1978 — a place that still brings us all together.",
    image: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&h=400&fit=crop",
    contributors: ["Eleanor Mitchell", "David Mitchell", "Rebecca Mitchell-Harris"],
    type: "memorial",
  },
  {
    id: "h2",
    year: 2005,
    title: "The Great Mitchell Family Reunion",
    branch: "Mitchell Branch",
    content: "47 family members gathered at Blue Ridge for the first-ever official Mitchell reunion. Three generations under one roof for an entire weekend. Uncle Thomas organized the talent show — nobody has forgotten Grandpa Robert's harmonica solo.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
    contributors: ["Thomas Mitchell", "David Mitchell"],
    type: "event",
  },
  {
    id: "h3",
    year: 1978,
    title: "Building the Blue Ridge Cabin",
    branch: "Mitchell Branch",
    content: "Robert Sr. spent the entire summer of 1978 building the family cabin from reclaimed timber. Eleanor kept a detailed journal of the construction. \"Day 42: Robert says the porch is finally level. I'll believe it when my coffee mug stops sliding.\"",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=400&fit=crop",
    contributors: ["Eleanor Mitchell"],
    type: "story",
  },
  {
    id: "h4",
    year: 1966,
    title: "Robert & Eleanor's Wedding Day",
    branch: "Mitchell Branch",
    content: "Married on June 15th, 1966 at the First Presbyterian Church in Savannah. Eleanor wore her mother's lace veil. 60 years of love, laughter, and the foundation of everything our family is today.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop",
    contributors: ["Eleanor Mitchell", "Rebecca Mitchell-Harris"],
    type: "milestone",
  },
  {
    id: "h5",
    year: 1952,
    title: "The Chen Family Arrives in San Francisco",
    branch: "Chen Circle",
    content: "Wei and Mei-Lin Chen arrived at Angel Island with their daughter Margaret (then age 8). They opened the Golden Gate Bakery on Stockton Street, which became a Chinatown institution for 30 years. Margaret still makes her mother's mooncakes every autumn.",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=400&fit=crop",
    contributors: ["Margaret Chen", "Linda Chen-Mitchell"],
    type: "story",
  },
];

export const POST_TYPE_CONFIG = {
  daily: { label: "Daily Life", color: "bg-emerald-100 text-emerald-700", icon: "Sun" },
  milestone: { label: "Milestone", color: "bg-amber-100 text-amber-700", icon: "Trophy" },
  memory: { label: "Family Memory", color: "bg-violet-100 text-violet-700", icon: "BookHeart" },
};

export const HERITAGE_TYPE_CONFIG = {
  memorial: { label: "Memorial", color: "bg-slate-100 text-slate-600" },
  event: { label: "Family Event", color: "bg-sky-100 text-sky-700" },
  story: { label: "Family Story", color: "bg-amber-100 text-amber-700" },
  milestone: { label: "Milestone", color: "bg-rose-100 text-rose-700" },
};

export const BRANCHES = ["All Branches", "Mitchell Branch", "Chen Circle", "Harris Family"];