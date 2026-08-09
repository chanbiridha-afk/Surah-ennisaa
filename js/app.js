/* =========================================================
   التطبيق الرئيسي: التنقل بين الشاشات وعرض المحتوى
   ========================================================= */

const App = (() => {
  const root = document.getElementById("app");
  let currentTab = "intro";
  let currentSectionId = null;
  let introSubtab = "fadl";

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  function navTo(tab, opts = {}) {
    currentTab = tab;
    if (opts.sectionId !== undefined) currentSectionId = opts.sectionId;
    renderBottomNav();
    render();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  /* ---------------- شريط التنقل السفلي ---------------- */
  function renderBottomNav() {
    const nav = document.getElementById("bottom-nav");
    const items = [
      { id: "intro", icon: "📜", label: "مقدمة" },
      { id: "topics", icon: "🗂️", label: "موضوعات" },
      { id: "review", icon: "🔁", label: "المراجعة" },
      { id: "mutashabihat", icon: "🔀", label: "متشابهات" }
    ];
    nav.innerHTML = items.map(it => `
      <button data-tab="${it.id}" class="${currentTab === it.id ? "active" : ""}">
        <span class="icon">${it.icon}</span>
        <span>${it.label}</span>
      </button>
    `).join("");
    nav.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => navTo(btn.dataset.tab));
    });
  }

  /* ---------------- شاشة المقدمة ---------------- */
  function renderIntro() {
    const tabs = [
      { id: "fadl", label: "الفضل" },
      { id: "asma", label: "الأسماء" },
      { id: "maqasid", label: "المقاصد" },
      { id: "adad", label: "عدد الآي" }
    ];
    let body = "";
    if (introSubtab === "fadl") {
      body = `
        <div class="card">
          <h2>فضل سورة النساء</h2>
          ${NISA_VIRTUES.map(v => `<p>${v.text}</p>`).join("")}
        </div>
        <div class="card">
          <h2>عن السورة</h2>
          <ul class="plain">
            <li><b>ترتيبها:</b> السورة ${NISA_META.order} في المصحف الشريف.</li>
            <li><b>مكية أم مدنية:</b> ${NISA_META.makkiMadani}</li>
            <li><b>زمن النزول:</b> ${NISA_META.nuzul}</li>
          </ul>
        </div>`;
    } else if (introSubtab === "asma") {
      body = `<div class="card"><h2>أسماء السورة</h2>` +
        NISA_NAMES.map(n => `<h3>${n.name}</h3><p>${n.detail}</p>`).join("") +
        `</div>`;
    } else if (introSubtab === "maqasid") {
      body = `<div class="card">
        <h2>مقاصد سورة النساء</h2>
        <ul class="plain">${NISA_PURPOSES.map(p => `<li>${p}</li>`).join("")}</ul>
      </div>`;
    } else if (introSubtab === "adad") {
      body = `<div class="card">
        <h2>عدد آياتها حسب مدارس عدّ الآي</h2>
        <p>اختلف علماء «عدّ الآي» قديمًا في تحديد رؤوس بعض الآيات (لا في زيادة أو نقصان النص)، فنتج عن ذلك اختلاف يسير في العدد الإجمالي حسب المدرسة:</p>
        <table class="count-table">
          <tr><th>المدرسة</th><th>العدد</th></tr>
          ${NISA_AYAH_COUNT_SCHOOLS.map(s => `
            <tr>
              <td>${s.school}<br><small class="ref">${s.note}</small></td>
              <td class="num">${s.count}</td>
            </tr>`).join("")}
        </table>
        <p class="settings-note">النص المعروض افتراضيًّا في التطبيق هو رواية ورش عن نافع (وفق ترقيمها المطابق للعدّ الكوفي، 176 آية)، وهي الرواية المعتمدة في مصحف الجزائر المعروف بـ"مصحف الشاذلي". يمكن التبديل إلى رواية حفص من زر الرواية أعلى شاشتي الحفظ والمراجعة. يبقى هذا نصًّا رقميًّا لأغراض العرض؛ ترقيم الصفحات والأسطر يطابق مصحفكم المطبوع فقط في عدد الآيات لا في تخطيط الصفحة.</p>
      </div>`;
    }
    return `
      <div class="ornament-frame">
        <div class="eyebrow">﷽</div>
        <h1>سورة النساء</h1>
        <div class="sub">مقدمة تعريفية بالسورة</div>
      </div>
      <div class="page-wrap">
        <div class="subtabs">
          ${tabs.map(t => `<button data-sub="${t.id}" class="${introSubtab === t.id ? "active" : ""}">${t.label}</button>`).join("")}
        </div>
        ${body}
      </div>`;
  }

  /* ---------------- شاشة قائمة الموضوعات ---------------- */
  function renderTopicsList() {
    const items = NISA_TOPICS.map(t => {
      const sec = SRS.getSection(t.id);
      const due = SRS.isDue(sec);
      let statusText = "لم يبدأ الحفظ";
      let ringColor = "#B8863B";
      if (sec.status === "memorized") {
        if (due) {
          statusText = sec.stage === "near" ? "مراجعة قريبة مستحقة" : "مراجعة بعيدة مستحقة";
          ringColor = sec.stage === "near" ? "#1F5C50" : "#8C2F2F";
        } else {
          statusText = sec.stage === "near" ? "قيد المراجعة القريبة" : "قيد المراجعة البعيدة";
          ringColor = "#2e7d32";
        }
      }
      return `
        <div class="topic-item" data-id="${t.id}">
          <div class="topic-badge">${t.id}</div>
          <div class="topic-info">
            <h3>${t.title}</h3>
            <div class="range">من الآية ${t.from} إلى الآية ${t.to} (${t.to - t.from + 1} آية)</div>
            <div class="desc">${t.desc}</div>
          </div>
          <div class="topic-progress">
            <svg class="ring" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="4"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="${ringColor}" stroke-width="4"
                stroke-dasharray="94" stroke-dashoffset="${sec.status === "memorized" ? 0 : 70}"
                stroke-linecap="round" transform="rotate(-90 18 18)"/>
            </svg>
            <div>${sec.status === "memorized" ? "✓" : "○"}</div>
          </div>
        </div>`;
    }).join("");

    const st = SRS.stats(NISA_TOPICS);
    return `
      <div class="ornament-frame">
        <div class="eyebrow">التقسيم الموضوعي</div>
        <h1>موضوعات السورة</h1>
        <div class="sub">${st.memorized} / ${st.total} مقطعًا محفوظًا</div>
      </div>
      <div class="page-wrap">
        <div class="review-summary">
          <div class="stat"><span class="n">${st.dueNear + st.dueFar}</span><span class="l">مراجعة مستحقة اليوم</span></div>
          <div class="stat"><span class="n">${st.memorized}</span><span class="l">مقاطع محفوظة</span></div>
          <div class="stat"><span class="n">${st.notStarted}</span><span class="l">لم تُحفظ بعد</span></div>
        </div>
        ${items}
      </div>`;
  }

  /* ---------------- عداد التكرار (حفظ/مراجعة) ---------------- */
  function renderRepCounterHTML(sectionId, kind) {
    const t = RepCounter.target(kind);
    const n = RepCounter.get(sectionId, kind);
    const pct = Math.min(100, Math.round((n / t.count) * 100));
    const doneClass = n >= t.count ? "done" : "";
    return `
      <div class="rep-counter" data-rep-section="${sectionId}" data-rep-kind="${kind}">
        <div class="rep-head">
          <h3>عداد التكرار — ${t.label}</h3>
          <span class="rep-target">الموصى به: ${t.count} مرة</span>
        </div>
        <div class="rep-row">
          <span class="rep-count">${n}</span>
          <div class="rep-bar"><div class="rep-bar-fill ${doneClass}" style="width:${pct}%"></div></div>
        </div>
        <div class="rep-btns">
          <button class="rep-btn plus ${doneClass}" data-act="rep-plus">+ سمّعتُها مرة أخرى</button>
          <button class="rep-btn reset" data-act="rep-reset">↺</button>
        </div>
        ${n >= t.count ? `<div class="rep-goal-msg">✓ بلغتَ العدد الموصى به لـ${t.label}</div>` : ""}
        <div class="settings-note">${t.note}</div>
      </div>`;
  }

  function bindRepCounter(container, sectionId, kind, onChange) {
    const wrap = container.querySelector(`[data-rep-section="${sectionId}"][data-rep-kind="${kind}"]`);
    if (!wrap) return;
    wrap.querySelector('[data-act="rep-plus"]').addEventListener("click", () => {
      RepCounter.increment(sectionId, kind);
      if (onChange) onChange();
    });
    wrap.querySelector('[data-act="rep-reset"]').addEventListener("click", () => {
      RepCounter.reset(sectionId, kind);
      if (onChange) onChange();
    });
  }

  /* ---------------- تبديل الرواية (ورش / حفص) ---------------- */
  function riwayaToggleHTML() {
    const active = QuranAPI.getActiveRiwaya();
    return `
      <div class="riwaya-toggle" id="riwayaToggle">
        <button data-riwaya="warsh" class="${active === "warsh" ? "active" : ""}">رواية ورش</button>
        <button data-riwaya="hafs" class="${active === "hafs" ? "active" : ""}">رواية حفص</button>
      </div>`;
  }
  function bindRiwayaToggle(onSwitch) {
    const wrap = document.getElementById("riwayaToggle");
    if (!wrap) return;
    wrap.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        QuranAPI.setActiveRiwaya(btn.dataset.riwaya);
        onSwitch();
      });
    });
  }

  /* ---------------- شاشة الحفظ لمقطع محدّد ---------------- */
  async function renderMemorizeSection(id) {
    const topic = NISA_TOPICS.find(t => t.id === id);
    root.innerHTML = shell(`
      <div class="ornament-frame">
        <button class="back-btn" id="backBtn" style="position:absolute;right:14px;top:14px;background:none;border:none;color:var(--gold-light);font-size:1.3rem;">←</button>
        <div class="eyebrow">المقطع ${topic.id} من 12</div>
        <h1>${topic.title}</h1>
        <div class="sub">من الآية ${topic.from} إلى الآية ${topic.to}</div>
      </div>
      <div class="page-wrap">
        ${riwayaToggleHTML()}
        <div id="ayahContainer">
          <div class="loading"><div class="spin"></div><p>جارٍ تحميل الآيات من المصحف الشريف…</p></div>
        </div>
      </div>
    `);
    bindBack();
    bindRiwayaToggle(() => renderMemorizeSection(id));

    try {
      const ayahs = await QuranAPI.getAyahRange(topic.from, topic.to);
      const sec = SRS.getSection(id);
      const container = document.getElementById("ayahContainer");
      const fellBack = QuranAPI.didFallBack();
      container.innerHTML = `
        ${fellBack ? `<div class="settings-note">تعذّر الوصول مؤقتًا لمصدر نص ورش، فعُرض نص حفص بدلًا منه. أعد المحاولة لاحقًا.</div>` : ""}
        <div class="ayah-block">
          <div class="ayah-text">
            ${ayahs.map(a => `${a.text} <span class="ayah-num">${a.numberInSurah}</span>`).join(" ")}
          </div>
        </div>
        <div class="card">
          <h2>تتبّع الحفظ</h2>
          <p>بعد إتقان حفظ هذا المقطع، اضغط الزر أدناه ليبدأ جدول المراجعة (مراجعة قريبة ثم مراجعة بعيدة تلقائيًا).</p>
          ${renderRepCounterHTML(id, "memorize")}
          <div class="ayah-actions">
            <button id="memBtn" class="chip-btn memorize ${sec.status === "memorized" ? "done" : ""}">
              ${sec.status === "memorized" ? "✓ محفوظ" : "🟢 تعليم كمحفوظ"}
            </button>
            ${sec.status === "memorized" ? `<button id="resetBtn" class="chip-btn ghost">↺ إعادة الحفظ من جديد</button>` : ""}
          </div>
          ${sec.status === "memorized" ? renderSectionScheduleInfo(sec) : ""}
        </div>
      `;
      bindRepCounter(container, id, "memorize", () => renderMemorizeSection(id));
      document.getElementById("memBtn").addEventListener("click", () => {
        SRS.markMemorized(id);
        RepCounter.reset(id, "memorize");
        toast("تم تسجيل الحفظ، بدأ جدول المراجعة القريبة 🎉");
        renderMemorizeSection(id);
      });
      const resetBtn = document.getElementById("resetBtn");
      if (resetBtn) resetBtn.addEventListener("click", () => {
        SRS.resetToNear(id);
        toast("أُعيد جدول المراجعة إلى البداية");
        renderMemorizeSection(id);
      });
    } catch (e) {
      document.getElementById("ayahContainer").innerHTML = errorCard(e);
    }
  }

  function renderSectionScheduleInfo(sec) {
    const stageLabel = sec.stage === "near" ? "المراجعة القريبة" : "المراجعة البعيدة";
    return `<div class="settings-note">
      المرحلة الحالية: <b>${stageLabel}</b> (الخطوة ${sec.stepIndex + 1}) —
      الموعد القادم للمراجعة: <b>${sec.nextReview}</b>
    </div>`;
  }

  /* ---------------- شاشة المراجعة (لوحة يومية) ---------------- */
  function renderReview() {
    const due = SRS.dueList(NISA_TOPICS);
    const st = SRS.stats(NISA_TOPICS);
    let list;
    if (due.length === 0) {
      list = `<div class="empty-state">
        <span class="icon">🌿</span>
        <p>لا توجد مراجعات مستحقة الآن. أحسنت! يمكنك حفظ مقطع جديد أو استكشاف المتشابهات.</p>
      </div>`;
    } else {
      list = due.map(({ topic, sec }) => `
        <div class="review-card" data-id="${topic.id}">
          <span class="tag ${sec.stage}">${sec.stage === "near" ? "قريبة" : "بعيدة"}</span>
          <div class="info">
            <h4>${topic.title}</h4>
            <small>الآيات ${topic.from}–${topic.to} · مستحقة منذ ${sec.nextReview}</small>
          </div>
          <button class="go" data-act="open">مراجعة</button>
        </div>`).join("");
    }

    root.innerHTML = shell(`
      <div class="ornament-frame">
        <div class="eyebrow">لوحة المراجعة اليومية</div>
        <h1>المراجعة</h1>
        <div class="sub">${SRS.todayStr()}</div>
      </div>
      <div class="page-wrap">
        <div class="review-summary">
          <div class="stat"><span class="n">${st.dueNear}</span><span class="l">مراجعة قريبة</span></div>
          <div class="stat"><span class="n">${st.dueFar}</span><span class="l">مراجعة بعيدة</span></div>
          <div class="stat"><span class="n">${st.memorized}</span><span class="l">إجمالي المحفوظ</span></div>
        </div>
        ${list}
      </div>
    `);
    root.querySelectorAll(".review-card .go").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = Number(e.target.closest(".review-card").dataset.id);
        openReviewSession(id);
      });
    });
  }

  async function openReviewSession(id) {
    const topic = NISA_TOPICS.find(t => t.id === id);
    const sec0 = SRS.getSection(id);
    const kind = sec0.stage === "far" ? "far" : "near";
    root.innerHTML = shell(`
      <div class="ornament-frame">
        <button id="backBtn" style="position:absolute;right:14px;top:14px;background:none;border:none;color:var(--gold-light);font-size:1.3rem;">←</button>
        <div class="eyebrow">جلسة مراجعة</div>
        <h1>${topic.title}</h1>
        <div class="sub">الآيات ${topic.from}–${topic.to}</div>
      </div>
      <div class="page-wrap">
        ${riwayaToggleHTML()}
        <div id="revContainer">
          <div class="loading"><div class="spin"></div></div>
        </div>
      </div>
    `);
    bindBack(() => navTo("review"));
    bindRiwayaToggle(() => openReviewSession(id));
    try {
      const ayahs = await QuranAPI.getAyahRange(topic.from, topic.to);
      const fellBack = QuranAPI.didFallBack();
      const container = document.getElementById("revContainer");
      container.innerHTML = `
        ${fellBack ? `<div class="settings-note">تعذّر الوصول مؤقتًا لمصدر نص ورش، فعُرض نص حفص بدلًا منه.</div>` : ""}
        <div class="ayah-block">
          <div class="ayah-text">${ayahs.map(a => `${a.text} <span class="ayah-num">${a.numberInSurah}</span>`).join(" ")}</div>
        </div>
        <div class="card">
          <p>راجع المقطع تسميعًا أو نظرًا، ثم سجّل نتيجة المراجعة:</p>
          ${renderRepCounterHTML(id, kind)}
          <div class="ayah-actions">
            <button id="okBtn" class="chip-btn memorize">✓ تمت المراجعة بإتقان</button>
            <button id="forgotBtn" class="chip-btn ghost">↺ احتجت لإعادة الحفظ</button>
          </div>
        </div>
      `;
      bindRepCounter(container, id, kind, () => openReviewSession(id));
      document.getElementById("okBtn").addEventListener("click", () => {
        SRS.completeReview(id);
        RepCounter.reset(id, kind);
        toast("أُحسنت! تم جدولة المراجعة القادمة");
        navTo("review");
      });
      document.getElementById("forgotBtn").addEventListener("click", () => {
        SRS.resetToNear(id);
        RepCounter.reset(id, "near");
        toast("لا بأس، أُعيد المقطع لبداية المراجعة القريبة");
        navTo("review");
      });
    } catch (e) {
      document.getElementById("revContainer").innerHTML = errorCard(e);
    }
  }

  /* ---------------- شاشة المتشابهات ---------------- */
  function renderMutashabihatList() {
    const items = NISA_TOPICS.map(t => `
      <div class="topic-item" data-id="${t.id}">
        <div class="topic-badge">${t.id}</div>
        <div class="topic-info">
          <h3>${t.title}</h3>
          <div class="range">الآيات ${t.from}–${t.to}</div>
        </div>
        <div class="topic-progress"><span>🔀</span></div>
      </div>`).join("");

    root.innerHTML = shell(`
      <div class="ornament-frame">
        <div class="eyebrow">علم المتشابهات</div>
        <h1>متشابهات سورة النساء</h1>
        <div class="sub">تشابهها مع نفسها ومع بقية آيات القرآن</div>
      </div>
      <div class="page-wrap">
        <div class="card">
          <p>يجلب التطبيق بيانات المتشابهات من قاعدة بيانات مفتوحة مخصّصة للحفّاظ، وقد لا تكون شاملة لكل تشابه ممكن، بل تركّز على أكثر المواضع التي تُلبس على الحافظ. اختر مقطعًا لعرض متشابهاته:</p>
        </div>
        ${items}
      </div>
    `);
    root.querySelectorAll(".topic-item").forEach(el => {
      el.addEventListener("click", () => openMutashabihatSection(Number(el.dataset.id)));
    });
  }

  async function openMutashabihatSection(id) {
    const topic = NISA_TOPICS.find(t => t.id === id);
    root.innerHTML = shell(`
      <div class="ornament-frame">
        <button id="backBtn" style="position:absolute;right:14px;top:14px;background:none;border:none;color:var(--gold-light);font-size:1.3rem;">←</button>
        <div class="eyebrow">متشابهات المقطع ${id}</div>
        <h1>${topic.title}</h1>
        <div class="sub">الآيات ${topic.from}–${topic.to}</div>
      </div>
      <div class="page-wrap" id="mutContainer">
        <div class="loading"><div class="spin"></div><p>جارٍ البحث عن المتشابهات…</p></div>
      </div>
    `);
    bindBack(() => navTo("mutashabihat"));

    try {
      const { entries, nisaRange } = await QuranAPI.getMutashabihatForRange(topic.from, topic.to);
      const container = document.getElementById("mutContainer");
      if (entries.length === 0) {
        container.innerHTML = `<div class="empty-state"><span class="icon">✅</span><p>لا توجد متشابهات مسجَّلة لهذا المقطع في قاعدة البيانات المستخدمة — غالبًا آياته واضحة التمييز.</p></div>`;
        return;
      }
      // اجمع كل الأرقام المطلقة المطلوبة (مصدر + متشابهات)
      const allAbs = [];
      entries.forEach(e => {
        (Array.isArray(e.src.ayah) ? e.src.ayah : [e.src.ayah]).forEach(n => allAbs.push(n));
        e.muts.forEach(m => (Array.isArray(m.ayah) ? m.ayah : [m.ayah]).forEach(n => allAbs.push(n)));
      });
      const textMap = await QuranAPI.getAyahsByAbsoluteList(allAbs);

      const html = entries.map(e => {
        const srcNums = Array.isArray(e.src.ayah) ? e.src.ayah : [e.src.ayah];
        const srcInfo = srcNums.map(n => textMap.get(n)).filter(Boolean);
        const srcLabel = srcInfo.length ? `${srcInfo[0].surahName} : ${srcInfo.map(s => s.numberInSurah).join("-")}` : "";
        const srcText = srcInfo.map(s => s.text).join(" ");

        const mutsHtml = e.muts.map(m => {
          const mNums = Array.isArray(m.ayah) ? m.ayah : [m.ayah];
          const mInfo = mNums.map(n => textMap.get(n)).filter(Boolean);
          if (!mInfo.length) return "";
          const isSameSurah = mInfo[0].surahNumber === QuranAPI.SURAH_NO;
          const label = `${mInfo[0].surahName} : ${mInfo.map(s => s.numberInSurah).join("-")}`;
          const text = mInfo.map(s => s.text).join(" ");
          return `
            <div class="divider"></div>
            <div class="loc">${label}
              <span class="tagline">${isSameSurah ? "داخل سورة النساء" : "في سورة أخرى"}</span>
            </div>
            <div class="txt">${text}</div>`;
        }).join("");

        return `
          <div class="mutash-pair">
            <div class="loc">${srcLabel} <span class="tagline">النصّ الأصلي في هذا المقطع</span></div>
            <div class="txt">${srcText}</div>
            ${mutsHtml}
          </div>`;
      }).join("");

      container.innerHTML = html;
    } catch (e) {
      document.getElementById("mutContainer").innerHTML = errorCard(e);
    }
  }

  /* ---------------- أدوات مساعدة للعرض ---------------- */
  function shell(inner) {
    return inner;
  }
  function errorCard(e) {
    return `<div class="card"><h2>تعذّر الاتصال</h2><p>حدث خطأ أثناء جلب البيانات من الإنترنت. تحقّق من اتصالك وحاول مجددًا.</p><p style="color:#8C2F2F;font-size:.8rem">${e.message || e}</p></div>`;
  }
  function bindBack(fn) {
    const btn = document.getElementById("backBtn");
    if (btn) btn.addEventListener("click", fn || (() => navTo("topics")));
  }

  /* ---------------- الموجّه الرئيسي ---------------- */
  function render() {
    if (currentTab === "intro") {
      root.innerHTML = renderIntro();
      root.querySelectorAll("[data-sub]").forEach(btn => {
        btn.addEventListener("click", () => { introSubtab = btn.dataset.sub; render(); });
      });
    } else if (currentTab === "topics") {
      root.innerHTML = renderTopicsList();
      root.querySelectorAll(".topic-item").forEach(el => {
        el.addEventListener("click", () => renderMemorizeSection(Number(el.dataset.id)));
      });
    } else if (currentTab === "review") {
      renderReview();
    } else if (currentTab === "mutashabihat") {
      renderMutashabihatList();
    }
  }

  function init() {
    renderBottomNav();
    render();
  }

  return { init, navTo };
})();

document.addEventListener("DOMContentLoaded", App.init);
