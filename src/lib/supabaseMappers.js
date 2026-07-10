export function profileFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    avatar: row.avatar,
  };
}

export function profileToRow(profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    phone: profile.phone || '',
    role: profile.role,
    avatar: profile.avatar,
    updated_at: new Date().toISOString(),
  };
}

export function parkingFromRow(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    address: row.address,
    city: row.city,
    pricePerHour: Number(row.price_per_hour),
    type: row.type,
    spotNumber: row.spot_number,
    description: row.description,
    rating: Number(row.rating),
    reviewsCount: row.reviews_count,
    walkMinutes: row.walk_minutes,
    available: row.available,
    status: row.status,
    image: row.image,
    images: row.images || [],
    lat: row.lat,
    lng: row.lng,
    availabilityHours: row.availability_hours,
    availability: row.availability || {},
    bookingsToday: row.bookings_today,
    incomeToday: Number(row.income_today),
    covered: row.covered,
    photosCount: row.photos_count,
    notes: row.notes || '',
  };
}

export function parkingToRow(parking) {
  return {
    id: parking.id,
    owner_id: parking.ownerId,
    name: parking.name,
    address: parking.address,
    city: parking.city,
    price_per_hour: parking.pricePerHour,
    type: parking.type,
    spot_number: parking.spotNumber,
    description: parking.description,
    rating: parking.rating,
    reviews_count: parking.reviewsCount,
    walk_minutes: parking.walkMinutes,
    available: parking.available,
    status: parking.status,
    image: parking.image,
    images: parking.images || [],
    lat: parking.lat,
    lng: parking.lng,
    availability_hours: parking.availabilityHours,
    availability: parking.availability || {},
    bookings_today: parking.bookingsToday,
    income_today: parking.incomeToday,
    covered: parking.covered,
    photos_count: parking.photosCount,
    notes: parking.notes || '',
    updated_at: new Date().toISOString(),
  };
}

export function bookingFromRow(row) {
  const dateValue = row.date;
  const date = typeof dateValue === 'string'
    ? dateValue.split('T')[0]
    : dateValue;

  return {
    id: row.id,
    userId: row.user_id,
    parkingId: row.parking_id,
    date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationHours: Number(row.duration_hours),
    durationMinutes: row.duration_minutes,
    totalPrice: Number(row.total_price),
    basePrice: row.base_price != null ? Number(row.base_price) : undefined,
    discountPercent: row.discount_percent != null ? Number(row.discount_percent) : undefined,
    discountLabel: row.discount_label,
    paymentMethod: row.payment_method,
    status: row.status,
    slotBlocked: row.slot_blocked,
    holdStartedAt: row.hold_started_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    review: row.review,
  };
}

export function paymentMethodFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    type: row.type,
    label: row.label,
    brand: row.brand,
    lastFour: row.last_four,
    bankName: row.bank_name,
    bankBranch: row.bank_branch,
    accountHolderName: row.account_holder_name,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export function paymentMethodToRow(method) {
  return {
    id: method.id,
    user_id: method.userId,
    category: method.category,
    type: method.type,
    label: method.label,
    brand: method.brand || null,
    last_four: method.lastFour || null,
    bank_name: method.bankName || null,
    bank_branch: method.bankBranch || null,
    account_holder_name: method.accountHolderName || null,
    is_default: method.isDefault,
    updated_at: new Date().toISOString(),
  };
}

export function bookingToRow(booking) {
  return {
    id: booking.id,
    user_id: booking.userId,
    parking_id: booking.parkingId,
    date: booking.date,
    start_time: booking.startTime,
    end_time: booking.endTime,
    duration_hours: booking.durationHours,
    duration_minutes: booking.durationMinutes,
    total_price: booking.totalPrice,
    base_price: booking.basePrice,
    discount_percent: booking.discountPercent,
    discount_label: booking.discountLabel,
    payment_method: booking.paymentMethod,
    status: booking.status,
    slot_blocked: booking.slotBlocked,
    hold_started_at: booking.holdStartedAt,
    started_at: booking.startedAt,
    completed_at: booking.completedAt,
    created_at: booking.createdAt,
    review: booking.review,
  };
}
