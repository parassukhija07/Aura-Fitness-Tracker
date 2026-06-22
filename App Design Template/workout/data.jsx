/* Active Workout — seed data. "Push Day A" in progress. */
const WORKOUT = {
  name: "Push Day A",
  program: "Push · Pull · Legs",
  exercises: [
    {
      id: "bench", name: "Barbell Bench Press", muscle: "Chest",
      groups: ["Chest", "Front Delts", "Triceps"], equipment: "Barbell", isCable: false,
      repRange: "6–8", planned: 4,
      lastPR: { weight: 80, reps: 6, date: "May 28" },
      target: { weight: 82.5, reps: 6, note: "+2.5 kg vs last session" },
      warmup: [
        { reps: 12, pct: "Empty bar" }, { reps: 8, pct: "40%" },
        { reps: 5, pct: "60%" }, { reps: 3, pct: "80%" }
      ],
      hint: "Drive your feet into the floor and keep your shoulder blades pinned back and down. Lower the bar to your lower chest, not your neck.",
      sets: [
        { weight: 82.5, reps: 6, done: true, type: "normal" },
        { weight: 82.5, reps: 6, done: true, type: "normal" },
        { weight: 80, reps: 5, done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" }
      ]
    },
    {
      id: "incline", name: "Incline Dumbbell Press", muscle: "Upper Chest",
      groups: ["Upper Chest", "Front Delts"], equipment: "Dumbbell", isCable: false,
      repRange: "8–10", planned: 3,
      lastPR: { weight: 32, reps: 9, date: "May 28" },
      target: { weight: 32, reps: 9, note: "Match last, add a rep" },
      warmup: [ { reps: 10, pct: "50%" }, { reps: 6, pct: "75%" } ],
      hint: "Set the bench to ~30°. Don't let the dumbbells drift forward — keep them stacked over your elbows.",
      sets: [
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" }
      ]
    },
    {
      id: "fly", name: "Cable Fly", muscle: "Chest",
      groups: ["Chest"], equipment: "Cable", isCable: true,
      repRange: "12–15", planned: 3,
      lastPR: { weight: 15, reps: 14, date: "May 28" },
      target: { weight: 15, reps: 14, note: "Focus on the stretch" },
      warmup: [],
      hint: "Lead with your pinkies and squeeze at the midline. Keep a soft bend in the elbows throughout.",
      pulley: "double",
      sets: [
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" }
      ]
    },
    {
      id: "ohp", name: "Seated Shoulder Press", muscle: "Shoulders",
      groups: ["Front Delts", "Side Delts"], equipment: "Machine", isCable: false,
      repRange: "8–12", planned: 3,
      lastPR: { weight: 45, reps: 10, date: "May 28" },
      target: { weight: 47.5, reps: 9, note: "+2.5 kg vs last session" },
      warmup: [],
      hint: "Keep your core braced and avoid arching your lower back as you press overhead.",
      sets: [
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" }
      ]
    },
    {
      id: "lateral", name: "Cable Lateral Raise", muscle: "Side Delts",
      groups: ["Side Delts"], equipment: "Cable", isCable: true,
      repRange: "12–15", planned: 3,
      lastPR: { weight: 10, reps: 13, date: "May 28" },
      target: { weight: 10, reps: 13, note: "Slow eccentric" },
      warmup: [],
      pulley: "single",
      hint: "Lead with your elbow, not your hand. Imagine pouring water from a jug at the top.",
      sets: [
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" }
      ]
    },
    {
      id: "pushdown", name: "Triceps Rope Pushdown", muscle: "Triceps",
      groups: ["Triceps"], equipment: "Cable", isCable: true,
      repRange: "10–12", planned: 3,
      lastPR: { weight: 25, reps: 12, date: "May 28" },
      target: { weight: 27.5, reps: 10, note: "+2.5 kg vs last session" },
      warmup: [],
      pulley: "single",
      hint: "Keep your elbows pinned to your sides and spread the rope apart at the bottom of each rep.",
      sets: [
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" },
        { weight: "", reps: "", done: false, type: "normal" }
      ]
    }
  ]
};
const SET_TYPES = {
  normal:    { label: "Normal",     short: "",  color: "var(--text-2)" },
  warmup:    { label: "Warm-up",    short: "W", color: "var(--text-3)" },
  drop:      { label: "Drop set",   short: "D", color: "var(--purple)" },
  restpause: { label: "Rest-pause", short: "R", color: "var(--blue)" },
  failure:   { label: "To failure", short: "F", color: "var(--red)" },
  partials:  { label: "Partials",   short: "P", color: "var(--green)" }
};
const SUB_OPTIONS = [
  { name: "Dumbbell Bench Press", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Machine Chest Press", muscle: "Chest", equipment: "Machine" },
  { name: "Smith Machine Bench", muscle: "Chest", equipment: "Smith Machine" },
  { name: "Push-Up (Weighted)", muscle: "Chest", equipment: "Bodyweight" }
];
const ADD_OPTIONS = [
  { name: "Pec Deck", muscle: "Chest", equipment: "Machine" },
  { name: "Dips", muscle: "Chest · Triceps", equipment: "Bodyweight" },
  { name: "Overhead Triceps Extension", muscle: "Triceps", equipment: "Cable" },
  { name: "Front Raise", muscle: "Front Delts", equipment: "Dumbbell" },
  { name: "Face Pull", muscle: "Rear Delts", equipment: "Cable" }
];
window.WORKOUT = WORKOUT; window.SET_TYPES = SET_TYPES;
window.SUB_OPTIONS = SUB_OPTIONS; window.ADD_OPTIONS = ADD_OPTIONS;
