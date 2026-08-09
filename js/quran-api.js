/* =========================================================
   طبقة الاتصال بالقرآن الكريم (نص، صوت، متشابهات)
   تعتمد على واجهة alquran.cloud المجانية المفتوحة (بدون مفتاح)
   ولا تُخزَّن أي نصوص قرآنية داخل التطبيق نفسه، بل تُجلَب حيّة
   لضمان دقتها ومطابقتها للمصدر الموثوق.
   ========================================================= */

const QuranAPI = (() => {
  const BASE = "https://api.alquran.cloud/v1"; // مصدر رواية حفص + بيانات السور + المتشابهات
  const WARSH_BASE = "https://api.quranhub.com/v1"; // مصدر رواية ورش عن نافع
  const SURAH_NO = 4; // سورة النساء
  const TEXT_EDITION_HAFS = "quran-uthmani";  // رسم عثماني - رواية حفص عن عاصم
  const TEXT_EDITION_WARSH = "quran-warsh";   // رواية ورش عن نافع (تطابق نص مصحف الجزائر "مصحف الشاذلي")
  const AUDIO_EDITION = "ar.alafasy";
  const MUTASHABIHAT_URL =
    "https://raw.githubusercontent.com/Waqar144/Quran_Mutashabihat_Data/master/mutashabiha_data.json";

  const RIWAYA_KEY = "nisa-app-riwaya";
  let activeRiwaya = localStorage.getItem(RIWAYA_KEY) || "warsh"; // الافتراضي: ورش عن نافع
  let lastFetchFellBack = false; // هل تعذّر جلب ورش فعادت القراءة تلقائيًا لحفص؟

  const cache = {
    surahAyahs: { hafs: null, warsh: null }, // نص آيات سورة النساء كاملة، لكل رواية
    surahList: null,       // بيانات كل سور القرآن (لحساب الأرقام المطلقة) - رواية حفص فقط (للمتشابهات)
    mutashabihat: null,    // قاعدة بيانات المتشابهات كاملة
    ayahByAbs: new Map()   // تخزين مؤقت للآيات المفردة بالرقم المطلق (رواية حفص، لغرض المتشابهات)
  };

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("تعذّر الاتصال: " + res.status);
    return res.json();
  }

  function getActiveRiwaya() { return activeRiwaya; }
  function didFallBack() { return lastFetchFellBack; }

  function setActiveRiwaya(r) {
    activeRiwaya = (r === "hafs") ? "hafs" : "warsh";
    localStorage.setItem(RIWAYA_KEY, activeRiwaya);
  }

  // جلب نص سورة النساء كاملة (176 آية) حسب الرواية النشطة، مع رجوع تلقائي لحفص إن تعذّر جلب ورش
  async function getSurahAyahs() {
    const r = activeRiwaya;
    if (cache.surahAyahs[r]) { lastFetchFellBack = false; return cache.surahAyahs[r]; }

    if (r === "warsh") {
      try {
        const data = await fetchJSON(`${WARSH_BASE}/surah/${SURAH_NO}/${TEXT_EDITION_WARSH}`);
        cache.surahAyahs.warsh = data.data.ayahs;
        lastFetchFellBack = false;
        return cache.surahAyahs.warsh;
      } catch (e) {
        // تعذّر مصدر ورش (اتصال أو تغيّر في الواجهة) — نرجع مؤقتًا لحفص دون كسر التطبيق
        lastFetchFellBack = true;
        const data = await fetchJSON(`${BASE}/surah/${SURAH_NO}/${TEXT_EDITION_HAFS}`);
        cache.surahAyahs.hafs = data.data.ayahs;
        return cache.surahAyahs.hafs;
      }
    } else {
      const data = await fetchJSON(`${BASE}/surah/${SURAH_NO}/${TEXT_EDITION_HAFS}`);
      cache.surahAyahs.hafs = data.data.ayahs;
      lastFetchFellBack = false;
      return cache.surahAyahs.hafs;
    }
  }

  // آيات نطاق معيّن [from,to] ضمن سورة النساء (أرقام داخل السورة)
  async function getAyahRange(from, to) {
    const all = await getSurahAyahs();
    return all.filter(a => a.numberInSurah >= from && a.numberInSurah <= to);
  }

  function audioUrlFor(absoluteAyahNumber) {
    return `https://cdn.islamic.network/quran/audio/128/${AUDIO_EDITION}/${absoluteAyahNumber}.mp3`;
  }

  // قائمة كل السور مع عدد آياتها (لحساب الأرقام المطلقة في المتشابهات)
  async function getSurahList() {
    if (cache.surahList) return cache.surahList;
    const data = await fetchJSON(`${BASE}/surah`);
    cache.surahList = data.data; // [{number, name, englishName, numberOfAyahs}, ...]
    return cache.surahList;
  }

  // حدود سورة النساء بالأرقام المطلقة (1..6236) — تُحسب حيًّا من بيانات alquran.cloud
  async function getNisaAbsoluteRange() {
    const list = await getSurahList();
    let start = 1;
    for (const s of list) {
      if (s.number === SURAH_NO) {
        return { start, end: start + s.numberOfAyahs - 1, count: s.numberOfAyahs };
      }
      start += s.numberOfAyahs;
    }
    throw new Error("تعذّر تحديد نطاق سورة النساء");
  }

  async function getMutashabihatRaw() {
    if (cache.mutashabihat) return cache.mutashabihat;
    cache.mutashabihat = await fetchJSON(MUTASHABIHAT_URL);
    return cache.mutashabihat;
  }

  function asArray(v) { return Array.isArray(v) ? v : [v]; }

  // إرجاع كل مدخلات المتشابهات التي يقع "مصدرها" ضمن نطاق مقطع موضوعي معيّن من سورة النساء
  async function getMutashabihatForRange(fromInSurah, toInSurah) {
    const [raw, range] = await Promise.all([getMutashabihatRaw(), getNisaAbsoluteRange()]);
    const absFrom = range.start + fromInSurah - 1;
    const absTo = range.start + toInSurah - 1;

    const relevant = raw.filter(entry => {
      const srcAyahs = asArray(entry.src.ayah);
      return srcAyahs.some(n => n >= absFrom && n <= absTo);
    });
    return { entries: relevant, nisaRange: range };
  }

  // جلب نص آية واحدة عبر رقمها المطلق، مع تخزين مؤقت
  async function getAyahByAbsolute(absNum) {
    if (cache.ayahByAbs.has(absNum)) return cache.ayahByAbs.get(absNum);
    const data = await fetchJSON(`${BASE}/ayah/${absNum}/${TEXT_EDITION}`);
    const info = {
      absolute: absNum,
      text: data.data.text,
      numberInSurah: data.data.numberInSurah,
      surahNumber: data.data.surah.number,
      surahName: data.data.surah.name
    };
    cache.ayahByAbs.set(absNum, info);
    return info;
  }

  async function getAyahsByAbsoluteList(list) {
    const unique = [...new Set(list)];
    const results = await Promise.all(unique.map(n => getAyahByAbsolute(n)));
    const map = new Map();
    results.forEach(r => map.set(r.absolute, r));
    return map;
  }

  return {
    SURAH_NO,
    getSurahAyahs,
    getAyahRange,
    audioUrlFor,
    getSurahList,
    getNisaAbsoluteRange,
    getMutashabihatForRange,
    getAyahByAbsolute,
    getAyahsByAbsoluteList,
    getActiveRiwaya,
    setActiveRiwaya,
    didFallBack
  };
})();
