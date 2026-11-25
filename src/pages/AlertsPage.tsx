import { useState } from 'react';
import { useAnnouncementsQuery, useMarkAllReadMutation, useNotificationsQuery } from '../api/teacherApi';
import { Alert, Badge, Button, Card, Empty, Spinner, Tabs } from '../components/ui';
import { errorMessage, formatDate, formatDateTime } from '../lib/utils';

/** T7: notifications (leave decisions, timetable changes, cover) and school notices. */
export default function AlertsPage() {
  const [tab, setTab] = useState<'alerts' | 'notices'>('alerts');
  const notes = useNotificationsQuery();
  const notices = useAnnouncementsQuery();
  const [markAll, markState] = useMarkAllReadMutation();

  return (
    <>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'alerts', label: `Alerts${notes.data?.unreadCount ? ` (${notes.data.unreadCount})` : ''}` },
          { value: 'notices', label: 'Notices & events' },
        ]}
      />
      {tab === 'alerts' && (
        <Card
          actions={
            notes.data?.unreadCount ? (
              <Button variant="ghost" onClick={() => markAll()} loading={markState.isLoading}>
                Mark all read
              </Button>
            ) : null
          }
          title="Alerts"
        >
          {notes.isLoading ? (
            <Spinner />
          ) : notes.error ? (
            <Alert>{errorMessage(notes.error)}</Alert>
          ) : !notes.data?.items.length ? (
            <Empty>No alerts.</Empty>
          ) : (
            <ul className="list">
              {notes.data.items.map((n) => (
                <li key={n.id} style={{ fontWeight: n.read ? 400 : 600 }}>
                  <div className="row between">
                    <span>{n.title}</span>
                    <span className="muted small">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <div className="muted small">{n.body}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {tab === 'notices' && (
        <Card title="From the school">
          {notices.isLoading ? (
            <Spinner />
          ) : notices.error ? (
            <Alert>{errorMessage(notices.error)}</Alert>
          ) : !notices.data?.length ? (
            <Empty>No notices.</Empty>
          ) : (
            <ul className="list">
              {notices.data.map((a) => (
                <li key={a.id} className="stack" style={{ gap: '0.2rem' }}>
                  <div className="row between">
                    <strong>{a.title}</strong>
                    {a.kind === 'event' ? <Badge tone="blue">event</Badge> : <span className="muted small">{formatDate(a.publishAt)}</span>}
                  </div>
                  {a.event && (
                    <span className="small">
                      📅 {formatDate(a.event.date)} {a.event.time ?? ''} {a.event.place ? `· ${a.event.place}` : ''}
                    </span>
                  )}
                  {a.body && <span className="muted small" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
