import { useState, type FormEvent } from 'react';
import { useClassesQuery, useCreateHomeworkMutation, useDeleteHomeworkMutation, useHomeworkQuery, useUpdateHomeworkMutation } from '../api/teacherApi';
import { Alert, Button, Card, Empty, Field, Modal, Spinner } from '../components/ui';
import { errorMessage, formatDate, todayISO } from '../lib/utils';
import type { HomeworkItem } from '../types';

const MAX_MB = 10;

function HomeworkForm({ item, onClose }: { item: HomeworkItem | null; onClose: () => void }) {
  const { data: classes = [] } = useClassesQuery();
  const [create, createState] = useCreateHomeworkMutation();
  const [update, updateState] = useUpdateHomeworkMutation();
  const [classId, setClassId] = useState(item?.classId ?? classes[0]?.id ?? '');
  const [subject, setSubject] = useState(item?.subject ?? '');
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [dueDate, setDueDate] = useState(item?.dueDate ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [removeKeys, setRemoveKeys] = useState<string[]>([]);
  const [fileError, setFileError] = useState('');

  const pickFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const tooBig = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
    const wrong = picked.find((f) => !(f.type.startsWith('image/') || f.type === 'application/pdf'));
    setFileError(tooBig ? `${tooBig.name} is larger than ${MAX_MB} MB` : wrong ? `${wrong.name}: only photos or PDF` : '');
    setFiles(tooBig || wrong ? [] : picked);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (!item) fd.append('classId', classId);
    fd.append('subject', subject);
    fd.append('title', title);
    fd.append('description', description);
    fd.append('dueDate', dueDate);
    files.forEach((f) => fd.append('attachments', f));
    if (item && removeKeys.length) fd.append('removeKeys', JSON.stringify(removeKeys));
    const res = item ? await update({ id: item.id, body: fd }).unwrap().catch(() => null) : await create(fd).unwrap().catch(() => null);
    if (res !== null) onClose();
  };
  const state = item ? updateState : createState;

  return (
    <Modal title={item ? 'Edit homework' : 'Post homework'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        {!item && (
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} required>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="form-grid">
          <Field label="Subject">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </Field>
          <Field label="Due date">
            <input type="date" min={todayISO()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </Field>
        </div>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
        </Field>
        <Field label="Details">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Field>
        {item?.attachments.length ? (
          <div className="stack" style={{ gap: '0.25rem' }}>
            <span className="field-label">Current files</span>
            {item.attachments.map((a) => (
              <label key={a.key} className="check">
                <input
                  type="checkbox"
                  checked={!removeKeys.includes(a.key)}
                  onChange={(e) => setRemoveKeys((k) => (e.target.checked ? k.filter((x) => x !== a.key) : [...k, a.key]))}
                />
                {a.name}
              </label>
            ))}
          </div>
        ) : null}
        <Field label="Photo or PDF (optional)" hint={`Up to 5 files, ${MAX_MB} MB each`}>
          <input type="file" accept="image/*,application/pdf" multiple capture="environment" onChange={(e) => pickFiles(e.target.files)} />
        </Field>
        <Alert>{fileError || errorMessage(state.error)}</Alert>
        <p className="muted small">Parents of this class get a notification{item ? ' that the homework was updated' : ''}.</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={state.isLoading} disabled={!!fileError}>
            {item ? 'Save' : 'Post'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function HomeworkPage() {
  const { data: classes = [] } = useClassesQuery();
  const [classId, setClassId] = useState('');
  const { data, isLoading, error } = useHomeworkQuery(classId || undefined);
  const [remove] = useDeleteHomeworkMutation();
  const [editing, setEditing] = useState<HomeworkItem | null | 'new'>(null);

  return (
    <>
      <div className="row between">
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">All my classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <Button onClick={() => setEditing('new')} disabled={!classes.length}>
          + Post homework
        </Button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert>{errorMessage(error)}</Alert>
      ) : !data?.length ? (
        <Empty>No homework posted yet.</Empty>
      ) : (
        data.map((h) => (
          <Card
            key={h.id}
            title={
              <>
                {h.className} · {h.subject}
              </>
            }
            actions={<span className="muted small">Due {formatDate(h.dueDate)}</span>}
          >
            <strong>{h.title}</strong>
            {h.description && <p style={{ whiteSpace: 'pre-wrap', margin: '0.35rem 0' }}>{h.description}</p>}
            {h.attachments.map((a) => (
              <div key={a.key}>
                📎{' '}
                <a href={a.url} target="_blank" rel="noreferrer">
                  {a.name}
                </a>
              </div>
            ))}
            {h.mine && (
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setEditing(h)}>
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => confirm('Delete this homework?') && remove(h.id)}>
                  Delete
                </Button>
              </div>
            )}
          </Card>
        ))
      )}
      {editing && <HomeworkForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
