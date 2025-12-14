import foxHappy from "../assets/scene/fox_happy.svg";
import foxSleepy from "../assets/scene/fox_sleepy.svg";
import foxSleepyDirty from "../assets/scene/fox_sleepy_dirty.svg";
import foxSad from "../assets/scene/fox_sad.svg";
import foxSadDirty from "../assets/scene/fox_sad_dirty.svg";
import foxDirty from "../assets/scene/fox_dirty.svg";
import foxDead from "../assets/scene/fox_dead.svg";

const ALL_MOOD_IMAGES = [
  foxHappy,
  foxSleepy,
  foxSleepyDirty,
  foxSad,
  foxSadDirty,
  foxDirty,
  foxDead,
];

let imagesPreloaded = false;

export function preloadMoodImages() {
  if (imagesPreloaded || typeof window === "undefined") return;
  imagesPreloaded = true;
  ALL_MOOD_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

function clampValue(v) {
  if (Number.isNaN(v)) return 0;
  if (v === undefined || v === null) return 0;
  return Math.max(-999, Math.min(999, Number(v)));
}

// Derive view-friendly mood info from the raw creature stats.
export function deriveMood(state = {}) {
  const hunger = clampValue(state.hunger);
  const clean = clampValue(state.clean);
  const energy = clampValue(state.energy);

  const thresholds = {
    critical: 0,
    exhausted: 5,
    sleepy: 18,
    veryHungry: 12,
    hungry: 32,
    veryDirty: 12,
    dirty: 28,
  };

  const isCritical =
    hunger <= thresholds.critical &&
    clean <= thresholds.critical &&
    energy <= thresholds.critical;

  const isExhausted = energy <= thresholds.exhausted;
  const isSleepy = energy <= thresholds.sleepy;
  const isVeryDirty = clean <= thresholds.veryDirty;
  const isDirty = clean <= thresholds.dirty;
  const isVeryHungry = hunger <= thresholds.veryHungry;
  const isHungry = hunger <= thresholds.hungry;

  if (isCritical) {
    return {
      mood: "unresponsive",
      moodText: "Kimi needs urgent care!",
      moodImage: foxDead,
    };
  }

  if (isExhausted) {
    return {
      mood: isDirty ? "sleepy-dirty" : "sleepy",
      moodText: isDirty ? "Too tired to clean up." : "Barely keeping eyes open.",
      moodImage: isDirty ? foxSleepyDirty : foxSleepy,
    };
  }

  if (isSleepy && isDirty) {
    return {
      mood: "sleepy-dirty",
      moodText: "Needs rest and a bath.",
      moodImage: foxSleepyDirty,
    };
  }

  if (isSleepy && isHungry) {
    return {
      mood: "sleepy-hungry",
      moodText: "Tired and craving food.",
      moodImage: foxSad,
    };
  }

  if (isSleepy) {
    return {
      mood: "sleepy",
      moodText: "Time for a nap.",
      moodImage: foxSleepy,
    };
  }

  if (isVeryDirty && (isHungry || isVeryHungry)) {
    return {
      mood: "dirty-hungry",
      moodText: "Filthy and starving.",
      moodImage: foxSadDirty,
    };
  }

  if (isVeryDirty) {
    return {
      mood: "dirty",
      moodText: "Needs a bath ASAP.",
      moodImage: foxDirty,
    };
  }

  if (isDirty && isHungry) {
    return {
      mood: "dirty-hungry",
      moodText: "Could use soap and snacks.",
      moodImage: foxSadDirty,
    };
  }

  if (isDirty) {
    return {
      mood: "dirty",
      moodText: "Could really use a bath.",
      moodImage: foxDirty,
    };
  }

  if (isVeryHungry) {
    return {
      mood: "hungry",
      moodText: "Stomach is growling!",
      moodImage: foxSad,
    };
  }

  if (isHungry) {
    return {
      mood: "hungry",
      moodText: "Snack time?",
      moodImage: foxSad,
    };
  }

  return {
    mood: "happy",
    moodText: "All good!",
    moodImage: foxHappy,
  };
}

export function withMood(state = {}) {
  return { ...state, ...deriveMood(state) };
}
