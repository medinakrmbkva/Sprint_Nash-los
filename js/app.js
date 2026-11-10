/* =========================================================
   Нашлось! — app.js
   ========================================================= */

const STORAGE_POSTS  = 'nashlos_posts';
const STORAGE_SAVED  = 'nashlos_saved';
const SCHEMA_VERSION = 4; // Версия увеличилась, чтобы сбросить старые данные

/* ---------- Правильные seed-данные ---------- */
const SEED = [
  { id: 1, type: 'lost', title: 'Потерялись беспроводные наушники', category: 'Электроника', place: 'Библиотека', price: 'Хозяин, отзовись!', description: 'Белый футляр, кажется, оставила в библиотеке после второй пары.', author: 'Алина', contact: '@alina', date: 'Сегодня', emoji: '🎧' },
  { id: 2, type: 'rent', title: 'Сдам учебник по математике', category: 'Учебники и конспекты', place: 'Главный корпус', price: '100 ₽ / неделя', description: 'Учебник в хорошем состоянии. Можно взять на неделю.', author: 'Данияр', contact: '@daniyar', date: 'Сегодня', emoji: '📘' },
  { id: 3, type: 'lost', title: 'Найдена синяя флешка', category: 'Электроника', place: 'Главный корпус', price: 'Бесплатно', description: 'Нашла возле кабинета информатики. Напишите, если ваша.', author: 'Соня', contact: '@sonya', date: 'Вчера', emoji: '💾' },
  { id: 4, type: 'rent', title: 'Учебник по истории в аренду', category: 'Учебники и конспекты', place: 'Библиотека', price: '50 ₽ / месяц', description: 'На месяц или на пару недель. Обложка немного помята.', author: 'Миша', contact: '@misha', date: 'Вчера', emoji: '📚' },
  { id: 5, type: 'found', title: 'Кто забыл зелёный зонт?', category: 'Личные вещи', place: 'Столовая', price: 'Вознаграждение', description: 'Остался после занятий в аудитории. Передам владельцу.', author: 'Лера', contact: '@lera', date: 'Вчера', emoji: '☂️' },
  { id: 6, type: 'exchange', title: 'Обменяю конспект по биологии', category: 'Учебники и конспекты', place: 'Главный корпус', price: 'Обмен', description: 'Аккуратный конспект за последний раздел.', author: 'Настя', contact: '@nastya', date: '2 дня назад', emoji: '📝' }
];

const LABELS = {
  lost: 'ПОТЕРЯШКИ',
  found: 'НАЙДЕНО',
  rent: 'АРЕНДА',
  exchange: 'ОБМЕН',
  help: 'ПОМОЩЬ'
};

let posts = loadPosts();
let saved = loadSaved();
let activeFilter = 'all';
let searchTerm = '';
let placeFilter = 'all';
let sortMode = 'new';

/* =========================================================
   ХРАНИЛИЩЕ
   ========================================================= */
function loadPosts() {
  try {
    const version = Number(localStorage.getItem(STORAGE_POSTS + '_v') || 0);
    const raw = localStorage.getItem(STORAGE_POSTS);
    if (!raw || version !== SCHEMA_VERSION) {
      const fresh = SEED.map(p => ({ ...p }));
      persistPosts(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const fresh = SEED.map(p => ({ ...p }));
      persistPosts(fresh);
      return fresh;
    }
    return parsed;
  } catch {
    const fresh = SEED.map(p => ({ ...p }));
    persistPosts(fresh);
    return fresh;
  }
}

function loadSaved() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_SAVED) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function persistPosts(list) {
  try {
    localStorage.setItem(STORAGE_POSTS, JSON.stringify(list));
    localStorage.setItem(STORAGE_POSTS + '_v', String(SCHEMA_VERSION));
  } catch (e) {
    toast('Ошибка сохранения: фото слишком большое!');
  }
}

function persistSaved() {
  try { localStorage.setItem(STORAGE_SAVED, JSON.stringify(saved)); } catch (e) {}
}

/* =========================================================
   УТИЛИТЫ
   ========================================================= */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function normalizeType(t) {
  const v = String(t ?? '').toLowerCase().trim();
  if (v === 'lost' || v === 'потерял' || v === 'потеряшки') return 'lost';
  if (v === 'found' || v === 'нашёл' || v === 'нашел') return 'found';
  if (v === 'rent' || v === 'аренда') return 'rent';
  if (v === 'exchange' || v === 'обмен') return 'exchange';
  return v;
}

function priceNum(s) {
  const n = String(s).match(/\d+/);
  return n ? Number(n[0]) : 999999;
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* =========================================================
   РЕНДЕР СПИСКА
   ========================================================= */
function render() {
  const box = document.getElementById('cards');
  if (!box) return;

  let list = posts.filter(p => {
    const type = normalizeType(p.type);
    const matchFilter = activeFilter === 'all' || type === activeFilter;
    const matchPlace = placeFilter === 'all' || p.place === placeFilter;
    const haystack = `${p.title} ${p.description} ${p.category} ${p.place}`.toLowerCase();
    const matchSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
    return matchFilter && matchPlace && matchSearch;
  });

  if (sortMode === 'price') list.sort((a, b) => priceNum(a.price) - priceNum(b.price));
  else list.sort((a, b) => b.id - a.id);

  if (!list.length) {
    box.innerHTML = `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:10px">⌕</div>
        <strong>Пока ничего не нашлось</strong>
        <p>Попробуй изменить запрос или выбрать другой раздел.</p>
        <button class="btn secondary" id="resetFilters" style="margin-top:14px">Сбросить фильтры</button>
      </div>`;
    document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
  } else {
    box.innerHTML = list.map(p => {
      const type = normalizeType(p.type);
      const isSaved = saved.includes(p.id);
      // Показываем фото (base64), если оно есть. Иначе эмодзи.
      const media = p.image
        ? `<img src="${p.image}" alt="${esc(p.title)}">`
        : (p.emoji || '📌');
      
      return `
        <article class="post" data-id="${p.id}">
          <div class="post-img">
            <span class="tag">${LABELS[type] || 'ОБЪЯВЛЕНИЕ'}</span>
            <button class="save ${isSaved ? 'saved' : ''}" data-save="${p.id}" title="В избранное">${isSaved ? '♥' : '♡'}</button>
            ${media}
          </div>
          <div class="postbody">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
            <div class="postmeta">
              <span class="price">${esc(p.price || 'Договорная')}</span>
              <span class="owner">
                <span class="owner-avatar">${esc((p.author || '?')[0].toUpperCase())}</span>
                ${esc(p.author || 'Студент')}
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    box.querySelectorAll('.post').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-save]')) return;
        openDetail(Number(el.dataset.id));
      });
    });
    box.querySelectorAll('[data-save]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleSave(Number(btn.dataset.save));
      });
    });
  }

  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === activeFilter));
  document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('selected', b.dataset.category === activeFilter));
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === activeFilter));

  const heading = document.getElementById('listingHeading');
  const sub = document.getElementById('listingSub');
  if (heading) heading.textContent = activeFilter === 'all' ? 'Свежие объявления' : (LABELS[activeFilter] || 'Объявления');
  if (sub) sub.textContent = activeFilter === 'all' ? 'Возможно, здесь уже есть то, что ты ищешь' : 'Объявления из выбранного раздела';

  const stat = document.getElementById('statPosts');
  if (stat) stat.textContent = posts.length + 120;

  const badge = document.getElementById('savedBadge');
  if (badge) {
    badge.textContent = String(saved.length);
    badge.classList.toggle('show', saved.length > 0);
  }
}

function setFilter(filter) {
  activeFilter = filter;
  render();
  document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetFilters() {
  activeFilter = 'all';
  searchTerm = '';
  placeFilter = 'all';
  if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
  if (document.getElementById('searchPlace')) document.getElementById('searchPlace').value = 'all';
  if (document.getElementById('searchCategory')) document.getElementById('searchCategory').value = 'all';
  render();
}

function toggleSave(id) {
  saved = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
  persistSaved();
  render();
  toast(saved.includes(id) ? 'Добавлено в избранное' : 'Удалено из избранного');
}

/* =========================================================
   МОДАЛКИ
   ========================================================= */
function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

function openCreate(type = 'lost') {
  const sel = document.getElementById('postType');
  if (sel) sel.value = type;
  openModal('createModal');
}

function openDetail(id) {
  const p = posts.find(x => x.id === id);
  if (!p) return;
  const type = normalizeType(p.type);
  const media = p.image
    ? `<img class="detail-img" src="${p.image}" alt="${esc(p.title)}">`
    : `<div class="detail-emoji">${p.emoji || '📌'}</div>`;

  document.getElementById('detailContent').innerHTML = `
    <div class="modal-head">
      <h2>Объявление</h2>
      <button class="close" data-close="detailModal">×</button>
    </div>
    ${media}
    <span class="eyebrow">${LABELS[type] || 'ОБЪЯВЛЕНИЕ'}</span>
    <h2 style="font-size:22px;margin:12px 0 7px">${esc(p.title)}</h2>
    <div class="detail-info">
      <span>⌖ ${esc(p.place)}</span>
      <span>◷ ${esc(p.date || 'Недавно')}</span>
      <span>Автор: ${esc(p.author || 'Студент')}</span>
    </div>
    <p class="detail-copy">${esc(p.description)}</p>
    <div class="contact-box">
      <strong>Связаться:</strong><br>
      ${esc(p.contact || 'Контакт не указан')}
    </div>
    <div class="form-actions">
      <button class="btn secondary" id="detailSave">${saved.includes(id) ? '♥ В избранном' : '♡ В избранное'}</button>
      <button class="btn primary" id="contactAuthor">Связаться</button>
    </div>
  `;
  openModal('detailModal');

  document.querySelector('[data-close="detailModal"]')?.addEventListener('click', () => closeModal('detailModal'));
  document.getElementById('detailSave')?.addEventListener('click', () => {
    toggleSave(id);
    openDetail(id);
  });
  document.getElementById('contactAuthor')?.addEventListener('click', () => {
    if (p.contact) {
      navigator.clipboard?.writeText(p.contact).then(() => toast('Контакт скопирован')).catch(() => toast('Контакт: ' + p.contact));
    } else {
      toast('Автор не указал контакт');
    }
  });
}

function showHelp(title = 'Помощь и правила') {
  document.getElementById('helpTitle').textContent = title;
  document.getElementById('helpBody').innerHTML = `<p><strong>«Нашлось!»</strong> — студенческая доска объявлений.</p><p>Учебный прототип. Объявления и фото сохраняются только в этом браузере.</p>`;
  openModal('helpModal');
}

function showProfile(which) {
  document.getElementById('profileMenu')?.classList.remove('open');
  const title = document.getElementById('profileTitle');
  const body = document.getElementById('profileBody');

  if (which === 'saved') {
    const arr = posts.filter(p => saved.includes(p.id));
    title.textContent = 'Избранные объявления';
    body.innerHTML = arr.length
      ? arr.map(p => `<p><strong>${esc(p.title)}</strong><br><span style="color:var(--muted)">${LABELS[normalizeType(p.type)] || ''} · ${esc(p.place)}</span></p>`).join('')
      : '<p>Пока нет сохранённых объявлений.</p>';
  } else if (which === 'myPosts') {
    title.textContent = 'Мои объявления';
    body.innerHTML = '<p>Здесь будут отображаться объявления, созданные с этого устройства.</p>';
  } else if (which === 'help') {
    showHelp();
    return;
  } else {
    title.textContent = 'Мой профиль';
    body.innerHTML = `<p>Это твой локальный профиль.</p><p><strong>Избранных:</strong> ${saved.length}</p>`;
  }
  openModal('profileModal');
}

/* =========================================================
   СОЗДАНИЕ (С ФОТО В BASE64)
   ========================================================= */
function handleCreate(e) {
  e.preventDefault();
  const notice = document.getElementById('formNotice');
  const fail = msg => { notice.textContent = msg; notice.classList.add('error'); };

  const title = document.getElementById('postTitle').value.trim();
  const description = document.getElementById('postDescription').value.trim();
  const author = document.getElementById('postAuthor').value.trim();

  if (!title || !description || !author) {
    return fail('Заполните обязательные поля: название, описание, имя.');
  }

  const type = document.getElementById('postType').value;
  const file = document.getElementById('postPhoto')?.files[0];

  // Проверка размера (LocalStorage переполняется огромными фото)
  if (file && file.size > 900 * 1024) {
    return fail('Файл слишком большой (максимум ~900 КБ).');
  }

  const addPost = (imageData) => {
    const post = {
      id: Date.now(),
      type,
      title,
      category: document.getElementById('postCategory').value,
      place: document.getElementById('postPlace').value,
      price: document.getElementById('postPrice').value.trim() || 'Договорная',
      description,
      author,
      contact: document.getElementById('postContact').value.trim(),
      date: 'Только что',
      image: imageData, // ТУТ ХРАНИТСЯ BASE64 СТРОКА
      emoji: type === 'lost' ? '🔎' : type === 'found' ? '✅' : type === 'rent' ? '📚' : '🔁'
    };

    posts.unshift(post);
    persistPosts(posts);
    e.target.reset();
    notice.textContent = '';
    notice.classList.remove('error');
    closeModal('createModal');
    resetFilters();
    toast('Объявление опубликовано!');
  };

  // Если пользователь прикрепил фото
  if (file) {
    const reader = new FileReader();
    reader.onload = () => addPost(reader.result); // reader.result — это Base64
    reader.onerror = () => fail('Ошибка чтения изображения');
    reader.readAsDataURL(file);
  } else {
    addPost(null);
  }
}

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */
/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Навигация в шапке
  document.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.nav)));
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.tab)));
  document.querySelectorAll('[data-category]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.category === 'help') { showHelp(); return; }
    setFilter(b.dataset.category);
  }));

  document.getElementById('allCategories')?.addEventListener('click', () => setFilter('all'));

  // ИСПРАВЛЕНИЕ: Кнопка "Смотреть объявления ↓"
  document.getElementById('scrollToFeed')?.addEventListener('click', () => {
    document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Поиск
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    searchTerm = document.getElementById('searchInput').value.trim();
    activeFilter = document.getElementById('searchCategory').value;
    placeFilter = document.getElementById('searchPlace').value;
    render();
    document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' });
  });
  
  document.getElementById('searchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('searchBtn')?.click();
  });

  // Сортировка
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    sortMode = e.target.value;
    render();
  });

  // Кнопки открытия формы создания
  ['openAddTop', 'openAddHero', 'openAddFeed', 'sideCreate'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => openCreate());
  });

  // Помощь
  document.getElementById('rulesBtn')?.addEventListener('click', () => showHelp('Правила'));
  document.getElementById('footerRules')?.addEventListener('click', () => showHelp('Правила'));
  document.getElementById('footerHelp')?.addEventListener('click', () => showHelp());
  document.getElementById('footerAbout')?.addEventListener('click', () => showHelp('О проекте'));

  // Профиль
  document.getElementById('savedTop')?.addEventListener('click', () => showProfile('saved'));
  document.getElementById('profileBtn')?.addEventListener('click', () => document.getElementById('profileMenu')?.classList.toggle('open'));
  document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => showProfile(b.dataset.profile)));

  // Закрытие модалок
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  document.querySelectorAll('.modal-back').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-back.show').forEach(m => closeModal(m.id));
      document.getElementById('profileMenu')?.classList.remove('open');
    }
  });

  // Форма создания
  document.getElementById('createForm')?.addEventListener('submit', handleCreate);
  
  // Первый рендер карточек
  render();
});