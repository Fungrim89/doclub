/* =========================================================================
 * Doclub.tv — API client
 *
 * Talks to the Django videohosting REST API (see urls.py / views.py in the
 * doclub-tv backend).  When the backend is unreachable or the user is not
 * authenticated, the client returns deterministic mock data so the UI is
 * always usable for demo / preview.
 *
 *   API surface (matches src/videohosting):
 *     GET    /api/videohosting/channels/
 *     POST   /api/videohosting/channels/
 *     GET    /api/videohosting/channels/{id}/
 *     PATCH  /api/videohosting/channels/{id}/
 *     GET    /api/videohosting/channels/{id}/videos/
 *     POST   /api/videohosting/channels/{id}/videos/
 *
 *   Endpoints added by the new business spec (broadcasts, tiers, posts,
 *   feed, live rail, premium grants).  They follow the same shape and are
 *   already implied by the new models (Broadcast, AccessTier, Subscription,
 *   Post) in `videohosting/models.py`.
 * ========================================================================= */
(function (global) {
  "use strict";

  // ---- Configuration ----
  const API_BASE = (function () {
    try {
      const stored = localStorage.getItem("doclub.tv:apiBase");
      if (stored) return stored.replace(/\/+$/, "");
    } catch (_) {}
    return "/api/videohosting";
  })();

  const TOKEN_KEY = "doclub.tv:token";
  const USER_KEY = "doclub.tv:user";

  // ---- Auth state ----
  const auth = {
    get token() {
      try {
        return localStorage.getItem(TOKEN_KEY) || "";
      } catch (_) {
        return "";
      }
    },
    get user() {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    },
    get isAuthenticated() {
      return Boolean(this.user);
    },
    signIn(user, token) {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        if (token) localStorage.setItem(TOKEN_KEY, token);
      } catch (_) {}
    },
    signOut() {
      try {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } catch (_) {}
    },
  };

  // ---- HTTP helper with mock fallback ----
  async function request(path, { method = "GET", body, signal } = {}) {
    const url = API_BASE + path;
    const headers = { Accept: "application/json" };
    if (body && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (auth.token) headers["Authorization"] = "Bearer " + auth.token;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body:
          body && !(body instanceof FormData) ? JSON.stringify(body) : body,
        signal,
        credentials: "include",
      });
      if (!res.ok) {
        const err = new Error("HTTP " + res.status);
        err.status = res.status;
        try {
          err.body = await res.json();
        } catch (_) {}
        throw err;
      }
      if (res.status === 204) return null;
      return res.json();
    } catch (e) {
      // Network failure or backend not running — fall through to mock.
      throw e;
    }
  }

  // ---- Mock dataset ----
  // Carefully shaped to mirror the Django serializers (Channel, Video,
  // Broadcast, Post, AccessTier, Subscription).
  const mock = (function () {
    const channels = [
      {
        id: 1,
        owner: 101,
        slug: "cardiocast",
        name: "CardioCast",
        description:
          "Канал д-ра Виноградовой: разборы клинических случаев, новинки кардиологии, прямые эфиры с экспертами.",
        avatar: null,
        banner: null,
        category: { id: 1, name: "Кардиология", slug: "cardiology" },
        subscribers: 12450,
        owner_user: {
          id: 101,
          full_name: "Анна Виноградова, к.м.н.",
          handle: "anna_vino",
        },
      },
      {
        id: 2,
        owner: 102,
        slug: "neuropulse",
        name: "Neuropulse",
        description:
          "Современная неврология для практикующих врачей. Еженедельные стримы по нейровизуализации.",
        avatar: null,
        banner: null,
        category: { id: 2, name: "Неврология", slug: "neurology" },
        subscribers: 9870,
        owner_user: {
          id: 102,
          full_name: "Михаил Орлов",
          handle: "m_orlov_md",
        },
      },
      {
        id: 3,
        owner: 103,
        slug: "pharmlab",
        name: "PharmLab",
        description:
          "Фармакология и клинические рекомендации без воды. Подходит для фармацевтов и врачей-интернистов.",
        avatar: null,
        banner: null,
        category: { id: 3, name: "Фармакология", slug: "pharmacology" },
        subscribers: 7320,
        owner_user: {
          id: 103,
          full_name: "Дина Хасанова",
          handle: "pharmlab",
        },
      },
      {
        id: 4,
        owner: 104,
        slug: "endolive",
        name: "EndoLive",
        description:
          "Эндокринология в практике: щитовидка, диабет, репродуктивная эндокринология. Q&A с подписчиками.",
        avatar: null,
        banner: null,
        category: { id: 4, name: "Эндокринология", slug: "endo" },
        subscribers: 5410,
        owner_user: {
          id: 104,
          full_name: "Елена Шаповалова",
          handle: "endolive",
        },
      },
      {
        id: 5,
        owner: 105,
        slug: "pediatrium",
        name: "Pediatrium",
        description:
          "Педиатрия от классики до доказательной медицины. Регулярные клинические разборы.",
        avatar: null,
        banner: null,
        category: { id: 5, name: "Педиатрия", slug: "pediatrics" },
        subscribers: 8120,
        owner_user: {
          id: 105,
          full_name: "Татьяна Лебедева",
          handle: "pediatrium",
        },
      },
      {
        id: 6,
        owner: 106,
        slug: "oncoreview",
        name: "OncoReview",
        description:
          "Онкология: персонализированная терапия, иммунотерапия, обзоры исследований ASCO и ESMO.",
        avatar: null,
        banner: null,
        category: { id: 6, name: "Онкология", slug: "onco" },
        subscribers: 14210,
        owner_user: {
          id: 106,
          full_name: "Игорь Селезнев, д.м.н.",
          handle: "oncoreview",
        },
      },
    ];

    const broadcasts = [
      {
        id: 11,
        channel: 1,
        title: "Острая декомпенсация ХСН: алгоритм первых 24 часов",
        description:
          "Прямой разбор клинического случая. Зрители смогут задать вопросы в чате.",
        cover: null,
        status: "live",
        scheduled_start: nowOffsetISO(-15 * 60),
        actual_start: nowOffsetISO(-15 * 60),
        actual_end: null,
        viewers: 412,
        access_type: "free",
        rtmp_server_url: "rtmps://live.video.cloud.yandex.net/input",
        category: { id: 1, name: "Кардиология" },
      },
      {
        id: 12,
        channel: 2,
        title: "МРТ при рассеянном склерозе: новые критерии",
        description:
          "Разбор протоколов и сравнение с актуальными рекомендациями.",
        cover: null,
        status: "live",
        scheduled_start: nowOffsetISO(-32 * 60),
        actual_start: nowOffsetISO(-32 * 60),
        actual_end: null,
        viewers: 287,
        access_type: "subscription",
        min_tier: { level: 1, name: "Базовый" },
        category: { id: 2, name: "Неврология" },
      },
      {
        id: 13,
        channel: 6,
        title: "ASCO 2026: дайджест ключевых исследований",
        description: "Что меняется в клинической практике уже завтра.",
        cover: null,
        status: "scheduled",
        scheduled_start: nowOffsetISO(2 * 3600),
        actual_start: null,
        actual_end: null,
        viewers: 0,
        access_type: "free",
        category: { id: 6, name: "Онкология" },
      },
      {
        id: 14,
        channel: 4,
        title: "Гипотиреоз у пожилых: типичные ошибки",
        description: "Сегодня в 19:00 МСК — прямой эфир с Q&A.",
        cover: null,
        status: "scheduled",
        scheduled_start: nowOffsetISO(4 * 3600),
        actual_start: null,
        actual_end: null,
        viewers: 0,
        access_type: "free",
        category: { id: 4, name: "Эндокринология" },
      },
      {
        id: 15,
        channel: 5,
        title: "Лихорадка у ребёнка: разбор скорой помощи",
        description: "Реальные кейсы из приёмного покоя.",
        cover: null,
        status: "scheduled",
        scheduled_start: nowOffsetISO(8 * 3600),
        actual_start: null,
        actual_end: null,
        viewers: 0,
        access_type: "subscription",
        min_tier: { level: 2, name: "Premium" },
        category: { id: 5, name: "Педиатрия" },
      },
    ];

    const videos = [
      {
        id: 101,
        channel: 1,
        title: "Антикоагуляция при ФП: разбор обновленных рекомендаций",
        description:
          "Полный разбор обновлённых рекомендаций ESC по антикоагуляции у пациентов с ФП. С практическими алгоритмами и клиническими кейсами.",
        thumbnail: null,
        duration: 1860,
        access_type: "free",
        is_published: true,
        views: 8421,
        published_at: nowOffsetISO(-2 * 86400),
        category: { id: 1, name: "Кардиология" },
      },
      {
        id: 102,
        channel: 1,
        title: "ЭКГ-разбор: блокады ножек пучка Гиса",
        description: "Учимся читать ЭКГ при широких комплексах QRS.",
        thumbnail: null,
        duration: 1240,
        access_type: "subscription",
        min_tier: { level: 1, name: "Базовый" },
        is_published: true,
        views: 5120,
        published_at: nowOffsetISO(-5 * 86400),
        category: { id: 1, name: "Кардиология" },
      },
      {
        id: 103,
        channel: 2,
        title: "Болезнь Паркинсона: ранняя диагностика",
        description: "Что должен знать терапевт о ранних признаках.",
        thumbnail: null,
        duration: 2240,
        access_type: "free",
        is_published: true,
        views: 3210,
        published_at: nowOffsetISO(-1 * 86400),
        category: { id: 2, name: "Неврология" },
      },
      {
        id: 104,
        channel: 3,
        title: "Антибиотикорезистентность: что назначать в 2026",
        description: "Обзор актуальных схем.",
        thumbnail: null,
        duration: 1620,
        access_type: "free",
        is_published: true,
        views: 11340,
        published_at: nowOffsetISO(-7 * 86400),
        category: { id: 3, name: "Фармакология" },
      },
      {
        id: 105,
        channel: 4,
        title: "Диабет 2 типа: персонализация терапии",
        description: "Алгоритмы выбора препарата.",
        thumbnail: null,
        duration: 1980,
        access_type: "subscription",
        min_tier: { level: 1, name: "Базовый" },
        is_published: true,
        views: 4870,
        published_at: nowOffsetISO(-3 * 86400),
        category: { id: 4, name: "Эндокринология" },
      },
      {
        id: 106,
        channel: 5,
        title: "Вакцинация: разбор отказов и сомнений",
        description: "Как говорить с родителями.",
        thumbnail: null,
        duration: 1450,
        access_type: "free",
        is_published: true,
        views: 6780,
        published_at: nowOffsetISO(-6 * 86400),
        category: { id: 5, name: "Педиатрия" },
      },
      {
        id: 107,
        channel: 6,
        title: "Иммунотерапия меланомы: 5 ключевых исследований",
        description: "Что изменилось за последний год.",
        thumbnail: null,
        duration: 2510,
        access_type: "one_time",
        price: 990,
        currency: "RUB",
        is_published: true,
        views: 2310,
        published_at: nowOffsetISO(-4 * 86400),
        category: { id: 6, name: "Онкология" },
      },
      {
        id: 108,
        channel: 6,
        title: "Молекулярные мишени в онкологии: гид для практики",
        description: "Полный обзор актуальных таргетов.",
        thumbnail: null,
        duration: 3120,
        access_type: "subscription",
        min_tier: { level: 2, name: "Premium" },
        is_published: true,
        views: 1820,
        published_at: nowOffsetISO(-8 * 86400),
        category: { id: 6, name: "Онкология" },
      },
    ];

    const posts = [
      {
        id: 201,
        channel: 1,
        title: "Сводка по ESC Congress 2026",
        body: "Краткая выжимка ключевых сессий. Полный конспект — для подписчиков уровня Premium.",
        cover: null,
        access_type: "free",
        published_at: nowOffsetISO(-1 * 86400),
      },
      {
        id: 202,
        channel: 1,
        title: "Конспект: алгоритм при остром ИМ с подъёмом ST",
        body: "Развёрнутый PDF-конспект для подписчиков.",
        cover: null,
        access_type: "subscription",
        min_tier: { level: 2, name: "Premium" },
        published_at: nowOffsetISO(-3 * 86400),
      },
    ];

    const tiers = [
      {
        id: 301,
        channel: 1,
        level: 1,
        name: "Базовый",
        description: "Доступ к платным видео и расшифровкам.",
        price: 490,
        currency: "RUB",
        period: "month",
        perks: ["Все платные видео", "Текстовые расшифровки эфиров"],
        is_active: true,
      },
      {
        id: 302,
        channel: 1,
        level: 2,
        name: "Premium",
        description: "Базовый + клинические конспекты, чат с автором, без рекламы.",
        price: 1490,
        currency: "RUB",
        period: "month",
        perks: [
          "Всё из Базового",
          "PDF-конспекты по каждому эфиру",
          "Закрытый чат с автором",
          "Стримы для подписчиков Premium",
        ],
        is_active: true,
      },
      {
        id: 303,
        channel: 1,
        level: 3,
        name: "Pro",
        description: "Все материалы + индивидуальные разборы кейсов раз в месяц.",
        price: 3990,
        currency: "RUB",
        period: "month",
        perks: [
          "Всё из Premium",
          "1 разбор кейса в месяц 1:1",
          "Ранний доступ к видео",
        ],
        is_active: true,
      },
    ];

    return { channels, broadcasts, videos, posts, tiers };
  })();

  function nowOffsetISO(seconds) {
    return new Date(Date.now() + seconds * 1000).toISOString();
  }

  // ---- Public API ----
  const api = {
    auth,
    config: { API_BASE },

    // -- channels --
    async listChannels({ category } = {}) {
      try {
        const path = "/channels/" + (category ? `?category=${category}` : "");
        return await request(path);
      } catch (e) {
        let items = mock.channels.slice();
        if (category) items = items.filter((c) => c.category?.slug === category);
        return { count: items.length, results: items };
      }
    },

    async getChannel(idOrSlug) {
      try {
        return await request(`/channels/${idOrSlug}/`);
      } catch (e) {
        return (
          mock.channels.find(
            (c) => String(c.id) === String(idOrSlug) || c.slug === idOrSlug
          ) || mock.channels[0]
        );
      }
    },

    async createChannel(payload) {
      try {
        return await request("/channels/", { method: "POST", body: payload });
      } catch (e) {
        const created = {
          id: 9000 + Math.floor(Math.random() * 1000),
          owner: auth.user?.id || 999,
          ...payload,
          subscribers: 0,
        };
        mock.channels.push(created);
        return created;
      }
    },

    // -- videos --
    async listVideos({ channel, category, access } = {}) {
      try {
        if (channel) return await request(`/channels/${channel}/videos/`);
        return await request("/videos/");
      } catch (e) {
        let items = mock.videos.slice();
        if (channel) items = items.filter((v) => v.channel === Number(channel));
        if (category) items = items.filter((v) => v.category?.slug === category);
        if (access) items = items.filter((v) => v.access_type === access);
        return { count: items.length, results: items };
      }
    },

    async getVideo(id) {
      try {
        return await request(`/videos/${id}/`);
      } catch (e) {
        return mock.videos.find((v) => v.id === Number(id)) || mock.videos[0];
      }
    },

    async uploadVideo(channelId, payload) {
      try {
        return await request(`/channels/${channelId}/videos/`, {
          method: "POST",
          body: payload,
        });
      } catch (e) {
        const created = {
          id: 9000 + Math.floor(Math.random() * 1000),
          channel: Number(channelId),
          ...payload,
          views: 0,
          published_at: new Date().toISOString(),
        };
        mock.videos.unshift(created);
        return created;
      }
    },

    // -- broadcasts --
    async listBroadcasts({ status, channel } = {}) {
      try {
        const qs = new URLSearchParams();
        if (status) qs.set("status", status);
        if (channel) qs.set("channel", channel);
        const suffix = qs.toString() ? `?${qs}` : "";
        return await request(`/broadcasts/${suffix}`);
      } catch (e) {
        let items = mock.broadcasts.slice();
        if (status) items = items.filter((b) => b.status === status);
        if (channel) items = items.filter((b) => b.channel === Number(channel));
        return { count: items.length, results: items };
      }
    },

    async getBroadcast(id) {
      try {
        return await request(`/broadcasts/${id}/`);
      } catch (e) {
        return (
          mock.broadcasts.find((b) => b.id === Number(id)) || mock.broadcasts[0]
        );
      }
    },

    async createBroadcast(channelId, payload) {
      try {
        return await request(`/channels/${channelId}/broadcasts/`, {
          method: "POST",
          body: payload,
        });
      } catch (e) {
        const created = {
          id: 9000 + Math.floor(Math.random() * 1000),
          channel: Number(channelId),
          status: "ready",
          rtmp_server_url: "rtmps://live.video.cloud.yandex.net/input",
          stream_key: "sk_live_" + Math.random().toString(36).slice(2, 18),
          ycv_stream_id: "ycv_str_" + Math.random().toString(36).slice(2, 10),
          ...payload,
          viewers: 0,
        };
        mock.broadcasts.unshift(created);
        return created;
      }
    },

    // -- posts --
    async listPosts({ channel } = {}) {
      try {
        if (channel) return await request(`/channels/${channel}/posts/`);
        return await request("/posts/");
      } catch (e) {
        let items = mock.posts.slice();
        if (channel) items = items.filter((p) => p.channel === Number(channel));
        return { count: items.length, results: items };
      }
    },

    // -- tiers --
    async listTiers({ channel } = {}) {
      try {
        return await request(`/channels/${channel}/tiers/`);
      } catch (e) {
        const items = mock.tiers.filter((t) => t.channel === Number(channel));
        return { count: items.length, results: items };
      }
    },

    // -- subscription / paywall --
    async subscribe({ channel, tier }) {
      try {
        return await request(`/channels/${channel}/subscribe/`, {
          method: "POST",
          body: { tier },
        });
      } catch (e) {
        return {
          status: "active",
          tier,
          current_period_end: nowOffsetISO(30 * 86400),
        };
      }
    },

    // -- auth (Doclub.ID surrogate) --
    async signInWithDoclubId(profile) {
      // Real flow: redirect to Doclub.ID, then back here with a code.
      // For demo, accept the supplied profile directly.
      auth.signIn(profile, "demo." + Date.now());
      return profile;
    },

    signOut() {
      auth.signOut();
    },

    // ---- mock accessors for the UI ----
    _mock: mock,
  };

  global.DoclubAPI = api;
})(window);
