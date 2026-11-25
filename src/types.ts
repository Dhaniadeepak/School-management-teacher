export type UserStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent';
  status: UserStatus;
  phone?: string;
  schoolId: string;
  schoolName: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type SlotKind = 'class' | 'duty' | 'free' | 'substitution' | 'covered';

export interface ScheduleSlot {
  period: number;
  start?: string;
  end?: string;
  kind: SlotKind;
  classId?: string;
  className?: string;
  subject?: string;
  room?: string;
  note?: string;
}

export interface TeacherDashboard {
  date: string;
  holiday?: string;
  onLeave: boolean;
  slots: ScheduleSlot[];
  currentPeriod: number | null;
  unreadNotifications: number;
  pendingLeave: number;
  name: string;
}

export interface TeacherClass {
  id: string;
  label: string;
  isClassTeacher: boolean;
}

export interface AttendanceSheet {
  date: string;
  classId: string;
  marked: boolean;
  markedAt: string | null;
  students: { id: string; name: string; rollNo: number | null; admissionNo: string; status: 'present' | 'absent'; recorded: boolean }[];
}

export interface AttendanceSubmit {
  classId: string;
  date: string;
  absentStudentIds: string[];
  clientSubmissionId?: string;
}

export interface Attachment {
  key: string;
  name: string;
  mime: string;
  size: number;
  url: string;
}

export interface HomeworkItem {
  id: string;
  classId: string;
  className: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  mine: boolean;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaveItem {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decisionComment: string | null;
  decidedAt: string | null;
  document: { name: string; url: string } | null;
  appliedAt: string;
}

export interface AnnouncementItem {
  id: string;
  kind: 'notice' | 'event';
  title: string;
  body: string;
  event: { date: string; time?: string; place?: string } | null;
  publishAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  read: boolean;
  createdAt: string;
}
