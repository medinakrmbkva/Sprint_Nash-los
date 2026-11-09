/* ============================================================
   «Нашлось!» — логика приложения
   MVP: 12 SP · frontend-only · LocalStorage + FileReader/Base64
   ============================================================ */

const STORAGE_POSTS   = 'nashlos_posts';
const STORAGE_NAME    = 'nashlos_name';
const STORAGE_PALETTE = 'nashlos_palette';
const MAX_FILE_SIZE   = 900 * 1024; // ~900 КБ (BUG-02)

/* ---------- Стартовые данные ---------- */
const seed = [
  { id: 1, title: 'Потерялись беспроводные наушники', description: 'Белый футляр, кажется, оставила в библиотеке после второй пары. Буду благодарна за помощь!', category: 'lost', contact: 'Алина · @alina', emoji: '🎧', date: 'Сегодня' },
  { id: 2, title: 'Сдам учебник по математике', description: 'Учебник в хорошем состоянии. Можно взять на неделю, договоримся после занятий.', category: 'rent', contact: 'Даня · кабинет 214', emoji: '📘', date: 'Сегодня' },
  { id: 3, title: 'Найдена синяя флешка', description: 'Нашла возле кабинета информатики. Напишите, если ваша — уточню детали.', category: 'lost', contact: 'Соня · @sonya', emoji: '💾', date: 'Вчера' },
  { id: 4, title: 'Учебник по истории в аренду', description: 'На месяц или на пару недель. Обложка немного помята, внутри всё целое.', category: 'rent', contact: 'Миша · @misha', emoji: '📚', date: 'Вчера' },
  { id: 5, title: 'Кто забыл зелёный зонт?', description: 'Остался после занятий в аудитории. Передам владельцу на перемене.', category: 'lost', contact: 'Лера · кабинет 108', emoji: '☂️', date: 'Вчера' },
  { id: 6, title: 'Отдам конспект по биологии', description: 'Аккуратный конспект за последний раздел. Можно сфотографировать или переписать.', category: 'rent', contact: 'Настя · @nastya', emoji: '📝', date: '2 дня назад' }
];

/* ---------- Палитры ---------- */
const palettes = {
  violet: { bg:'#100d1c', surface:'#1b1730', ink:'#f5f2ff', muted:'#aaa2c5', primary:'#a855ff', primary2:'#d36bff', accent:'#00e5ef', soft:'#2a2145', soft2:'#183a43', line:'#393052' },
  lime:   { bg:'#0e1717', surface:'#182625', ink:'#f2fff8', muted:'#9db9ad', primary:'#b8ff38', primary2:'#00e6a8', accent:'#00e6a8', soft:'#263d32', soft2:'#1e4038', line:'#345148' },
  cyber:  { bg:'#101222', surface:'#1b1d35', ink:'#f5f4ff', muted:'#aaa9c9', primary:'#00e5ef', primary2:'#a855ff', accent:'#ff4fd8', soft:'#252b4b', soft2:'#392448', line:'#393b60' },
  ultra:  { bg:'#141020', surface:'#211832', ink:'#fff4ff', muted:'#b9a9c6', primary:'#8d5bff', primary2:'#ff4fd8', accent:'#b8ff38', soft:'#322247', soft2:'#422044', line:'#49365b' }
};

/* ---------- Состояние ---------- */
let posts = loadPosts();
let activeFilter = 'all';
let submitting = false;

/* ============================================================
   Хранилище
   ============================================================ */
function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_POSTS);
    if (!raw) return [...seed];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...seed];
  } catch {
    return [...seed];
  }
}

function savePosts() {
  try {
    localStorage.setItem(STORAGE_POSTS, JSON.stringify(posts));
  } catch (e) {
    alert('Не удалось сохранить: возможно, превышен размер LocalStorage. Попробуйте меньшее фото.');
    console.error(e);
  }
}

/* ============================================================
   Имя пользователя (FR-01)
   ============================================================ */
function loadUserName() {
  return localStorage.getItem(STORAGE_NAME) || '';
}

function saveUserName(name) {
  localStorage.setItem(STORAGE_NAME, name);
}

function updateUserLabel() {
  const el = document.getElementById('userLabel');
  if (!el) return;
  const name = loadUserName();
  el.textContent = name ? `Привет, ${name}!` : 'Привет, студент!';
  el.style.cursor = 'pointer';
  el.title = 'Нажмите, чтобы изменить имя';
}

function askUserName() {
  const current = loadUserName();
  const name = prompt('Как к вам обращаться?', current);
  if (name === null) return;
  const trimmed = name.trim();
  saveUserName(trimmed);
  updateUserLabel();
}

/* ============================================================
   Утилиты
   ============================================================ */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

function applyPalette(name) {
  const p = palettes[name] || palettes.violet;
  Object.entries(p).forEach(([k, v]) =>
    document.documentElement.style.setProperty('--' + k, v)
  );
  document.querySelectorAll('.palette').forEach(b =>
    b.classList.toggle('selected', b.dataset.palette === name)
  );
}

/* ============================================================
   Рендер карточек (FR-02)
   ============================================================ */
function renderPosts() {
  const box = document.getElementById('cards');
  if (!box) return;

  const q = (document.getElementById('search')?.value || '').toLowerCase().trim();

  const arr = posts.filter(p => {
    const matchFilter = activeFilter === 'all' || p.category === activeFilter;
    const haystack = `${p.title} ${p.description} ${p.contact}`.toLowerCase();
    return matchFilter && haystack.includes(q);
  });

  if (!arr.length) {
    box.innerHTML = '<div class="empty-state">Ничего не нашлось. Попробуй изменить запрос или добавь объявление ✨</div>';
    return;
  }

  box.innerHTML = arr.map(p => {
    const tag = p.category === 'lost' ? 'ПОТЕРЯШКИ' : 'АРЕНДА / ОБМЕН';
    const media = p.image
      ? `<img src="${p.image}" alt="${esc(p.title)}">`
      : (p.emoji || '📌');
    return `
      <article class="post" data-id="${p.id}">
        <div class="post-img">
          <span class="tag">${tag}</span>
          ${media}
        </div>
        <div class="postbody">
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description)}</p>
          <div class="postmeta">
            <span>${esc(p.date || 'Недавно')}</span>
            <span class="contact">Подробнее →</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  box.querySelectorAll('.post').forEach(el => {
    el.addEventListener('click', () => showDetail(Number(el.dataset.id)));
  });
}

/* ============================================================
   Фильтры (FR-06)
   ============================================================ */
function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPosts();
}

/* ============================================================
   Модальное окно (FR-05)
   ============================================================ */
function openModal(html, title) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalBack').classList.add('show');
}

function closeModal() {
  document.getElementById('modalBack').classList.remove('show');
  submitting = false;
}

/* ============================================================
   Форма добавления (FR-03)
   ============================================================ */
function openAdd() {
  openModal(`
    <form id="postForm" novalidate>
      <div class="field">
        <label>Категория</label>
        <select name="category">
          <option value="lost">Потеряшки — потерял(а) или нашёл(ла)</option>
          <option value="rent">Аренда / обмен учебных материалов</option>
        </select>
      </div>
      <div class="field">
        <label>Заголовок *</label>
        <input name="title" required maxlength="75" placeholder="Например, найден пенал">
      </div>
      <div class="field">
        <label>Описание *</label>
        <textarea name="description" required maxlength="500" placeholder="Расскажи подробнее..."></textarea>
      </div>
      <div class="field">
        <label>Контакт для связи *</label>
        <input name="contact" required placeholder="Имя, Telegram или где тебя найти">
      </div>
      <div class="field">
        <label>Фотография (необязательно)</label>
        <input type="file" name="photo" accept="image/*">
        <div class="hint">Для демонстрации лучше использовать небольшое изображение (до ~900 КБ).</div>
      </div>
      <div class="notice" id="formNotice"></div>
      <button class="btn primary" type="submit" style="width:100%;margin-top:8px">Опубликовать</button>
    </form>
  `, 'Новое объявление');

  document.getElementById('postForm').addEventListener('submit', submitPost);
}

/* ---------- Отправка формы (FR-07 / BUG-01 / BUG-03 / FR-04) ---------- */
function submitPost(e) {
  e.preventDefault();
  if (submitting) return;

  const f = e.target;
  const notice = document.getElementById('formNotice');

  const title       = f.title.value.trim();
  const description = f.description.value.trim();
  const contact     = f.contact.value.trim();

  // FR-07 / BUG-01
  if (!title || !description || !contact) {
    notice.textContent = 'Заполните все обязательные поля: заголовок, описание и контакт.';
    notice.classList.add('error');
    return;
  }

  const file = f.photo.files[0];

  // BUG-02
  if (file && file.size > MAX_FILE_SIZE) {
    notice.textContent = 'Файл слишком большой для демо (максимум около 900 КБ).';
    notice.classList.add('error');
    return;
  }

  notice.textContent = '';
  notice.classList.remove('error');
  submitting = true;

  const addPost = (imageData) => {
    posts.unshift({
      id: Date.now(),
      title,
      description,
      category: f.category.value,
      contact,
      image: imageData,
      emoji: f.category.value === 'lost' ? '🔎' : '📚',
      date: 'Только что'
    });
    savePosts();
    renderPosts();
    closeModal();
  };

  // FR-04
  if (file) {
    const reader = new FileReader();
    reader.onload = () => addPost(reader.result);
    reader.onerror = () => {
      notice.textContent = 'Не удалось прочитать изображение.';
      notice.classList.add('error');
      submitting = false;
    };
    reader.readAsDataURL(file);
  } else {
    addPost(null);
  }
}

/* ============================================================
   Просмотр карточки (FR-05)
   ============================================================ */
function showDetail(id) {
  const p = posts.find(x => x.id === id);
  if (!p) return;

  const media = p.image
    ? `<img class="detail-img" src="${p.image}" alt="${esc(p.title)}">`
    : `<div class="detail-emoji">${p.emoji || '📌'}</div>`;

  const tag = p.category === 'lost' ? 'ПОТЕРЯШКИ' : 'АРЕНДА / ОБМЕН';

  openModal(`
    ${media}
    <span class="eyebrow">${tag}</span>
    <h2 style="margin:13px 0 7px">${esc(p.title)}</h2>
    <p style="color:var(--muted)">${esc(p.description)}</p>
    <div style="background:var(--soft);padding:14px;border-radius:14px;margin-top:17px">
      <b>Связаться:</b><br>${esc(p.contact)}
    </div>
    <p class="hint">${esc(p.date || 'Недавно')}</p>
  `, 'Объявление');
}

/* ============================================================
   Инициализация
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // палитра
  const savedPalette = localStorage.getItem(STORAGE_PALETTE) || 'violet';
  applyPalette(savedPalette);

  // имя
  updateUserLabel();

  // кнопки "Разместить"
  document.getElementById('openAddTop')?.addEventListener('click', openAdd);
  document.getElementById('openAddHero')?.addEventListener('click', openAdd);
  document.getElementById('openAddFeed')?.addEventListener('click', openAdd);

  // "Смотреть объявления"
  document.getElementById('scrollToFeed')?.addEventListener('click', () => {
    document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' });
  });

  // поиск
  document.getElementById('search')?.addEventListener('input', renderPosts);

  // фильтры
  document.querySelectorAll('.filter').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter, btn));
  });

  // закрытие модалки
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('modalBack')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalBack') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // клик по имени — изменить имя
  document.getElementById('userLabel')?.addEventListener('click', askUserName);

  renderPosts();
});