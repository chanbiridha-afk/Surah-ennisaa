/* =========================================================
   محرك التكرار المتباعد: الحفظ ← المراجعة القريبة ← المراجعة البعيدة
   يُخزَّن التقدّم محليًّا على جهاز المستخدم فقط (localStorage)
   ========================================================= */

const SRS = (() => {
  const STORAGE_KEY = "nisa-app-progress-v1";

  // فترات المراجعة القريبة (أيام) ثم البعيدة (أيام)
  const NEAR_INTERVALS = [1, 3, 7];
  const FAR_INTERVALS = [14, 30, 60, 120, 180];

  function todayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { sections: {} };
    } catch (e) {
      return { sections: {} };
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  let state = load();

  function getSection(id) {
    return state.sections[id] || {
      status: "new",       // new | memorized
      stage: null,         // near | far
      stepIndex: 0,
      nextReview: null,
      lastReview: null,
      memorizedOn: null,
      history: []
    };
  }

  function setSection(id, data) {
    state.sections[id] = data;
    save(state);
  }

  // تعليم المقطع كمحفوظ لأول مرة → يدخل في المراجعة القريبة
  function markMemorized(id) {
    const sec = getSection(id);
    sec.status = "memorized";
    sec.stage = "near";
    sec.stepIndex = 0;
    sec.memorizedOn = sec.memorizedOn || todayStr();
    sec.lastReview = todayStr();
    sec.nextReview = todayStr(NEAR_INTERVALS[0]);
    sec.history.push({ date: todayStr(), action: "حفظ" });
    setSection(id, sec);
    return sec;
  }

  // تسجيل مراجعة ناجحة → الانتقال للخطوة التالية (قريبة ثم بعيدة)
  function completeReview(id) {
    const sec = getSection(id);
    if (sec.status !== "memorized") return sec;

    sec.lastReview = todayStr();

    if (sec.stage === "near") {
      const nextIdx = sec.stepIndex + 1;
      if (nextIdx < NEAR_INTERVALS.length) {
        sec.stepIndex = nextIdx;
        sec.nextReview = todayStr(NEAR_INTERVALS[nextIdx]);
      } else {
        sec.stage = "far";
        sec.stepIndex = 0;
        sec.nextReview = todayStr(FAR_INTERVALS[0]);
      }
    } else if (sec.stage === "far") {
      const nextIdx = Math.min(sec.stepIndex + 1, FAR_INTERVALS.length - 1);
      sec.stepIndex = nextIdx;
      sec.nextReview = todayStr(FAR_INTERVALS[nextIdx]);
    }
    sec.history.push({ date: todayStr(), action: "مراجعة" });
    setSection(id, sec);
    return sec;
  }

  // نسيان المقطع أو الرغبة في إعادة حفظه من جديد
  function resetToNear(id) {
    const sec = getSection(id);
    sec.stage = "near";
    sec.stepIndex = 0;
    sec.lastReview = todayStr();
    sec.nextReview = todayStr(NEAR_INTERVALS[0]);
    sec.history.push({ date: todayStr(), action: "إعادة حفظ" });
    setSection(id, sec);
    return sec;
  }

  function isDue(sec) {
    if (sec.status !== "memorized" || !sec.nextReview) return false;
    return sec.nextReview <= todayStr();
  }

  function allSections() {
    return state.sections;
  }

  function stats(topicsList) {
    let memorized = 0, dueNear = 0, dueFar = 0, notStarted = 0;
    topicsList.forEach(t => {
      const sec = getSection(t.id);
      if (sec.status !== "memorized") { notStarted++; return; }
      memorized++;
      if (isDue(sec)) {
        if (sec.stage === "near") dueNear++; else dueFar++;
      }
    });
    return { memorized, dueNear, dueFar, notStarted, total: topicsList.length };
  }

  function dueList(topicsList) {
    return topicsList
      .map(t => ({ topic: t, sec: getSection(t.id) }))
      .filter(x => isDue(x.sec))
      .sort((a, b) => a.sec.nextReview.localeCompare(b.sec.nextReview));
  }

  return {
    getSection, markMemorized, completeReview, resetToNear,
    isDue, allSections, stats, dueList, todayStr,
    NEAR_INTERVALS, FAR_INTERVALS
  };
})();
