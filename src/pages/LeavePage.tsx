import { useState, type FormEvent } from 'react';
import { useApplyLeaveMutation, useCancelLeaveMutation, useLeaveQuery, useLeaveTypesQuery } from '../api/teacherApi';
import { Alert, Badge, Button, Card, Empty, Field, Spinner } from '../components/ui';
import { errorMessage, formatDate, todayISO } from '../lib/utils';

const tone = { pending: 'amber', approved: 'green', rejected: 'red', cancelled: 'gray' } as const;

/** T6: apply for leave and follow its status. */
export default function LeavePage() {
  const { data: types = [] } = useLeaveTypesQuery();
  const { data, isLoading, error } = useLeaveQuery();
  const [apply, applyState] = useApplyLeaveMutation();
  const [cancel, cancelState] = useCancelLeaveMutation();
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setDone(false);
    const fd = new FormData();
    fd.append('type', type || types[0]);
    fd.append('from', from);
    fd.append('to', to || from);
    fd.append('reason', reason);
    if (file) fd.append('document', file);
    const ok = await apply(fd).unwrap().catch(() => null);
    if (ok !== null) {
      setFrom('');
      setTo('');
      setReason('');
      setFile(null);
      setDone(true);
    }
  };

  const today = todayISO();

  return (
    <>
      <Card title="Apply for leave">
        <form className="stack" onSubmit={submit}>
          <Field label="Type">
            <select value={type || types[0] || ''} onChange={(e) => setType(e.target.value)} required>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <div className="form-grid">
            <Field label="From">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
            </Field>
            <Field label="To">
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <Field label="Reason">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
          </Field>
          <Field label="Document (optional)" hint="e.g. medical certificate, photo or PDF">
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
          <Alert>{errorMessage(applyState.error)}</Alert>
          {done && <Alert kind="success">Leave request sent. You will be notified when the office decides.</Alert>}
          <Button className="block" loading={applyState.isLoading}>
            Send request
          </Button>
        </form>
      </Card>

      <Card title="My requests">
        <Alert>{errorMessage(cancelState.error)}</Alert>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <Alert>{errorMessage(error)}</Alert>
        ) : !data?.length ? (
          <Empty>No leave requests yet.</Empty>
        ) : (
          <ul className="list">
            {data.map((l) => (
              <li key={l.id} className="stack" style={{ gap: '0.2rem' }}>
                <div className="row between">
                  <strong>
                    {l.type} · {l.days} day(s)
                  </strong>
                  <Badge tone={tone[l.status]}>{l.status}</Badge>
                </div>
                <span className="small">
                  {formatDate(l.from)} – {formatDate(l.to)}
                </span>
                <span className="muted small">{l.reason}</span>
                {l.decisionComment && <span className="small">Office: {l.decisionComment}</span>}
                {(l.status === 'pending' || (l.status === 'approved' && l.from > today)) && (
                  <div>
                    <Button variant="ghost" onClick={() => confirm('Cancel this leave request?') && cancel(l.id)}>
                      Cancel request
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
