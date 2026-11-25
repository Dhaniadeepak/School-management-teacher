import type {
  AnnouncementItem,
  AttendanceSheet,
  AttendanceSubmit,
  AuthUser,
  HomeworkItem,
  LeaveItem,
  NotificationItem,
  Session,
  TeacherClass,
  TeacherDashboard,
} from '../types';
import { baseApi, unwrap } from './baseApi';

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  schoolCode: string;
  subjects: string[];
  qualification?: string;
}

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ---------- auth ----------
    login: b.mutation<Session, { phone: string; password: string }>({
      query: (body) => ({ url: '/auth/teacher/login', method: 'POST', body }),
      transformResponse: unwrap<Session>,
    }),
    register: b.mutation<Session, RegisterInput>({
      query: (body) => ({ url: '/auth/teacher/register', method: 'POST', body }),
      transformResponse: unwrap<Session>,
    }),
    forgotPassword: b.mutation<unknown, { phone: string }>({
      query: (body) => ({ url: '/auth/password/forgot', method: 'POST', body: { ...body, role: 'teacher' } }),
    }),
    resetPassword: b.mutation<unknown, { phone: string; code: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/password/reset', method: 'POST', body: { ...body, role: 'teacher' } }),
    }),
    logout: b.mutation<unknown, void>({ query: () => ({ url: '/auth/logout', method: 'POST' }) }),
    me: b.query<AuthUser, void>({ query: () => '/me', transformResponse: unwrap<AuthUser> }),

    // ---------- T3 dashboard ----------
    dashboard: b.query<TeacherDashboard, string | void>({
      query: (date) => ({ url: '/teacher/dashboard', params: date ? { date } : undefined }),
      transformResponse: unwrap<TeacherDashboard>,
      providesTags: ['Dashboard'],
    }),
    classes: b.query<TeacherClass[], void>({
      query: () => '/teacher/classes',
      transformResponse: unwrap<TeacherClass[]>,
      providesTags: ['Classes'],
    }),

    // ---------- T4 attendance ----------
    attendance: b.query<AttendanceSheet, { classId: string; date: string }>({
      query: (params) => ({ url: '/teacher/attendance', params }),
      transformResponse: unwrap<AttendanceSheet>,
      providesTags: ['Attendance'],
    }),
    submitAttendance: b.mutation<{ saved: number; newlyAbsent: number; clientSubmissionId: string | null }, AttendanceSubmit>({
      query: (body) => ({ url: '/teacher/attendance', method: 'POST', body }),
      transformResponse: unwrap<{ saved: number; newlyAbsent: number; clientSubmissionId: string | null }>,
      invalidatesTags: ['Attendance'],
    }),

    // ---------- T5 homework ----------
    homework: b.query<HomeworkItem[], string | void>({
      query: (classId) => ({ url: '/teacher/homework', params: classId ? { classId } : undefined }),
      transformResponse: unwrap<HomeworkItem[]>,
      providesTags: ['Homework'],
    }),
    createHomework: b.mutation<unknown, FormData>({
      query: (body) => ({ url: '/teacher/homework', method: 'POST', body }),
      invalidatesTags: ['Homework'],
    }),
    updateHomework: b.mutation<unknown, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/teacher/homework/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Homework'],
    }),
    deleteHomework: b.mutation<unknown, string>({
      query: (id) => ({ url: `/teacher/homework/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Homework'],
    }),

    // ---------- T6 leave ----------
    leaveTypes: b.query<string[], void>({ query: () => '/teacher/leave/types', transformResponse: unwrap<string[]> }),
    leave: b.query<LeaveItem[], void>({
      query: () => '/teacher/leave',
      transformResponse: unwrap<LeaveItem[]>,
      providesTags: ['Leave'],
    }),
    applyLeave: b.mutation<unknown, FormData>({
      query: (body) => ({ url: '/teacher/leave', method: 'POST', body }),
      invalidatesTags: ['Leave', 'Dashboard'],
    }),
    cancelLeave: b.mutation<unknown, string>({
      query: (id) => ({ url: `/teacher/leave/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Leave', 'Dashboard'],
    }),

    // ---------- T7 notifications, notices ----------
    announcements: b.query<AnnouncementItem[], void>({
      query: () => '/teacher/announcements',
      transformResponse: unwrap<AnnouncementItem[]>,
      providesTags: ['Announcements'],
    }),
    notifications: b.query<{ unreadCount: number; items: NotificationItem[] }, void>({
      query: () => '/me/notifications',
      transformResponse: unwrap<{ unreadCount: number; items: NotificationItem[] }>,
      providesTags: ['Notifications'],
    }),
    markAllRead: b.mutation<unknown, void>({
      query: () => ({ url: '/me/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications', 'Dashboard'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useMeQuery,
  useDashboardQuery,
  useClassesQuery,
  useAttendanceQuery,
  useSubmitAttendanceMutation,
  useHomeworkQuery,
  useCreateHomeworkMutation,
  useUpdateHomeworkMutation,
  useDeleteHomeworkMutation,
  useLeaveTypesQuery,
  useLeaveQuery,
  useApplyLeaveMutation,
  useCancelLeaveMutation,
  useAnnouncementsQuery,
  useNotificationsQuery,
  useMarkAllReadMutation,
} = teacherApi;
