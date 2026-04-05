/** PROM type definitions and question banks for seeding. */

export type PromTypeSeed = {
  code: string;
  name: string;
  applicableRegions: string[];
  questionCount: number;
  minScore: number;
  maxScore: number;
  scoreDirection: "HIGHER_BETTER" | "LOWER_BETTER";
  description: string;
};

export type PromQuestionSeed = {
  code: string;
  order: number;
  text: string;
  options: { value: string; label: string; score: number }[];
  reverseScored?: boolean;
};

const noneToUnbearable = [
  { value: "0", label: "None", score: 0 },
  { value: "1", label: "Very mild", score: 1 },
  { value: "2", label: "Mild", score: 2 },
  { value: "3", label: "Moderate", score: 3 },
  { value: "4", label: "Severe", score: 4 },
];

const neverToAlways = [
  { value: "0", label: "Never", score: 0 },
  { value: "1", label: "Rarely", score: 1 },
  { value: "2", label: "Sometimes", score: 2 },
  { value: "3", label: "Often", score: 3 },
  { value: "4", label: "Always", score: 4 },
];

const noneToExtreme = [
  { value: "0", label: "None", score: 0 },
  { value: "1", label: "Mild", score: 1 },
  { value: "2", label: "Moderate", score: 2 },
  { value: "3", label: "Severe", score: 3 },
  { value: "4", label: "Extreme", score: 4 },
];

export const allPromTypeSeeds: PromTypeSeed[] = [
  {
    code: "OXFORD_KNEE",
    name: "Oxford Knee Score",
    applicableRegions: ["KNEE"],
    questionCount: 12,
    minScore: 0,
    maxScore: 48,
    scoreDirection: "HIGHER_BETTER",
    description: "12-item OKS, 0–48, higher is better.",
  },
  {
    code: "OXFORD_HIP",
    name: "Oxford Hip Score",
    applicableRegions: ["HIP"],
    questionCount: 12,
    minScore: 0,
    maxScore: 48,
    scoreDirection: "HIGHER_BETTER",
    description: "12-item OHS, 0–48, higher is better.",
  },
  {
    code: "KOOS12",
    name: "KOOS-12",
    applicableRegions: ["KNEE"],
    questionCount: 12,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "HIGHER_BETTER",
    description: "KOOS short form, 0–100 summary.",
  },
  {
    code: "HOOS12",
    name: "HOOS-12",
    applicableRegions: ["HIP"],
    questionCount: 12,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "HIGHER_BETTER",
    description: "HOOS short form, 0–100 summary.",
  },
  {
    code: "ODI",
    name: "Oswestry Disability Index",
    applicableRegions: ["SPINE"],
    questionCount: 10,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "LOWER_BETTER",
    description: "ODI percentage disability.",
  },
  {
    code: "QUICKDASH",
    name: "QuickDASH",
    applicableRegions: ["SHOULDER", "HAND_WRIST", "OTHER"],
    questionCount: 11,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "LOWER_BETTER",
    description: "Upper extremity disability 0–100.",
  },
  {
    code: "VAS_PAIN",
    name: "VAS Pain (0–10)",
    applicableRegions: ["KNEE", "HIP", "SHOULDER", "SPINE", "FOOT_ANKLE", "HAND_WRIST", "OTHER"],
    questionCount: 1,
    minScore: 0,
    maxScore: 10,
    scoreDirection: "LOWER_BETTER",
    description: "Numeric pain 0–10.",
  },
];

const oksQ: PromQuestionSeed[] = [
  { code: "OXFORD_KNEE", order: 1, text: "How would you describe the pain you usually have from your knee?", options: noneToUnbearable },
  { code: "OXFORD_KNEE", order: 2, text: "Pain from your knee in bed at night?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 3, text: "Pain when sitting or lying?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 4, text: "Pain walking on level ground?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 5, text: "Pain going up or down stairs?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 6, text: "Pain standing upright?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 7, text: "Pain on uneven ground?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 8, text: "Pain kneeling on the knee?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 9, text: "Pain when squatting?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 10, text: "Limping when walking?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 11, text: "Walk before pain becomes severe?", options: [
    { value: "0", label: "No pain / >30 min", score: 0 },
    { value: "1", label: "16–30 min", score: 1 },
    { value: "2", label: "5–15 min", score: 2 },
    { value: "3", label: "Around house only", score: 3 },
    { value: "4", label: "Not at all", score: 4 },
  ]},
  { code: "OXFORD_KNEE", order: 12, text: "Kneel down and get up again?", options: [
    { value: "0", label: "Yes easily", score: 0 },
    { value: "1", label: "Little difficulty", score: 1 },
    { value: "2", label: "Moderate", score: 2 },
    { value: "3", label: "Extreme", score: 3 },
    { value: "4", label: "Impossible", score: 4 },
  ]},
];

const ohsQ: PromQuestionSeed[] = oksQ.map((q) => ({
  ...q,
  code: "OXFORD_HIP",
  text: q.text.replace(/knee/gi, "hip"),
}));

const koosQ: PromQuestionSeed[] = [
  { code: "KOOS12", order: 1, text: "How often knee pain?", options: neverToAlways },
  { code: "KOOS12", order: 2, text: "Twisting/pivoting — knee pain", options: noneToExtreme },
  { code: "KOOS12", order: 3, text: "Straightening knee — pain", options: noneToExtreme },
  { code: "KOOS12", order: 4, text: "Stairs — knee pain", options: noneToExtreme },
  { code: "KOOS12", order: 5, text: "Rising from sitting — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 6, text: "Standing — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 7, text: "Walking flat — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 8, text: "Car — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 9, text: "Aware of knee problem?", options: neverToAlways },
  { code: "KOOS12", order: 10, text: "Modified lifestyle for knee?", options: neverToAlways },
  { code: "KOOS12", order: 11, text: "Lack of confidence in knee?", options: neverToAlways },
  { code: "KOOS12", order: 12, text: "Overall knee difficulty?", options: noneToExtreme },
];

const hoosQ: PromQuestionSeed[] = koosQ.map((q) => ({
  ...q,
  code: "HOOS12",
  text: q.text.replace(/knee/gi, "hip"),
}));

const odiSection = (n: number, lines: string[]): PromQuestionSeed => ({
  code: "ODI",
  order: n,
  text: `ODI section ${n}: choose one statement.`,
  options: lines.map((label, i) => ({ value: String(i), label, score: i })),
});

const odiQ: PromQuestionSeed[] = [
  odiSection(1, ["No pain", "Tolerable", "Partial relief", "Relief with meds", "Only meds help", "Disabling"]),
  odiSection(2, ["Self care ok", "Extra pain", "Slow/painful", "Some help", "Daily help", "Bed/wash difficulty"]),
  odiSection(3, ["Lift heavy ok", "Extra pain", "No heavy floor", "Light only", "Very light", "Cannot lift"]),
  odiSection(4, ["Walk any", ">1 mi", ">½ mi", ">¼ mi", "Stick only", "Bed mostly"]),
  odiSection(5, ["Sit anywhere", "Favourite chair", ">1h", ">30m", ">10m", "Cannot sit"]),
  odiSection(6, ["Sleep well", "<1h disturb", "1–2h", "2–3h", "3–5h", "Fully disturbed"]),
  odiSection(7, ["Sex no pain", "Extra pain", "Partial", "No enjoyment", "None", "Relationship strain"]),
  odiSection(8, ["Social ok", "Extra pain", "Some limits", "Short visits", "Home only", "Bed"]),
  odiSection(9, ["Travel ok", ">2h pain", "<1h severe", "<30m", "Necessary only", "Doctor only"]),
  odiSection(10, ["Social normal", "Increased pain", "Sport limits", "No energetic", "Home", "No social life"]),
];

const dashOpts = [
  { value: "1", label: "No difficulty", score: 1 },
  { value: "2", label: "Mild", score: 2 },
  { value: "3", label: "Moderate", score: 3 },
  { value: "4", label: "Severe", score: 4 },
  { value: "5", label: "Unable", score: 5 },
];

const qdashQ: PromQuestionSeed[] = [
  { code: "QUICKDASH", order: 1, text: "Open a tight jar.", options: dashOpts },
  { code: "QUICKDASH", order: 2, text: "Heavy household chores.", options: dashOpts },
  { code: "QUICKDASH", order: 3, text: "Carry shopping bag.", options: dashOpts },
  { code: "QUICKDASH", order: 4, text: "Wash your back.", options: dashOpts },
  { code: "QUICKDASH", order: 5, text: "Cut food with knife.", options: dashOpts },
  { code: "QUICKDASH", order: 6, text: "Light recreational activities.", options: dashOpts },
  { code: "QUICKDASH", order: 7, text: "Activities needing force (e.g. golf).", options: dashOpts },
  { code: "QUICKDASH", order: 8, text: "Free movement activities.", options: dashOpts },
  { code: "QUICKDASH", order: 9, text: "Transportation needs.", options: dashOpts },
  { code: "QUICKDASH", order: 10, text: "Sexual activities.", options: dashOpts },
  { code: "QUICKDASH", order: 11, text: "Sleep due to arm/shoulder/hand pain?", options: dashOpts },
];

const vasQ: PromQuestionSeed[] = [
  {
    code: "VAS_PAIN",
    order: 1,
    text: "Rate your pain now (0–10).",
    options: Array.from({ length: 11 }, (_, i) => ({
      value: String(i),
      label: String(i),
      score: i,
    })),
  },
];

export const allPromQuestionSeeds: PromQuestionSeed[] = [
  ...oksQ,
  ...ohsQ,
  ...koosQ,
  ...hoosQ,
  ...odiQ,
  ...qdashQ,
  ...vasQ,
];
