import { useEffect, useMemo, useState } from 'react';
import { useAttendanceQuery, useClassesQuery, useDashboardQuery, useSubmitAttendanceMutation } from '../api/teacherApi';
import { Alert, Button, Card, Empty, Field, Spinner } from '../components/ui';
import { enqueueAttendance, newSubmissionId } from '../lib/offline';
import { errorMessage, formatDateTime, isNetworkError, todayISO } from '../lib/utils';

/** T4: everyone starts present; tap the absent ones and submit. Parents of absent children are told. */
export default function AttendancePage() {
  const date = todayISO();
  const { data: classes, isLoading: loadingClasses, error: classesError } = useClassesQuery();
  const { data: dash } = useDashboardQuery(date);
  const [classId, setClassId] = useState('');
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ kind: 'success' | 'info'; text: string } | null>(null);

  // Default to the class of the current period, else the teacher's own class, else the first one
  useEffect(() => {
    if (classId || !classes?.length) return;
    const now = dash?.slots.find((s) => s.period === dash.currentPeriod && s.classId);
    const preferred = classes.find((c) => c.id === now?.classId) ?? classes.find((c) => c.isClassTeacher) ?? classes[0];
    setClassId(preferred.id);
  }, [classes, dash, classId]);

  const { data: sheet, isFetching, error } = useAttendanceQuery({ classId, date }, { skip: !classId });
  const [submit, submitState] = useSubmitAttendanceMutation();

  useEffect(() => {
    setResult(null);
    if (sheet) setAbsent(new Set(sheet.students.filter((s) => s.status === 'absent').map((s) => s.id)));
  }, [sheet]);

  const className = useMemo(() => classes?.find((c) => c.id === classId)?.label ?? '', [classes, classId]);

  const toggle = (id: string) =>
    setAbsent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSubmit = async () => {
    if (!sheet) return;
    const body = { classId, date, absentStudentIds: [...absent], clientSubmissionId: newSubmissionId() };
    const res = await submit(body);
    if ('data' in res && res.data) {
      setResult({
        kind: 'success',
        text: `Attendance saved for Class ${className}. ${absent.size} absent${res.data.newlyAbsent ? `; ${res.data.newlyAbsent} parent alert(s) are being sent.` : '.'}`,
      });
    } else if ('error' in res && isNetworkError(res.error)) {
      enqueueAttendance({ ...body, className, savedAt: new Date().toISOString() });
      setResult({ kind: 'info', text: 'No connection. Attendance is saved on this phone and will be sent automatically when you are online.' });
    }
  };

  if (loadingClasses) return <Spinner />;
  if (classesError) return <Alert>{errorMessage(classesError)}</Alert>;
  if (!classes?.length) return <Empty>You have no classes yet. The office assigns classes through the timetable.</Empty>;

  const total = sheet?.students.length ?? 0;

  return (
    <>
      <Card>
        <div className="form-grid">
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {c.isClassTeacher ? ' (my class)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input value={date} readOnly />
          </Field>
        </div>
        {sheet?.marked && <p className="muted small">Already submitted {formatDateTime(sheet.markedAt)}. You can change it and submit again.</p>}
      </Card>

      {error ? (
        <Alert>{errorMessage(error)}</Alert>
      ) : !sheet ? (
        <Spinner />
      ) : !total ? (
        <Empty>No students in this class.</Empty>
      ) : (
        <>
          <div className="row between">
            <strong>
              {total - absent.size} present · <span style={{ color: 'var(--red)' }}>{absent.size} absent</span>
            </strong>
            <span className="muted small">Tap a name to mark absent</span>
          </div>
          <div className="att-list" style={{ opacity: isFetching ? 0.6 : 1 }}>
            {sheet.students.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                className={`att-row ${absent.has(s.id) ? 'absent' : ''}`}
                onClick={() => toggle(s.id)}
                onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && toggle(s.id)}
              >
                <span className="roll">{s.rollNo ?? ''}</span>
                <span className="name">{s.name}</span>
                <span className="state">{absent.has(s.id) ? 'Absent' : 'Present'}</span>
              </div>
            ))}
          </div>
          {result && <Alert kind={result.kind}>{result.text}</Alert>}
          {submitState.isError && !isNetworkError(submitState.error) && <Alert>{errorMessage(submitState.error)}</Alert>}
          <Button className="block" onClick={onSubmit} loading={submitState.isLoading}>
            Submit attendance ({absent.size} absent)
          </Button>
        </>
      )}
    </>
  );
}
