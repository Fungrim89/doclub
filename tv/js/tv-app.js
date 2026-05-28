/* =========================================================================
 * Doclub.tv — shared UI helpers (header, formatting, toasts, header auth).
 * Loaded on every page after tv-api.js.
 * ========================================================================= */
(function (global) {
  "use strict";

  const api = global.DoclubAPI;

  // ---- Header markup (shared) ----
  function headerHTML(active) {
    const items = [
      { href: "index.html", key: "home", label: "Главная" },
      { href: "index.html?view=live", key: "live", label: "Сейчас в эфире" },
      { href: "index.html?view=channels", key: "channels", label: "Каналы" },
      { href: "studio.html", key: "studio", label: "Студия" },
    ];
    const nav = items
      .map(
        (i) =>
          `<a href="${i.href}" class="${
            active === i.key ? "is-active" : ""
          }">${i.label}</a>`
      )
      .join("");

    const user = api.auth.user;
    const right = user
      ? `
        <a href="studio.html" class="btn btn--ghost btn--sm">Студия</a>
        <button class="btn btn--sm" data-action="logout">
          <span class="header__avatar" style="background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-right:6px;">${(
            user.full_name || "U"
          )
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)}</span>
          ${user.full_name || "Профиль"}
        </button>
      `
      : `
        <a href="login.html" class="btn btn--ghost btn--sm">Войти</a>
        <a href="login.html?intent=signup" class="btn btn--primary btn--sm">Создать аккаунт</a>
      `;

    return `
      <header class="header">
        <div class="container header__row">
          <a href="index.html" class="header__logo">
            <span class="header__logo-badge">Dc</span>
            <span>Doclub<span style="color:#4f46e5">.tv</span></span>
            <span class="header__logo-tag">UGC · LIVE</span>
          </a>
          <nav class="header__nav">${nav}</nav>
          <div class="header__search">
            <input type="search" placeholder="Поиск каналов, видео, эфиров…" data-search />
          </div>
          <div class="header__actions">${right}</div>
        </div>
      </header>
    `;
  }

  function footerHTML() {
    return `
      <footer class="footer">
        <div class="container footer__row">
          <div>© Doclub.tv — платформа для врачей и фармацевтов</div>
          <div>
            <a href="../index.html">Doclub.tech</a>
            · <a href="#">Правила</a>
            · <a href="#">Соглашение</a>
            · <a href="#">Согласие на обработку ПД</a>
          </div>
        </div>
      </footer>
    `;
  }

  function mountChrome(active) {
    const headerSlot = document.querySelector("[data-header]");
    const footerSlot = document.querySelector("[data-footer]");
    if (headerSlot) headerSlot.outerHTML = headerHTML(active);
    if (footerSlot) footerSlot.outerHTML = footerHTML();

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action='logout']");
      if (!t) return;
      api.signOut();
      location.reload();
    });

    const search = document.querySelector("[data-search]");
    if (search) {
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          location.href = `index.html?q=${encodeURIComponent(search.value)}`;
        }
      });
    }
  }

  // ---- Formatting ----
  function formatViews(n) {
    if (n == null) return "—";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  }

  function formatDuration(sec) {
    if (sec == null) return "";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function formatRelative(iso) {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    const diff = Math.round((Date.now() - t) / 1000);
    const abs = Math.abs(diff);
    if (abs < 60) return diff >= 0 ? "только что" : "через мгновение";
    if (abs < 3600) {
      const m = Math.round(abs / 60);
      return diff >= 0 ? `${m} мин назад` : `через ${m} мин`;
    }
    if (abs < 86400) {
      const h = Math.round(abs / 3600);
      return diff >= 0 ? `${h} ч назад` : `через ${h} ч`;
    }
    const d = Math.round(abs / 86400);
    return diff >= 0 ? `${d} дн назад` : `через ${d} дн`;
  }

  function formatStartTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    const sameDay =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    const time = d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (sameDay) return `Сегодня · ${time}`;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) +
      ` · ${time}`;
  }

  function priceLabel(value, currency) {
    const c = { RUB: "₽", USD: "$", UZS: "сум" }[currency] || currency || "";
    return `${value}${c === "₽" ? c : " " + c}`;
  }

  function accessBadge(item) {
    const t = item.access_type;
    if (t === "free") return `<span class="badge badge--free">Бесплатно</span>`;
    if (t === "subscription") {
      const lvl = item.min_tier ? ` · L${item.min_tier.level}` : "";
      return `<span class="badge badge--premium">Подписка${lvl}</span>`;
    }
    if (t === "one_time") {
      return `<span class="badge badge--paid">${priceLabel(
        item.price,
        item.currency
      )}</span>`;
    }
    return "";
  }

  // ---- Thumbnail placeholder (deterministic gradient) ----
  function thumbBackground(seed) {
    const palettes = [
      ["#4f46e5", "#06b6d4"],
      ["#0f172a", "#4f46e5"],
      ["#0ea5e9", "#06b6d4"],
      ["#8b5cf6", "#ec4899"],
      ["#f59e0b", "#ef4444"],
      ["#10b981", "#06b6d4"],
      ["#ef4444", "#f59e0b"],
      ["#6366f1", "#a855f7"],
    ];
    let h = 0;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return palettes[h % palettes.length];
  }

  function placeholderThumb(item) {
    const [a, b] = thumbBackground(item.id + ":" + (item.title || ""));
    const initial = (item.title || "?").slice(0, 1).toUpperCase();
    return `
      <div style="position:absolute;inset:0;background:linear-gradient(135deg,${a},${b});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:42px;letter-spacing:-0.02em;">
        ${initial}
      </div>
    `;
  }

  // ---- Toast ----
  function toast(message, type = "") {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const t = document.createElement("div");
    t.className = "toast" + (type ? " toast--" + type : "");
    t.textContent = message;
    stack.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transition = "opacity 0.25s";
    }, 3000);
    setTimeout(() => t.remove(), 3300);
  }

  // ---- Cards ----
  function videoCard(v, channels) {
    const channel = (channels || []).find((c) => c.id === v.channel) || {};
    const authorInitials = (channel.name || "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return `
      <a class="card" href="watch.html?video=${v.id}">
        <div class="card__thumb">
          ${placeholderThumb(v)}
          ${accessBadge(v)}
          <div class="card__thumb-overlay">
            <div></div>
            <span class="card__thumb-duration">${formatDuration(v.duration)}</span>
          </div>
        </div>
        <div class="card__body">
          <div class="card__avatar" style="background:linear-gradient(135deg,#4f46e5,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;">${authorInitials}</div>
          <div>
            <h3 class="card__title">${v.title}</h3>
            <div class="card__author">${channel.name || ""}</div>
            <div class="card__meta">${formatViews(v.views)} просмотров · ${formatRelative(
      v.published_at
    )}</div>
          </div>
        </div>
      </a>
    `;
  }

  function broadcastCard(b, channels) {
    const channel = (channels || []).find((c) => c.id === b.channel) || {};
    const isLive = b.status === "live";
    const badge = isLive
      ? `<span class="badge badge--live">LIVE</span>`
      : `<span class="badge badge--soon">Скоро</span>`;
    const meta = isLive
      ? `${formatViews(b.viewers)} смотрят сейчас`
      : formatStartTime(b.scheduled_start);
    return `
      <a class="card" href="watch.html?broadcast=${b.id}">
        <div class="card__thumb">
          ${placeholderThumb(b)}
          ${badge}
          ${accessBadge(b)}
        </div>
        <div class="card__body">
          <div class="card__avatar" style="background:linear-gradient(135deg,#e11d48,#f59e0b);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;">${(
            channel.name || "?"
          )
            .slice(0, 2)
            .toUpperCase()}</div>
          <div>
            <h3 class="card__title">${b.title}</h3>
            <div class="card__author">${channel.name || ""}</div>
            <div class="card__meta">${meta}</div>
          </div>
        </div>
      </a>
    `;
  }

  function channelCard(c) {
    const initials = (c.name || "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return `
      <a class="channel-card" href="channel.html?id=${c.id}">
        <div class="channel-card__avatar">${initials}</div>
        <h3 class="channel-card__name">${c.name}</h3>
        <div class="channel-card__cat">${c.category?.name || ""}</div>
        <div class="channel-card__subs">${formatViews(c.subscribers)} подписчиков</div>
      </a>
    `;
  }

  // ---- Querystring ----
  function qs(name, fallback = null) {
    const u = new URL(location.href);
    return u.searchParams.get(name) || fallback;
  }

  global.DoclubUI = {
    mountChrome,
    formatViews,
    formatDuration,
    formatRelative,
    formatStartTime,
    priceLabel,
    accessBadge,
    placeholderThumb,
    toast,
    videoCard,
    broadcastCard,
    channelCard,
    qs,
  };
})(window);
