import { useEffect, useState } from "react";
import "./App.css";
import { Login, Signup } from "./pages.jsx";
import {
  createMyProfile,
  uploadScan,
  getGradCam,
  getGradCamOverlay,
  getScan,
  getScanImage,
  downloadReport,
  loginUser,
  registerUser,
  getCurrentUser,
  getMyProfile,
  getPatientById,
  getPatientHistory,
  logoutUser,
} from "./api";

import fundImage from "./assets/fund.jpg";

const TEXTS = {
  en: {
    stagesNav: "Stages",
    loginNav: "Log in",
    langToggle: "हिंदी",
    eyebrow: "RETINAL SCREENING PLATFORM",
    heroTitle1: "Early detection.",
    heroTitle2: "Better decisions.",
    heroDesc:
      "A structured, deep-learning powered retinal screening workflow designed for early identification of diabetic retinopathy to prevent avoidable vision impairment.",
    startBtn: "Start screening",
    backBtn: "Back",
    exitBtn: "Exit",
    selectPortal: "Select your portal",
    patient: "Patient",
    doctorAdmin: "Doctor / Admin",
    intakeEyebrow: "NEW SCREENING WORKFLOW",
    intakeTitle: "Patient Intake & Fundus Analysis",
    intakeDesc:
      "Enter patient details and duration of diabetes before proceeding with the retinal fundus scan.",
    step1: "STEP 1: PATIENT PARTICULARS",
    fullName: "Patient Full Name",
    age: "Age",
    gender: "Gender",
    selectGender: "Select Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    hasDiabetes: "Diagnosed with Diabetes?",
    yes: "Yes",
    no: "No",
    duration: "Duration of Diabetes (Years)",
    step2: "STEP 2: FUNDUS IMAGE",
    selectImgText: "Select Retinal Fundus File",
    noFileSelected: "No file chosen yet",
    runBtn: "Run screening →",
    runningBtn: "Analyzing Fundus Scan...",
    resultEyebrow: "SCREENING RESULT",
    resultTitle: "Retinal Screening Output",
    detectedStage: "DETECTED STAGE",
    modelConfidence: "MODEL CONFIDENCE",
    originalFundus: "ORIGINAL FUNDUS",
    gradcam: "GRAD-CAM ATTENTION HEATMAP",
    progressionScale: "Severity Progression Scale",
    knowMoreBtn: "Know more about this stage →",
    getPdfBtn: "Get PDF Report",
    doctorSuite: "CLINICAL SUITE",
    doctorTitle: "Doctor / Admin Workspace",
    doctorDesc:
      "Choose an action below to initiate a diagnostic screening or retrieve a patient's historical records.",
    opt1Title: "Start a new scan",
    opt1Desc:
      "Enter patient intake information and run a fresh CNN fundus screening.",
    opt1Btn: "Open screening form →",
    opt2Title: "Search patient by ID",
    opt2Desc:
      "Input a Patient ID to view diagnostic history, progression, and past scan results.",
    opt2Btn: "Search records →",
    statsEyebrow: "NATIONAL EPIDEMIOLOGICAL CONTEXT",
    statsHeading: "Diabetic Retinopathy in India",
    stat1Num: "101M+",
    stat1Desc:
      "Individuals in India currently live with diabetes mellitus (ICMR-INDIAB).",
    stat2Num: "~12.5%",
    stat2Desc:
      "Prevalence of diabetic retinopathy among adults diagnosed with diabetes.",
    stat3Num: "3–4%",
    stat3Desc:
      "Progress to sight-threatening (STDR) or proliferative stages without regular screening.",
    stat4Num: "80%+",
    stat4Desc:
      "Of vision loss cases are preventable through prompt detection and early intervention.",
    workflowEyebrow: "THE WORKFLOW",
    workflowHeading: "Screening built around",
    workflowSpan: "clarity.",
    workflowDesc:
      "नेत्रia brings patient profiling, high-resolution fundus CNN inference, and explainable visual insights into one cohesive platform.",
    wf1Title: "Patient information",
    wf1Desc:
      "Record essential systemic parameters, diabetes duration, and demographic data.",
    wf2Title: "Retinal analysis",
    wf2Desc:
      "Upload a standard fundus image and run real-time multi-stage CNN inference.",
    wf3Title: "Explainable results",
    wf3Desc:
      "Review predicted stage, confidence, Grad-CAM visual attention, and medical reports.",
    footerText: "AI-assisted retinal screening interface · SIH Project",
    warningDoctor:
      "This screening output is for assistive evaluation only and does not replace a professional medical consultation or clinical diagnosis by an actual certified doctor.",
    warningConfidence:
      "The confidence score represents the model's pattern-recognition certainty on this scan, not the clinical progression or anatomical severity of the disease.",
  },
  hi: {
    stagesNav: "स्टेज",
    loginNav: "लॉग इन",
    langToggle: "English",
    eyebrow: "रेटिनल स्क्रीनिंग प्लेटफॉर्म",
    heroTitle1: "समय पर पहचान।",
    heroTitle2: "बेहतर निर्णय।",
    heroDesc:
      "डायबिटिक रेटिनोपैथी की शुरुआती पहचान और दृष्टि सुरक्षा के लिए आधुनिक डीप-लर्निंग रेटिनल स्क्रीनिंग वर्कफ्लो।",
    startBtn: "स्क्रीनिंग शुरू करें",
    backBtn: "वापस",
    exitBtn: "बाहर निकलें",
    selectPortal: "अपना पोर्टल चुनें",
    patient: "मरीज",
    doctorAdmin: "डॉक्टर / एडमिन",
    intakeEyebrow: "नया स्क्रीनिंग वर्कफ्लो",
    intakeTitle: "मरीज विवरण एवं फंडस विश्लेषण",
    intakeDesc:
      "रेटिनल फंडस स्कैन शुरू करने से पहले मरीज का विवरण और डायबिटीज की अवधि दर्ज करें।",
    step1: "चरण 1: मरीज का विवरण",
    fullName: "मरीज का पूरा नाम",
    age: "उम्र",
    gender: "लिंग",
    selectGender: "लिंग चुनें",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    hasDiabetes: "क्या मरीज को डायबिटीज है?",
    yes: "हाँ",
    no: "नहीं",
    duration: "डायबिटीज की अवधि (वर्ष)",
    step2: "चरण 2: फंडस छवि",
    selectImgText: "रेटिनल फंडस फाइल चुनें",
    noFileSelected: "कोई फाइल नहीं चुनी गई",
    runBtn: "स्क्रीनिंग शुरू करें →",
    runningBtn: "फंडस विश्लेषण जारी है...",
    resultEyebrow: "स्क्रीनिंग परिणाम",
    resultTitle: "रेटिनल स्क्रीनिंग रिपोर्ट",
    detectedStage: "पहचानी गई स्टेज",
    modelConfidence: "मॉडल सटीकता",
    originalFundus: "मूल फंडस छवि",
    gradcam: "ग्रैड-कैम (Grad-CAM) हीटमैप",
    progressionScale: "गंभीरता प्रगति स्केल",
    knowMoreBtn: "इस स्टेज के बारे में और जानें →",
    getPdfBtn: "पीडीएफ रिपोर्ट प्राप्त करें",
    doctorSuite: "क्लिनिकल सुइट",
    doctorTitle: "डॉक्टर / एडमिन कार्यक्षेत्र",
    doctorDesc:
      "नया स्कैन शुरू करने या मरीज के पिछले रिकॉर्ड देखने के लिए विकल्प चुनें।",
    opt1Title: "नया स्कैन शुरू करें",
    opt1Desc: "मरीज का विवरण दर्ज करें और नया CNN फंडस स्कैन करें।",
    opt1Btn: "स्क्रीनिंग फॉर्म खोलें →",
    opt2Title: "आईडी द्वारा मरीज खोजें",
    opt2Desc: "मरीज की आईडी दर्ज कर पुरानी रिपोर्ट और इतिहास देखें।",
    opt2Btn: "रिकॉर्ड खोजें →",
    statsEyebrow: "राष्ट्रीय महामारी विज्ञान संदर्भ",
    statsHeading: "भारत में डायबिटिक रेटिनोपैथी",
    stat1Num: "101M+",
    stat1Desc:
      "भारत में 10.1 करोड़ से अधिक लोग डायबिटीज के साथ जी रहे हैं (ICMR-INDIAB)।",
    stat2Num: "~12.5%",
    stat2Desc:
      "डायबिटीज से पीड़ित वयस्कों में डायबिटिक रेटिनोपैथी का प्रसार।",
    stat3Num: "3–4%",
    stat3Desc:
      "नियमित जांच के अभाव में दृष्टि-घातक या प्रोलिफेरेटिव स्टेज में बढ़ जाते हैं।",
    stat4Num: "80%+",
    stat4Desc:
      "दृष्टि हानि के 80% से अधिक मामले समय पर पहचान और उपचार से रोके जा सकते हैं।",
    workflowEyebrow: "कार्यप्रणाली",
    workflowHeading: "स्पष्टता पर आधारित",
    workflowSpan: "स्क्रीनिंग।",
    workflowDesc:
      "नेत्रia मरीज प्रोफाइलिंग, उच्च-रिज़ॉल्यूशन फंडस CNN मॉडल और व्याख्यात्मक विज़ुअल इनसाइट्स को एक साथ लाता है।",
    wf1Title: "मरीज की जानकारी",
    wf1Desc:
      "महत्वपूर्ण पैरामीटर, डायबिटीज की अवधि और जनसांख्यिकीय डेटा दर्ज करें।",
    wf2Title: "रेटिनल विश्लेषण",
    wf2Desc:
      "मानक फंडस छवि अपलोड करें और रीयल-टाइम बहु-चरणीय CNN विश्लेषण चलाएं।",
    wf3Title: "व्याख्यात्मक परिणाम",
    wf3Desc:
      "पहचानी गई स्टेज, सटीकता, ग्रैड-कैम विज़ुअल ध्यान और मेडिकल रिपोर्ट देखें।",
    footerText: "AI-आधारित रेटिनल स्क्रीनिंग इंटरफेस · SIH प्रोजेक्ट",
    warningDoctor:
      "यह परिणाम केवल सहायक मूल्यांकन के लिए है और यह किसी प्रमाणित चिकित्सक या नेत्र रोग विशेषज्ञ के परामर्श का विकल्प नहीं है।",
    warningConfidence:
      "कॉन्फिडेंस स्कोर केवल इस स्कैन पर मॉडल की पहचान संबंधी गणितीय निश्चितता को दर्शाता है, यह रोग की नैदानिक गंभीरता या स्टेज का स्तर नहीं है।",
  },
};

const STAGE_DETAILS = {
  "No DR": {
    level: 0,
    title: "No Diabetic Retinopathy Detected",
    titleHi: "डायबिटिक रेटिनोपैथी के संकेत नहीं मिले",
    summary:
      "No microaneurysms, hemorrhages, or exudates were identified in the fundus scan.",
    symptoms: [
      "No visual acuity degradation.",
      "Clear foveal reflex and normal vascular architecture.",
    ],
    management: [
      "Continue regular HbA1c monitoring.",
      "Maintain a comprehensive dilated eye examination every 12 months.",
    ],
  },
  "Mild NPDR": {
    level: 1,
    title: "Mild Non-Proliferative Retinopathy",
    titleHi: "हल्की नॉन-प्रोलिफेरेटिव रेटिनोपैथी",
    summary:
      "Presence of microaneurysms—small balloon-like outpouchings in tiny retinal blood vessels.",
    symptoms: [
      "Often entirely asymptomatic; vision remains normal.",
      "Earliest clinically detectable stage.",
    ],
    management: [
      "Strict blood glucose and blood pressure regulation.",
      "Follow-up retinal screening recommended in 6 to 9 months.",
    ],
  },
  "Moderate NPDR": {
    level: 2,
    title: "Moderate Non-Proliferative Retinopathy",
    titleHi: "मध्यम नॉन-प्रोलिफेरेटिव रेटिनोपैथी",
    summary:
      "Vessel dilation, dot-and-blot hemorrhages, and venous beading indicate localized capillary blockage.",
    symptoms: [
      "Mild fluctuations in reading clarity or subtle floaters.",
      "Progressive compromise of retinal nourishment.",
    ],
    management: [
      "Referral to an ophthalmologist / retina specialist.",
      "Screening intervals reduced to 3 to 6 months.",
    ],
  },
  "Severe NPDR": {
    level: 3,
    title: "Severe Non-Proliferative Retinopathy",
    titleHi: "गंभीर नॉन-प्रोलिफेरेटिव रेटिनोपैथी",
    summary:
      "Extensive microvascular blockages across multiple retinal quadrants leading to significant retinal ischemia.",
    symptoms: [
      "Hazy or blurry central vision, diminished contrast sensitivity.",
      "High rate of progression to proliferative retinopathy within 1 year.",
    ],
    management: [
      "Immediate clinical evaluation for laser panretinal photocoagulation or anti-VEGF therapy.",
      "Strict monitoring every 2 to 3 months.",
    ],
  },
  "Proliferative DR": {
    level: 4,
    title: "Proliferative Diabetic Retinopathy (PDR)",
    titleHi: "प्रोलिफेरेटिव डायबिटिक रेटिनोपैथी",
    summary:
      "Ischemia stimulates abnormal, fragile neovascularization on the retina or optic disc that can bleed or cause retinal detachment.",
    symptoms: [
      "Sudden showers of dark spots, spiderwebs, or significant vision loss.",
      "Vitreous hemorrhage or tractional retinal detachment risks.",
    ],
    management: [
      "Urgent retinal intervention: Panretinal photocoagulation (PRP) or vitrectomy.",
      "Frequent specialist treatment.",
    ],
  },
};

const STAGE_ORDER = [
  "No DR",
  "Mild NPDR",
  "Moderate NPDR",
  "Severe NPDR",
  "Proliferative DR",
];

function getDurationStats(durationNum, hasDiabetes, lang = "en") {
  if (!hasDiabetes || !durationNum || durationNum <= 0) {
    return {
      riskPercent: "< 5%",
      band:
        lang === "hi"
          ? "शुरुआती / गैर-डायबिटिक आधार"
          : "Early / Non-diabetic baseline",
      explanation:
        lang === "hi"
          ? "गैर-डायबिटिक मरीजों में रेटिनल जोखिम न्यूनतम होता है, फिर भी नियमित जांच सहायक है।"
          : "Retinal complications are rare in non-diabetic individuals, but routine baselines are essential.",
      annualProgression:
        lang === "hi" ? "न्यूनतम आधारभूत जोखिम" : "Minimal baseline risk",
    };
  }

  if (durationNum < 5) {
    return {
      riskPercent: "~15% – 25%",
      band:
        lang === "hi" ? "0 से 5 वर्ष डायबिटीज" : "0 to 5 Years with Diabetes",
      explanation:
        lang === "hi"
          ? "लगभग 20% मरीजों में 5 वर्ष के भीतर शुरुआती माइक्रोएन्यूरिज्म दिखते हैं। सख्त ग्लूकोज नियंत्रण प्रगति रोकता है।"
          : "Roughly 1 in 5 individuals show early microaneurysms within 5 years. Good glycemic control halts progression.",
      annualProgression: lang === "hi" ? "कम से मध्यम" : "Low to Moderate",
    };
  } else if (durationNum <= 10) {
    return {
      riskPercent: "~40% – 50%",
      band:
        lang === "hi" ? "5 से 10 वर्ष डायबिटीज" : "5 to 10 Years with Diabetes",
      explanation:
        lang === "hi"
          ? "5-10 वर्षों के बाद रक्त वाहिकाओं में रुकावट का जोखिम तेजी से बढ़ता है। हर 6 महीने पर जांच जरूरी है।"
          : "Prevalence of changes increases noticeably after 5–10 years. Bi-annual checkups strongly advised.",
      annualProgression:
        lang === "hi"
          ? "मध्यम — हर 6 माह पर जांच"
          : "Moderate — Bi-annual checkups advised",
    };
  } else if (durationNum <= 15) {
    return {
      riskPercent: "~60% – 70%",
      band:
        lang === "hi"
          ? "10 से 15 वर्ष डायबिटीज"
          : "10 to 15 Years with Diabetes",
      explanation:
        lang === "hi"
          ? "60% से अधिक मरीजों में रेटिनोपैथी के स्पष्ट संकेत मिलते हैं। रेटिना विशेषज्ञ की देखरेख अनिवार्य है।"
          : "Over 60% of patients develop detectable microvascular retinopathy signs.",
      annualProgression:
        lang === "hi"
          ? "उच्च — विशेषज्ञ देखरेख आवश्यक"
          : "Elevated — Active specialist care required",
    };
  } else {
    return {
      riskPercent: "> 75% – 85%",
      band: lang === "hi" ? "15+ वर्ष डायबिटीज" : "15+ Years with Diabetes",
      explanation:
        lang === "hi"
          ? "लंबे समय से डायबिटीज के कारण अधिकांश मरीजों में रेटिनल जोखिम अत्यधिक बढ़ जाता है।"
          : "Chronic microvascular exposure creates high risk of macular edema or proliferative vessels.",
      annualProgression:
        lang === "hi"
          ? "अत्यधिक गंभीर — हर 3 माह पर जांच"
          : "High — Examination every 3–6 months",
    };
  }
}

function UniversalBackButton({ onClick, label = "Back" }) {
  return (
    <button type="button" className="universal-pill-back" onClick={onClick}>
      <span className="pill-arrow">←</span>
      <span>{label}</span>
    </button>
  );
}

export default function App() {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("home");
  const [targetRole, setTargetRole] = useState("patient");
  const [user, setUser] = useState(null);

  const t = TEXTS[lang];

  const [patient, setPatient] = useState({
    fullName: "",
    gender: "",
    age: "",
    diabetes: false,
    diabetesDuration: "",
  });

  const [searchId, setSearchId] = useState("");
  const [searchedPatient, setSearchedPatient] = useState(null);

  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onSignup = () => {
      setError("");
      setTargetRole("patient");
      setPage("signup");
    };
    const onLogin = () => {
      setError("");
      setPage("login");
    };
    window.addEventListener("netrava-open-signup", onSignup);
    window.addEventListener("netrava-open-login", onLogin);
    return () => {
      window.removeEventListener("netrava-open-signup", onSignup);
      window.removeEventListener("netrava-open-login", onLogin);
    };
  }, []);

  function toggleLanguage() {
    setLang((prev) => (prev === "en" ? "hi" : "en"));
  }

  function renderLangButton() {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        style={{
          background: "transparent",
          border: "1.5px solid var(--orange)",
          color: "var(--orange-dark)",
          borderRadius: "999px",
          padding: "7px 15px",
          fontWeight: 800,
          fontSize: "12.5px",
          cursor: "pointer",
        }}
      >
        {t.langToggle}
      </button>
    );
  }

  async function handleLogin(values) {
    setBusy(true);
    setError("");

    try {
      const data = await loginUser(values.username, values.password);
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error("Unable to load the logged-in user.");
      }

      const role = currentUser.role || data?.user?.role;

      if (!role) {
        throw new Error("Your account role could not be determined.");
      }

      if (targetRole && role !== targetRole) {
        logoutUser();
        throw new Error(
          targetRole === "admin"
            ? "This account is not a Doctor / Admin account."
            : "This account is not a Patient account."
        );
      }

      setUser(currentUser);

      if (role === "admin") {
        setPage("admin-dashboard");
      } else {
        try {
          const profile = await getMyProfile();
          setPatient({
            patient_id: profile.patient_id,
            fullName: profile.full_name || "",
            gender: profile.gender || "",
            age: profile.age ?? "",
            diabetes: Boolean(profile.diabetes),
            diabetesDuration: profile.diabetes_duration ?? "",
          });
        } catch {
          // A new patient may not have a profile yet.
        }
        setPage("screening");
      }
    } catch (err) {
      setError(err?.message || "Unable to log in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(values) {
    setBusy(true);
    setError("");

    try {
      await registerUser({
        username: values.username,
        password: values.password,
        fullName: values.fullName,
        role: "patient",
      });

      // Registration creates the account. Login immediately so the
      // newly created patient can create their profile without another screen.
      await loginUser(values.username, values.password);
      const currentUser = await getCurrentUser();

      setUser(currentUser || {
        username: values.username,
        full_name: values.fullName,
        role: "patient",
      });

      setPatient({
        fullName: values.fullName || "",
        gender: "",
        age: "",
        diabetes: false,
        diabetesDuration: "",
      });
      setPage("screening");
    } catch (err) {
      setError(err?.message || "Unable to create the account.");
    } finally {
      setBusy(false);
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function normalizePatient(profile, scans = []) {
    return {
      patient_id: profile?.patient_id,
      fullName: profile?.full_name ?? profile?.fullName ?? "",
      age: profile?.age ?? "",
      gender: profile?.gender ?? "",
      diabetes: Boolean(profile?.diabetes),
      diabetesDuration: profile?.diabetes_duration ?? profile?.diabetesDuration ?? "",
      scans: Array.isArray(scans) ? scans : [],
    };
  }

  async function handleSearchPatient(e) {
    if (e) e.preventDefault();
    setError("");

    const query = searchId.trim().toUpperCase();

    if (!query) {
      setError(
        lang === "hi" ? "कृपया मरीज आईडी दर्ज करें।" : "Please enter a Patient ID."
      );
      return;
    }

    setBusy(true);

    try {
      const profile = await getPatientById(query);
      const history = await getPatientHistory(query);
      const scans = Array.isArray(history)
        ? history
        : history?.scans || history?.items || history?.data || [];

      const normalized = normalizePatient(profile, scans);
      setSearchedPatient(normalized);
      setPage("patient-search-result");
    } catch (err) {
      setSearchedPatient(null);
      setError(err?.message || "Patient record could not be found.");
    } finally {
      setBusy(false);
    }
  }

  async function loadScanResult(scanItem, currentPat) {
    setBusy(true);
    setError("");

    try {
      const scanId = scanItem?.scan_id || scanItem?.id;
      if (!scanId) throw new Error("Scan ID is missing.");

      const scan = scanItem?.prediction
        ? scanItem
        : await getScan(scanId);

      const [originalUrl, gradcamUrl, gradcamOverlayUrl] = await Promise.all([
        getScanImage(scanId).catch(() => ""),
        getGradCam(scanId).catch(() => ""),
        getGradCamOverlay(scanId).catch(() => ""),
      ]);

      setPatient(normalizePatient(currentPat, []));
      setResult({
        ...scan,
        confidence:
          typeof scan.confidence === "number" && scan.confidence <= 1
            ? Number((scan.confidence * 100).toFixed(2))
            : scan.confidence,
        originalImageUrl: originalUrl,
        gradcamUrl: gradcamUrl || scan.gradcam_url || "",
        gradcamOverlayUrl: gradcamOverlayUrl || "",
      });
      setPage("result");
    } catch (err) {
      setError(err?.message || "Unable to load the scan result.");
    } finally {
      setBusy(false);
    }
  }

  function viewPastScan(scanItem, currentPat) {
    loadScanResult(scanItem, currentPat);
  }

  function startScanForPatient(currentPat) {
    setPatient({
      patient_id: currentPat.patient_id,
      fullName: currentPat.fullName,
      gender: currentPat.gender,
      age: currentPat.age,
      diabetes: currentPat.diabetes,
      diabetesDuration: currentPat.diabetesDuration,
    });
    setSelectedFileName("");
    setSelectedFile(null);
    setImagePreview("");
    setPage("screening");
  }

  function logout() {
    logoutUser();
    setUser(null);
    setResult(null);
    setSearchedPatient(null);
    setPatient({
      fullName: "",
      gender: "",
      age: "",
      diabetes: false,
      diabetesDuration: "",
    });
    setPage("home");
  }

  async function downloadPdfReport() {
    if (!result?.scan_id) return;

    try {
      setError("");
      await downloadReport(result.scan_id, lang);
    } catch (err) {
      setError(err?.message || "Unable to generate the PDF report.");
    }
  }

  async function runScreening() {
    setError("");

    if (!selectedFile) {
      setError(
        lang === "hi"
          ? "कृपया फंडस इमेज चुनें।"
          : "Please select a fundus image."
      );
      return;
    }

    if (!patient.fullName.trim()) {
      setError(
        lang === "hi"
          ? "कृपया मरीज का पूरा नाम दर्ज करें।"
          : "Please enter the patient's full name."
      );
      return;
    }

    if (!patient.age || Number(patient.age) < 1) {
      setError(
        lang === "hi" ? "कृपया मरीज की उम्र दर्ज करें।" : "Please enter a valid patient age."
      );
      return;
    }

    if (!patient.gender) {
      setError(
        lang === "hi" ? "कृपया लिंग चुनें।" : "Please select a gender."
      );
      return;
    }

    if (patient.diabetes && !patient.diabetesDuration) {
      setError(
        lang === "hi"
          ? "कृपया डायबिटीज की अवधि दर्ज करें।"
          : "Please enter the duration of diabetes."
      );
      return;
    }

    setBusy(true);

    try {
      let patientId = patient.patient_id;

      // Existing patient profile: reuse it.
      if (!patientId) {
        const profile = await createMyProfile(patient);
        patientId = profile?.patient_id;

        if (!patientId) {
          throw new Error("Patient profile was created without a Patient ID.");
        }

        setPatient((prev) => ({
          ...prev,
          patient_id: patientId,
        }));
      }

      const scan = await uploadScan(selectedFile, patientId);
      const scanId = scan?.scan_id;

      if (!scanId) {
        throw new Error("Screening completed but no Scan ID was returned.");
      }

      const [originalUrl, gradcamUrl, gradcamOverlayUrl] = await Promise.all([
        getScanImage(scanId).catch(() => imagePreview || ""),
        getGradCam(scanId).catch(() => ""),
        getGradCamOverlay(scanId).catch(() => ""),
      ]);

      const confidence =
        typeof scan.confidence === "number" && scan.confidence <= 1
          ? Number((scan.confidence * 100).toFixed(2))
          : scan.confidence;

      setResult({
        ...scan,
        confidence,
        originalImageUrl: originalUrl,
        gradcamUrl: gradcamUrl || scan.gradcam_url || "",
        gradcamOverlayUrl: gradcamOverlayUrl || "",
      });
      setPage("result");
    } catch (err) {
      setError(err?.message || "Unable to complete screening.");
    } finally {
      setBusy(false);
    }
  }

  // ==========================================
  // 1. HOME SCREEN
  // ==========================================
  if (page === "home") {
    return (
      <main className="home-page">
        <nav className="home-nav">
          <button className="home-logo" onClick={() => setPage("home")}>
            नेत्रia
          </button>

          <div className="home-nav-actions">
            <button
              className="nav-stages-link"
              onClick={() => setPage("stages")}
            >
              {t.stagesNav}
            </button>
            <button
              className="nav-login"
              onClick={() => setPage("role-selection")}
            >
              {t.loginNav}
            </button>
            {renderLangButton()}
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>
              {t.heroTitle1}
              <br />
              <span>{t.heroTitle2}</span>
            </h1>
            <p className="hero-description">{t.heroDesc}</p>
            <div className="hero-actions">
              <button
                className="primary-btn hero-main-btn"
                onClick={() => setPage("role-selection")}
              >
                {t.startBtn} <span>→</span>
              </button>
            </div>

            <div className="hero-meta">
              <span><b>01</b> {t.wf1Title}</span>
              <span><b>02</b> {t.wf2Title}</span>
              <span><b>03</b> {t.wf3Title}</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-frame">
              <div className="visual-scan-laser" />
              <img
                src={fundImage}
                alt="Retinal Fundus"
                className="fundus-home-img"
              />
            </div>
          </div>
        </section>

        {/* EPIDEMIOLOGICAL CONTEXT STATS IN CARDS */}
        <section className="home-stats-wrapper">
          <div className="home-stats-heading">
            <p className="eyebrow">{t.statsEyebrow}</p>
            <h3>{t.statsHeading}</h3>
          </div>
          <div className="home-stats-grid">
            <div className="home-stat-card">
              <strong className="stat-metric">{t.stat1Num}</strong>
              <p className="stat-desc">{t.stat1Desc}</p>
            </div>
            <div className="home-stat-card">
              <strong className="stat-metric">{t.stat2Num}</strong>
              <p className="stat-desc">{t.stat2Desc}</p>
            </div>
            <div className="home-stat-card">
              <strong className="stat-metric">{t.stat3Num}</strong>
              <p className="stat-desc">{t.stat3Desc}</p>
            </div>
            <div className="home-stat-card">
              <strong className="stat-metric">{t.stat4Num}</strong>
              <p className="stat-desc">{t.stat4Desc}</p>
            </div>
          </div>
        </section>

        {/* 3-STEP WORKFLOW CARDS */}
        <section className="features">
          <div className="section-heading">
            <p className="eyebrow">{t.workflowEyebrow}</p>
            <h2>
              {t.workflowHeading} <span>{t.workflowSpan}</span>
            </h2>
            <p>{t.workflowDesc}</p>
          </div>

          <div className="feature-grid">
            <article>
              <span className="feature-badge">01</span>
              <div className="feature-content">
                <h3>{t.wf1Title}</h3>
                <p>{t.wf1Desc}</p>
              </div>
            </article>
            <article>
              <span className="feature-badge">02</span>
              <div className="feature-content">
                <h3>{t.wf2Title}</h3>
                <p>{t.wf2Desc}</p>
              </div>
            </article>
            <article>
              <span className="feature-badge">03</span>
              <div className="feature-content">
                <h3>{t.wf3Title}</h3>
                <p>{t.wf3Desc}</p>
              </div>
            </article>
          </div>
        </section>

        <footer className="home-footer">
          <strong>नेत्रia</strong>
          <span>{t.footerText}</span>
        </footer>
      </main>
    );
  }

  // ==========================================
  // 2. STAGES OVERVIEW PAGE
  // ==========================================
  if (page === "stages") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <nav className="screening-nav">
            <button className="screening-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div className="app-nav">
              <UniversalBackButton
                onClick={() => setPage("home")}
                label={t.backBtn}
              />
              {renderLangButton()}
            </div>
          </nav>

          <section className="dashboard">
            <div style={{ marginBottom: 18 }}>
              <UniversalBackButton
                onClick={() => setPage("home")}
                label={t.backBtn}
              />
            </div>

            <p className="screening-eyebrow">
              {lang === "hi" ? "रेटिनोपैथी के 5 चरण" : "RETINOPATHY STAGES"}
            </p>
            <h1>
              {lang === "hi"
                ? "पांच अवस्थाओं को समझें"
                : "Understand the 5 stages."}
            </h1>
            <p className="screening-intro">
              {lang === "hi"
                ? "डीप-लर्निंग मॉडल फंडस छवियों को डायबिटिक रेटिनोपैथी की इन पांच श्रेणियों में वर्गीकृत करता है।"
                : "The screening model classifies fundus scans into five distinct diabetic retinopathy categories."}
            </p>

            <div className="dashboard-grid">
              {STAGE_ORDER.map((stageKey) => {
                const info = STAGE_DETAILS[stageKey];
                return (
                  <article className="dashboard-card" key={stageKey}>
                    <span>0{info.level}</span>
                    <h3>{lang === "hi" ? info.titleHi : info.title}</h3>
                    <p>{info.summary}</p>
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

  // ==========================================
  // 3. ROLE SELECTION
  // ==========================================
  if (page === "role-selection") {
    return (
      <main className="role-page">
        <div className="role-shell">
          <nav
            className="role-nav"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button className="home-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <UniversalBackButton
                onClick={() => setPage("home")}
                label={t.backBtn}
              />
              {renderLangButton()}
            </div>
          </nav>

          <div className="role-content">
            <div className="role-heading">
              <h1>{t.selectPortal}</h1>
            </div>

            <div className="role-choice-grid">
              <button
                className="role-choice-card"
                onClick={() => {
                  setTargetRole("patient");
                  setPage("login");
                }}
              >
                <div className="role-choice-top">
                  <div className="role-icon">👤</div>
                  <span className="role-arrow">→</span>
                </div>
                <h2>{t.patient}</h2>
              </button>

              <button
                className="role-choice-card"
                onClick={() => {
                  setTargetRole("admin");
                  setPage("login");
                }}
              >
                <div className="role-choice-top">
                  <div className="role-icon">🩺</div>
                  <span className="role-arrow">→</span>
                </div>
                <h2>{t.doctorAdmin}</h2>
              </button>
            </div>

            <div style={{ marginTop: 32 }}>
              <UniversalBackButton
                onClick={() => setPage("home")}
                label={t.backBtn}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // 4. AUTH (LOGIN / SIGNUP)
  // ==========================================
  if (page === "login") {
    return (
      <Login
        goHome={() => setPage("home")}
        onSuccess={handleLogin}
        error={error}
        busy={busy}
        targetRole={targetRole}
        onChangeRole={() => setPage("role-selection")}
      />
    );
  }

  if (page === "signup") {
    return (
      <Signup
        goHome={() => setPage("home")}
        onSuccess={handleSignup}
        error={error}
        busy={busy}
      />
    );
  }

  // ==========================================
  // 5. DOCTOR WORKSPACE
  // ==========================================
  if (page === "admin-dashboard") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <nav className="screening-nav">
            <button className="screening-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div className="app-nav">
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--orange-dark)",
                }}
              >
                🩺 {t.doctorAdmin}
              </span>
              <UniversalBackButton onClick={logout} label={t.exitBtn} />
              {renderLangButton()}
            </div>
          </nav>

          <section className="dashboard">
            <p className="screening-eyebrow">{t.doctorSuite}</p>
            <h1>{t.doctorTitle}</h1>
            <p className="screening-intro">{t.doctorDesc}</p>

            <div className="dashboard-grid">
              <button
                className="dashboard-card"
                onClick={() => {
                  setPatient({
                    fullName: "",
                    gender: "",
                    age: "",
                    diabetes: false,
                    diabetesDuration: "",
                  });
                  setSelectedFileName("");
                  setSelectedFile(null);
                  setImagePreview("");
                  setPage("screening");
                }}
              >
                <span>OPTION 01</span>
                <h3>{t.opt1Title}</h3>
                <p>{t.opt1Desc}</p>
                <strong>{t.opt1Btn}</strong>
              </button>

              <button
                className="dashboard-card"
                onClick={() => setPage("search-patient-view")}
              >
                <span>OPTION 02</span>
                <h3>{t.opt2Title}</h3>
                <p>{t.opt2Desc}</p>
                <strong>{t.opt2Btn}</strong>
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================
  // 6. DOCTOR: SEARCH PATIENT INPUT SCREEN
  // ==========================================
  if (page === "search-patient-view") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <nav className="screening-nav">
            <button className="screening-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div className="app-nav">
              <UniversalBackButton
                onClick={() => setPage("admin-dashboard")}
                label={t.backBtn}
              />
              {renderLangButton()}
            </div>
          </nav>

          <section className="dashboard">
            <div style={{ marginBottom: 18 }}>
              <UniversalBackButton
                onClick={() => setPage("admin-dashboard")}
                label={t.backBtn}
              />
            </div>

            <p className="screening-eyebrow">
              {lang === "hi" ? "मरीज रिकॉर्ड खोज" : "PATIENT SEARCH"}
            </p>
            <h1>
              {lang === "hi" ? "मरीज आईडी खोजें" : "Lookup Patient Record"}
            </h1>

            <section className="profile-create">
              <form onSubmit={handleSearchPatient}>
                <div className="field">
                  <label>
                    {lang === "hi" ? "मरीज आईडी दर्ज करें" : "Patient ID"}
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="e.g. DR-P-1001"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      style={{ textTransform: "uppercase" }}
                    />
                    <button
                      type="submit"
                      className="primary-btn"
                      style={{ minWidth: 140 }}
                    >
                      {lang === "hi" ? "खोजें" : "Search ID"}
                    </button>
                  </div>
                </div>
              </form>

              {error && <div className="form-error">{error}</div>}

              <div style={{ marginTop: 20 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-soft)",
                    marginRight: 8,
                  }}
                >
                  Sample IDs:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchId("DR-P-1001");
                  }}
                  style={{
                    background: "var(--panel)",
                    color: "var(--orange-dark)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "5px 12px",
                    marginRight: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  DR-P-1001
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchId("DR-P-1002");
                  }}
                  style={{
                    background: "var(--panel)",
                    color: "var(--orange-dark)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "5px 12px",
                    marginRight: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  DR-P-1002
                </button>
              </div>
            </section>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================
  // 7. DOCTOR: SEARCH RESULTS & PAST SCANS
  // ==========================================
  if (page === "patient-search-result" && searchedPatient) {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <nav className="screening-nav">
            <button className="screening-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div className="app-nav">
              <button onClick={() => setPage("search-patient-view")}>
                {lang === "hi" ? "नई खोज" : "New Search"}
              </button>
              {renderLangButton()}
            </div>
          </nav>

          <section className="dashboard">
            <div style={{ marginBottom: 18 }}>
              <UniversalBackButton
                onClick={() => setPage("search-patient-view")}
                label={t.backBtn}
              />
            </div>

            <p className="screening-eyebrow">
              {lang === "hi" ? "मरीज रिकॉर्ड" : "PATIENT PROFILE FOUND"}
            </p>
            <h1>{searchedPatient.fullName}</h1>

            <div className="patient-dashboard-top" style={{ marginTop: 20 }}>
              <div>
                <p className="result-label">PATIENT ID</p>
                <strong>{searchedPatient.patient_id}</strong>
              </div>
              <button
                className="primary-btn"
                onClick={() => startScanForPatient(searchedPatient)}
              >
                +{" "}
                {lang === "hi"
                  ? "इस मरीज के लिए नया स्कैन करें"
                  : "Upload new scan for this patient"}
              </button>
            </div>

            <div className="patient-summary">
              <div>
                <span>{t.fullName}</span>
                <strong>{searchedPatient.fullName}</strong>
              </div>
              <div>
                <span>
                  {t.age} / {t.gender}
                </span>
                <strong>
                  {searchedPatient.age} yrs · {searchedPatient.gender}
                </strong>
              </div>
              <div>
                <span>{t.hasDiabetes}</span>
                <strong>{searchedPatient.diabetes ? t.yes : t.no}</strong>
              </div>
              <div>
                <span>{t.duration}</span>
                <strong>
                  {searchedPatient.diabetes
                    ? `${searchedPatient.diabetesDuration} ${
                        lang === "hi" ? "वर्ष" : "Years"
                      }`
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div className="profile-create" style={{ marginTop: 24 }}>
              <p className="result-label">
                {lang === "hi"
                  ? "पिछली स्क्रीनिंग रिपोर्ट"
                  : "HISTORICAL SCREENINGS"}
              </p>

              {searchedPatient.scans.map((scan) => (
                <div
                  key={scan.scan_id}
                  className="patient-row"
                  style={{ cursor: "pointer", marginTop: 12 }}
                  onClick={() => viewPastScan(scan, searchedPatient)}
                >
                  <div>
                    <b>{scan.prediction}</b>
                    <small>
                      Scan ID: {scan.scan_id} · {scan.confidence}% confidence ·{" "}
                      {new Date(scan.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <span style={{ color: "var(--orange-dark)", fontWeight: 700 }}>
                    {lang === "hi"
                      ? "पूरी रिपोर्ट देखें →"
                      : "View Full Diagnostic Report →"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================
  // 8. SCREENING FORM
  // ==========================================
  if (page === "screening") {
    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <nav className="screening-nav">
            <button className="screening-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div className="app-nav">
              <UniversalBackButton
                onClick={() =>
                  setPage(user?.role === "admin" ? "admin-dashboard" : "home")
                }
                label={t.backBtn}
              />
              {renderLangButton()}
            </div>
          </nav>

          <section className="dashboard">
            <div style={{ marginBottom: 18 }}>
              <UniversalBackButton
                onClick={() =>
                  setPage(user?.role === "admin" ? "admin-dashboard" : "home")
                }
                label={t.backBtn}
              />
            </div>

            <p className="screening-eyebrow">{t.intakeEyebrow}</p>
            <h1>{t.intakeTitle}</h1>
            <p className="screening-intro">{t.intakeDesc}</p>

            <section className="profile-create">
              <p className="result-label">{t.step1}</p>

              <div className="field">
                <label>{t.fullName}</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={patient.fullName}
                  onChange={(e) =>
                    setPatient({ ...patient, fullName: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t.age}</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 48"
                    value={patient.age}
                    onChange={(e) =>
                      setPatient({ ...patient, age: e.target.value })
                    }
                  />
                </div>

                <div className="field">
                  <label>{t.gender}</label>
                  <select
                    value={patient.gender}
                    onChange={(e) =>
                      setPatient({ ...patient, gender: e.target.value })
                    }
                  >
                    <option value="">{t.selectGender}</option>
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t.hasDiabetes}</label>
                  <select
                    value={patient.diabetes ? "yes" : "no"}
                    onChange={(e) =>
                      setPatient({
                        ...patient,
                        diabetes: e.target.value === "yes",
                        diabetesDuration:
                          e.target.value === "yes"
                            ? patient.diabetesDuration
                            : "",
                      })
                    }
                  >
                    <option value="no">{t.no}</option>
                    <option value="yes">{t.yes}</option>
                  </select>
                </div>

                {patient.diabetes && (
                  <div className="field">
                    <label>{t.duration}</label>
                    <input
                      type="number"
                      min="0"
                      max="80"
                      placeholder="e.g. 8"
                      value={patient.diabetesDuration}
                      onChange={(e) =>
                        setPatient({
                          ...patient,
                          diabetesDuration: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="profile-create" style={{ marginTop: 24 }}>
              <p className="result-label">{t.step2}</p>

              <div
                style={{
                  border: "2px dashed var(--border-dark)",
                  borderRadius: 12,
                  padding: "30px 20px",
                  textAlign: "center",
                  background: "#fbfaf8",
                  margin: "16px 0",
                }}
              >
                <input
                  type="file"
                  id="fundus-file-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />

                <label
                  htmlFor="fundus-file-input"
                  className="secondary-btn"
                  style={{
                    display: "inline-flex",
                    cursor: "pointer",
                    padding: "10px 22px",
                    fontWeight: 700,
                  }}
                >
                  📁 {t.selectImgText}
                </label>

                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: 13,
                    color: "var(--text-soft)",
                  }}
                >
                  {selectedFileName ? (
                    <strong style={{ color: "var(--orange-dark)" }}>
                      ✓ {selectedFileName}
                    </strong>
                  ) : (
                    t.noFileSelected
                  )}
                </p>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button
                className="primary-btn"
                onClick={runScreening}
                disabled={busy}
                style={{ marginTop: 12 }}
              >
                {busy ? t.runningBtn : t.runBtn}
              </button>
            </section>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================
  // 9. SCREENING RESULT SCREEN
  // ==========================================
  if (page === "result" && result) {
    const stage = result.prediction;
    const stageData = STAGE_DETAILS[stage] || STAGE_DETAILS["Moderate NPDR"];
    const durationNum = Number(patient.diabetesDuration) || 0;
    const currentFundusDisplay = result.originalImageUrl || imagePreview || fundImage;

    return (
      <main className="screening-page result-screen">
        <div className="screening-wrapper">
          <nav className="screening-nav">
            <button className="screening-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div className="app-nav">
              <UniversalBackButton
                onClick={() => setPage("screening")}
                label={t.backBtn}
              />
              {renderLangButton()}
            </div>
          </nav>

          <section className="result-page">
            <div style={{ marginBottom: 18 }}>
              <UniversalBackButton
                onClick={() => setPage("screening")}
                label={t.backBtn}
              />
            </div>

            <div className="result-container">
              <div className="result-title-area">
                <p className="screening-eyebrow">{t.resultEyebrow}</p>
                <h1>{t.resultTitle}</h1>
              </div>

              {/* Patient Card */}
              <section className="result-section patient-result-card">
                <div className="result-section-heading">
                  <span>01</span>
                  <h2>{patient.fullName}</h2>
                </div>
                <div className="patient-result-grid">
                  <div>
                    <span>Patient ID</span>
                    <strong>{result.patient_id}</strong>
                  </div>
                  <div>
                    <span>
                      {t.age} / {t.gender}
                    </span>
                    <strong>
                      {patient.age} yrs · {patient.gender}
                    </strong>
                  </div>
                  <div>
                    <span>{t.hasDiabetes}</span>
                    <strong>
                      {patient.diabetes
                        ? `${t.yes} (${durationNum} ${
                            lang === "hi" ? "वर्ष" : "yrs"
                          })`
                        : t.no}
                    </strong>
                  </div>
                </div>
              </section>

              {/* Stage Detection Card with Dynamic Severity Styling */}
              <section
                className="diagnosis-card"
                data-severity={STAGE_DETAILS[stage]?.level ?? 2}
              >
                <div className="diagnosis-left">
                  <p className="result-label">{t.detectedStage}</p>
                  <h2 className="diagnosis-stage">{stage}</h2>
                  <p className="diagnosis-description">
                    {lang === "hi" ? stageData.titleHi : stageData.title}
                  </p>
                </div>
                <div className="confidence-box">
                  <span>{t.modelConfidence}</span>
                  <strong>{result.confidence}%</strong>
                </div>
              </section>

              {/* Fundus Visuals */}
              <section className="result-section">
                <div className="result-section-heading">
                  <span>02</span>
                  <h2>
                    {lang === "hi"
                      ? "फंडस स्कैन एवं विज़ुअल हीटमैप"
                      : "Fundus Scan & Heatmap"}
                  </h2>
                </div>
                <div className="result-images-new">
                  <div className="analysis-image-card">
                    <div className="analysis-image-header">
                      <span>{t.originalFundus}</span>
                    </div>
                    <img src={currentFundusDisplay} alt="Original Fundus" />
                  </div>
                  <div className="analysis-image-card">
                    <div className="analysis-image-header">
                      <span>{t.gradcam}</span>
                    </div>
                    <img
                      src={
                      result.gradcamOverlayUrl ||
                      result.gradcamUrl ||
                      fundImage
                    }
                      alt="Grad-CAM"
                    />
                  </div>
                </div>
              </section>

              {/* Severity Progression Scale */}
              <section
                className="result-section"
                data-severity={STAGE_DETAILS[stage]?.level ?? 2}
              >
                <div className="result-section-heading">
                  <span>03</span>
                  <h2>{t.progressionScale}</h2>
                </div>
                <div
                  className="severity-scale"
                  data-stage={STAGE_DETAILS[stage]?.level ?? 2}
                >
                  <div className="severity-track" />
                  {STAGE_ORDER.map((item, idx) => {
                    const isActive = item === stage;
                    return (
                      <div
                        key={item}
                        className={`severity-step step-${idx} ${
                          isActive ? "active" : ""
                        }`}
                      >
                        <div className="severity-dot">
                          {isActive && <span className="severity-pulse-ring" />}
                        </div>
                        <span className="severity-number">{idx}</span>
                        <strong>{item}</strong>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Action Buttons */}
              <div
                className="result-actions"
                style={{
                  marginTop: 28,
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <button
                  className="primary-btn"
                  onClick={downloadPdfReport}
                  style={{
                    background: "#25211f",
                    boxShadow: "0 6px 18px rgba(37,33,31,0.22)",
                  }}
                >
                  {t.getPdfBtn}
                </button>

                <button
                  className="primary-btn"
                  onClick={() => setPage("stage-info")}
                >
                  {t.knowMoreBtn}
                </button>
              </div>

              {/* Two Red Warnings (No Emojis) */}
              <div className="screening-disclaimers">
                <p className="disclaimer-text">
                  <strong>Warning:</strong> {t.warningDoctor}
                </p>
                <p className="disclaimer-text">
                  <strong>Notice:</strong> {t.warningConfidence}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================
  // 10. DETAILED STAGE INFO + DURATION STATS
  // ==========================================
  if (page === "stage-info" && result) {
    const stage = result.prediction;
    const details = STAGE_DETAILS[stage] || STAGE_DETAILS["Moderate NPDR"];
    const durationNum = Number(patient.diabetesDuration) || 0;
    const stats = getDurationStats(durationNum, patient.diabetes, lang);

    return (
      <main className="screening-page">
        <div className="screening-wrapper">
          <nav className="screening-nav">
            <button className="screening-logo" onClick={() => setPage("home")}>
              नेत्रia
            </button>
            <div className="app-nav">
              <UniversalBackButton
                onClick={() => setPage("result")}
                label={t.backBtn}
              />
              {renderLangButton()}
            </div>
          </nav>

          <section className="stage-info-page">
            <div style={{ marginBottom: 18 }}>
              <UniversalBackButton
                onClick={() => setPage("result")}
                label={t.backBtn}
              />
            </div>

            <p className="screening-eyebrow">
              {lang === "hi"
                ? "विस्तृत पैथोलॉजी एवं जोखिम आंकड़े"
                : "DETAILED PATHOLOGY & STATS"}
            </p>
            <h1>{lang === "hi" ? details.titleHi : details.title}</h1>
            <p className="stage-info-intro">{details.summary}</p>

            <section
              className="info-card"
              style={{
                borderLeft: "6px solid var(--orange)",
                background: "#fffaf6",
              }}
            >
              <div className="info-card-heading">
                <p className="result-label">
                  {lang === "hi"
                    ? "डायबिटीज अवधि अनुसार जोखिम प्रोफाइल"
                    : "PATIENT DURATION-BASED RISK PROFILE"}
                </p>
                <h3 style={{ margin: "4px 0 0", fontSize: 20 }}>
                  {stats.band}
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginTop: 18,
                }}
              >
                <div
                  style={{
                    padding: 16,
                    background: "#ffffff",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text-soft)" }}>
                    {lang === "hi" ? "डायबिटीज की अवधि" : "DIABETES DURATION"}
                  </span>
                  <strong
                    style={{ display: "block", fontSize: 22, marginTop: 4 }}
                  >
                    {patient.diabetes
                      ? `${durationNum} ${lang === "hi" ? "वर्ष" : "Years"}`
                      : "Non-Diabetic"}
                  </strong>
                </div>

                <div
                  style={{
                    padding: 16,
                    background: "#ffffff",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text-soft)" }}>
                    {lang === "hi"
                      ? "रेटिनोपैथी प्रसार जोखिम"
                      : "POPULATION DR PREVALENCE"}
                  </span>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 22,
                      marginTop: 4,
                      color: "var(--orange-dark)",
                    }}
                  >
                    {stats.riskPercent}
                  </strong>
                </div>

                <div
                  style={{
                    padding: 16,
                    background: "#ffffff",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text-soft)" }}>
                    {lang === "hi" ? "प्रगति तीव्रता" : "PROGRESSION ACCELERATION"}
                  </span>
                  <strong
                    style={{ display: "block", fontSize: 15, marginTop: 6 }}
                  >
                    {stats.annualProgression}
                  </strong>
                </div>
              </div>

              <p
                style={{
                  marginTop: 16,
                  fontSize: 14,
                  color: "var(--text-soft)",
                  lineHeight: 1.6,
                }}
              >
                💡{" "}
                <b>
                  {lang === "hi" ? "क्लिनिकल संदर्भ:" : "Clinical Context:"}
                </b>{" "}
                {stats.explanation}
              </p>
            </section>

            <section className="stage-detail-card" style={{ marginTop: 24 }}>
              <p className="result-label">
                {lang === "hi"
                  ? "रोग लक्षण एवं प्रबंधन"
                  : "PATHOLOGICAL CHARACTERISTICS"}
              </p>
              <h2>
                {lang === "hi"
                  ? "इस स्टेज में क्या बदलाव होते हैं?"
                  : "What happens in this stage?"}
              </h2>

              <div className="stage-changes">
                <h3>
                  {lang === "hi"
                    ? "प्रमुख लक्षण एवं सूक्ष्म बदलाव"
                    : "Common Microvascular Changes"}
                </h3>
                <ul>
                  {details.symptoms.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="stage-changes" style={{ marginTop: 20 }}>
                <h3>
                  {lang === "hi"
                    ? "अनुशंसित क्लिनिकल सलाह"
                    : "Recommended Clinical Protocols"}
                </h3>
                <ul>
                  {details.management.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </section>
          </section>
        </div>
      </main>
    );
  }

  return null;
}