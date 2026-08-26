import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

/* =========================================================
   TYPES
========================================================= */

export interface VisionLiveState {
  faceDetected: boolean;
  mouthMoving: boolean;
  jawOpen: number;
}

export interface VisionAttemptResult {
  faceVisiblePercent: number;
  mouthMovementPercent: number;
  maxJawOpen: number;
  visualSpeakingDetected: boolean;
}

interface VisionAttemptStore {
  attemptActive: boolean;

  totalFrames: number;
  faceVisibleFrames: number;
  mouthMovingFrames: number;

  maxJawOpen: number;
  previousJawOpen: number;

  latestFaceDetected: boolean;
  latestMouthMoving: boolean;
  latestJawOpen: number;
}

/* =========================================================
   GLOBAL TYPE
========================================================= */

declare global {
  var __reellingoVisionAttemptStore:
    | VisionAttemptStore
    | undefined;
}

/* =========================================================
   CONSTANTS
========================================================= */

const JAW_OPEN_THRESHOLD = 0.07;
const JAW_DELTA_THRESHOLD = 0.018;

/* =========================================================
   SHARED ATTEMPT STORE

   globalThis prevents Turbopack / HMR from creating
   separate attempt counters during development.
========================================================= */

function createEmptyAttemptStore(): VisionAttemptStore {
  return {
    attemptActive: false,

    totalFrames: 0,
    faceVisibleFrames: 0,
    mouthMovingFrames: 0,

    maxJawOpen: 0,
    previousJawOpen: 0,

    latestFaceDetected: false,
    latestMouthMoving: false,
    latestJawOpen: 0,
  };
}

function getAttemptStore(): VisionAttemptStore {
  if (!globalThis.__reellingoVisionAttemptStore) {
    globalThis.__reellingoVisionAttemptStore =
      createEmptyAttemptStore();
  }

  return globalThis.__reellingoVisionAttemptStore;
}

/* =========================================================
   MEDIAPIPE INSTANCE
========================================================= */

let faceLandmarker: FaceLandmarker | null = null;

/* =========================================================
   INITIALIZE MEDIAPIPE
========================================================= */

export async function initializeVision() {
  if (faceLandmarker) {
    return faceLandmarker;
  }

  const vision =
    await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

  faceLandmarker =
    await FaceLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",

          delegate: "GPU",
        },

        runningMode: "VIDEO",

        numFaces: 1,

        outputFaceBlendshapes: true,

        outputFacialTransformationMatrixes:
          false,
      }
    );

  return faceLandmarker;
}

/* =========================================================
   GET BLENDSHAPE SCORE
========================================================= */

function getBlendshapeScore(
  categories:
    | {
        categoryName?: string;
        score?: number;
      }[]
    | undefined,

  name: string
) {
  if (!categories) {
    return 0;
  }

  const item = categories.find(
    (category) =>
      category.categoryName === name
  );

  return item?.score ?? 0;
}

/* =========================================================
   FILTER XNNPACK INFO MESSAGE
========================================================= */

function withFilteredXnnpackLog<T>(
  callback: () => T
): T {
  const originalError =
    console.error.bind(console);

  const originalWarn =
    console.warn.bind(console);

  const originalLog =
    console.log.bind(console);

  const shouldIgnore = (
    args: unknown[]
  ) => {
    const message = args
      .map((arg) => {
        if (typeof arg === "string") {
          return arg;
        }

        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    return message.includes(
      "Created TensorFlow Lite XNNPACK delegate for CPU"
    );
  };

  console.error = (
    ...args: unknown[]
  ) => {
    if (shouldIgnore(args)) {
      return;
    }

    originalError(...args);
  };

  console.warn = (
    ...args: unknown[]
  ) => {
    if (shouldIgnore(args)) {
      return;
    }

    originalWarn(...args);
  };

  console.log = (
    ...args: unknown[]
  ) => {
    if (shouldIgnore(args)) {
      return;
    }

    originalLog(...args);
  };

  try {
    return callback();
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
  }
}

/* =========================================================
   ANALYZE ONE VIDEO FRAME
========================================================= */

export function analyzeVisionFrame(
  video: HTMLVideoElement,
  timestamp: number
): VisionLiveState {
  const store = getAttemptStore();

  if (!faceLandmarker) {
    store.latestFaceDetected = false;
    store.latestMouthMoving = false;
    store.latestJawOpen = 0;

    return {
      faceDetected: false,
      mouthMoving: false,
      jawOpen: 0,
    };
  }

  if (
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return {
      faceDetected:
        store.latestFaceDetected,

      mouthMoving:
        store.latestMouthMoving,

      jawOpen:
        store.latestJawOpen,
    };
  }

  const result =
    withFilteredXnnpackLog(() =>
      faceLandmarker!.detectForVideo(
        video,
        timestamp
      )
    );

  const faceDetected =
    result.faceLandmarks.length > 0;

  let jawOpen = 0;
  let mouthMoving = false;

  /* =======================================================
     FACE BLENDSHAPES
  ======================================================= */

  if (
    faceDetected &&
    result.faceBlendshapes.length > 0
  ) {
    const categories =
      result.faceBlendshapes[0]
        ?.categories;

    jawOpen =
      getBlendshapeScore(
        categories,
        "jawOpen"
      );

    const jawDelta =
      Math.abs(
        jawOpen -
          store.previousJawOpen
      );

    mouthMoving =
      jawOpen >
        JAW_OPEN_THRESHOLD ||
      jawDelta >
        JAW_DELTA_THRESHOLD;

    store.previousJawOpen =
      jawOpen;
  } else {
    store.previousJawOpen = 0;
  }

  /* =======================================================
     SAVE CURRENT LIVE STATE
  ======================================================= */

  store.latestFaceDetected =
    faceDetected;

  store.latestMouthMoving =
    mouthMoving;

  store.latestJawOpen =
    jawOpen;

  /* =======================================================
     ATTEMPT STATISTICS

     Only count frames while Record is active.
  ======================================================= */

  if (store.attemptActive) {
    store.totalFrames += 1;

    if (faceDetected) {
      store.faceVisibleFrames += 1;
    }

    if (mouthMoving) {
      store.mouthMovingFrames += 1;
    }

    if (
      jawOpen >
      store.maxJawOpen
    ) {
      store.maxJawOpen =
        jawOpen;
    }
  }

  return {
    faceDetected,
    mouthMoving,
    jawOpen,
  };
}

/* =========================================================
   START ATTEMPT
========================================================= */

export function startVisionAttempt() {
  const store =
    getAttemptStore();

  store.totalFrames = 0;
  store.faceVisibleFrames = 0;
  store.mouthMovingFrames = 0;

  store.maxJawOpen = 0;

  /*
   * Important:
   * use the current jaw position as the baseline
   * instead of always starting from zero.
   */
  store.previousJawOpen =
    store.latestJawOpen;

  /*
   * Set this LAST so no frame gets counted
   * before all counters have been reset.
   */
  store.attemptActive =
    true;

  console.log(
    "CV attempt started"
  );
}

/* =========================================================
   FINISH ATTEMPT
========================================================= */

export function finishVisionAttempt(): VisionAttemptResult {
  const store =
    getAttemptStore();

  /*
   * Stop counting immediately.
   */
  store.attemptActive =
    false;

  const {
    totalFrames,
    faceVisibleFrames,
    mouthMovingFrames,
    maxJawOpen,
  } = store;

  const faceVisiblePercent =
    totalFrames > 0
      ? Math.round(
          (
            faceVisibleFrames /
            totalFrames
          ) * 100
        )
      : 0;

  const mouthMovementPercent =
    totalFrames > 0
      ? Math.round(
          (
            mouthMovingFrames /
            totalFrames
          ) * 100
        )
      : 0;

  const visualSpeakingDetected =
    faceVisiblePercent >= 60 &&
    mouthMovementPercent >= 10;

  const result: VisionAttemptResult = {
    faceVisiblePercent,

    mouthMovementPercent,

    maxJawOpen:
      Math.round(
        maxJawOpen * 1000
      ) / 1000,

    visualSpeakingDetected,
  };

  console.log(
    "CV attempt finished:",
    {
      totalFrames,
      faceVisibleFrames,
      mouthMovingFrames,
      ...result,
    }
  );

  return result;
}

/* =========================================================
   RESET ATTEMPT
========================================================= */

export function resetVisionAttempt() {
  const store =
    getAttemptStore();

  store.attemptActive =
    false;

  store.totalFrames = 0;

  store.faceVisibleFrames =
    0;

  store.mouthMovingFrames =
    0;

  store.maxJawOpen = 0;

  store.previousJawOpen =
    store.latestJawOpen;
}

/* =========================================================
   OPTIONAL DEBUG

   Useful while developing.
========================================================= */

export function getVisionDebugState() {
  const store =
    getAttemptStore();

  return {
    attemptActive:
      store.attemptActive,

    totalFrames:
      store.totalFrames,

    faceVisibleFrames:
      store.faceVisibleFrames,

    mouthMovingFrames:
      store.mouthMovingFrames,

    latestFaceDetected:
      store.latestFaceDetected,

    latestMouthMoving:
      store.latestMouthMoving,

    latestJawOpen:
      store.latestJawOpen,

    maxJawOpen:
      store.maxJawOpen,
  };
}
