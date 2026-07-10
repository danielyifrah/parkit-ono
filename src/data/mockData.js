// Mock data — בעתיד יוחלף בקריאות ל-Supabase Database

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function pexelsPhoto(id, width = 800) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

const PARKING_IMAGES = {
  p1: pexelsPhoto(106399),
  p2: pexelsPhoto(1396122),
  p3: pexelsPhoto(186077),
  p4: pexelsPhoto(1396132),
  p5: pexelsPhoto(1643383),
};

const PARKING_GALLERY = {
  p1: [106399, 280222, 280229].map(pexelsPhoto),
  p2: [1396122, 280240].map(pexelsPhoto),
  p3: [186077, 280232].map(pexelsPhoto),
  p4: [1396132].map(pexelsPhoto),
  p5: [1643383, 323705, 323775].map(pexelsPhoto),
};

function weeklySchedule(start, end, openDays = [0, 1, 2, 3, 4, 5, 6]) {
  const weekly = {};
  for (let day = 0; day < 7; day += 1) {
    weekly[day] = openDays.includes(day) ? { start, end } : null;
  }
  return weekly;
}

function monthAvailability(weekly, blockedDates = [], bookedSlots = []) {
  return { weekly, blockedDates, bookedSlots };
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function offsetDateStr(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return toDateStr(date);
}

export const users = [
  {
    id: 'user-1',
    name: 'ישראל ישראלי',
    email: 'israel@example.com',
    phone: '050-1234567',
    role: 'driver',
    avatar: null,
  },
  {
    id: 'owner-1',
    name: 'דני כהן',
    email: 'danny@example.com',
    phone: '052-9876543',
    role: 'owner',
    avatar: null,
  },
  {
    id: 'admin-1',
    name: 'מיכל לוי',
    email: 'admin@parkit.com',
    phone: '03-5551234',
    role: 'admin',
    avatar: null,
  },
];

export const paymentMethods = [
  {
    id: 'pm1',
    userId: 'user-1',
    category: 'payment',
    type: 'credit_card',
    label: 'כרטיס אשראי',
    brand: 'Visa',
    lastFour: '4242',
    isDefault: true,
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'pm2',
    userId: 'owner-1',
    category: 'payout',
    type: 'bank_account',
    label: 'חשבון בנק',
    bankName: 'בנק לאומי',
    bankBranch: '800',
    lastFour: '5678',
    accountHolderName: 'דני כהן',
    isDefault: true,
    createdAt: '2026-06-01T10:00:00Z',
  },
];

export const parkings = [
  {
    id: 'p1',
    ownerId: 'owner-1',
    name: 'חניה פרטית הרצל',
    address: "רח' הרצל 45, תל אביב",
    city: 'תל אביב',
    pricePerHour: 22,
    type: 'private',
    spotNumber: 'B12',
    description: 'חניה פרטית מקורה בבניין מגורים, כניסה 24/7 עם קוד דלת. מרחק הליכה קצר מרחוב הרצל.',
    rating: 4.8,
    reviewsCount: 124,
    walkMinutes: 2,
    available: true,
    status: 'active',
    image: PARKING_IMAGES.p1,
    images: PARKING_GALLERY.p1,
    lat: 32.0634,
    lng: 34.7702,
    availabilityHours: '00:00 - 23:59',
    availability: monthAvailability(
      weeklySchedule('00:00', '23:59'),
      ['2026-07-12', '2026-07-19'],
      [
        { date: '2026-07-08', start: '10:00', end: '14:00' },
        { date: '2026-07-15', start: '18:00', end: '21:00' },
      ],
    ),
    bookingsToday: 2,
    incomeToday: 80,
    covered: true,
    photosCount: 8,
  },
  {
    id: 'p2',
    ownerId: 'owner-1',
    name: 'חניה בדיזנגוף סנטר',
    address: 'דיזנגוף 50, תל אביב',
    city: 'תל אביב',
    pricePerHour: 25,
    type: 'public',
    spotNumber: 'A3',
    description: 'חניה ציבורית בקרבת דיזנגוף סנטר, נגישה ונוחה.',
    rating: 4.5,
    reviewsCount: 89,
    walkMinutes: 5,
    available: true,
    status: 'active',
    image: PARKING_IMAGES.p2,
    images: PARKING_GALLERY.p2,
    lat: 32.0773,
    lng: 34.7745,
    availabilityHours: '07:00 - 22:00',
    availability: monthAvailability(
      weeklySchedule('07:00', '22:00'),
      ['2026-07-06', '2026-07-20', '2026-07-27'],
      [{ date: '2026-07-10', start: '09:00', end: '13:00' }],
    ),
    bookingsToday: 1,
    incomeToday: 50,
    covered: false,
    photosCount: 4,
  },
  {
    id: 'p3',
    ownerId: 'owner-1',
    name: 'חניה משרדית רוטשילד',
    address: "רח' רוטשילד 12, תל אביב",
    city: 'תל אביב',
    pricePerHour: 18,
    type: 'office',
    spotNumber: 'C7',
    description: 'חניה במשרדים, זמינה בסופי שבוע ובשעות הערב.',
    rating: 4.2,
    reviewsCount: 56,
    walkMinutes: 3,
    available: true,
    status: 'active',
    image: PARKING_IMAGES.p3,
    images: PARKING_GALLERY.p3,
    lat: 32.0641,
    lng: 34.7718,
    availabilityHours: 'א׳-ה׳ 18:00-08:00 · ו׳-ש׳ 00:00-23:59',
    availability: monthAvailability(
      {
        0: { start: '00:00', end: '23:59' },
        1: { start: '18:00', end: '23:59' },
        2: { start: '18:00', end: '23:59' },
        3: { start: '18:00', end: '23:59' },
        4: { start: '18:00', end: '23:59' },
        5: { start: '18:00', end: '23:59' },
        6: { start: '00:00', end: '23:59' },
      },
      ['2026-07-14'],
      [{ date: '2026-07-11', start: '19:00', end: '22:00' }],
    ),
    bookingsToday: 0,
    incomeToday: 0,
    covered: true,
    photosCount: 6,
  },
  {
    id: 'p4',
    ownerId: 'owner-1',
    name: 'חניה פרטית פלורנטין',
    address: 'פלורנטין 8, תל אביב',
    city: 'תל אביב',
    pricePerHour: 15,
    type: 'private',
    spotNumber: 'D1',
    description: 'חניה פרטית שקטה בשכונת פלורנטין.',
    rating: 4.6,
    reviewsCount: 42,
    walkMinutes: 4,
    available: true,
    status: 'inactive',
    image: PARKING_IMAGES.p4,
    images: PARKING_GALLERY.p4,
    lat: 32.0577,
    lng: 34.7668,
    availabilityHours: '08:00 - 20:00',
    availability: monthAvailability(weeklySchedule('08:00', '20:00'), ['2026-07-09', '2026-07-16']),
    bookingsToday: 0,
    incomeToday: 0,
    covered: false,
    photosCount: 3,
  },
  {
    id: 'p5',
    ownerId: 'owner-1',
    name: 'חניה בנמל תל אביב',
    address: 'נמל תל אביב, תל אביב',
    city: 'תל אביב',
    pricePerHour: 20,
    type: 'public',
    spotNumber: 'E5',
    description: 'חניה ליד נמל תל אביב, מושלמת לבילוי.',
    rating: 4.7,
    reviewsCount: 201,
    walkMinutes: 1,
    available: true,
    status: 'active',
    image: PARKING_IMAGES.p5,
    images: PARKING_GALLERY.p5,
    lat: 32.0972,
    lng: 34.7755,
    availabilityHours: '00:00 - 23:59',
    availability: monthAvailability(
      weeklySchedule('00:00', '23:59'),
      ['2026-07-18', '2026-07-25'],
      [
        { date: '2026-07-07', start: '12:00', end: '16:00' },
        { date: '2026-07-13', start: '20:00', end: '23:00' },
      ],
    ),
    bookingsToday: 3,
    incomeToday: 120,
    covered: false,
    photosCount: 10,
  },
];

export const bookings = [
  {
    id: 'b1',
    userId: 'user-1',
    parkingId: 'p1',
    date: '2026-06-28',
    startTime: '12:00',
    endTime: '14:30',
    durationHours: 2.5,
    totalPrice: 55,
    status: 'completed',
    paymentMethod: 'כרטיס אשראי',
    createdAt: '2026-06-28T11:45:00',
    review: { rating: 5, text: 'חניה נוחה ונקייה, כניסה קלה.' },
  },
  {
    id: 'b2',
    userId: 'user-1',
    parkingId: 'p5',
    date: '2026-06-25',
    startTime: '19:00',
    endTime: '22:00',
    durationHours: 3,
    totalPrice: 60,
    status: 'completed',
    paymentMethod: 'Apple Pay',
    createdAt: '2026-06-25T18:30:00',
  },
  {
    id: 'b3',
    userId: 'user-1',
    parkingId: 'p2',
    date: '2026-06-20',
    startTime: '10:00',
    endTime: '12:00',
    durationHours: 2,
    totalPrice: 50,
    status: 'completed',
    paymentMethod: 'כרטיס אשראי',
    createdAt: '2026-06-20T09:50:00',
    review: { rating: 4, text: 'מיקום מעולה, קצת צפוף בשעות עומס.' },
  },
  {
    id: 'b4',
    userId: 'user-1',
    parkingId: 'p3',
    date: '2026-06-15',
    startTime: '18:30',
    endTime: '21:00',
    durationHours: 2.5,
    totalPrice: 45,
    status: 'completed',
    paymentMethod: 'Google Pay',
    createdAt: '2026-06-15T18:15:00',
  },
  {
    id: 'b5',
    userId: 'user-1',
    parkingId: 'p1',
    date: '2026-06-10',
    startTime: '09:00',
    endTime: '11:00',
    durationHours: 2,
    totalPrice: 44,
    status: 'completed',
    paymentMethod: 'כרטיס אשראי',
    createdAt: '2026-06-10T08:40:00',
  },
  {
    id: 'b6',
    userId: 'user-1',
    parkingId: 'p4',
    date: '2026-05-28',
    startTime: '14:00',
    endTime: '17:00',
    durationHours: 3,
    totalPrice: 45,
    status: 'completed',
    paymentMethod: 'Apple Pay',
    createdAt: '2026-05-28T13:30:00',
  },
  {
    id: 'b7',
    userId: 'user-1',
    parkingId: 'p2',
    date: '2026-05-20',
    startTime: '11:30',
    endTime: '13:30',
    durationHours: 2,
    totalPrice: 50,
    status: 'completed',
    paymentMethod: 'כרטיס אשראי',
    createdAt: '2026-05-20T11:00:00',
  },
  {
    id: 'b8',
    userId: 'user-1',
    parkingId: 'p5',
    date: '2026-05-12',
    startTime: '16:00',
    endTime: '18:00',
    durationHours: 2,
    totalPrice: 40,
    status: 'completed',
    paymentMethod: 'Google Pay',
    createdAt: '2026-05-12T15:45:00',
  },
  {
    id: 'b9',
    userId: 'user-1',
    parkingId: 'p1',
    date: offsetDateStr(0),
    startTime: '10:00',
    endTime: '13:00',
    durationHours: 3,
    totalPrice: 66,
    status: 'active',
    paymentMethod: 'כרטיס אשראי',
    createdAt: `${offsetDateStr(0)}T09:40:00`,
  },
  {
    id: 'b10',
    userId: 'user-1',
    parkingId: 'p1',
    date: offsetDateStr(0),
    startTime: '18:00',
    endTime: '21:00',
    durationHours: 3,
    totalPrice: 66,
    status: 'scheduled',
    paymentMethod: 'כרטיס אשראי',
    createdAt: `${offsetDateStr(-1)}T12:00:00`,
  },
  {
    id: 'b11',
    userId: 'user-1',
    parkingId: 'p2',
    date: offsetDateStr(1),
    startTime: '09:00',
    endTime: '12:30',
    durationHours: 3.5,
    totalPrice: 87.5,
    status: 'scheduled',
    paymentMethod: 'Apple Pay',
    createdAt: `${offsetDateStr(-1)}T16:20:00`,
  },
  {
    id: 'b12',
    userId: 'user-1',
    parkingId: 'p1',
    date: offsetDateStr(2),
    startTime: '14:00',
    endTime: '17:00',
    durationHours: 3,
    totalPrice: 66,
    status: 'scheduled',
    paymentMethod: 'כרטיס אשראי',
    createdAt: `${offsetDateStr(0)}T08:10:00`,
  },
  {
    id: 'b13',
    userId: 'user-1',
    parkingId: 'p3',
    date: offsetDateStr(3),
    startTime: '19:00',
    endTime: '22:00',
    durationHours: 3,
    totalPrice: 54,
    status: 'scheduled',
    paymentMethod: 'Google Pay',
    createdAt: `${offsetDateStr(0)}T11:00:00`,
  },
  {
    id: 'b14',
    userId: 'user-1',
    parkingId: 'p2',
    date: offsetDateStr(5),
    startTime: '11:00',
    endTime: '15:00',
    durationHours: 4,
    totalPrice: 100,
    status: 'scheduled',
    paymentMethod: 'כרטיס אשראי',
    createdAt: `${offsetDateStr(1)}T09:00:00`,
  },
];

export const ownerStatsByOwnerId = {
  'owner-1': {
    incomeToday: 120,
    incomeTodayAvg: 112,
    bookingsToday: 3,
    bookingsChange: '+12% מאתמול',
    monthlyIncome: 1480,
    monthlyGoal: 2000,
  },
};

export const recentSearches = [
  { id: 's1', query: "רח' הרצל 45, תל אביב", time: 'לפני שעתיים' },
  { id: 's2', query: 'דיזנגוף סנטר', time: 'אתמול' },
  { id: 's3', query: 'נמל תל אביב', time: 'לפני 3 ימים' },
];

export function getParkingById(id) {
  return parkings.find((p) => p.id === id);
}

export function getBookingsByUserId(userId) {
  return bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getBookingById(id) {
  return bookings.find((b) => b.id === id) || null;
}

export function getParkingsByOwnerId(ownerId) {
  return parkings.filter((p) => p.ownerId === ownerId);
}

export function getUserStats(userId) {
  const userBookings = getBookingsByUserId(userId);
  return {
    savedParkings: userBookings.filter((b) => b.status === 'saved').length,
    completedParkings: userBookings.filter((b) => b.status === 'completed').length,
  };
}

export function getSavedBookingByUserId(userId) {
  return bookings.find((b) => b.userId === userId && b.status === 'saved') || null;
}

export function getActiveBookingByUserId(userId) {
  return bookings.find((b) => b.userId === userId && b.status === 'active') || null;
}

export function getOwnerStats(ownerId) {
  const ownerParkings = getParkingsByOwnerId(ownerId);
  const stats = ownerStatsByOwnerId[ownerId] || {
    incomeToday: 0,
    incomeTodayAvg: 0,
    bookingsToday: 0,
    bookingsChange: '',
    monthlyIncome: 0,
    monthlyGoal: 2000,
  };

  return {
    ...stats,
    activeParkings: ownerParkings.filter((p) => p.status === 'active').length,
    totalParkings: ownerParkings.length,
  };
}

export function getUserByEmail(email) {
  return users.find((u) => u.email === email);
}
