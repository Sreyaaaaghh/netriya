/* =====================================================
   NETRAVA API CLIENT
===================================================== */

const API_ROOT =
  import.meta.env.VITE_API_ROOT ||
  "http://127.0.0.1:8000";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${API_ROOT}/api/v1`;

const TOKEN_KEY = "netrava_token";
const USER_KEY = "netrava_user";


/* =====================================================
   STORAGE HELPERS
===================================================== */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setSession(data) {
  if (data?.access_token) {
    localStorage.setItem(
      TOKEN_KEY,
      data.access_token
    );
  }

  if (data?.user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user)
    );
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Remove older keys from previous builds.
  localStorage.removeItem("reto_token");
  localStorage.removeItem("reto_user");
}


/* =====================================================
   URL HELPERS
===================================================== */

export function buildApiUrl(path) {
  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  // Backend responses return paths such as
  // /api/v1/scans/<id>/gradcam.
  // These already contain /api/v1.
  if (path.startsWith("/api/v1/")) {
    return `${API_ROOT}${path}`;
  }

  // Normal API endpoints such as:
  // /auth/register
  // /auth/login
  // /patients
  // /scans
  //
  // IMPORTANT:
  // These must use API_BASE_URL so /api/v1 is included.
  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  try {
    const text = await response.text();
    return text ? { detail: text } : {};
  } catch {
    return {};
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: authHeaders(options.headers || {}),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}.`
    );
  }

  return data;
}


/* =====================================================
   HEALTH
===================================================== */

export async function checkBackend() {
  const response = await fetch(`${API_ROOT}/`);

  if (!response.ok) {
    throw new Error("Backend is not available.");
  }

  return response.json();
}


/* =====================================================
   AUTHENTICATION
===================================================== */

export async function loginUser(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required.");
  }

  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      "Invalid username or password."
    );
  }

  if (!data?.access_token) {
    throw new Error(
      "Login succeeded but no access token was returned."
    );
  }

  // Store the token immediately.
  // The backend /me endpoint is then used to load
  // the authoritative role and user details.
  setSession({
    access_token: data.access_token,
    token_type: data.token_type || "bearer",
    user: data.user || null,
  });

  return data;
}

export async function registerUser(
  arg1,
  arg2,
  arg3
) {
  let username;
  let password;
  let fullName;
  let role = "patient";

  if (typeof arg1 === "object" && arg1 !== null) {
    username = arg1.username;
    password = arg1.password;
    fullName = arg1.fullName || arg1.full_name;
    role = arg1.role || "patient";
  } else {
    username = arg1;
    password = arg2;
    fullName = arg3;
  }

  const data = await apiRequest(
    "/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        full_name: fullName,
        role,
      }),
    }
  );

  return data;
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) return null;

  try {
    const data = await apiRequest("/auth/me", {
      method: "GET",
    });

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data)
    );

    return data;
  } catch (error) {
    clearSession();
    throw error;
  }
}

export function getAuthToken() {
  return getToken();
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function logoutUser() {
  clearSession();
}


/* =====================================================
   PATIENT PROFILE
===================================================== */

export async function createMyProfile(patient) {
  return apiRequest("/patients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: patient.fullName,
      gender: patient.gender,
      age: Number(patient.age),
      diabetes: Boolean(patient.diabetes),
      diabetes_duration:
        patient.diabetes
          ? patient.diabetesDuration || null
          : null,
    }),
  });
}

export async function getMyProfile() {
  return apiRequest("/patients/me", {
    method: "GET",
  });
}

export async function getMyHistory() {
  // The current backend exposes history as
  // /patients/{patient_id}/history rather than
  // /patients/me/history.
  const profile = await getMyProfile();

  if (!profile?.patient_id) {
    throw new Error("Patient profile has no Patient ID.");
  }

  return getPatientHistory(profile.patient_id);
}


/* =====================================================
   ADMIN PATIENT SEARCH / DIRECTORY
===================================================== */

export async function getAllPatients(
  search = "",
  limit = 50
) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  params.set("limit", String(limit));

  return apiRequest(
    `/patients?${params.toString()}`,
    {
      method: "GET",
    }
  );
}

export async function getPatientById(patientId) {
  if (!patientId) {
    throw new Error("Patient ID is required.");
  }

  return apiRequest(
    `/patients/${encodeURIComponent(patientId)}`,
    {
      method: "GET",
    }
  );
}

export async function getPatientHistory(patientId) {
  if (!patientId) {
    throw new Error("Patient ID is required.");
  }

  return apiRequest(
    `/patients/${encodeURIComponent(patientId)}/history`,
    {
      method: "GET",
    }
  );
}


/* =====================================================
   SCREENING
===================================================== */

export async function uploadScan(image, patientId) {
  if (!image) {
    throw new Error("Please select a fundus image.");
  }

  if (!patientId) {
    throw new Error("Patient ID is required.");
  }

  const token = getToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const formData = new FormData();

  // IMPORTANT: these names must match scans.py exactly.
  formData.append("image", image);
  formData.append("patient_id", patientId);

  const response = await fetch(
    `${API_BASE_URL}/scans`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      "Unable to complete screening."
    );
  }

  return data;
}

export const runScreening = uploadScan;

export async function getScan(scanId) {
  return apiRequest(
    `/scans/${encodeURIComponent(scanId)}`,
    {
      method: "GET",
    }
  );
}


/* =====================================================
   PROTECTED IMAGE / GRAD-CAM BLOBS
===================================================== */

async function protectedBlob(path) {
  const token = getToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(
    buildApiUrl(path),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to load image.";

    try {
      const data = await response.json();
      message = data?.detail || message;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export function getScanImage(scanId) {
  return protectedBlob(
    `/api/v1/scans/${encodeURIComponent(scanId)}/image`
  );
}

export function getGradCam(scanId) {
  return protectedBlob(
    `/api/v1/scans/${encodeURIComponent(scanId)}/gradcam`
  );
}

export function getGradCamOverlay(scanId) {
  return protectedBlob(
    `/api/v1/scans/${encodeURIComponent(scanId)}/gradcam-overlay`
  );
}


/* =====================================================
   REPORT
===================================================== */

export async function downloadReport(
  scanId,
  _language = "en",
  _patientId = ""
) {
  const token = getToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(
    `${API_BASE_URL}/scans/${encodeURIComponent(scanId)}/report?language=${encodeURIComponent(_language)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to generate the PDF report.";

    try {
      const data = await response.json();
      message = data?.detail || message;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `NETRAVA_report_${scanId}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}