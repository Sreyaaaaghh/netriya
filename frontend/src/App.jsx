import { useEffect, useState } from "react";
import "./App.css";

import {
  Login,
  Signup,
} from "./pages.jsx";

import {
  getStoredUser,
  getToken,
  setSession,
  clearSession,
  getCurrentUser,
  loginUser,
  getMyProfile,
  createMyProfile,
  getMyHistory,
  getAllPatients,
  getPatientById,
  getPatientHistory,
  uploadScan,
  getScan,
  getScanImage,
  getGradCam,
  getGradCamOverlay,
  downloadReport,
} from "./api.js";

const EMPTY_PATIENT = {
  fullName: "",
  gender: "",
  age: "",
  diabetes: false,
  diabetesDuration: "",
};

const STAGES = {
  "No DR": {
    level: 0,
    title: "No diabetic retinopathy detected",
    seriousness: "Minimal",
    description:
      "No diabetic-retinopathy features are represented in this screening result.",
    changes: [
      "No diabetic-retinopathy changes detected in the screening result.",
      "Routine eye screening remains important for people with diabetes.",
    ],
  },
  "Mild Non-Proliferative retinopathy [NPDR]": {
    level: 1,
    title: "Mild nonproliferative diabetic retinopathy",
    seriousness: "Early",
    description:
      "The earliest stage of diabetic retinopathy. Small retinal blood-vessel changes such as microaneurysms may occur.",
    changes: [
      "Microaneurysms may be present.",
      "Early retinal vascular changes can occur without noticeable symptoms.",
    ],
  },
  "Mild NPDR": {
    level: 1,
    title: "Mild nonproliferative diabetic retinopathy",
    seriousness: "Early",
    description:
      "The earliest stage of diabetic retinopathy. Small retinal blood-vessel changes such as microaneurysms may occur.",
    changes: [
      "Microaneurysms may be present.",
      "Early retinal vascular changes can occur without noticeable symptoms.",
    ],
  },
  "Moderate NPDR": {
    level: 2,
    title: "Moderate nonproliferative diabetic retinopathy",
    seriousness: "Moderate",
    description:
      "Retinal vascular changes are more developed than in mild NPDR. Some blood vessels may become blocked or altered.",
    changes: [
      "More noticeable retinal vascular abnormalities may occur.",
      "Some blood vessels supplying the retina may become blocked.",
    ],
  },
  "Severe NPDR": {
    level: 3,
    title: "Severe nonproliferative diabetic retinopathy",
    seriousness: "High",
    description:
      "A more advanced nonproliferative stage in which many retinal blood vessels can become blocked, reducing blood supply to parts of the retina.",
    changes: [
      "More extensive retinal blood-vessel blockage can occur.",
      "Reduced retinal blood supply can trigger signals associated with abnormal vessel growth.",
    ],
  },
  "Proliferative Diabetic Retinopathy": {
    level: 4,
    title: "Proliferative diabetic retinopathy",
    seriousness: "Very high",
    description:
      "The advanced stage of diabetic retinopathy, where abnormal new blood vessels can grow and may bleed or contribute to serious vision loss.",
    changes: [
      "Abnormal fragile blood vessels may grow on the retina.",
      "These vessels can leak or bleed.",
      "Advanced disease can be associated with severe vision loss.",
    ],
  },
  "Proliferative DR": {
    level: 4,
    title: "Proliferative diabetic retinopathy",
    seriousness: "Very high",
    description:
      "The advanced stage of diabetic retinopathy, where abnormal new blood vessels can grow and may bleed or contribute to serious vision loss.",
    changes: [
      "Abnormal fragile blood vessels may grow on the retina.",
      "These vessels can leak or bleed.",
      "Advanced disease can be associated with severe vision loss.",
    ],
  },
};

const STAGE_ALIASES = {
  "Mild Non-Proliferative retinopathy [NPDR]": "Mild NPDR",
  "Proliferative Diabetic Retinopathy": "Proliferative DR",
};

const STAGE_ORDER = [
  "No DR",
  "Mild NPDR",
  "Moderate NPDR",
  "Severe NPDR",
  "Proliferative DR",
];

const STAGE_HI = {
  "No DR": {
    name: "कोई डायबिटिक रेटिनोपैथी नहीं",
    title: "डायबिटिक रेटिनोपैथी के संकेत नहीं मिले",
    seriousness: "न्यूनतम",
    description:
      "इस स्क्रीनिंग परिणाम में डायबिटिक रेटिनोपैथी से जुड़े बदलाव दिखाई नहीं दिए।",
    changes: [
      "स्क्रीनिंग परिणाम में डायबिटिक रेटिनोपैथी के बदलाव नहीं मिले।",
      "डायबिटीज वाले लोगों के लिए नियमित आंखों की जांच फिर भी महत्वपूर्ण है।",
    ],
  },
  "Mild NPDR": {
    name: "हल्की NPDR",
    title: "हल्की नॉनप्रोलिफेरेटिव डायबिटिक रेटिनोपैथी",
    seriousness: "प्रारंभिक",
    description:
      "डायबिटिक रेटिनोपैथी की शुरुआती अवस्था। रेटिना की छोटी रक्त वाहिकाओं में माइक्रोएन्यूरिज्म जैसे बदलाव हो सकते हैं।",
    changes: [
      "माइक्रोएन्यूरिज्म मौजूद हो सकते हैं।",
      "शुरुआती रेटिनल रक्त-वाहिका बदलाव बिना स्पष्ट लक्षणों के भी हो सकते हैं।",
    ],
  },
  "Moderate NPDR": {
    name: "मध्यम NPDR",
    title: "मध्यम नॉनप्रोलिफेरेटिव डायबिटिक रेटिनोपैथी",
    seriousness: "मध्यम",
    description:
      "रेटिनल रक्त-वाहिका बदलाव हल्की NPDR की तुलना में अधिक विकसित हो सकते हैं। कुछ रक्त वाहिकाएं अवरुद्ध या परिवर्तित हो सकती हैं।",
    changes: [
      "रेटिना की रक्त वाहिकाओं में अधिक स्पष्ट असामान्यताएं हो सकती हैं।",
      "रेटिना को रक्त पहुंचाने वाली कुछ रक्त वाहिकाएं अवरुद्ध हो सकती हैं।",
    ],
  },
  "Severe NPDR": {
    name: "गंभीर NPDR",
    title: "गंभीर नॉनप्रोलिफेरेटिव डायबिटिक रेटिनोपैथी",
    seriousness: "उच्च",
    description:
      "यह अधिक उन्नत अवस्था है जिसमें रेटिना की कई रक्त वाहिकाएं अवरुद्ध हो सकती हैं और रेटिना के कुछ हिस्सों में रक्त की आपूर्ति कम हो सकती है।",
    changes: [
      "रेटिना की रक्त वाहिकाओं में अधिक व्यापक रुकावट हो सकती है।",
      "रेटिना में रक्त की कम आपूर्ति असामान्य रक्त-वाहिका वृद्धि से जुड़े संकेत पैदा कर सकती है।",
    ],
  },
  "Proliferative DR": {
    name: "प्रोलिफेरेटिव DR",
    title: "प्रोलिफेरेटिव डायबिटिक रेटिनोपैथी",
    seriousness: "बहुत उच्च",
    description:
      "डायबिटिक रेटिनोपैथी की उन्नत अवस्था, जिसमें असामान्य नई रक्त वाहिकाएं बन सकती हैं और उनसे रक्तस्राव या गंभीर दृष्टि हानि हो सकती है।",
    changes: [
      "रेटिना पर असामान्य और नाजुक नई रक्त वाहिकाएं बन सकती हैं।",
      "इन रक्त वाहिकाओं से रिसाव या रक्तस्राव हो सकता है।",
      "उन्नत रोग गंभीर दृष्टि हानि से जुड़ा हो सकता है।",
    ],
  },
};

function tr(language, en, hi) {
  return language === "hi" ? hi : en;
}

function normalizeStage(stage) {
  return STAGE_ALIASES[stage] || stage || "Moderate NPDR";
}

function stageInfo(stage, language = "en") {
  const key = normalizeStage(stage);
  if (language === "hi") return STAGE_HI[key] || STAGE_HI["Moderate NPDR"];
  return STAGES[key] || STAGES["Moderate NPDR"];
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPatientName(patient) {
  return patient?.full_name || patient?.fullName || patient?.name || "Patient";
}

function getPatientId(patient) {
  return patient?.patient_id || patient?.patientId || "";
}

function getConfidence(scan) {
  const value = Number(scan?.confidence ?? scan?.modelConfidence ?? 0);
  return value <= 1 ? value * 100 : value;
}

function getScanStage(scan) {
  return scan?.prediction || scan?.stage || "Moderate NPDR";
}

function getScanId(scan) {
  return scan?.scan_id || scan?.scanId || scan?.id;
}

function extractError(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function RetinaGraphic() {
  return (
    <div className="retina-visual">
      <div className="retina-ring ring-one" />
      <div className="retina-ring ring-two" />
      <div className="retina-ring ring-three" />
      <div className="retina-vessel vessel-one" />
      <div className="retina-vessel vessel-two" />
      <div className="retina-vessel vessel-three" />
      <div className="retina-vessel vessel-four" />
      <div className="retina-center" />
    </div>
  );
}

function Home({ startAuth, startSignup, setPage }) {
  return (
    <main className="home-page">
      <nav className="home-nav">
        <button className="home-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          नेत्रia
        </button>

        <div className="home-nav-actions">
          <button onClick={() => setPage("stages")}>Stages</button>
          <button className="nav-signup" onClick={startSignup}>
            Patient sign up
          </button>
          <button className="nav-login" onClick={startAuth}>
            Log in
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">RETINAL SCREENING PLATFORM</p>
          <h1>
            Early detection.
            <br />
            <span>Better decisions.</span>
          </h1>

          <p className="hero-description">
            A structured retinal screening workflow designed to support early
            identification of diabetic retinopathy.
          </p>

          <div className="hero-actions">
            <button className="primary-btn" onClick={startAuth}>
              Start screening <span>→</span>
            </button>
            <button className="secondary-btn" onClick={() => setPage("stages")}>
              Explore stages
            </button>
          </div>

          <div className="hero-meta">
            <span><b>01</b> Patient-first workflow</span>
            <span><b>02</b> Explainable analysis</span>
            <span><b>03</b> Screening history</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-frame">
            <div className="visual-top">
              <span>नेत्रia / 01</span>
              <span>RETINAL ANALYSIS</span>
            </div>

            <RetinaGraphic />

            <div className="visual-bottom">
              <div>
                <span>SCREENING</span>
                <strong>FUNDUS IMAGE</strong>
              </div>
              <div className="visual-status">
                <span /> READY
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats">
        <div><strong>05</strong><span>Retinopathy stages</span></div>
        <div><strong>02</strong><span>User roles</span></div>
        <div><strong>01</strong><span>Screening workflow</span></div>
        <div><strong>24/7</strong><span>Local prototype access</span></div>
      </section>

      <section className="features">
        <div className="section-heading">
          <p className="eyebrow">THE WORKFLOW</p>
          <h2>Screening built around <span>clarity.</span></h2>
          <p>
            नेत्रia brings patient information, retinal analysis and explainable
            results into one structured flow.
          </p>
        </div>

        <div className="feature-grid">
          <article><span>01</span><div><h3>Patient information</h3><p>Record essential patient details before screening.</p></div></article>
          <article><span>02</span><div><h3>Retinal analysis</h3><p>Upload a fundus image and review the model output.</p></div></article>
          <article><span>03</span><div><h3>Explainable result</h3><p>Review stage, confidence, Grad-CAM and screening history.</p></div></article>
        </div>
      </section>

      <footer className="home-footer">
        <strong>नेत्रia</strong>
        <span>AI-assisted retinal screening interface</span>
      </footer>
    </main>
  );
}

function Header({ user, language, setLanguage, setPage, logout }) {
  return (
    <nav className="screening-nav">
      <button className="screening-logo" onClick={() => setPage("home")}>
        नेत्रia
      </button>

      <div className="app-nav">
        <button onClick={() => setPage(user?.role === "admin" ? "admin-dashboard" : "patient-dashboard")}>
          {tr(language, "Dashboard", "डैशबोर्ड")}
        </button>

        {user?.role === "patient" && (
          <button onClick={() => setPage("history")}>
            {tr(language, "History", "इतिहास")}
          </button>
        )}

        <button onClick={() => setLanguage(language === "en" ? "hi" : "en")}>
          {language === "en" ? "हिंदी" : "English"}
        </button>

        <button onClick={logout}>
          {tr(language, "Log out", "लॉग आउट")}
        </button>
      </div>
    </nav>
  );
}

function PatientDetails({ patient, setPatient, disabled = false, language = "en" }) {
  return (
    <div className="patient-details-form">
      <div className="field">
        <label>{tr(language, "Patient name", "रोगी का नाम")}</label>
        <input
          disabled={disabled}
          value={patient.fullName || ""}
          onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
          placeholder={tr(language, "Enter patient name", "रोगी का नाम दर्ज करें")}
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label>{tr(language, "Age", "उम्र")}</label>
          <input
            disabled={disabled}
            type="number"
            min="1"
            max="120"
            value={patient.age || ""}
            onChange={(e) => setPatient({ ...patient, age: e.target.value })}
            placeholder="Age"
          />
        </div>

        <div className="field">
          <label>{tr(language, "Gender", "लिंग")}</label>
          <select
            disabled={disabled}
            value={patient.gender || ""}
            onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
          >
            <option value="">Select</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>{tr(language, "Diabetes", "डायबिटीज")}</label>
        <select
          disabled={disabled}
          value={patient.diabetes ? "yes" : "no"}
          onChange={(e) =>
            setPatient({
              ...patient,
              diabetes: e.target.value === "yes",
              diabetesDuration: e.target.value === "yes" ? patient.diabetesDuration : "",
            })
          }
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      {patient.diabetes && (
        <div className="field">
          <label>{tr(language, "Diabetes duration", "डायबिटीज की अवधि")}</label>
          <div className="input-suffix">
            <input
              disabled={disabled}
              type="number"
              min="0"
              max="100"
              value={patient.diabetesDuration || ""}
              onChange={(e) =>
                setPatient({ ...patient, diabetesDuration: e.target.value })
              }
              placeholder="Years"
            />
            <span>{tr(language, "years", "वर्ष")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SeverityScale({ stage, language }) {
  const key = normalizeStage(stage);
  const info = stageInfo(key, language);
  const level = STAGES[key]?.level ?? 2;

  return (
    <section className="severity-section">
      <div className="section-topline">
        <div>
          <p className="result-label">
            {tr(language, "RETINOPATHY SEVERITY", "रेटिनोपैथी की गंभीरता")}
          </p>
          <h3>{tr(language, `Stage ${level} of 4`, `स्टेज ${level} / 4`)}</h3>
        </div>
        <span className={`severity-badge ${level >= 3 ? "red" : level === 2 ? "orange" : "green"}`}>
          {info.seriousness}
        </span>
      </div>

      <div className="severity-scale">
        <div className="severity-track" />
        {STAGE_ORDER.map((item, index) => (
          <div className={`severity-step ${index === level ? "active" : ""}`} key={item}>
            <div className="severity-dot">{index === level && <span />}</div>
            <span className="severity-number">{index}</span>
            <strong>{language === "hi" ? STAGE_HI[item].name : item}</strong>
          </div>
        ))}
      </div>

      <p className="severity-note">
        {tr(
          language,
          "This 0–4 scale visually represents progression across five commonly described diabetic-retinopathy stages. It is not a separate clinical scoring system.",
          "यह 0–4 स्केल डायबिटिक रेटिनोपैथी की पांच सामान्य अवस्थाओं की प्रगति को दिखाता है। यह कोई अलग क्लिनिकल स्कोरिंग सिस्टम नहीं है।"
        )}
      </p>
    </section>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => getStoredUser());
  const [language, setLanguage] = useState("en");

  const [patient, setPatient] = useState(EMPTY_PATIENT);
  const [myProfile, setMyProfile] = useState(null);

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState([]);

  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [gradcamUrl, setGradcamUrl] = useState("");
  const [overlayUrl, setOverlayUrl] = useState("");

  const [searchId, setSearchId] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const openSignup = () => {
      setAuthMode("signup");
      setError("");
      setPage("signup");
    };
    const openLogin = () => {
      setAuthMode("login");
      setError("");
      setPage("login");
    };

    window.addEventListener("netrava-open-signup", openSignup);
    window.addEventListener("netrava-open-login", openLogin);

    return () => {
      window.removeEventListener("netrava-open-signup", openSignup);
      window.removeEventListener("netrava-open-login", openLogin);
    };
  }, []);

  useEffect(() => {
    async function loadSession() {
      if (!getToken()) return;

      try {
        const current = await getCurrentUser();
        setUser(current);

        if (current.role === "patient") {
          try {
            const profile = await getMyProfile();
            setMyProfile(profile);
          } catch {
            // Profile may not exist yet.
          }
        }
      } catch {
        clearSession();
        setUser(null);
      }
    }

    loadSession();
  }, []);

  function resetError() {
    setError("");
  }

  function goHome() {
    setPage("home");
    resetError();
  }

  function logout() {
    clearSession();
    setUser(null);
    setMyProfile(null);
    setResult(null);
    setImage(null);
    setImagePreview("");
    setGradcamUrl("");
    setOverlayUrl("");
    setSelectedPatient(null);
    setSelectedHistory([]);
    setPage("home");
  }

  async function handleLogin(values) {
    setBusy(true);
    setError("");

    try {
      const username = values?.username?.trim();
      const password = values?.password || "";

      if (!username || !password) {
        throw new Error("Enter your username and password.");
      }

      const loggedIn = await loginUser(username, password);
      const actualUser = loggedIn?.user || await getCurrentUser();

      if (!actualUser) {
        throw new Error("Login succeeded, but the user session could not be loaded.");
      }

      setUser(actualUser);

      if (actualUser.role === "patient") {
        try {
          const profile = await getMyProfile();
          setMyProfile(profile);
          setPatient({
            fullName: profile.full_name || "",
            gender: profile.gender || "",
            age: profile.age || "",
            diabetes: Boolean(profile.diabetes),
            diabetesDuration: profile.diabetes_duration || "",
          });
        } catch {
          setMyProfile(null);
        }

        setPage("patient-dashboard");
      } else if (actualUser.role === "admin") {
        setPage("admin-dashboard");
      } else {
        throw new Error("Unsupported user role.");
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(values) {
    setBusy(true);
    setError("");

    try {
      const username = values.username;
      const password = values.password;
      const fullName = values.fullName || values.full_name || "";

      if (!username || !password || !fullName) {
        throw new Error("Complete all required fields.");
      }

      // Registration is patient-only.
      const { registerUser, loginUser } = await import("./api.js");

      await registerUser({
        username,
        password,
        fullName,
      });

      const loggedIn = await loginUser(username, password);
      const actualUser = loggedIn.user || await getCurrentUser();

      setSession({
        ...loggedIn,
        user: actualUser,
      });

      setUser(actualUser);
      setPage("patient-dashboard");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  function validateProfile() {
    if (!patient.fullName?.trim()) return "Enter the patient's name.";
    if (!patient.age || Number(patient.age) < 1 || Number(patient.age) > 120) {
      return "Enter a valid age.";
    }
    if (!patient.gender) return "Select the patient's gender.";
    return "";
  }

  async function saveMyProfile() {
    const validation = validateProfile();

    if (validation) {
      setError(validation);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const profile = await createMyProfile(patient);

      setMyProfile(profile);
      setPatient({
        fullName: profile.full_name,
        gender: profile.gender,
        age: profile.age,
        diabetes: Boolean(profile.diabetes),
        diabetesDuration: profile.diabetes_duration || "",
      });

      setProfileSaved(true);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function refreshPatientHistory() {
    try {
      const data = await getMyHistory();
      setHistory(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function openPatientScreening(patientRecord = myProfile) {
    if (!patientRecord) {
      setPage("patient-dashboard");
      return;
    }

    setImage(null);
    setImagePreview("");
    setResult(null);
    setGradcamUrl("");
    setOverlayUrl("");
    setError("");

    setPage("screening");
  }

  async function handleImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid retinal image.");
      return;
    }

    setImage(file);
    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  }

  async function runScreening() {
    if (!image) {
      setError("Upload a retinal fundus image.");
      return;
    }

    const patientId =
      user?.role === "patient"
        ? getPatientId(myProfile)
        : getPatientId(selectedPatient);

    if (!patientId) {
      setError("A valid Patient ID is required before screening.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const scan = await uploadScan(image, patientId);

      setResult(scan);

      const scanId = getScanId(scan);

      // Load protected visual assets using the JWT.
      try {
        const [original, heatmap, overlay] = await Promise.all([
          getScanImage(scanId),
          getGradCam(scanId),
          getGradCamOverlay(scanId),
        ]);

        setImagePreview(original);
        setGradcamUrl(heatmap);
        setOverlayUrl(overlay);
      } catch {
        // The result itself can still be shown if an image endpoint fails.
      }

      if (user?.role === "patient") {
        await refreshPatientHistory();
      }

      setPage("result");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function openHistory() {
    setBusy(true);
    setError("");

    try {
      const data = await getMyHistory();
      setHistory(Array.isArray(data) ? data : data?.items || []);
      setPage("history");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function loadAdminPatients() {
    setBusy(true);
    setError("");

    try {
      const data = await getAllPatients();
      setPatients(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function searchPatient() {
    const id = searchId.trim();

    if (!id) {
      setError("Enter a Patient ID to search.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const found = await getPatientById(id);
      setSelectedPatient(found);

      const patientHistory = await getPatientHistory(id);
      setSelectedHistory(
        Array.isArray(patientHistory)
          ? patientHistory
          : patientHistory?.items || []
      );

      setPage("admin-patient");
    } catch (err) {
      setSelectedPatient(null);
      setSelectedHistory([]);
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function openAdminPatient(item) {
    const id = getPatientId(item);

    if (!id) return;

    setBusy(true);
    setError("");

    try {
      const profile = await getPatientById(id);
      const patientHistory = await getPatientHistory(id);

      setSelectedPatient(profile);
      setSelectedHistory(
        Array.isArray(patientHistory)
          ? patientHistory
          : patientHistory?.items || []
      );

      setPage("admin-patient");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function openScan(scan) {
    const scanId = getScanId(scan);

    if (!scanId) return;

    setBusy(true);
    setError("");

    try {
      const fullScan = await getScan(scanId);
      setResult(fullScan);

      try {
        const [original, heatmap, overlay] = await Promise.all([
          getScanImage(scanId),
          getGradCam(scanId),
          getGradCamOverlay(scanId),
        ]);

        setImagePreview(original);
        setGradcamUrl(heatmap);
        setOverlayUrl(overlay);
      } catch {
        setGradcamUrl("");
        setOverlayUrl("");
      }

      setPage("result");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  function beginAdminScreening() {
    if (!selectedPatient) {
      setPage("admin-dashboard");
      return;
    }

    setImage(null);
    setImagePreview("");
    setResult(null);
    setGradcamUrl("");
    setOverlayUrl("");
    setError("");
    setPage("screening");
  }

  async function handleReport() {
    if (!result) return;

    try {
      await downloadReport(
        getScanId(result),
        language,
        result.patient_id || getPatientId(selectedPatient) || getPatientId(myProfile)
      );
    } catch (err) {
      setError(extractError(err));
    }
  }

  function openStageInfo() {
    setPage("stage-info");
  }

  // ---------------- HOME ----------------

  if (page === "home") {
    return (
      <Home
        startAuth={() => {
          setAuthMode("login");
          setPage("login");
          setError("");
        }}
        startSignup={() => {
          setAuthMode("signup");
          setPage("signup");
          setError("");
        }}
        setPage={setPage}
      />
    );
  }

  // ---------------- STAGES ----------------

  if (page === "stages") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="dashboard">
            <button className="back-step" onClick={goHome}>← Home</button>

            <p className="screening-eyebrow">RETINOPATHY STAGES</p>
            <h1>Understand the five stages.</h1>
            <p className="screening-intro">
              The screening model classifies fundus images into five diabetic
              retinopathy categories.
            </p>

            <div className="dashboard-grid">
              {STAGE_ORDER.map((stage) => {
                const info = stageInfo(stage, language);
                const level = STAGES[stage].level;

                return (
                  <article className="dashboard-card" key={stage}>
                    <span>0{level}</span>
                    <h3>{language === "hi" ? STAGE_HI[stage].name : stage}</h3>
                    <p>{info.description}</p>
                    <strong>{info.seriousness}</strong>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ---------------- AUTH ----------------

  if (page === "login") {
    return (
      <Login
        goHome={goHome}
        onSuccess={handleLogin}
        error={error}
        busy={busy}
      />
    );
  }

  if (page === "signup") {
    return (
      <Signup
        goHome={goHome}
        onSuccess={handleSignup}
        error={error}
        busy={busy}
      />
    );
  }

  // ---------------- PATIENT DASHBOARD ----------------

  if (page === "patient-dashboard" && user?.role === "patient") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="dashboard">
            <p className="screening-eyebrow">PATIENT DASHBOARD</p>
            <h1>Welcome to नेत्रia.</h1>

            <p className="screening-intro">
              Manage your profile, screenings and previous results.
            </p>

            {!myProfile ? (
              <section className="profile-create">
                <p className="result-label">COMPLETE YOUR PROFILE</p>
                <h2>Patient details</h2>
                <p>Enter your details before starting your first screening.</p>

                <PatientDetails
                  patient={patient}
                  setPatient={setPatient}
                  language={language}
                />

                {error && <div className="form-error">{error}</div>}

                <button className="primary-btn" onClick={saveMyProfile} disabled={busy}>
                  {busy ? "Saving..." : "Save profile →"}
                </button>

                {profileSaved && (
                  <div className="success-message">
                    Profile saved successfully.
                  </div>
                )}
              </section>
            ) : (
              <>
                <div className="patient-dashboard-top">
                  <div>
                    <p className="result-label">YOUR PATIENT ID</p>
                    <strong>{getPatientId(myProfile)}</strong>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={() => openPatientScreening(myProfile)}
                  >
                    Start screening →
                  </button>
                </div>

                <div className="patient-summary">
                  <div><span>Name</span><strong>{getPatientName(myProfile)}</strong></div>
                  <div><span>Age</span><strong>{myProfile.age}</strong></div>
                  <div><span>Gender</span><strong>{myProfile.gender}</strong></div>
                  <div><span>Diabetes</span><strong>{myProfile.diabetes ? "Yes" : "No"}</strong></div>
                </div>

                <div className="dashboard-grid">
                  <button className="dashboard-card" onClick={() => openPatientScreening(myProfile)}>
                    <span>01</span>
                    <h3>New screening</h3>
                    <p>Upload a fundus image for AI-assisted screening.</p>
                    <strong>Start →</strong>
                  </button>

                  <button className="dashboard-card" onClick={openHistory}>
                    <span>02</span>
                    <h3>My history</h3>
                    <p>Review your previous screening results.</p>
                    <strong>View history →</strong>
                  </button>
                </div>
              </>
            )}

            {error && myProfile && <div className="form-error">{error}</div>}
          </section>
        </div>
      </main>
    );
  }

  // ---------------- ADMIN DASHBOARD ----------------

  if (page === "admin-dashboard" && user?.role === "admin") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="dashboard">
            <p className="screening-eyebrow">ADMIN DASHBOARD</p>
            <h1>Screening workspace.</h1>

            <p className="screening-intro">
              Search patients, review their screening history or upload a new
              fundus scan.
            </p>

            <div className="search-patient">
              <p className="result-label">SEARCH PATIENT ID</p>

              <div className="search-row">
                <input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="e.g. DR-P-123456"
                />
                <button className="primary-btn" onClick={searchPatient} disabled={busy}>
                  {busy ? "Searching..." : "Search"}
                </button>
              </div>

              {error && <div className="form-error">{error}</div>}
            </div>

            <div className="dashboard-grid">
              <button
                className="dashboard-card"
                onClick={async () => {
                  await loadAdminPatients();
                  setPage("patients");
                }}
              >
                <span>01</span>
                <h3>Patient management</h3>
                <p>View all registered patients and open their records.</p>
                <strong>Open patients →</strong>
              </button>

              <button
                className="dashboard-card"
                onClick={() => {
                  setSelectedPatient(null);
                  setError("Select a patient before starting a scan.");
                  setPage("patients");
                }}
              >
                <span>02</span>
                <h3>New screening</h3>
                <p>Select an existing patient and upload a fundus image.</p>
                <strong>Choose patient →</strong>
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ---------------- ADMIN PATIENT LIST ----------------

  if (page === "patients" && user?.role === "admin") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="dashboard">
            <button className="back-step" onClick={() => setPage("admin-dashboard")}>
              ← Admin dashboard
            </button>

            <p className="screening-eyebrow">PATIENT MANAGEMENT</p>
            <h1>Find a patient.</h1>
            <p className="screening-intro">
              Search by Patient ID or choose a patient from the registered list.
            </p>

            <div className="search-patient">
              <p className="result-label">SEARCH PATIENT ID</p>

              <div className="search-row">
                <input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="DR-P-123456"
                />
                <button className="primary-btn" onClick={searchPatient} disabled={busy}>
                  Search
                </button>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="patient-list">
              {patients.length === 0 ? (
                <div className="empty-state">No patients found.</div>
              ) : (
                patients.map((item) => (
                  <button
                    className="patient-row"
                    key={getPatientId(item)}
                    onClick={() => openAdminPatient(item)}
                  >
                    <span>
                      <b>{getPatientName(item)}</b>
                      <small>
                        {getPatientId(item)} · {item.age} years · {item.gender}
                      </small>
                    </span>
                    <span>Open →</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ---------------- ADMIN PATIENT PROFILE ----------------

  if (page === "admin-patient" && user?.role === "admin" && selectedPatient) {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="dashboard">
            <button className="back-step" onClick={() => setPage("patients")}>
              ← Patient management
            </button>

            <p className="screening-eyebrow">PATIENT RECORD</p>
            <h1>{getPatientName(selectedPatient)}</h1>

            <div className="patient-dashboard-top">
              <div>
                <p className="result-label">PATIENT ID</p>
                <strong>{getPatientId(selectedPatient)}</strong>
              </div>

              <button className="primary-btn" onClick={beginAdminScreening}>
                Upload new scan →
              </button>
            </div>

            <div className="patient-summary">
              <div><span>Name</span><strong>{getPatientName(selectedPatient)}</strong></div>
              <div><span>Age</span><strong>{selectedPatient.age}</strong></div>
              <div><span>Gender</span><strong>{selectedPatient.gender}</strong></div>
              <div><span>Diabetes</span><strong>{selectedPatient.diabetes ? "Yes" : "No"}</strong></div>
            </div>

            <div className="profile-create">
              <p className="result-label">SCREENING HISTORY</p>

              {selectedHistory.length === 0 ? (
                <div className="empty-state">No scans found for this patient.</div>
              ) : (
                <div className="patient-list">
                  {selectedHistory.map((scan) => (
                    <button
                      className="patient-row"
                      key={getScanId(scan)}
                      onClick={() => openScan(scan)}
                    >
                      <span>
                        <b>{getScanStage(scan)}</b>
                        <small>
                          {formatDate(scan.created_at)} · {getConfidence(scan).toFixed(1)}% confidence
                        </small>
                      </span>
                      <span>View →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ---------------- PATIENT HISTORY ----------------

  if (page === "history" && user?.role === "patient") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="dashboard">
            <button className="back-step" onClick={() => setPage("patient-dashboard")}>
              ← Dashboard
            </button>

            <p className="screening-eyebrow">MY HISTORY</p>
            <h1>Previous screenings.</h1>

            {history.length === 0 ? (
              <div className="empty-state">No screening history yet.</div>
            ) : (
              <div className="patient-list">
                {history.map((scan) => (
                  <button
                    className="patient-row"
                    key={getScanId(scan)}
                    onClick={() => openScan(scan)}
                  >
                    <span>
                      <b>{getScanStage(scan)}</b>
                      <small>
                        {formatDate(scan.created_at)} · {getConfidence(scan).toFixed(1)}% confidence
                      </small>
                    </span>
                    <span>View →</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  // ---------------- SCREENING ----------------

  if (page === "screening") {
    const screeningPatient =
      user?.role === "patient" ? myProfile : selectedPatient;

    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="dashboard">
            <button
              className="back-step"
              onClick={() =>
                setPage(user?.role === "admin" ? "admin-patient" : "patient-dashboard")
              }
            >
              ← Back
            </button>

            <p className="screening-eyebrow">NEW SCREENING</p>
            <h1>Upload a fundus image.</h1>

            <p className="screening-intro">
              Patient information is linked to this screening automatically.
            </p>

            <div className="patient-summary">
              <div>
                <span>Patient ID</span>
                <strong>{getPatientId(screeningPatient)}</strong>
              </div>
              <div>
                <span>Name</span>
                <strong>{getPatientName(screeningPatient)}</strong>
              </div>
              <div>
                <span>Age</span>
                <strong>{screeningPatient?.age}</strong>
              </div>
              <div>
                <span>Gender</span>
                <strong>{screeningPatient?.gender}</strong>
              </div>
            </div>

            <section className="profile-create">
              <p className="result-label">FUNDUS IMAGE</p>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImage}
              />

              {imagePreview && (
                <div className="result-image-card">
                  <img src={imagePreview} alt="Selected fundus" />
                </div>
              )}

              {error && <div className="form-error">{error}</div>}

              <button
                className="primary-btn"
                onClick={runScreening}
                disabled={busy || !image}
              >
                {busy ? "Analysing retinal image..." : "Run screening →"}
              </button>
            </section>
          </section>
        </div>
      </main>
    );
  }

  // ---------------- RESULT ----------------

  if (page === "result" && result) {
    const rawStage = getScanStage(result);
    const key = normalizeStage(rawStage);
    const info = stageInfo(key, language);
    const confidence = getConfidence(result);

    const uncertainty = result.uncertainty;
    const ambiguous = Boolean(uncertainty?.ambiguous);
    const alternatives = uncertainty?.alternatives || [];

    const patientId =
      result.patient_id ||
      getPatientId(selectedPatient) ||
      getPatientId(myProfile);

    const patientRecord = selectedPatient || myProfile;

    return (
      <main className="screening-page result-screen">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="result-page">
            <button
              className="back-step"
              onClick={() =>
                setPage(
                  user?.role === "admin"
                    ? "admin-patient"
                    : "history"
                )
              }
            >
              ← Back
            </button>

            <div className="result-container">
              <div className="result-title-area">
                <p className="screening-eyebrow">
                  {tr(
                    language,
                    "SCREENING RESULT",
                    "स्क्रीनिंग परिणाम"
                  )}
                </p>

                <h1>
                  {tr(
                    language,
                    "Retinal Screening Result",
                    "रेटिनल स्क्रीनिंग परिणाम"
                  )}
                </h1>
              </div>

              {/* 01 — PATIENT DETAILS */}
              <section className="result-section patient-result-card">
                <div className="result-section-heading">
                  <span>01</span>

                  <div>
                    <p className="result-label">
                      {tr(
                        language,
                        "PATIENT DETAILS",
                        "रोगी की जानकारी"
                      )}
                    </p>

                    <h2>{getPatientName(patientRecord)}</h2>
                  </div>
                </div>

                <div className="patient-result-grid">
                  <div>
                    <span>Patient ID</span>
                    <strong>{patientId || "—"}</strong>
                  </div>

                  <div>
                    <span>Age</span>
                    <strong>{patientRecord?.age || "—"}</strong>
                  </div>

                  <div>
                    <span>Gender</span>
                    <strong>{patientRecord?.gender || "—"}</strong>
                  </div>

                  <div>
                    <span>Diabetes</span>
                    <strong>
                      {patientRecord?.diabetes ? "Yes" : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Screening date</span>
                    <strong>
                      {formatDate(result.created_at) || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Model</span>
                    <strong>
                      {result.model_version || "—"}
                    </strong>
                  </div>
                </div>
              </section>

              {/* 02 — RESULT */}
              <section className="diagnosis-card">
                <div className="diagnosis-left">
                  <p className="result-label">
                    {tr(
                      language,
                      "DETECTED DIABETIC RETINOPATHY STAGE",
                      "पाई गई डायबिटिक रेटिनोपैथी स्टेज"
                    )}
                  </p>

                  <h2 className="diagnosis-stage">
                    {language === "hi" ? info.name : rawStage}
                  </h2>

                  <p className="diagnosis-description">
                    {info.title}
                  </p>
                </div>

                <div className="confidence-box">
                  <span>
                    {tr(
                      language,
                      "CNN MODEL CONFIDENCE",
                      "CNN मॉडल कॉन्फिडेंस"
                    )}
                  </span>

                  <strong>{confidence.toFixed(1)}%</strong>
                </div>
              </section>

              {/* 03 — IMAGES */}
              <section className="result-section">
                <div className="result-section-heading">
                  <span>03</span>

                  <div>
                    <p className="result-label">
                      {tr(
                        language,
                        "RETINAL ANALYSIS",
                        "रेटिनल विश्लेषण"
                      )}
                    </p>

                    <h2>Fundus image & Grad-CAM</h2>
                  </div>
                </div>

                <div className="result-images-new">
                  <div className="analysis-image-card">
                    <div className="analysis-image-header">
                      <span>ORIGINAL FUNDUS</span>
                    </div>

                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Original fundus"
                      />
                    ) : (
                      <div className="empty-state">
                        Original image unavailable.
                      </div>
                    )}
                  </div>

                  <div className="analysis-image-card">
                    <div className="analysis-image-header">
                      <span>GRAD-CAM</span>
                    </div>

                    {overlayUrl || gradcamUrl ? (
                      <img
                        src={overlayUrl || gradcamUrl}
                        alt="Grad-CAM explanation"
                      />
                    ) : (
                      <div className="empty-state">
                        Grad-CAM unavailable.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* 04 — SEVERITY */}
              <section className="result-section severity-result-card">
                <div className="result-section-heading">
                  <span>04</span>

                  <div>
                    <p className="result-label">
                      {tr(
                        language,
                        "DISEASE SEVERITY",
                        "रोग की गंभीरता"
                      )}
                    </p>

                    <h2>Retinopathy progression</h2>
                  </div>
                </div>

                <SeverityScale
                  stage={key}
                  language={language}
                />
              </section>

              {/* CONDITIONAL UNCERTAINTY */}
              {ambiguous && (
                <section className="result-section uncertainty-card">
                  <p className="result-label">
                    {tr(
                      language,
                      "MODEL UNCERTAINTY",
                      "मॉडल अनिश्चितता"
                    )}
                  </p>

                  <h2>
                    {tr(
                      language,
                      "More than one stage may be plausible.",
                      "एक से अधिक स्टेज संभावित हो सकते हैं।"
                    )}
                  </h2>

                  <div className="uncertainty-grid">
                    {alternatives.map((item) => (
                      <div key={item.stage}>
                        <span>{item.stage}</span>

                        <strong>
                          {(Number(item.probability) * 100).toFixed(1)}%
                        </strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 05 — WARNINGS */}
              <section className="warnings-section">
                <div className="medical-warning-box">
                  <strong>⚠ CNN MODEL CONFIDENCE</strong>

                  <p>
                    The confidence score reflects the CNN model's
                    confidence in its predicted diabetic-retinopathy
                    category. It is not a guarantee of disease
                    presence, absence, or clinical severity.
                  </p>
                </div>

                <div className="medical-warning-box">
                  <strong>⚠ MEDICAL DISCLAIMER</strong>

                  <p>
                    This AI-assisted screening result does not replace
                    a qualified doctor's examination, diagnosis, or
                    professional medical opinion.
                  </p>
                </div>
              </section>

              {/* ACTIONS */}
              <section className="result-actions">
                <button
                  className="primary-btn"
                  onClick={handleReport}
                >
                  {tr(
                    language,
                    "Download PDF report",
                    "PDF रिपोर्ट डाउनलोड करें"
                  )}
                  {" →"}
                </button>

                <button
                  className="secondary-btn know-more-btn"
                  onClick={openStageInfo}
                >
                  {tr(
                    language,
                    "Know more about this stage",
                    "इस स्टेज के बारे में और जानें"
                  )}
                  {" →"}
                </button>
              </section>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ---------------- STAGE INFORMATION ----------------

  if (page === "stage-info" && result) {
    const rawStage = getScanStage(result);
    const key = normalizeStage(rawStage);
    const info = stageInfo(key, language);

    const patientRecord = selectedPatient || myProfile;

    const patientId =
      result.patient_id ||
      getPatientId(selectedPatient) ||
      getPatientId(myProfile);

    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <Header
            user={user}
            language={language}
            setLanguage={setLanguage}
            setPage={setPage}
            logout={logout}
          />

          <section className="stage-info-page">
            <button
              className="back-step"
              onClick={() => setPage("result")}
            >
              ← Back to result
            </button>

            <p className="screening-eyebrow">
              {tr(
                language,
                "STAGE INFORMATION",
                "स्टेज की जानकारी"
              )}
            </p>

            <h1>
              {language === "hi" ? info.name : info.title}
            </h1>

            <p className="stage-info-intro">
              {tr(
                language,
                "Detailed information about the detected diabetic-retinopathy stage and the patient's screening result.",
                "पाई गई डायबिटिक रेटिनोपैथी स्टेज और रोगी के स्क्रीनिंग परिणाम की विस्तृत जानकारी।"
              )}
            </p>

            <section className="info-card">
              <div className="info-card-heading">
                <p className="result-label">PATIENT DETAILS</p>
              </div>

              <div className="patient-info-grid">
                <div>
                  <span>Patient ID</span>
                  <strong>{patientId || "—"}</strong>
                </div>

                <div>
                  <span>Name</span>
                  <strong>{getPatientName(patientRecord)}</strong>
                </div>

                <div>
                  <span>Age</span>
                  <strong>{patientRecord?.age || "—"}</strong>
                </div>

                <div>
                  <span>Gender</span>
                  <strong>{patientRecord?.gender || "—"}</strong>
                </div>

                <div>
                  <span>Diabetes</span>
                  <strong>
                    {patientRecord?.diabetes ? "Yes" : "No"}
                  </strong>
                </div>

                <div>
                  <span>Screening date</span>
                  <strong>
                    {formatDate(result.created_at) || "—"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="stage-detail-card">
              <p className="result-label">DETECTED STAGE</p>

              <h2>{info.title}</h2>

              <div className="stage-detail-badge">
                Stage {STAGES[key]?.level ?? 2} of 4
              </div>

              <p className="stage-detail-description">
                {info.description}
              </p>

              <div className="stage-changes">
                <h3>
                  {tr(
                    language,
                    "Commonly described changes",
                    "आम तौर पर बताए जाने वाले बदलाव"
                  )}
                </h3>

                <ul>
                  {info.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="info-card">
              <p className="result-label">SCREENING INFORMATION</p>

              <div className="patient-info-grid">
                <div>
                  <span>Predicted stage</span>
                  <strong>{rawStage}</strong>
                </div>

                <div>
                  <span>Model confidence</span>
                  <strong>
                    {getConfidence(result).toFixed(1)}%
                  </strong>
                </div>

                <div>
                  <span>Model version</span>
                  <strong>
                    {result.model_version || "—"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="medical-warning-box">
              <strong>⚠ CNN MODEL CONFIDENCE</strong>

              <p>
                The confidence score represents the confidence of the
                CNN-based model in its predicted diabetic-retinopathy
                category. It should not be interpreted as a guarantee
                or as a standalone clinical diagnosis.
              </p>
            </section>

            <section className="medical-warning-box">
              <strong>⚠ IMPORTANT MEDICAL INFORMATION</strong>

              <p>
                This AI-assisted screening result does not replace
                examination, diagnosis, or medical advice from a
                qualified eye-care professional.
              </p>
            </section>
          </section>
        </div>
      </main>
    );
  }

  // Fallback
  return (
    <main className="screening-page">
      <div className="screening-wrapper">
        <section className="dashboard">
          <h1>नेत्रia</h1>
          <p>Loading...</p>
        </section>
      </div>
    </main>
  );
}

export default App;
