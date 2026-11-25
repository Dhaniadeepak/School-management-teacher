import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnnouncementsQuery, useDashboardQuery } from '../api/teacherApi';
import { Alert, Badge, Card, Empty, Spinner } from '../components/ui';
import { cacheDashboard, cachedDashboard, readQueue } from '../lib/offline';
import { errorMessage, formatDate, isNetworkError, todayISO } from '../lib/utils';
import type { ScheduleSlot } from '../types';

function SlotRow({ slot, current }: { slot: ScheduleSlot; current: boolean }) {
  const cls = `slot ${slot.kind} ${current ? 'current' : ''}`;
  return (
    <div className={cls}>
      <div className="time">
        P{slot.period}
        <br />
        {slot.start}–{slot.end}
      </div>
      <div className="what">
        {slot.kind === 'class' && (
          <>
            <strong>Class {slot.className}</strong> · {slot.subject}
            {slot.room && <div className="muted small">Room {slot.room}</div>}
          </>
        )}
        {slot.kind === 'free' && <span className="muted">Free period</span>}
        {slot.kind === 'duty' && (
          <>
            <strong>Free period · {slot.note || 'Duty'}</strong>
            {(slot.className || slot.room) && (
              <div className="small">
                Go to {slot.className ? `Class ${slot.className}` : ''} {slot.room ? `Room ${slot.room}` : ''}
              </div>
            )}
          </>
        )}
        {slot.kind === 'substitution' && (
          <>
            <strong>Cover Class {slot.className}</strong> {slot.subject ? `· ${slot.subject}` : ''}
            <div className="small">
              {slot.room ? `Room ${slot.room}. ` : ''}
              {slot.note}
            </div>
          </>
        )}
        {slot.kind === 'covered' && (
          <>
            <span>Class {slot.className}</span>
            <div className="muted small">{slot.note}</div>
          </>
        )}
      </div>
      {current && <Badge tone="blue">Now</Badge>}
    </div>
  );
}

export default function DashboardPage() {
  const [date, setDate] = useState(todayISO());
  const { data: live, isLoading, error, refetch } = useDashboardQuery(date, { pollingInterval: 5 * 60_000 });
  const { data: notices = [] } = useAnnouncementsQuery();
  const offline = isNetworkError(error);
  const cached = offline ? cachedDashboard() : null;
  const data = live ?? (cached && cached.date === date ? cached : null);
  const [queued, setQueued] = useState(readQueue().length);

  useEffect(() => {
    if (live && live.date === todayISO()) cacheDashboard(live);
  }, [live]);
  useEffect(() => {
    const update = () => setQueued(readQueue().length);
    window.addEventListener('attendance-queue-changed', update);
    return () => window.removeEventListener('attendance-queue-changed', update);
  }, []);

  const upcomingEvents = notices.filter((n) => n.event && n.event.date >= todayISO()).slice(0, 3);
  const freeWithDuty = data?.slots.filter((s) => s.kind === 'duty' || s.kind === 'substitution') ?? [];

  return (
    <>
      <div className="row between">
        <div>
          <h2>Hello, {data?.name ?? ''}</h2>
          <span className="muted small">{formatDate(date)}</span>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {offline && <Alert kind="warning">You are offline. {cached ? 'Showing the timetable saved on this phone.' : ''}</Alert>}
      {queued > 0 && <Alert kind="info">{queued} attendance submission(s) will be sent when you are back online.</Alert>}
      {error && !offline && <Alert>{errorMessage(error)}</Alert>}

      {isLoading && !data ? (
        <Spinner />
      ) : !data ? (
        <Empty>
          Could not load your timetable. <button className="btn btn-ghost" onClick={() => refetch()}>Try again</button>
        </Empty>
      ) : data.holiday ? (
        <Card>
          <Empty>🎉 {data.holiday} — no periods today.</Empty>
        </Card>
      ) : (
        <>
          {data.onLeave && <Alert kind="info">You are on approved leave this day.</Alert>}
          {freeWithDuty.length > 0 && (
            <Alert kind="warning">
              {freeWithDuty.map((s) => `P${s.period}: ${s.kind === 'substitution' ? `cover ${s.className}` : s.note || 'duty'}`).join(' · ')}
            </Alert>
          )}
          <Card title="Periods">
            {!data.slots.length ? (
              <Empty>No timetable published yet.</Empty>
            ) : (
              <div className="stack" style={{ gap: '0.5rem' }}>
                {data.slots.map((s) => (
                  <SlotRow key={s.period} slot={s} current={s.period === data.currentPeriod} />
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <div className="grid grid-2">
        <Card title="Quick actions">
          <div className="stack">
            <Link className="btn btn-primary block" to="/attendance">
              Mark attendance
            </Link>
            <Link className="btn btn-secondary block" to="/homework">
              Post homework
            </Link>
          </div>
        </Card>
        <Card title="Upcoming events">
          {!upcomingEvents.length ? (
            <Empty>No upcoming events.</Empty>
          ) : (
            <ul className="list">
              {upcomingEvents.map((e) => (
                <li key={e.id}>
                  <strong>{e.title}</strong>
                  <div className="muted small">
                    {formatDate(e.event!.date)} {e.event!.time ?? ''} {e.event!.place ? `· ${e.event!.place}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
