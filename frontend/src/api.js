const API_ROOT = import.meta.env.VITE_API_ROOT || "http://127.0.0.1:8000";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${API_ROOT}/api/v1`;

const TOKEN_KEY = "netrava_token";
const USER_KEY = "netrava_user";

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getToken() {
  return getStoredToken();
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(data) {
  if (data?.access_token) localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data?.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function buildApiUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_ROOT}${path}`;
  return `${API_ROOT}/${path}`;
}

function authHeaders(extra = {}) {
  const token = getStoredToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function parseResponse(response) {
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = text; }

  if (!response.ok) {
    let message = "Request failed.";
    if (typeof data === "string" && data) message = data;
    else if (Array.isArray(data?.detail)) message = data.detail.map(x => x.msg || x.message || String(x)).join(", ");
    else if (data?.detail) message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    else if (data?.message) message = data.message;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function checkBackend() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return parseResponse(response);
}

export async function loginUser(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = await parseResponse(response);
  if (!data?.access_token) throw new Error("Login succeeded but no access token was returned.");

  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function registerUser(arg1, arg2, arg3) {
  const input = typeof arg1 === "object"
    ? arg1
    : { username: arg1, password: arg2, fullName: arg3 };

  const username = String(input.username || "").trim();
  const password = String(input.password || "");
  const fullName = String(input.fullName || input.full_name || "").trim();

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      full_name: fullName,
      role: "patient",
    }),
  });

  return parseResponse(response);
}

export async function getCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearSession();
    return null;
  }

  const data = await parseResponse(response);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  return data;
}

export function logoutUser() {
  clearSession();
}

export function getAuthToken() {
  return getStoredToken();
}

export function isLoggedIn() {
  return Boolean(getStoredToken());
}

export async function createMyProfile(profile) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      full_name: profile.fullName,
      gender: profile.gender,
      age: Number(profile.age),
      diabetes:
        profile.diabetes === true ||
        profile.diabetes === "yes",
      diabetes_duration:
        profile.diabetesDuration || null,
    }),
  });

  return parseResponse(response);
}

export async function getMyProfile() {
  const response = await fetch(`${API_BASE_URL}/patients/me`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getMyHistory() {
  const response = await fetch(`${API_BASE_URL}/patients/me/history`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getAllPatients() {
  const response = await fetch(`${API_BASE_URL}/patients`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getPatientById(patientId) {
  const response = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientId)}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getPatientHistory(patientId) {
  const response = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientId)}/history`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function uploadScan(image, patientId) {
  if (!image) throw new Error("Please select a fundus image.");
  if (!patientId) throw new Error("A Patient ID is required.");

  const form = new FormData();
  form.append("image", image);
  form.append("patient_id", patientId);

  const response = await fetch(`${API_BASE_URL}/scans`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  return parseResponse(response);
}

export async function getScan(scanId) {
  const response = await fetch(`${API_BASE_URL}/scans/${encodeURIComponent(scanId)}`, { headers: authHeaders() });
  return parseResponse(response);
}

async function protectedBlob(path) {
  const response = await fetch(path, { headers: authHeaders() });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Unable to load protected resource (${response.status}).`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function getScanImage(scanId) {
  return protectedBlob(`${API_BASE_URL}/scans/${encodeURIComponent(scanId)}/image`);
}

export async function getGradCam(scanId) {
  return protectedBlob(`${API_BASE_URL}/scans/${encodeURIComponent(scanId)}/gradcam`);
}

export async function getGradCamOverlay(scanId) {
  return protectedBlob(`${API_BASE_URL}/scans/${encodeURIComponent(scanId)}/gradcam-overlay`);
}

export async function getReportBlob(scanId, language = "en") {
  const response = await fetch(
    `${API_BASE_URL}/scans/${encodeURIComponent(scanId)}/report?language=${encodeURIComponent(language)}`,
    { headers: authHeaders() }
  );
  if (!response.ok) throw new Error(`Unable to generate report (${response.status}).`);
  return response.blob();
}

export async function downloadReport(scanId, language = "en", patientId = "patient") {
  const blob = await getReportBlob(scanId, language);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NETRAVA_${patientId}_${scanId}_report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
