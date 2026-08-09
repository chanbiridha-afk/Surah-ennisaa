/* =========================================================
   عداد التكرار: لحفظ عدد مرات ترديد المقطع أثناء الحفظ الأولي
   وأثناء المراجعة، مع اقتراح عدد موصى به من أهل الاختصاص
   في التحفيظ.
   ========================================================= */

const RepCounter = (() => {
  const STORAGE_KEY = "nisa-app-repcounts-v1";

  // الأعداد الموصى بها شيوعًا في طرق التحفيظ المعتمدة لدى المحفّظين:
  // - الحفظ الأولي للمقطع الجديد: لا يقل عن 20 مرة للمبتدئ حتى يثبت
  //   (ويكفي المتمرّس أحيانًا أقل، لكن 20 هي الحد الأدنى الشائع في التوصيات)
  // - المراجعة القريبة (خلال أول أسبوع بعد الحفظ): 5 مرات لتثبيت الحفظ الجديد
  // - المراجعة البعيدة (بعد أن ثبت الحفظ): 3 مرات كحد أدنى تكفي غالبًا
  const TARGETS = {
    memorize: { count: 20, label: "الحفظ الأولي", note: "لا يقل التكرار عند حفظ مقطع جديد عن 20 مرة حتى يثبت في الذاكرة، وهذا ما ينصح به أكثر المحفِّظين للمبتدئ." },
    near: { count: 5, label: "المراجعة القريبة", note: "يُنصح بتكرار المقطع 5 مرات أثناء المراجعة القريبة (الأيام الأولى) حتى يترسّخ الحفظ الجديد." },
    far: { count: 3, label: "المراجعة البعيدة", note: "3 مرات غالبًا كافية في المراجعة البعيدة، لأن الحفظ يكون قد استقر." }
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function save(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  let state = load();

  function key(sectionId, kind) { return `${sectionId}:${kind}`; }

  function get(sectionId, kind) {
    return state[key(sectionId, kind)] || 0;
  }

  function increment(sectionId, kind) {
    const k = key(sectionId, kind);
    state[k] = (state[k] || 0) + 1;
    save(state);
    return state[k];
  }

  function reset(sectionId, kind) {
    state[key(sectionId, kind)] = 0;
    save(state);
    return 0;
  }

  function target(kind) {
    return TARGETS[kind] || TARGETS.memorize;
  }

  return { get, increment, reset, target, TARGETS };
})();
