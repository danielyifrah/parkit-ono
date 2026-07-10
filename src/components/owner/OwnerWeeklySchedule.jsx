import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { toLocalDateStr } from '../../lib/bookingPricing';
import { formatDisplayDate, getDayName, timeToMinutes } from '../../lib/availability';
import { MAX_SEARCH_DAYS_AHEAD } from '../../lib/searchContext';
import Icon from '../ui/Icon';
import './OwnerWeeklySchedule.css';

const HOUR_HEIGHT = 56;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 24;
const DAY_START_MIN = DAY_START_HOUR * 60;
const DAY_END_MIN = DAY_END_HOUR * 60;
const GRID_HEIGHT = ((DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT);
const DAYS_PER_PAGE = 3;

const PARKING_COLORS = [
  { bg: '#DBEAFE', border: '#2563EB', text: '#1E3A8A' },
  { bg: '#D1FAE5', border: '#059669', text: '#064E3B' },
  { bg: '#FEF3C7', border: '#D97706', text: '#78350F' },
  { bg: '#E0E7FF', border: '#4F46E5', text: '#312E81' },
  { bg: '#FCE7F3', border: '#DB2777', text: '#831843' },
];

const STATUS_LABELS = {
  active: 'פעילה',
  scheduled: 'מתוזמנת',
  pending_arrival: 'ממתינה',
  saved: 'שמורה',
};

function buildWeekDays(daysAhead = MAX_SEARCH_DAYS_AHEAD) {
  const today = new Date();
  const days = [];

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateStr = toLocalDateStr(date);
    days.push({
      date: dateStr,
      dayName: getDayName(dateStr),
      displayDate: formatDisplayDate(dateStr),
      isToday: offset === 0,
      relativeLabel: offset === 0 ? 'היום' : offset === 1 ? 'מחר' : null,
    });
  }

  return days;
}

function clampBookingToGrid(booking) {
  const startMin = Math.max(DAY_START_MIN, timeToMinutes(booking.startTime));
  let endMin = timeToMinutes(booking.endTime);
  if (endMin <= startMin) endMin = Math.min(DAY_END_MIN, startMin + 30);
  endMin = Math.min(DAY_END_MIN, endMin);
  if (endMin <= DAY_START_MIN || startMin >= DAY_END_MIN) return null;
  return { startMin, endMin };
}

function getHourLabels() {
  const labels = [];
  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour += 1) {
    labels.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return labels;
}

export default function OwnerWeeklySchedule({ parkings, ownerId }) {
  const { getOwnerUpcomingBookings, version } = useParking();
  const [isOpen, setIsOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedParkingId, setSelectedParkingId] = useState('all');

  const weekDays = useMemo(() => buildWeekDays(), []);
  const hourLabels = useMemo(() => getHourLabels(), []);
  const pageCount = Math.max(1, Math.ceil(weekDays.length / DAYS_PER_PAGE));

  const visibleDays = useMemo(() => {
    const start = pageIndex * DAYS_PER_PAGE;
    return weekDays.slice(start, start + DAYS_PER_PAGE);
  }, [pageIndex, weekDays]);

  const parkingColorMap = useMemo(() => {
    const map = {};
    parkings.forEach((parking, index) => {
      map[parking.id] = PARKING_COLORS[index % PARKING_COLORS.length];
    });
    return map;
  }, [parkings]);

  const bookings = useMemo(() => {
    const all = getOwnerUpcomingBookings(ownerId);
    if (selectedParkingId === 'all') return all;
    return all.filter((booking) => booking.parkingId === selectedParkingId);
  }, [getOwnerUpcomingBookings, ownerId, selectedParkingId, version]);

  const bookingsByDate = useMemo(() => {
    const map = Object.fromEntries(weekDays.map((day) => [day.date, []]));
    bookings.forEach((booking) => {
      if (!map[booking.date]) return;
      const clamped = clampBookingToGrid(booking);
      if (!clamped) return;
      map[booking.date].push({
        ...booking,
        ...clamped,
        color: parkingColorMap[booking.parkingId] || PARKING_COLORS[0],
      });
    });
    return map;
  }, [bookings, parkingColorMap, weekDays]);

  const visibleBookingsCount = useMemo(
    () => visibleDays.reduce((sum, day) => sum + (bookingsByDate[day.date]?.length || 0), 0),
    [bookingsByDate, visibleDays],
  );

  const nowLineTop = useMemo(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < DAY_START_MIN || minutes >= DAY_END_MIN) return null;
    return ((minutes - DAY_START_MIN) / 60) * HOUR_HEIGHT;
  }, []);

  const rangeLabel = visibleDays.length > 0
    ? `${visibleDays[0].displayDate} – ${visibleDays[visibleDays.length - 1].displayDate}`
    : '';

  if (!parkings.length) return null;

  return (
    <section className="owner-week-schedule">
      <button
        type="button"
        className={`owner-week-schedule__toggle ${isOpen ? 'owner-week-schedule__toggle--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="owner-week-schedule__title-wrap">
          <Icon icon={CalendarDays} size={18} className="app-icon--primary" />
          <div>
            <h2 className="list-section-title">לוח הזמנות — שבוע קרוב</h2>
            <p className="owner-week-schedule__subtitle">
              {isOpen
                ? 'מי שמר את החניה ב־7 הימים הקרובים, ומתי היא פנויה לשימוש שלך'
                : bookings.length > 0
                  ? `${bookings.length} הזמנות בשבוע הקרוב · לחצו לפתיחה`
                  : 'אין הזמנות בשבוע הקרוב · לחצו לפתיחה'}
            </p>
          </div>
        </div>
        <Icon
          icon={isOpen ? ChevronUp : ChevronDown}
          size={20}
          className="app-icon--muted"
        />
      </button>

      {isOpen && (
        <div className="owner-week-schedule__body">
          <div className="owner-week-schedule__toolbar">
            {parkings.length > 1 && (
              <label className="owner-week-schedule__filter">
                <span>חניה</span>
                <select
                  value={selectedParkingId}
                  onChange={(e) => setSelectedParkingId(e.target.value)}
                >
                  <option value="all">כל החניות</option>
                  {parkings.map((parking) => (
                    <option key={parking.id} value={parking.id}>{parking.name}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="owner-week-schedule__pager">
              <button
                type="button"
                className="owner-week-schedule__pager-btn"
                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                disabled={pageIndex === 0}
                aria-label="3 ימים קודמים"
              >
                <Icon icon={ChevronRight} size={18} />
              </button>
              <div className="owner-week-schedule__pager-label">
                <strong>{rangeLabel}</strong>
                <span>
                  {pageIndex + 1} / {pageCount}
                  {visibleBookingsCount > 0 ? ` · ${visibleBookingsCount} הזמנות` : ''}
                </span>
              </div>
              <button
                type="button"
                className="owner-week-schedule__pager-btn"
                onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
                disabled={pageIndex >= pageCount - 1}
                aria-label="3 ימים הבאים"
              >
                <Icon icon={ChevronLeft} size={18} />
              </button>
            </div>
          </div>

          <div className="owner-week-schedule__card">
            <div className="owner-week-schedule__scroll">
              <div
                className="owner-week-schedule__grid"
                style={{ '--day-count': visibleDays.length }}
              >
                <div className="owner-week-schedule__corner" aria-hidden="true" />

                {visibleDays.map((day) => (
                  <div
                    key={day.date}
                    className={`owner-week-schedule__day-head ${day.isToday ? 'owner-week-schedule__day-head--today' : ''}`}
                  >
                    <span className="owner-week-schedule__day-name">
                      {day.relativeLabel || `יום ${day.dayName}`}
                    </span>
                    <span className="owner-week-schedule__day-date">{day.displayDate}</span>
                  </div>
                ))}

                <div className="owner-week-schedule__hours" style={{ height: GRID_HEIGHT }}>
                  {hourLabels.map((label) => (
                    <div key={label} className="owner-week-schedule__hour" style={{ height: HOUR_HEIGHT }}>
                      <span dir="ltr">{label}</span>
                    </div>
                  ))}
                </div>

                {visibleDays.map((day) => (
                  <div
                    key={`col-${day.date}`}
                    className={`owner-week-schedule__day-col ${day.isToday ? 'owner-week-schedule__day-col--today' : ''}`}
                    style={{ height: GRID_HEIGHT }}
                  >
                    {hourLabels.map((label) => (
                      <div
                        key={`${day.date}-${label}`}
                        className="owner-week-schedule__slot"
                        style={{ height: HOUR_HEIGHT }}
                      />
                    ))}

                    {day.isToday && nowLineTop != null && (
                      <div
                        className="owner-week-schedule__now"
                        style={{ top: nowLineTop }}
                        aria-hidden="true"
                      />
                    )}

                    {(bookingsByDate[day.date] || []).map((booking) => {
                      const top = ((booking.startMin - DAY_START_MIN) / 60) * HOUR_HEIGHT;
                      const height = Math.max(
                        44,
                        ((booking.endMin - booking.startMin) / 60) * HOUR_HEIGHT - 3,
                      );
                      const showStatus = height >= 64;
                      const statusLabel = STATUS_LABELS[booking.status] || 'תפוסה';

                      return (
                        <article
                          key={booking.id}
                          className="owner-week-schedule__event"
                          style={{
                            top,
                            height,
                            background: booking.color.bg,
                            borderColor: booking.color.border,
                            color: booking.color.text,
                          }}
                          title={`${booking.parkingName} · ${booking.startTime}–${booking.endTime} · ${statusLabel}`}
                        >
                          <strong className="owner-week-schedule__event-name">
                            {booking.parkingName}
                          </strong>
                          <span className="owner-week-schedule__event-time" dir="ltr">
                            {booking.startTime}–{booking.endTime}
                          </span>
                          {showStatus && (
                            <span className="owner-week-schedule__event-status">
                              {statusLabel}
                            </span>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {bookings.length === 0 ? (
              <p className="owner-week-schedule__empty">
                אין הזמנות בשבוע הקרוב — החניה פנויה לשימוש שלך בכל שעות הזמינות.
              </p>
            ) : (
              <ul className="owner-week-schedule__legend">
                {(selectedParkingId === 'all' ? parkings : parkings.filter((p) => p.id === selectedParkingId))
                  .map((parking) => {
                    const color = parkingColorMap[parking.id] || PARKING_COLORS[0];
                    return (
                      <li key={parking.id}>
                        <span
                          className="owner-week-schedule__legend-swatch"
                          style={{ background: color.bg, borderColor: color.border }}
                        />
                        {parking.name}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
