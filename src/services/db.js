// Data and storage layer for SpillATea — Daily Confession Board
// Supports Supabase with graceful, fully functioning local persistence for local preview and offline testing.

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { validateAndModeratePost, moderateText } from './moderation';
import { api } from './api';
import { firestoreService } from './firestore';
import { isFirebaseConfigured } from '../lib/firebase';

export async function checkBackendStatus() {
  if (isFirebaseConfigured) {
    return {
      isAvailable: true,
      service: 'Firebase Cloud Firestore',
      database: 'connected',
      databaseName: 'spillatea (Firestore)',
      isDbConnected: true
    };
  }
  return api.checkHealth();
}

const STORAGE_KEY_CONFESSIONS = 'spillatea_confessions_v11';
const STORAGE_KEY_COMMENTS = 'spillatea_comments_v6';
const STORAGE_KEY_REPORTS = 'spillatea_reports_v2';
const STORAGE_KEY_USER = 'spillatea_current_user_v1';
const STORAGE_KEY_LIKES = 'spillatea_user_likes_v1';
const STORAGE_KEY_SAVED = 'spillatea_saved_confessions_v2';
const STORAGE_KEY_MAYBE_ME = 'spillatea_user_maybe_me_v1';
const STORAGE_KEY_READ_POSTS = 'spillatea_read_confessions_v1';
const STORAGE_KEY_AUDIT = 'spillatea_audit_logs_v1';
const STORAGE_KEY_MY_POSTS = 'spillatea_my_created_post_ids_v1';

export function getMyCreatedPostIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MY_POSTS);
    return raw ? JSON.parse(raw) : ['confession-041'];
  } catch (e) {
    return ['confession-041'];
  }
}

export function saveMyCreatedPostIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_MY_POSTS, JSON.stringify(ids));
  } catch (e) {}
}

export function formatConfessionNumber(num) {
  if (num < 10) return `No. 00${num}`;
  if (num < 100) return `No. 0${num}`;
  return `No. ${num}`;
}

// Full Week Confessions Dataset (Friday 16 Oct through Monday 12 Oct) - Pure Text-Only Anonymous Board
const INITIAL_CONFESSIONS = [
  // ================= FRIDAY, 16 OCTOBER 2026 =================
  {
    id: 'confession-201',
    confession_number: 'No. 001',
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: '9:42 PM',
    exact_time: 'Friday, Oct 16, 2026 at 9:42 PM EDT',
    to_target: 'To: the guy in the blue hoodie, Organic Chem, Tuesday',
    category: 'Crushes',
    body: "You always sit in the 4th row left aisle and tap your pencil to whatever is playing in your headphones. You asked to borrow my periodic table two weeks ago and I haven't stopped thinking about it since.",
    image_url: null,
    likes: 38,
    is_liked: true,
    is_saved: false,
    comment_count: 2,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-sam-9021',
    real_author_name: 'Sam Alvarez',
    real_author_email: 's.alvarez@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: 'confession-202',
    confession_number: 'No. 002',
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: '8:15 PM',
    exact_time: 'Friday, Oct 16, 2026 at 8:15 PM EDT',
    to_target: null,
    category: 'Confessions',
    body: 'I still look for you on the 9:15 bus.',
    image_url: null,
    likes: 94,
    is_liked: false,
    is_saved: false,
    comment_count: 1,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-maya-8290',
    real_author_name: 'Maya Lin',
    real_author_email: 'maya.lin@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString()
  },
  {
    id: 'confession-204',
    confession_number: 'No. 003',
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: '6:20 PM',
    exact_time: 'Friday, Oct 16, 2026 at 6:20 PM EDT',
    to_target: 'To: whoever left their sketchbook in Tisch library 3rd floor',
    category: 'Lost & Found',
    body: 'There are pages of graphite portraits of students studying in the corner cubicles. I handed it to the front desk attendant so you can reclaim it, but honestly your art is breathtaking.',
    image_url: null,
    likes: 45,
    is_liked: false,
    is_saved: true,
    comment_count: 0,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-chloe-3109',
    real_author_name: 'Chloe Tremblay',
    real_author_email: 'chloe.tremblay@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString()
  },
  {
    id: 'confession-205',
    confession_number: 'No. 004',
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: '5:48 PM',
    exact_time: 'Friday, Oct 16, 2026 at 5:48 PM EDT',
    to_target: null,
    category: 'Late Night',
    body: 'Eating alone in the campus dining hall used to terrify me freshman year. Now it is my favorite twenty minutes of the day. Headphones on, watching the rain hit the glass ceiling, enjoying cereal at 5:00 PM without needing to perform for anybody.',
    image_url: null,
    likes: 81,
    is_liked: false,
    is_saved: false,
    comment_count: 0,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'user-current-session',
    real_author_name: 'Jordan Brooks',
    real_author_email: 'student@college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 260).toISOString()
  },
  {
    id: 'confession-206',
    confession_number: 'No. 005',
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: '4:30 PM',
    exact_time: 'Friday, Oct 16, 2026 at 4:30 PM EDT',
    to_target: 'To: my teammates in Senior Capstone, Group 7',
    category: 'Academics',
    body: `I know I seemed distant and disconnected during our standup yesterday morning. When you asked why the staging server was not deployed yet, I said I had bad wifi, but the truth is I was up until 4:00 AM at the hospital with my younger brother who had an emergency appendectomy.

I really did not want to bring personal baggage into our group work or make anyone feel burdened with my tasks, so I tried to brute-force the entire API integration on zero sleep from my phone's cellular hotspot in the waiting room chairs.

When Jordan sent me a quiet Slack message at 6:30 AM saying "hey, saw your PR, go get some sleep, I handled the demo slides," I genuinely broke down in tears in the hallway. You three are the kindest team I could have ever asked for in four years here, and I promise our presentation on Friday will be flawless.`,
    image_url: null,
    likes: 126,
    is_liked: false,
    is_saved: false,
    comment_count: 1,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-devon-1845',
    real_author_name: 'Devon Patel',
    real_author_email: 'devon.patel@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 330).toISOString()
  },
  {
    id: 'confession-207',
    confession_number: 'No. 006',
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: '3:10 PM',
    exact_time: 'Friday, Oct 16, 2026 at 3:10 PM EDT',
    to_target: 'To: the barista at the campus coffee cart near engineering',
    category: 'Crushes',
    body: 'You remember my oat milk cortado order even on Monday mornings when the queue reaches the hallway. That quiet little smile you give when passing the cup across the counter gets me through three consecutive hours of fluid mechanics.',
    image_url: null,
    likes: 53,
    is_liked: false,
    is_saved: false,
    comment_count: 0,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-elena-6754',
    real_author_name: 'Elena Rostova',
    real_author_email: 'elena.rostova@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString()
  },
  {
    id: 'confession-208',
    confession_number: 'No. 007',
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: '1:45 PM',
    exact_time: 'Friday, Oct 16, 2026 at 1:45 PM EDT',
    to_target: 'To: anyone feeling like an imposter today',
    category: 'Advice',
    body: "Nobody has it figured out. We're all just pretending to understand the readings and nodding along in seminars.",
    image_url: null,
    likes: 110,
    is_liked: false,
    is_saved: false,
    comment_count: 0,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-lucas-5510',
    real_author_name: 'Lucas Wright',
    real_author_email: 'lucas.wright@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString()
  },

  // ================= THURSDAY, 15 OCTOBER 2026 =================
  {
    id: 'confession-101',
    confession_number: 'No. 018',
    date_key: '2026-10-15',
    day_key: 'yesterday',
    day_name: 'Thursday',
    day_label: 'Thursday, 15 October',
    time_formatted: '11:22 PM',
    exact_time: 'Thursday, Oct 15, 2026 at 11:22 PM EDT',
    to_target: null,
    category: 'Confessions',
    body: "I accidentally said 'I love you' to my academic advisor instead of 'thank you' at the end of our degree audit call.",
    image_url: null,
    likes: 87,
    is_liked: true,
    is_saved: false,
    comment_count: 11,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-sam-9021',
    real_author_name: 'Sam Alvarez',
    real_author_email: 's.alvarez@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'confession-102',
    confession_number: 'No. 017',
    date_key: '2026-10-15',
    day_key: 'yesterday',
    day_name: 'Thursday',
    day_label: 'Thursday, 15 October',
    time_formatted: '9:05 PM',
    exact_time: 'Thursday, Oct 15, 2026 at 9:05 PM EDT',
    to_target: 'To: the girl who dropped her AirPods in the quad fountain',
    category: 'Lost & Found',
    body: 'I fished them out with a notebook ruler, cleaned them with alcohol wipes, and gave them to security.',
    image_url: null,
    likes: 42,
    is_liked: false,
    is_saved: false,
    comment_count: 3,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-chloe-3109',
    real_author_name: 'Chloe Tremblay',
    real_author_email: 'chloe.tremblay@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  },
  {
    id: 'confession-103',
    confession_number: 'No. 016',
    date_key: '2026-10-15',
    day_key: 'yesterday',
    day_name: 'Thursday',
    day_label: 'Thursday, 15 October',
    time_formatted: '7:40 PM',
    exact_time: 'Thursday, Oct 15, 2026 at 7:40 PM EDT',
    to_target: null,
    category: 'Late Night',
    body: 'The grand piano in the student union basement sounds noticeably richer when it rains outside.',
    image_url: null,
    likes: 65,
    is_liked: false,
    is_saved: true,
    comment_count: 5,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-elena-6754',
    real_author_name: 'Elena Rostova',
    real_author_email: 'elena.rostova@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString()
  },

  // ================= WEDNESDAY, 14 OCTOBER 2026 =================
  {
    id: 'confession-081',
    confession_number: 'No. 025',
    date_key: '2026-10-14',
    day_key: 'wednesday',
    day_name: 'Wednesday',
    day_label: 'Wednesday, 14 October',
    time_formatted: '10:14 PM',
    exact_time: 'Wednesday, Oct 14, 2026 at 10:14 PM EDT',
    to_target: 'To: the person who recommended the soundtrack to Interstellar for studying',
    category: 'Academics',
    body: 'I just finished an entire 12-page literature review in one uninterrupted flow state because of you. My thesis advisor will literally weep with joy tomorrow.',
    image_url: null,
    likes: 76,
    is_liked: false,
    is_saved: false,
    comment_count: 6,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-marcus-4412',
    real_author_name: 'Marcus Chen',
    real_author_email: 'marcus.chen@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'confession-082',
    confession_number: 'No. 024',
    date_key: '2026-10-14',
    day_key: 'wednesday',
    day_name: 'Wednesday',
    day_label: 'Wednesday, 14 October',
    time_formatted: '8:30 PM',
    exact_time: 'Wednesday, Oct 14, 2026 at 8:30 PM EDT',
    to_target: null,
    category: 'Confessions',
    body: 'I intentionally took the longest walking path through the humanities courtyard just to hear the autumn leaves crunch under my boots.',
    image_url: null,
    likes: 91,
    is_liked: false,
    is_saved: false,
    comment_count: 4,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-lucas-5510',
    real_author_name: 'Lucas Wright',
    real_author_email: 'lucas.wright@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString()
  },
  {
    id: 'confession-083',
    confession_number: 'No. 023',
    date_key: '2026-10-14',
    day_key: 'wednesday',
    day_name: 'Wednesday',
    day_label: 'Wednesday, 14 October',
    time_formatted: '4:15 PM',
    exact_time: 'Wednesday, Oct 14, 2026 at 4:15 PM EDT',
    to_target: 'To: the TA who gave feedback in green pen instead of red',
    category: 'Advice',
    body: 'It sounds so small, but your constructive comments didn’t feel like an attack for once. It genuinely gave me confidence to keep going in computer systems.',
    image_url: null,
    likes: 58,
    is_liked: false,
    is_saved: false,
    comment_count: 2,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-samir-7821',
    real_author_name: 'Samir Rao',
    real_author_email: 'samir.rao@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString()
  },

  // ================= TUESDAY, 13 OCTOBER 2026 =================
  {
    id: 'confession-061',
    confession_number: 'No. 031',
    date_key: '2026-10-13',
    day_key: 'tuesday',
    day_name: 'Tuesday',
    day_label: 'Tuesday, 13 October',
    time_formatted: '9:50 PM',
    exact_time: 'Tuesday, Oct 13, 2026 at 9:50 PM EDT',
    to_target: 'To: the girl with the tote bag featuring The Secret History',
    category: 'Crushes',
    body: 'You smiled when you caught me looking at your pins in line at the bagel shop. If you ever want to debate Greek tragedy or just grab tea, I am the guy who dropped his loyalty card.',
    image_url: null,
    likes: 104,
    is_liked: false,
    is_saved: false,
    comment_count: 14,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-sam-9021',
    real_author_name: 'Sam Alvarez',
    real_author_email: 's.alvarez@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: 'confession-062',
    confession_number: 'No. 030',
    date_key: '2026-10-13',
    day_key: 'tuesday',
    day_name: 'Tuesday',
    day_label: 'Tuesday, 13 October',
    time_formatted: '6:10 PM',
    exact_time: 'Tuesday, Oct 13, 2026 at 6:10 PM EDT',
    to_target: null,
    category: 'Confessions',
    body: 'I changed my major three times and I still do not know what I want to do after graduation. The relief of finally admitting it out loud is intoxicating.',
    image_url: null,
    likes: 142,
    is_liked: false,
    is_saved: false,
    comment_count: 19,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-maya-8290',
    real_author_name: 'Maya Lin',
    real_author_email: 'maya.lin@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 75).toISOString()
  },

  // ================= MONDAY, 12 OCTOBER 2026 =================
  {
    id: 'confession-041',
    confession_number: 'No. 038',
    date_key: '2026-10-12',
    day_key: 'monday',
    day_name: 'Monday',
    day_label: 'Monday, 12 October',
    time_formatted: '11:45 PM',
    exact_time: 'Monday, Oct 12, 2026 at 11:45 PM EDT',
    to_target: 'To: all freshman navigating campus in the dark',
    category: 'Advice',
    body: 'Do not be afraid to eat lunch alone, study on the lawn alone, or ask directions. Nobody is judging you; everybody is just as self-conscious as you are.',
    image_url: null,
    likes: 188,
    is_liked: false,
    is_saved: false,
    comment_count: 22,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'user-current-session',
    real_author_name: 'Jordan Brooks',
    real_author_email: 'student@college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
  },
  {
    id: 'confession-042',
    confession_number: 'No. 037',
    date_key: '2026-10-12',
    day_key: 'monday',
    day_name: 'Monday',
    day_label: 'Monday, 12 October',
    time_formatted: '8:20 PM',
    exact_time: 'Monday, Oct 12, 2026 at 8:20 PM EDT',
    to_target: null,
    category: 'Late Night',
    body: 'The campus radio station was playing slow ambient jazz at 2 AM last night while the street cleaners swept the quad. Most cinematic moment of my semester.',
    image_url: null,
    likes: 72,
    is_liked: false,
    is_saved: false,
    comment_count: 5,
    is_anonymous: true,
    author_name: 'Anonymous Student',
    author_id: 'uuid-devon-1845',
    real_author_name: 'Devon Patel',
    real_author_email: 'devon.patel@student.college.edu',
    status: 'published',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 99).toISOString()
  }
];

const INITIAL_COMMENTS = [
  {
    id: 'c-201-1',
    post_id: 'confession-201',
    author_name: 'Anonymous Student',
    real_author_name: 'Marcus Vance',
    real_author_email: 'marcus.v@student.college.edu',
    author_id: 'uuid-marcus-842',
    content: "If he's in row 4, he definitely knows who you are.",
    created_at: '20 mins ago',
    likes: 6
  },
  {
    id: 'c-201-2',
    post_id: 'confession-201',
    author_name: 'Anonymous Student',
    real_author_name: 'Chloe Lin',
    real_author_email: 'c.lin@student.college.edu',
    author_id: 'uuid-chloe-519',
    content: 'Next Tuesday just ask him for a pencil and see.',
    created_at: '14 mins ago',
    likes: 3
  },
  {
    id: 'c-202-1',
    post_id: 'confession-202',
    author_name: 'Anonymous Student',
    real_author_name: 'Aiden Brooks',
    real_author_email: 'aiden.b@student.college.edu',
    author_id: 'uuid-aiden-334',
    content: 'Ouch. This one hit right in the chest.',
    created_at: '1 hour ago',
    likes: 9
  },
  {
    id: 'c-206-1',
    post_id: 'confession-206',
    author_name: 'Anonymous Student',
    real_author_name: 'Maya Rodriguez',
    real_author_email: 'm.rodriguez@student.college.edu',
    author_id: 'uuid-maya-771',
    content: 'Hope your brother is recovering smoothly. Jordan is real for that.',
    created_at: '3 hours ago',
    likes: 18
  },
  {
    id: 'c-101-1',
    post_id: 'confession-101',
    author_name: 'Anonymous Student',
    real_author_name: 'Liam Chen',
    real_author_email: 'liam.chen@student.college.edu',
    author_id: 'uuid-liam-1029',
    content: 'My advisor once asked if I was okay after I signed off with "xoxo". You are not alone.',
    created_at: '2 hours ago',
    likes: 14
  },
  {
    id: 'c-083-1',
    post_id: 'confession-083',
    author_name: 'Anonymous Student',
    real_author_name: 'Sophia Patel',
    real_author_email: 'sophia.p@student.college.edu',
    author_id: 'uuid-sophia-4491',
    content: 'Green pen TAs are protected by campus law in my book.',
    created_at: '5 hours ago',
    likes: 22
  }
];

// Local storage helpers
function getStoredConfessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFESSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONFESSIONS, JSON.stringify(INITIAL_CONFESSIONS));
      return INITIAL_CONFESSIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_CONFESSIONS;
  }
}

function saveStoredConfessions(items) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFESSIONS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save confessions', e);
  }
}

function getStoredComments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(INITIAL_COMMENTS));
      return INITIAL_COMMENTS;
    }
    const parsed = JSON.parse(raw);
    let updated = false;
    const enriched = parsed.map(c => {
      const match = INITIAL_COMMENTS.find(init => init.id === c.id);
      if (match && (!c.real_author_name || !c.real_author_email)) {
        updated = true;
        return {
          ...c,
          real_author_name: match.real_author_name,
          real_author_email: match.real_author_email,
          author_id: match.author_id
        };
      }
      return c;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(enriched));
    }
    return enriched;
  } catch (e) {
    return INITIAL_COMMENTS;
  }
}

function saveStoredComments(items) {
  try {
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save comments', e);
  }
}

export function getStoredLikes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKES);
    return raw ? JSON.parse(raw) : { 'confession-201': true, 'confession-101': true };
  } catch (e) {
    return { 'confession-201': true, 'confession-101': true };
  }
}

export function saveStoredLikes(likesMap) {
  try {
    localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(likesMap));
  } catch (e) {}
}

export function getStoredSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED);
    return raw ? JSON.parse(raw) : { 'confession-204': true, 'confession-103': true };
  } catch (e) {
    return { 'confession-204': true, 'confession-103': true };
  }
}

export function saveStoredSaved(savedMap) {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedMap));
  } catch (e) {}
}

export async function toggleSaveConfession(confessionId) {
  const savedMap = getStoredSaved();
  const currentlySaved = Boolean(savedMap[confessionId]);

  if (currentlySaved) {
    delete savedMap[confessionId];
  } else {
    savedMap[confessionId] = true;
  }

  saveStoredSaved(savedMap);

  return {
    success: true,
    is_saved: !currentlySaved
  };
}

export function getStoredMaybeMe() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAYBE_ME);
    return raw ? JSON.parse(raw) : { 'confession-202': true };
  } catch (e) {
    return { 'confession-202': true };
  }
}

export function saveStoredMaybeMe(maybeMap) {
  try {
    localStorage.setItem(STORAGE_KEY_MAYBE_ME, JSON.stringify(maybeMap));
  } catch (e) {}
}

export function getStoredReadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_POSTS);
    return raw ? JSON.parse(raw) : { 'confession-201': true, 'confession-202': true };
  } catch (e) {
    return {};
  }
}

export function saveStoredReadPosts(readMap) {
  try {
    localStorage.setItem(STORAGE_KEY_READ_POSTS, JSON.stringify(readMap));
  } catch (e) {}
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const defaultUser = {
    id: 'user-current-session',
    email: 'student@college.edu',
    name: 'Jordan Brooks',
    username: 'jordan_b',
    college_verified: true,
    role: 'student',
    created_at: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(defaultUser));
  return defaultUser;
}

export function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

// Fetch Confessions for Daily Board
export async function fetchConfessions({ day = 'today', date = null, category = 'all', searchQuery = '' } = {}) {
  const likesMap = getStoredLikes();
  const savedMap = getStoredSaved();
  const currentUser = getCurrentUser();
  const isModerator = currentUser && currentUser.role === 'admin';
  const myPostIds = getMyCreatedPostIds();

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.endsWith('.local')
  );

  // 1. ON LOCALHOST: Prioritize local dev environment (MongoDB API + localStorage)
  if (isLocalhost) {
    let localApiPosts = [];
    try {
      const apiRes = await api.getConfessions({
        day: date || (day === 'this_week' ? 'all' : day),
        category: category === 'all' ? undefined : category,
        search: searchQuery
      });
      if (apiRes && apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
        localApiPosts = apiRes.data;
      }
    } catch (err) {
      // Local Express server may be offline
    }

    // Always merge with localStorage so locally created confessions NEVER disappear on reload
    const stored = getStoredConfessions();
    const mergedMap = new Map();

    // 1. Add locally created / saved posts from localStorage
    stored.forEach(p => {
      if (p && p.id) {
        mergedMap.set(p.id, p);
      }
    });

    // 2. Overlay / merge any posts from local MongoDB API
    localApiPosts.forEach(p => {
      if (p && p.id) {
        mergedMap.set(p.id, p);
      }
    });

    const combined = Array.from(mergedMap.values());
    let filtered = combined.filter(c => c.status === 'published' || !c.status);

    if (date) {
      filtered = filtered.filter(c => c.date_key === date);
    } else if (day === 'this_week') {
      const weekDates = ['2026-10-16', '2026-10-15', '2026-10-14', '2026-10-13', '2026-10-12'];
      filtered = filtered.filter(c => weekDates.includes(c.date_key) || c.day_key === 'today' || c.day_key === 'yesterday');
    } else if (day && day !== 'all') {
      filtered = filtered.filter(c => c.day_key === day || c.date_key === day);
    }

    if (category && category.toLowerCase() !== 'all') {
      filtered = filtered.filter(c => c.category && c.category.toLowerCase() === category.toLowerCase());
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => 
        (c.body && c.body.toLowerCase().includes(q)) ||
        (c.to_target && c.to_target.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.confession_number && c.confession_number.toLowerCase().includes(q))
      );
    }

    return filtered.map((c, idx) => {
      const isAuthor = myPostIds.includes(c.id) || (currentUser && (c.author_id === currentUser.id || c.real_author_name === currentUser.name || c.real_author_email === currentUser.email));
      const canDelete = Boolean(isModerator || isAuthor);

      return {
        ...c,
        is_liked: Boolean(likesMap[c.id]),
        is_saved: Boolean(savedMap[c.id]),
        is_own: isAuthor,
        can_delete: canDelete,
        content: c.body || c.content,
        title: c.to_target || (c.body ? c.body.substring(0, 40) + '...' : 'Confession'),
        post_number_formatted: c.confession_number,
        post_number: parseInt(c.confession_number?.replace(/\D/g, '') || '0', 10)
      };
    });
  }

  // 2. IN PRODUCTION: Query Firebase Firestore if configured
  if (isFirebaseConfigured && !isLocalhost) {
    try {
      const fsConfessions = await firestoreService.getConfessions({ day, category, search: searchQuery });
      if (fsConfessions && fsConfessions.length > 0) {
        return fsConfessions.map(c => {
          const isAuthor = myPostIds.includes(c.id) || (currentUser && c.author_id === currentUser.id);
          return {
            ...c,
            is_liked: Boolean(likesMap[c.id]),
            is_saved: Boolean(savedMap[c.id]),
            is_own: isAuthor,
            can_delete: Boolean(isModerator || isAuthor),
            content: c.body,
            title: c.to_target || (c.body ? c.body.substring(0, 40) + '...' : 'Confession'),
            post_number_formatted: c.confession_number,
            post_number: parseInt(c.confession_number?.replace(/\D/g, '') || '0', 10)
          };
        });
      }
    } catch (e) {}
  }

  // 2. Local Fallback
  const all = getStoredConfessions();
  let filtered = all.filter(c => c.status === 'published');

  if (date) {
    // Exact date match (e.g. '2026-10-14')
    filtered = filtered.filter(c => c.date_key === date);
  } else if (day === 'this_week') {
    // All confessions from Monday to Friday
    const weekDates = ['2026-10-16', '2026-10-15', '2026-10-14', '2026-10-13', '2026-10-12'];
    filtered = filtered.filter(c => weekDates.includes(c.date_key) || c.day_key === 'today' || c.day_key === 'yesterday');
  } else if (day && day !== 'all') {
    filtered = filtered.filter(c => c.day_key === day || c.date_key === day);
  }

  if (category && category.toLowerCase() !== 'all') {
    filtered = filtered.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(c => 
      c.body.toLowerCase().includes(q) ||
      (c.to_target && c.to_target.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q) ||
      c.confession_number.toLowerCase().includes(q)
    );
  }

  const fallbackNames = [
    { name: 'Sam Alvarez', email: 's.alvarez@student.college.edu' },
    { name: 'Maya Lin', email: 'maya.lin@student.college.edu' },
    { name: 'Samir Rao', email: 'samir.rao@student.college.edu' },
    { name: 'Chloe Tremblay', email: 'chloe.tremblay@student.college.edu' },
    { name: 'Marcus Chen', email: 'marcus.chen@student.college.edu' },
    { name: 'Devon Patel', email: 'devon.patel@student.college.edu' },
    { name: 'Elena Rostova', email: 'elena.rostova@student.college.edu' },
    { name: 'Lucas Wright', email: 'lucas.wright@student.college.edu' }
  ];

  const allComments = getStoredComments();
  const commentCounts = {};
  allComments.forEach(cm => {
    if (cm && cm.post_id) {
      commentCounts[cm.post_id] = (commentCounts[cm.post_id] || 0) + 1;
    }
  });

  return filtered.map((c, idx) => {
    const fallback = fallbackNames[idx % fallbackNames.length];
    const realName = c.real_author_name || fallback.name;
    const realEmail = c.real_author_email || fallback.email;
    const isAuthor = myPostIds.includes(c.id) || (currentUser && (c.author_id === currentUser.id || c.real_author_name === currentUser.name || c.real_author_email === currentUser.email));
    const canDelete = Boolean(isModerator || isAuthor);

    return {
      ...c,
      // Dynamic user state
      is_liked: Boolean(likesMap[c.id]),
      is_saved: Boolean(savedMap[c.id]),
      is_own: isAuthor,
      can_delete: canDelete,
      comment_count: commentCounts[c.id] || 0,
      // Anonymity enforcement for public view
      author_name: c.is_anonymous ? 'Anonymous Student' : c.author_name,
      author_id: c.is_anonymous && !isModerator ? undefined : c.author_id,
      real_author_name: isModerator ? realName : undefined,
      real_author_email: isModerator ? realEmail : undefined,
      // Aliases for backwards compatibility with existing components
      content: c.body,
      title: c.to_target || c.body.substring(0, 40) + '...',
      post_number_formatted: c.confession_number,
      post_number: parseInt(c.confession_number.replace(/\D/g, '') || '0', 10)
    };
  });
}

// Fetch Confessions Grouped By Week (Friday, Thursday, Wednesday, Tuesday, Monday)
export async function fetchConfessionsGroupedByWeek() {
  const all = await fetchConfessions({ day: 'this_week' });
  const daysOrder = [
    { date_key: '2026-10-16', day_name: 'Friday', day_label: 'Friday, 16 October' },
    { date_key: '2026-10-15', day_name: 'Thursday', day_label: 'Thursday, 15 October' },
    { date_key: '2026-10-14', day_name: 'Wednesday', day_label: 'Wednesday, 14 October' },
    { date_key: '2026-10-13', day_name: 'Tuesday', day_label: 'Tuesday, 13 October' },
    { date_key: '2026-10-12', day_name: 'Monday', day_label: 'Monday, 12 October' },
  ];

  return daysOrder.map(day => {
    const confessions = all.filter(c => c.date_key === day.date_key);
    return {
      date_key: day.date_key,
      day_name: day.day_name,
      day_label: day.day_label,
      confessions
    };
  }).filter(group => group.confessions.length > 0);
}

// Fetch Saved Confessions (Instagram style)
export async function fetchSavedConfessions() {
  const savedMap = getStoredSaved();
  const all = await fetchConfessions({ day: 'all' });
  return all.filter(c => Boolean(savedMap[c.id]));
}

// Fetch Liked Confessions for Activity Tab
export async function fetchLikedConfessions() {
  const likesMap = getStoredLikes();
  const all = await fetchConfessions({ day: 'all' });
  return all.filter(c => Boolean(likesMap[c.id]));
}

// Fetch User Authored Confessions for Activity Tab
export async function fetchUserAuthoredConfessions() {
  const currentUser = getCurrentUser();
  const myPostIds = getMyCreatedPostIds();
  const all = await fetchConfessions({ day: 'all' });
  return all.filter(c => myPostIds.includes(c.id) || c.author_id === currentUser.id || c.real_author_name === currentUser.name || c.is_own);
}


// Toggle Like
export async function toggleLikeConfession(confessionId) {
  const confessions = getStoredConfessions();
  const idx = confessions.findIndex(c => c.id === confessionId);
  if (idx === -1) return { success: false };

  const likesMap = getStoredLikes();
  const currentlyLiked = Boolean(likesMap[confessionId]);

  if (currentlyLiked) {
    delete likesMap[confessionId];
    confessions[idx].likes = Math.max(0, (confessions[idx].likes || 1) - 1);
  } else {
    likesMap[confessionId] = true;
    confessions[idx].likes = (confessions[idx].likes || 0) + 1;
  }

  saveStoredConfessions(confessions);
  saveStoredLikes(likesMap);

  // Sync with MongoDB backend
  api.likeConfession(confessionId, !currentlyLiked ? 1 : -1).catch(() => {});

  return {
    success: true,
    is_liked: !currentlyLiked,
    likes: confessions[idx].likes
  };
}

// Toggle "This might be me"
export async function toggleMaybeMe(confessionId) {
  const confessions = getStoredConfessions();
  const idx = confessions.findIndex(c => c.id === confessionId);
  if (idx === -1) return { success: false };

  const maybeMap = getStoredMaybeMe();
  const currentlyMarked = Boolean(maybeMap[confessionId]);

  if (currentlyMarked) {
    delete maybeMap[confessionId];
    confessions[idx].maybe_me_count = Math.max(0, (confessions[idx].maybe_me_count || 1) - 1);
  } else {
    maybeMap[confessionId] = true;
    confessions[idx].maybe_me_count = (confessions[idx].maybe_me_count || 0) + 1;
  }

  saveStoredConfessions(confessions);
  saveStoredMaybeMe(maybeMap);

  return {
    success: true,
    is_maybe_me: !currentlyMarked,
    maybe_me_count: confessions[idx].maybe_me_count
  };
}

// Mark confession as read
export async function markConfessionRead(confessionId) {
  const readMap = getStoredReadPosts();
  readMap[confessionId] = true;
  saveStoredReadPosts(readMap);
  return { success: true };
}

export function fetchReadConfessionIds() {
  return Object.keys(getStoredReadPosts());
}

// Right Panel Daily Summary Statistics
export async function fetchTodayStats() {
  const confessions = getStoredConfessions().filter(c => c.day_key === 'today' && c.status === 'published');
  const totalConfessions = confessions.length;
  const totalLikes = confessions.reduce((acc, c) => acc + (c.likes || 0), 0);

  // Most liked confession
  const sortedByLikes = [...confessions].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  const mostLiked = sortedByLikes[0] || null;

  // Top 3 confessions by "this might be me" count
  const sortedByMaybeMe = [...confessions]
    .filter(c => (c.maybe_me_count || 0) > 0)
    .sort((a, b) => (b.maybe_me_count || 0) - (a.maybe_me_count || 0))
    .slice(0, 3);

  return {
    totalConfessions,
    totalLikes,
    mostLiked,
    mostMaybeMe: sortedByMaybeMe
  };
}

// Fetch user marked confessions
export async function fetchUserMarkedMaybeMe() {
  const maybeMap = getStoredMaybeMe();
  const confessions = getStoredConfessions();
  return confessions.filter(c => maybeMap[c.id]);
}

// Create new confession
export async function createConfession({ body, to_target, category = 'Confessions', image_url = null, is_anonymous = true }) {
  const currentUser = getCurrentUser();
  const cleanBody = (body || '').trim();

  if (!cleanBody) {
    return { success: false, error: 'Confession text cannot be empty.' };
  }

  const modResult = validateAndModeratePost({ title: to_target || 'Confession', content: cleanBody, category });
  if (!modResult.isValid) {
    return { success: false, error: modResult.errors.join(' ') };
  }

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.endsWith('.local')
  );

  // Helper to persist to local cache for instant UI availability
  const persistLocally = (item) => {
    try {
      const all = getStoredConfessions();
      const existingIdx = all.findIndex(c => c.id === item.id);
      if (existingIdx >= 0) {
        all[existingIdx] = { ...all[existingIdx], ...item };
      } else {
        all.unshift(item);
      }
      saveStoredConfessions(all);

      const myPosts = getMyCreatedPostIds();
      if (!myPosts.includes(item.id)) {
        myPosts.unshift(item.id);
        saveMyCreatedPostIds(myPosts);
      }

      const likesMap = getStoredLikes();
      likesMap[item.id] = true;
      saveStoredLikes(likesMap);
    } catch (e) {}
  };

  const rawUser = getCurrentUser() || {};
  const authorName = is_anonymous ? 'Anonymous Student' : (rawUser.displayName || rawUser.name || 'Student');
  const realAuthorName = rawUser.displayName || rawUser.name || 'Student';
  const realAuthorEmail = rawUser.email || 'student@college.edu';
  const authorId = rawUser.uid || rawUser.id || 'user-current-session';

  // 1. On Localhost, prioritize local Express & MongoDB API (runs in ~30ms)
  if (isLocalhost) {
    try {
      const apiRes = await api.createConfession({
        body: cleanBody,
        to_target: (to_target || '').trim() || null,
        category,
        is_anonymous: Boolean(is_anonymous),
        author_name: authorName,
        real_author_name: realAuthorName,
        real_author_email: realAuthorEmail
      });

      if (apiRes && apiRes.success && apiRes.data) {
        const created = apiRes.data;
        const confessionPayload = {
          ...created,
          is_liked: true,
          is_saved: false,
          is_maybe_me: false,
          is_own: true,
          can_delete: true,
          content: created.body,
          title: created.to_target || created.body.substring(0, 40) + '...',
          post_number_formatted: created.confession_number,
          post_number: parseInt(created.confession_number?.replace(/\D/g, '') || '0', 10)
        };

        persistLocally(confessionPayload);

        return {
          success: true,
          confession: confessionPayload,
          post: confessionPayload
        };
      }
    } catch (err) {
      console.warn('[SpillATea] Local API failed, trying fallback:', err.message);
    }
  }

  // 2. In Production (or Localhost fallback), try Firebase Firestore
  if (isFirebaseConfigured && !isLocalhost) {
    try {
      const created = await firestoreService.createConfession({
        body: cleanBody,
        to_target: (to_target || '').trim() || null,
        category,
        is_anonymous: Boolean(is_anonymous),
        author_name: authorName,
        author_id: authorId,
        real_author_name: realAuthorName,
        real_author_email: realAuthorEmail
      });

      if (created) {
        const confessionPayload = {
          ...created,
          is_liked: true,
          is_saved: false,
          is_own: true,
          can_delete: true,
          content: created.body,
          title: created.to_target || created.body.substring(0, 40) + '...',
          post_number_formatted: created.confession_number,
          post_number: parseInt(created.confession_number?.replace(/\D/g, '') || '0', 10)
        };

        persistLocally(confessionPayload);

        return {
          success: true,
          confession: confessionPayload,
          post: confessionPayload
        };
      }
    } catch (e) {}
  }

  // 3. Local Fallback
  const all = getStoredConfessions();
  const todayItems = all.filter(c => c.day_key === 'today');
  const nextNum = todayItems.length + 1;
  const confession_number = formatConfessionNumber(nextNum);

  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const newConfession = {
    id: `confession-${Date.now()}`,
    confession_number,
    date_key: '2026-10-16',
    day_key: 'today',
    day_name: 'Friday',
    day_label: 'Friday, 16 October',
    time_formatted: timeFormatted,
    exact_time: now.toLocaleString(),
    to_target: (to_target || '').trim() || null,
    category,
    body: cleanBody,
    image_url: null,
    likes: 1,
    maybe_me_count: 0,
    comment_count: 0,
    is_anonymous: Boolean(is_anonymous),
    author_name: authorName,
    author_id: authorId,
    real_author_name: realAuthorName,
    real_author_email: realAuthorEmail,
    status: 'published',
    created_at: now.toISOString()
  };

  all.unshift(newConfession);
  saveStoredConfessions(all);

  // Track user authored post
  const myPosts = getMyCreatedPostIds();
  if (!myPosts.includes(newConfession.id)) {
    myPosts.unshift(newConfession.id);
    saveMyCreatedPostIds(myPosts);
  }

  // Auto like author's own confession
  const likesMap = getStoredLikes();
  likesMap[newConfession.id] = true;
  saveStoredLikes(likesMap);

  const confessionPayload = {
    ...newConfession,
    is_liked: true,
    is_saved: false,
    is_maybe_me: false,
    is_own: true,
    can_delete: true,
    content: newConfession.body,
    title: newConfession.to_target || newConfession.body.substring(0, 40) + '...',
    post_number_formatted: newConfession.confession_number,
    post_number: parseInt(newConfession.confession_number.replace(/\D/g, '') || '0', 10)
  };

  return {
    success: true,
    confession: confessionPayload,
    post: confessionPayload
  };
}

// Fetch comments
export async function fetchComments(confessionId) {
  try {
    const apiRes = await api.getComments(confessionId);
    if (apiRes && apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      return apiRes.data.map(cm => ({
        ...cm,
        content: cm.body || cm.content
      }));
    }
  } catch (err) {}

  const comments = getStoredComments();
  const filtered = comments.filter(c => c.post_id === confessionId);
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  if (isAdmin) {
    return filtered;
  }

  // AGENTS.md Rule 10: Non-moderator public view strips private author identity
  return filtered.map(({ real_author_name, real_author_email, author_id, ...rest }) => rest);
}

// Add comment
export async function addComment({ postId, content, is_anonymous = true }) {
  const currentUser = getCurrentUser();
  const trimmed = (content || '').trim();
  if (!trimmed) return { success: false, error: 'Comment cannot be empty.' };

  const mod = moderateText(trimmed);

  try {
    const apiRes = await api.addComment(postId, {
      body: mod.maskedText,
      author_name: is_anonymous ? 'Anonymous Student' : currentUser.name,
      author_role: 'Student'
    });
    if (apiRes && apiRes.success && apiRes.data) {
      return {
        success: true,
        comment: {
          ...apiRes.data,
          content: apiRes.data.body
        }
      };
    }
  } catch (err) {
    console.warn('[SpillATea] API unavailable, storing comment locally:', err.message);
  }

  const comments = getStoredComments();

  const newComment = {
    id: `c-${Date.now()}`,
    post_id: postId,
    author_name: is_anonymous ? 'Anonymous Student' : currentUser.name,
    real_author_name: currentUser.name,
    real_author_email: currentUser.email,
    author_id: currentUser.id,
    is_anonymous: Boolean(is_anonymous),
    content: mod.maskedText,
    created_at: 'Just now',
    likes: 0
  };

  comments.push(newComment);
  saveStoredComments(comments);

  // Increment comment count on confession
  const confessions = getStoredConfessions();
  const post = confessions.find(c => c.id === postId);
  if (post) {
    post.comment_count = (post.comment_count || 0) + 1;
    saveStoredConfessions(confessions);
  }

  return { success: true, comment: newComment };
}

// Backwards compatibility layer
export async function fetchPosts(params = {}) {
  return fetchConfessions(params);
}

export async function fetchPostById(id) {
  if (!id) return null;

  const likes = getStoredLikes();
  const saved = getStoredSaved();
  const user = getCurrentUser();
  const isMod = user && user.role === 'admin';
  const myPostIds = getMyCreatedPostIds();

  // Try Express & MongoDB API
  try {
    const apiRes = await api.getConfessionById(id);
    if (apiRes && apiRes.success && apiRes.data) {
      const c = apiRes.data;
      const isAuthor = myPostIds.includes(c.id) || (user && user.id === c.author_id);
      return {
        ...c,
        is_liked: Boolean(likes[c.id]),
        is_saved: Boolean(saved[c.id]),
        is_own: isAuthor,
        can_delete: Boolean(isMod || isAuthor),
        content: c.body,
        title: c.to_target || (c.body ? c.body.substring(0, 40) + '...' : 'Confession'),
        post_number_formatted: c.confession_number
      };
    }
  } catch (err) {}

  const all = getStoredConfessions();
  const rawId = String(id).trim().toLowerCase();
  const digitsOnly = rawId.replace(/\D/g, '');

  const c = all.find(item => {
    const itemNum = (item.confession_number || '').toLowerCase();
    const itemDigits = itemNum.replace(/\D/g, '');
    return item.id.toLowerCase() === rawId ||
           itemNum === rawId ||
           (digitsOnly && itemDigits === digitsOnly);
  });

  if (!c) return null;

  const idx = all.findIndex(item => item.id === c.id);
  const fallbackNames = [
    { name: 'Sam Alvarez', email: 's.alvarez@student.college.edu' },
    { name: 'Maya Lin', email: 'maya.lin@student.college.edu' },
    { name: 'Samir Rao', email: 'samir.rao@student.college.edu' },
    { name: 'Chloe Tremblay', email: 'chloe.tremblay@student.college.edu' },
    { name: 'Marcus Chen', email: 'marcus.chen@student.college.edu' },
    { name: 'Devon Patel', email: 'devon.patel@student.college.edu' },
    { name: 'Elena Rostova', email: 'elena.rostova@student.college.edu' },
    { name: 'Lucas Wright', email: 'lucas.wright@student.college.edu' }
  ];
  const fallback = fallbackNames[Math.max(0, idx) % fallbackNames.length];
  const realName = c.real_author_name || fallback.name;
  const realEmail = c.real_author_email || fallback.email;

  const isAuthor = myPostIds.includes(c.id) || (user && (c.author_id === user.id || c.real_author_name === user.name || c.real_author_email === user.email));
  const allComments = getStoredComments();
  const postComments = allComments.filter(cm => cm.post_id === c.id);

  return {
    ...c,
    is_liked: Boolean(likes[c.id]),
    is_own: isAuthor,
    can_delete: Boolean(isMod || isAuthor),
    comment_count: postComments.length,
    content: c.body,
    title: c.to_target || c.body.substring(0, 40),
    post_number_formatted: c.confession_number,
    real_author_name: isMod ? realName : undefined,
    real_author_email: isMod ? realEmail : undefined
  };
}

// Delete confession / post — Author can delete their own; Campus Moderator can delete any
export async function deleteConfession(confessionId) {
  const currentUser = getCurrentUser();
  const isModerator = currentUser && currentUser.role === 'admin';
  const myPostIds = getMyCreatedPostIds();
  const all = getStoredConfessions();

  const idx = all.findIndex(c => c.id === confessionId);
  if (idx === -1) {
    return { success: false, error: 'Confession not found.' };
  }

  const post = all[idx];
  const isAuthor = myPostIds.includes(post.id) || (currentUser && (post.author_id === currentUser.id || post.real_author_name === currentUser.name || post.real_author_email === currentUser.email));

  if (!isModerator && !isAuthor) {
    return { success: false, error: 'Unauthorized: Only the author or a campus moderator can delete this confession.' };
  }

  // Call Express MongoDB API
  api.deleteConfession(confessionId).catch(() => {});

  // Delete from stored confessions
  all.splice(idx, 1);
  saveStoredConfessions(all);

  // Remove from myPostIds
  saveMyCreatedPostIds(myPostIds.filter(id => id !== confessionId));

  // Delete associated comments
  const comments = getStoredComments();
  saveStoredComments(comments.filter(c => c.post_id !== confessionId));

  // Clean up likes and saved
  const likes = getStoredLikes();
  if (likes[confessionId]) {
    delete likes[confessionId];
    saveStoredLikes(likes);
  }
  const saved = getStoredSaved();
  if (saved[confessionId]) {
    delete saved[confessionId];
    saveStoredSaved(saved);
  }

  return { success: true };
}

export async function deletePost(postId) {
  return deleteConfession(postId);
}



export async function createPost({ title, content, category, is_anonymous }) {
  return createConfession({
    body: content,
    to_target: title,
    category,
    is_anonymous
  });
}

export async function reactToPost(postId, type) {
  if (type === 'like') {
    return toggleLikeConfession(postId);
  }
  return { success: true };
}

export async function secureRevealAuthorIdentity(postId) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return {
      success: false,
      error: 'Security Permission Denied: Only authenticated campus moderators can view hidden student identities.'
    };
  }

  // Try Express & MongoDB server-side reveal with audit trail
  try {
    const apiRes = await api.revealIdentity(postId, currentUser.name, currentUser.role);
    if (apiRes && apiRes.success && apiRes.data) {
      return apiRes;
    }
  } catch (err) {
    console.warn('[SpillATea] API unavailable, running local secure reveal:', err.message);
  }

  const all = getStoredConfessions();
  const item = all.find(c => c.id === postId || c.confession_number === postId);
  if (!item) return { success: false, error: 'Confession not found.' };

  const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIT) || '[]');
  const auditEntry = {
    id: `audit-${Date.now()}`,
    moderator_name: currentUser.name,
    action: 'Viewed hidden confession identity',
    target_post: item.confession_number,
    target_post_id: item.id,
    hidden_identity: item.real_author_name,
    registered_email: item.real_author_email,
    timestamp: new Date().toISOString()
  };
  auditLogs.unshift(auditEntry);
  localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));

  return {
    success: true,
    data: {
      post_number_formatted: item.confession_number,
      hidden_identity: item.real_author_name,
      registered_email: item.real_author_email,
      user_id: item.author_id,
      account_status: 'Active',
      college_verified: true,
      timestamp: auditEntry.timestamp,
      audit_id: auditEntry.id
    }
  };
}

export async function adminLookupAuthor(id) {
  return secureRevealAuthorIdentity(id);
}

export async function fetchAdminAuditLogs() {
  try {
    const apiRes = await api.getAuditLogs();
    if (apiRes && apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      return apiRes.data;
    }
  } catch (err) {}
  return JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIT) || '[]');
}

export async function fetchPendingReports() {
  try {
    const apiRes = await api.getReports('pending');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      return apiRes.data;
    }
  } catch (err) {}
  return JSON.parse(localStorage.getItem(STORAGE_KEY_REPORTS) || '[]');
}

export async function submitPostReport({ postId, reason, notes }) {
  try {
    await api.submitReport({ postId, reason, notes });
  } catch (err) {}

  const reports = JSON.parse(localStorage.getItem(STORAGE_KEY_REPORTS) || '[]');
  reports.unshift({
    id: `rep-${Date.now()}`,
    post_id: postId,
    reason,
    notes,
    created_at: new Date().toISOString(),
    status: 'pending'
  });
  localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  return { success: true };
}

export async function submitReport(params) {
  return submitPostReport(params);
}

export async function recordPostShare(postId) {
  return { success: true };
}

export async function fetchAdminReportQueue() {
  return fetchPendingReports();
}

export async function adminTakeAction({ reportId, action, notes }) {
  try {
    await api.takeReportAction(reportId, action, notes);
  } catch (err) {}

  const reports = JSON.parse(localStorage.getItem(STORAGE_KEY_REPORTS) || '[]');
  const updated = reports.map(r => r.id === reportId ? { ...r, status: action, resolution_notes: notes } : r);
  localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));
  return { success: true };
}

