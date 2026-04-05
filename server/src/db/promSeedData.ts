/** Validated PROM item banks for OrthoCare seed (Oxford, ODI, QuickDASH, VAS; KOOS-12 / HOOS-12 short forms). */

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

const noneToExtreme = [
  { value: "0", label: "None", score: 0 },
  { value: "1", label: "Mild", score: 1 },
  { value: "2", label: "Moderate", score: 2 },
  { value: "3", label: "Severe", score: 3 },
  { value: "4", label: "Extreme", score: 4 },
];

const neverToAlways = [
  { value: "0", label: "Never", score: 0 },
  { value: "1", label: "Rarely", score: 1 },
  { value: "2", label: "Sometimes", score: 2 },
  { value: "3", label: "Often", score: 3 },
  { value: "4", label: "Always", score: 4 },
];

/** Oxford Knee Score — 12 items, 0–4 each, higher total = better function */
export const oxfordKneeTypes: PromTypeSeed[] = [
  {
    code: "OXFORD_KNEE",
    name: "Oxford Knee Score",
    applicableRegions: ["KNEE"],
    questionCount: 12,
    minScore: 0,
    maxScore: 48,
    scoreDirection: "HIGHER_BETTER",
    description:
      "12-item patient-reported outcome for knee function and pain; validated 0–48 (higher is better).",
  },
];

export const oxfordKneeQuestions: PromQuestionSeed[] = [
  { code: "OXFORD_KNEE", order: 1, text: "How would you describe the pain you usually have from your knee?", options: noneToUnbearable },
  { code: "OXFORD_KNEE", order: 2, text: "Have you had any trouble with pain from your knee in bed at night?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 3, text: "Have you had any trouble with pain from your knee when sitting or lying?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 4, text: "Have you had any trouble with pain from your knee when walking on a level surface?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 5, text: "Have you had any trouble with pain from your knee going up or down stairs?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 6, text: "Have you had any trouble with pain from your knee standing upright?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 7, text: "Have you had any trouble with pain from your knee when walking on uneven ground?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 8, text: "Have you had any trouble with pain from your knee when kneeling on the front of your knee?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 9, text: "Have you had any trouble with pain from your knee when squatting?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 10, text: "Have you been limping when walking because of your knee?", options: neverToAlways },
  { code: "OXFORD_KNEE", order: 11, text: "For how long have you been able to walk before pain from your knee becomes severe (with or without a stick)?", options: [
    { value: "0", label: "No pain / more than 30 minutes", score: 0 },
    { value: "1", label: "16–30 minutes", score: 1 },
    { value: "2", label: "5–15 minutes", score: 2 },
    { value: "3", label: "Around the house only", score: 3 },
    { value: "4", label: "Not at all / severe pain on walking", score: 4 },
  ]},
  { code: "OXFORD_KNEE", order: 12, text: "Could you kneel down and get up again afterwards?", options: [
    { value: "0", label: "Yes, easily", score: 0 },
    { value: "1", label: "With little difficulty", score: 1 },
    { value: "2", label: "With moderate difficulty", score: 2 },
    { value: "3", label: "With extreme difficulty", score: 3 },
    { value: "4", label: "No, impossible", score: 4 },
  ]},
];

/** Oxford Hip Score — 12 items, hip-specific wording */
export const oxfordHipTypes: PromTypeSeed[] = [
  {
    code: "OXFORD_HIP",
    name: "Oxford Hip Score",
    applicableRegions: ["HIP"],
    questionCount: 12,
    minScore: 0,
    maxScore: 48,
    scoreDirection: "HIGHER_BETTER",
    description:
      "12-item patient-reported outcome for hip function and pain; validated 0–48 (higher is better).",
  },
];

export const oxfordHipQuestions: PromQuestionSeed[] = [
  { code: "OXFORD_HIP", order: 1, text: "How would you describe the pain you usually have from your hip?", options: noneToUnbearable },
  { code: "OXFORD_HIP", order: 2, text: "Have you had any trouble with pain from your hip in bed at night?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 3, text: "Have you had any trouble with pain from your hip when sitting or lying?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 4, text: "Have you had any trouble with pain from your hip when walking on a level surface?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 5, text: "Have you had any trouble with pain from your hip going up or down stairs?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 6, text: "Have you had any trouble with pain from your hip standing upright?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 7, text: "Have you had any trouble with pain from your hip when walking on uneven ground?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 8, text: "Have you had any trouble putting on socks/stockings because of your hip?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 9, text: "Have you had any trouble getting in/out of a car because of your hip?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 10, text: "Have you been limping when walking because of your hip?", options: neverToAlways },
  { code: "OXFORD_HIP", order: 11, text: "For how long have you been able to walk before pain from your hip becomes severe?", options: [
    { value: "0", label: "No pain / more than 30 minutes", score: 0 },
    { value: "1", label: "16–30 minutes", score: 1 },
    { value: "2", label: "5–15 minutes", score: 2 },
    { value: "3", label: "Around the house only", score: 3 },
    { value: "4", label: "Not at all / severe pain on walking", score: 4 },
  ]},
  { code: "OXFORD_HIP", order: 12, text: "Have you had any sudden, severe pain — 'shooting', 'stabbing' or 'spasms' — from your hip?", options: neverToAlways },
];

/** KOOS-12 — 12 items (Pain, Function, QoL); raw 0–4 per item; summary 0–100 computed in services */
export const koos12Types: PromTypeSeed[] = [
  {
    code: "KOOS12",
    name: "KOOS-12",
    applicableRegions: ["KNEE"],
    questionCount: 12,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "HIGHER_BETTER",
    description:
      "12-item short form of KOOS (Pain, Function, Quality of Life); 100 = no symptoms.",
  },
];

export const koos12Questions: PromQuestionSeed[] = [
  { code: "KOOS12", order: 1, text: "How often do you experience knee pain?", options: neverToAlways },
  { code: "KOOS12", order: 2, text: "Twisting/pivoting on your knee — knee pain experienced", options: noneToExtreme },
  { code: "KOOS12", order: 3, text: "Straightening knee fully — knee pain experienced", options: noneToExtreme },
  { code: "KOOS12", order: 4, text: "Going up or down stairs — knee pain experienced", options: noneToExtreme },
  { code: "KOOS12", order: 5, text: "Rising from sitting — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 6, text: "Standing — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 7, text: "Walking on flat surface — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 8, text: "Getting in/out of car — difficulty", options: noneToExtreme },
  { code: "KOOS12", order: 9, text: "How often are you aware of your knee problem?", options: neverToAlways },
  { code: "KOOS12", order: 10, text: "Have you modified your lifestyle to avoid damaging activities to your knee?", options: neverToAlways },
  { code: "KOOS12", order: 11, text: "How much are you troubled by lack of confidence in your knee?", options: neverToAlways },
  { code: "KOOS12", order: 12, text: "In general, how much difficulty do you have with your knee?", options: noneToExtreme },
];

export const hoos12Types: PromTypeSeed[] = [
  {
    code: "HOOS12",
    name: "HOOS-12",
    applicableRegions: ["HIP"],
    questionCount: 12,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "HIGHER_BETTER",
    description:
      "12-item short form of HOOS (Pain, Function, Quality of Life); 100 = no symptoms.",
  },
];

export const hoos12Questions: PromQuestionSeed[] = koos12Questions.map((q) => ({
  ...q,
  code: "HOOS12",
  text: q.text.replace(/knee/gi, "hip"),
}));

/** Oswestry Disability Index — 10 sections × 0–5; percentage = sum × 2 */
const odiSection = (n: number, statements: { label: string; score: number }[]): PromQuestionSeed => ({
  code: "ODI",
  order: n,
  text: `Section ${n}: pick the one statement that best describes you today.`,
  options: statements.map((s, i) => ({
    value: String(i),
    label: s.label,
    score: s.score,
  })),
});

export const odiTypes: PromTypeSeed[] = [
  {
    code: "ODI",
    name: "Oswestry Disability Index",
    applicableRegions: ["SPINE"],
    questionCount: 10,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "LOWER_BETTER",
    description:
      "10-section low back pain disability index; score is percentage disability (lower is better).",
  },
];

export const odiQuestions: PromQuestionSeed[] = [
  odiSection(1, [
    { label: "I can tolerate the pain without medication", score: 0 },
    { label: "The pain is severe but tolerable without medication", score: 1 },
    { label: "Pain gives no relief with rest or medication", score: 2 },
    { label: "Pain gives partial relief with medication", score: 3 },
    { label: "Pain is relieved only with medication", score: 4 },
    { label: "Pain is totally disabling despite medication", score: 5 },
  ]),
  odiSection(2, [
    { label: "I can look after myself without extra pain", score: 0 },
    { label: "I can look after myself but it causes extra pain", score: 1 },
    { label: "It is painful to look after myself and slow", score: 2 },
    { label: "I need some help but manage most personal care", score: 3 },
    { label: "I need help every day in most aspects of self-care", score: 4 },
    { label: "I do not get dressed, wash with difficulty, stay in bed", score: 5 },
  ]),
  odiSection(3, [
    { label: "I can lift heavy weights without extra pain", score: 0 },
    { label: "I can lift heavy weights but extra pain", score: 1 },
    { label: "Pain prevents me lifting heavy weights off floor", score: 2 },
    { label: "Pain prevents me lifting heavy weights but manages light to moderate", score: 3 },
    { label: "I can lift only very light weights", score: 4 },
    { label: "I cannot lift or carry anything", score: 5 },
  ]),
  odiSection(4, [
    { label: "Pain does not prevent walking any distance", score: 0 },
    { label: "Pain prevents walking > 1 mile", score: 1 },
    { label: "Pain prevents walking > 1/2 mile", score: 2 },
    { label: "Pain prevents walking > 1/4 mile", score: 3 },
    { label: "I can only walk with stick or crutches", score: 4 },
    { label: "I am in bed most of the time and crawl to toilet", score: 5 },
  ]),
  odiSection(5, [
    { label: "I can sit in any chair as long as I like", score: 0 },
    { label: "I can sit in my favourite chair as long as I like", score: 1 },
    { label: "Pain prevents sitting > 1 hour", score: 2 },
    { label: "Pain prevents sitting > 30 minutes", score: 3 },
    { label: "Pain prevents sitting > 10 minutes", score: 4 },
    { label: "Pain prevents sitting at all", score: 5 },
  ]),
  odiSection(6, [
    { label: "I can sleep well", score: 0 },
    { label: "Sleep is only disturbed for <1h per night", score: 1 },
    { label: "Sleep is disturbed for 1–2h", score: 2 },
    { label: "Sleep is disturbed for 2–3h", score: 3 },
    { label: "Sleep is disturbed for 3–5h", score: 4 },
    { label: "Sleep is completely disturbed", score: 5 },
  ]),
  odiSection(7, [
    { label: "I can have sex without pain", score: 0 },
    { label: "I can have sex but it causes extra pain", score: 1 },
    { label: "Pain is partially relieved by sex", score: 2 },
    { label: "Pain prevents any enjoyment of sex", score: 3 },
    { label: "Pain prevents any sex at all", score: 4 },
    { label: "Pain prevents any sex and relationship difficulty", score: 5 },
  ]),
  odiSection(8, [
    { label: "I can do social activities without pain", score: 0 },
    { label: "I can do social activities with extra pain", score: 1 },
    { label: "Pain is tolerable but prevents some activities", score: 2 },
    { label: "Pain prevents all social activities except short visits", score: 3 },
    { label: "Pain restricts me to home", score: 4 },
    { label: "Pain restricts me to bed most of day", score: 5 },
  ]),
  odiSection(9, [
    { label: "I can travel anywhere without pain", score: 0 },
    { label: "I can travel anywhere but extra pain", score: 1 },
    { label: "Moderate pain on journeys > 2h", score: 2 },
    { label: "Severe pain restricts journeys to <1h", score: 3 },
    { label: "Pain restricts journeys to necessary <30 min", score: 4 },
    { label: "Pain prevents travel except to doctor/hospital", score: 5 },
  ]),
  odiSection(10, [
    { label: "My social life is normal; no pain", score: 0 },
    { label: "My social life is normal but increased pain", score: 1 },
    { label: "Pain has no effect on social life apart from sport/dance", score: 2 },
    { label: "Pain has restricted social life and no energetic hobbies", score: 3 },
    { label: "Pain has restricted social life to home", score: 4 },
    { label: "I have no social life because of pain", score: 5 },
  ]),
];

const dashOptions = [
  { value: "1", label: "No difficulty", score: 1 },
  { value: "2", label: "Mild difficulty", score: 2 },
  { value: "3", label: "Moderate difficulty", score: 3 },
  { value: "4", label: "Severe difficulty", score: 4 },
  { value: "5", label: "Unable", score: 5 },
];

export const quickDashTypes: PromTypeSeed[] = [
  {
    code: "QUICKDASH",
    name: "QuickDASH",
    applicableRegions: ["SHOULDER", "HAND_WRIST", "OTHER"],
    questionCount: 11,
    minScore: 0,
    maxScore: 100,
    scoreDirection: "LOWER_BETTER",
    description:
      "11-item upper extremity disability; 0 = no disability, 100 = complete disability.",
  },
];

export const quickDashQuestions: PromQuestionSeed[] = [
  { code: "QUICKDASH", order: 1, text: "Open a tight or new jar.", options: dashOptions },
  { code: "QUICKDASH", order: 2, text: "Do heavy household chores (e.g. wash walls, floors).", options: dashOptions },
  { code: "QUICKDASH", order: 3, text: "Carry a shopping bag or briefcase.", options: dashOptions },
  { code: "QUICKDASH", order: 4, text: "Wash your back.", options: dashOptions },
  { code: "QUICKDASH", order: 5, text: "Use a knife to cut food.", options: dashOptions },
  { code: "QUICKDASH", order: 6, text: "Recreational activities requiring little effort (e.g. card games).", options: dashOptions },
  { code: "QUICKDASH", order: 7, text: "Recreational activities requiring force through arm/shoulder (e.g. golf).", options: dashOptions },
  { code: "QUICKDASH", order: 8, text: "Recreational activities requiring free movement (e.g. frisbee).", options: dashOptions },
  { code: "QUICKDASH", order: 9, text: "Manage transportation needs (getting from place to place).", options: dashOptions },
  { code: "QUICKDASH", order: 10, text: "Sexual activities.", options: dashOptions },
  { code: "QUICKDASH", order: 11, text: "During the past week, how much difficulty have you had sleeping because of pain in arm/shoulder/hand?", options: dashOptions },
];

export const vasPainTypes: PromTypeSeed[] = [
  {
    code: "VAS_PAIN",
    name: "VAS Pain (0–10)",
    applicableRegions: ["KNEE", "HIP", "SHOULDER", "SPINE", "FOOT_ANKLE", "HAND_WRIST", "OTHER"],
    questionCount: 1,
    minScore: 0,
    maxScore: 10,
    scoreDirection: "LOWER_BETTER",
    description: "Single-item numeric pain rating; 0 = no pain, 10 = worst imaginable.",
  },
];

export const vasPainQuestions: PromQuestionSeed[] = [
  {
    code: "VAS_PAIN",
    order: 1,
    text: "On a scale of 0 to 10, how would you rate your pain right now? (0 = no pain, 10 = worst pain imaginable)",
    options: Array.from({ length: 11 }, (_, i) => ({
      value: String(i),
      label: String(i),
      score: i,
    })),
  },
];

export const allPromTypeSeeds: PromTypeSeed[] = [
  ...oxfordKneeTypes,
  ...oxfordHipTypes,
  ...koos12Types,
  ...hoos12Types,
  ...odiTypes,
  ...quickDashTypes,
  ...vasPainTypes,
];

export const allPromQuestionSeeds: PromQuestionSeed[] = [
  ...oxfordKneeQuestions,
  ...oxfordHipQuestions,
  ...koos12Questions,
  ...hoos12Questions,
  ...odiQuestions,
  ...quickDashQuestions,
  ...vasPainQuestions,
];
