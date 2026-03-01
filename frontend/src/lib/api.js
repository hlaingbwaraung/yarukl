const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('yaruki_token');
  }
  return null;
}

function getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// AUTH
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(name, email, password, role = 'student', phone = '') {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, phone }),
  });
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: getHeaders(),
  });
  return res.json();
}

// HOMEWORK
export async function getAssignments() {
  const res = await fetch(`${API_URL}/homework/assignments`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function createAssignment(data) {
  const res = await fetch(`${API_URL}/homework/assignments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitHomework(assignmentId, files) {
  const formData = new FormData();
  // Support both single file (legacy) and array of files
  const fileList = Array.isArray(files) ? files : [files];
  fileList.forEach(f => formData.append('files', f));

  const res = await fetch(`${API_URL}/homework/submit/${assignmentId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return res.json();
}

export async function getMySubmissions() {
  const res = await fetch(`${API_URL}/homework/my-submissions`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function getAllSubmissions() {
  const res = await fetch(`${API_URL}/homework/all-submissions`, {
    headers: getHeaders(),
  });
  return res.json();
}

export function getDownloadUrl(submissionId) {
  return `${API_URL}/homework/download/${submissionId}`;
}

export async function sendHomeworkFeedback(submissionId, data) {
  const res = await fetch(`${API_URL}/homework/feedback/${submissionId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function downloadSubmission(submissionId, fileName, fileIndex = 0) {
  const res = await fetch(`${API_URL}/homework/download/${submissionId}?file=${fileIndex}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// QUIZ
export async function getQuizQuestions(level, category) {
  let url = `${API_URL}/quiz/questions/${level}`;
  if (category) url += `?category=${category}`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
}

export async function submitQuiz(level, category, answers, partNumber) {
  const res = await fetch(`${API_URL}/quiz/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ level, category, answers, partNumber }),
  });
  return res.json();
}

export async function getQuizHistory() {
  const res = await fetch(`${API_URL}/quiz/history`, {
    headers: getHeaders(),
  });
  return res.json();
}

// DICTIONARY
export async function searchDictionary(query, level) {
  let url = `${API_URL}/dictionary/search?q=${encodeURIComponent(query)}`;
  if (level) url += `&level=${level}`;
  const res = await fetch(url);
  return res.json();
}

export async function getAllDictionary(level) {
  let url = `${API_URL}/dictionary/all`;
  if (level) url += `?level=${level}`;
  const res = await fetch(url);
  return res.json();
}

// ============================================================
// ADMIN API
// ============================================================

// Analytics
export async function getAdminAnalytics() {
  const res = await fetch(`${API_URL}/admin/analytics`, { headers: getHeaders() });
  return res.json();
}

// Quiz Results (Admin)
export async function getAdminQuizResults(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/admin/quiz-results?${query}`, { headers: getHeaders() });
  return res.json();
}

// Students
export async function getAdminStudents(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/admin/students?${query}`, { headers: getHeaders() });
  return res.json();
}

export async function getAdminStudent(id) {
  const res = await fetch(`${API_URL}/admin/students/${id}`, { headers: getHeaders() });
  return res.json();
}

export async function updateAdminStudent(id, data) {
  const res = await fetch(`${API_URL}/admin/students/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function changeStudentStatus(id, status) {
  const res = await fetch(`${API_URL}/admin/students/${id}/status`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function resetStudentPassword(id, newPassword) {
  const res = await fetch(`${API_URL}/admin/students/${id}/reset-password`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify({ newPassword }),
  });
  return res.json();
}

export async function deleteStudent(id) {
  const res = await fetch(`${API_URL}/admin/students/${id}`, {
    method: 'DELETE', headers: getHeaders(),
  });
  return res.json();
}

// Messages
export async function getAdminMessages(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/admin/messages?${query}`, { headers: getHeaders() });
  return res.json();
}

export async function sendAdminMessage(data) {
  const res = await fetch(`${API_URL}/admin/messages`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function markMessageRead(id) {
  const res = await fetch(`${API_URL}/admin/messages/${id}/read`, {
    method: 'PUT', headers: getHeaders(),
  });
  return res.json();
}

export async function markMessageSeen(id) {
  const res = await fetch(`${API_URL}/admin/messages/${id}/seen`, {
    method: 'PUT', headers: getHeaders(),
  });
  return res.json();
}

export async function deleteMessage(id) {
  const res = await fetch(`${API_URL}/admin/messages/${id}`, {
    method: 'DELETE', headers: getHeaders(),
  });
  return res.json();
}

// Announcements
export async function getAnnouncements(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/admin/announcements?${query}`, { headers: getHeaders() });
  return res.json();
}

export async function createAnnouncement(data) {
  const res = await fetch(`${API_URL}/admin/announcements`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateAnnouncement(id, data) {
  const res = await fetch(`${API_URL}/admin/announcements/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteAnnouncement(id) {
  const res = await fetch(`${API_URL}/admin/announcements/${id}`, {
    method: 'DELETE', headers: getHeaders(),
  });
  return res.json();
}

// Payments
export async function getAdminPayments(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/admin/payments?${query}`, { headers: getHeaders() });
  return res.json();
}

export async function recordPayment(data) {
  const res = await fetch(`${API_URL}/admin/payments`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePayment(id, data) {
  const res = await fetch(`${API_URL}/admin/payments/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

// Subscriptions
export async function getAdminSubscriptions() {
  const res = await fetch(`${API_URL}/admin/subscriptions`, { headers: getHeaders() });
  return res.json();
}

export async function createSubscription(data) {
  const res = await fetch(`${API_URL}/admin/subscriptions`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateSubscription(id, data) {
  const res = await fetch(`${API_URL}/admin/subscriptions/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
  });
  return res.json();
}

// Activity Log
export async function getActivityLog(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/admin/activity?${query}`, { headers: getHeaders() });
  return res.json();
}

// ============================================================
// USER MESSAGES (for students/teachers/all users)
// ============================================================

export async function getUserMessages(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/messages?${query}`, { headers: getHeaders() });
  return res.json();
}

export async function getUserSentMessages(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/messages/sent?${query}`, { headers: getHeaders() });
  return res.json();
}

export async function getUnreadCount() {
  const res = await fetch(`${API_URL}/messages/unread-count`, { headers: getHeaders() });
  return res.json();
}

export async function getNotifications() {
  const res = await fetch(`${API_URL}/messages/notifications`, { headers: getHeaders() });
  return res.json();
}

export async function getMessageDetail(id) {
  const res = await fetch(`${API_URL}/messages/${id}`, { headers: getHeaders() });
  return res.json();
}

export async function replyToMessage(id, body) {
  const res = await fetch(`${API_URL}/messages/reply/${id}`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify({ body }),
  });
  return res.json();
}

export async function markUserMessageRead(id) {
  const res = await fetch(`${API_URL}/messages/${id}/read`, {
    method: 'PUT', headers: getHeaders(),
  });
  return res.json();
}

export async function markAllMessagesRead() {
  const res = await fetch(`${API_URL}/messages/read-all`, {
    method: 'PUT', headers: getHeaders(),
  });
  return res.json();
}

export async function deleteUserMessage(id) {
  const res = await fetch(`${API_URL}/messages/${id}`, {
    method: 'DELETE', headers: getHeaders(),
  });
  return res.json();
}
