const SCHEMA_VERSION = 2;
const STORAGE_POSTS   = 'nashlos_posts';
const STORAGE_NAME    = 'nashlos_name';
const STORAGE_PALETTE = 'nashlos_palette';
const MAX_FILE_SIZE   = 900 * 1024;


const SEED = [
  { id: 1, title: 'Потерялись беспроводные наушники', description: 'Белый футляр, кажется, оставила в библиотеке после второй пары. Буду благодарна за помощь!', category: 'lost', contact: 'Алина · @alina', emoji: '🎧', date: 'Сегодня' },
  { id: 2, title: 'Сдам учебник по математике', description: 'Учебник в хорошем состоянии. Можно взять на неделю, договоримся после занятий.', category: 'rent', contact: 'Даня · кабинет 214', emoji: '📘', date: 'Сегодня' },
  { id: 3, title: 'Найдена синяя флешка', description: 'Нашла возле кабинета информатики. Напишите, если ваша — уточню детали.', category: 'lost', contact: 'Соня · @sonya', emoji: '💾', date: 'Вчера' },
  { id: 4, title: 'Учебник по истории в аренду', description: 'На месяц или на пару недель. Обложка немного помята, внутри всё целое.', category: 'rent', contact: 'Миша · @misha', emoji: '📚', date: 'Вчера' },
  { id: 5, title: 'Кто забыл зелёный зонт?', description: 'Остался после занятий в аудитории. Передам владельцу на перемене.', category: 'lost', contact: 'Лера · кабинет 108', emoji: '☂️', date: 'Вчера' },
  { id: 6, title: 'Отдам конспект по биологии', description: 'Аккуратный конспект за последний раздел. Можно сфотографировать или переписать.', category: 'rent', contact: 'Настя · @nastya', emoji: '📝', date: '2 дня назад' }
];

const palettes = {
  violet: { bg:'#100d1c', surface:'#1b1730', ink:'#f5f2ff', muted:'#aaa2c5', primary:'#a855ff', primary2:'#d36bff', accent:'#00e5ef', soft:'#2a2145', soft2:'#183a43', line:'#393052' },
  lime:   { bg:'#0e1717', surface:'#182625', ink:'#f2fff8', muted:'#9db9ad', primary:'#b8ff38', primary2:'#00e6a8', accent:'#00e6a8', soft:'#263d32', soft2:'#1e4038', line:'#345148' },
  cyber:  { bg:'#101222', surface:'#1b1d35', ink:'#f5f4ff', muted:'#aaa9c9', primary:'#00e5ef', primary2:'#a855ff', accent:'#ff4fd8', soft:'#252b4b', soft2:'#392448', line:'#393b60' },
  ultra:  { bg:'#141020', surface:'#211832', ink:'#fff4ff', muted:'#b9a9c6', primary:'#8d5bff', primary2:'#ff4fd8', accent:'#b8ff38', soft:'#322247', soft2:'#422044', line:'#49365b' }
};

let posts = loadPosts();
let activeFilter = 'all';
let submitting = false;


function loadPosts() {
  try {
    const version = Number(localStorage.getItem(STORAGE_POSTS + '_v') || 0);
    const raw = localStorage.getItem(STORAGE_POSTS);

   
    if (!raw || version !== SCHEMA_VERSION) {
      const fresh = SEED.map(p => ({ ...p }));
      persist(fresh);
      return fresh;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const fresh = SEED.map(p => ({ ...p }));
      persist(fresh);
      return fresh;
    }
    return parsed;
  } catch {
    const fresh = SEED.map(p => ({ ...p }));
    persist(fresh);
    return fresh;
  }
}

function persist(list) {
  try {
    localStorage.setItem(STORAGE_POSTS, JSON.stringify(list));
    localStorage.setItem(STORAGE_POSTS + '_v', String(SCHEMA_VERSION));
  } catch (e) {
    toast('Не удалось сохранить: возможно, превышен размер хранилища.', 'error');
    console.error(e);
  }
}

function savePosts() {
  persist(posts);
}



function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

function normalizeCategory(c) {
  const v = String(c ?? '').toLowerCase().trim();
  if (v === 'lost' || v === 'потеряшки' || v === 'потеряшка') return 'lost';
  if (v === 'rent' || v === 'аренда' || v === 'аренда / обмен') return 'rent';
  return v;
}

function categoryLabel(cat) {
  return cat === 'lost' ? 'ПОТЕРЯШКИ' : 'АРЕНДА / ОБМЕН';
}

function toast(message, type = 'ok') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = `
      position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
      background: #2a2145; color: #f5f2ff; border: 1px solid #393052;
      padding: 12px 18px; border-radius: 12px; font-weight: 700;
      box-shadow: 0 10px 30px rgba(0,0,0,.35); z-index: 50;
      opacity: 0; transition: opacity .2s; pointer-events: none;
    `;
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.borderColor = type === 'error' ? '#ff6b8a' : '#00e5ef';
  el.style.color = type === 'error' ? '#ff6b8a' : '#00e5ef';
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 2600);
}



function loadUserName() {
  return localStorage.getItem(STORAGE_NAME) || '';
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
  openModal(`
    <form id="nameForm">
      <div class="field">
        <label>Как к вам обращаться?</label>
        <input name="name" maxlength="40" value="${esc(loadUserName())}" placeholder="Например, Алина">
      </div>
      <div class="notice" id="nameNotice"></div>
      <button class="btn primary" type="submit" style="width:100%;margin-top:8px">Сохранить</button>
    </form>
  `, 'Ваше имя');

  document.getElementById('nameForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    localStorage.setItem(STORAGE_NAME, name);
    updateUserLabel();
    closeModal();
    toast('Имя сохранено');
  });
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


function renderPosts() {
  const box = document.getElementById('cards');
  if (!box) return;

  const q = (document.getElementById('search')?.value || '').toLowerCase().trim();

  const arr = posts.filter(p => {
    const cat = normalizeCategory(p.category);
    const matchFilter = activeFilter === 'all' || cat === activeFilter;
    const haystack = `${p.title} ${p.description} ${p.contact}`.toLowerCase();
    return matchFilter && haystack.includes(q);
  });

  if (!arr.length) {
    const isFiltered = activeFilter !== 'all' || q;
    box.innerHTML = `
      <div class="empty-state">
        Ничего не нашлось${isFiltered ? ' по этому фильтру или запросу' : ''}. ✨
        ${isFiltered ? '<br><button class="btn secondary" id="resetFilters" style="margin-top:14px">Сбросить фильтры</button>' : ''}
      </div>`;
    document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
    return;
  }

  box.innerHTML = arr.map(p => {
    const cat = normalizeCategory(p.category);
    const media = p.image
      ? `<img src="${p.image}" alt="${esc(p.title)}">`
      : (p.emoji || '📌');
    return `
      <article class="post" data-id="${p.id}">
        <div class="post-img">
          <span class="tag">${categoryLabel(cat)}</span>
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

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else document.querySelector(`.filter[data-filter="${filter}"]`)?.classList.add('active');
  renderPosts();
}

function resetFilters() {
  activeFilter = 'all';
  document.querySelectorAll('.filter').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === 'all')
  );
  const s = document.getElementById('search');
  if (s) s.value = '';
  renderPosts();
}


function openModal(html, title) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalBack').classList.add('show');
}

function closeModal() {
  document.getElementById('modalBack').classList.remove('show');
  submitting = false;
}



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
        <div class="hint">Лучше небольшое изображение (до ~900 КБ).</div>
      </div>
      <div class="notice" id="formNotice"></div>
      <button class="btn primary" type="submit" style="width:100%;margin-top:8px">Опубликовать</button>
    </form>
  `, 'Новое объявление');

  document.getElementById('postForm').addEventListener('submit', submitPost);
}

function submitPost(e) {
  e.preventDefault();
  if (submitting) return;

  const f = e.target;
  const notice = document.getElementById('formNotice');
  const title       = f.title.value.trim();
  const description = f.description.value.trim();
  const contact     = f.contact.value.trim();

  const fail = (msg) => {
    notice.textContent = msg;
    notice.classList.add('error');
  };

  if (!title || !description || !contact) {
    return fail('Заполните все обязательные поля: заголовок, описание и контакт.');
  }

  const file = f.photo.files[0];
  if (file && file.size > MAX_FILE_SIZE) {
    return fail('Файл слишком большой для демо (максимум около 900 КБ).');
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
    toast('Объявление опубликовано');
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => addPost(reader.result);
    reader.onerror = () => {
      fail('Не удалось прочитать изображение.');
      submitting = false;
    };
    reader.readAsDataURL(file);
  } else {
    addPost(null);
  }
}



function showDetail(id) {
  const p = posts.find(x => x.id === id);
  if (!p) return;

  const media = p.image
    ? `<img class="detail-img" src="${p.image}" alt="${esc(p.title)}">`
    : `<div class="detail-emoji">${p.emoji || '📌'}</div>`;

  const cat = normalizeCategory(p.category);

  openModal(`
    ${media}
    <span class="eyebrow">${categoryLabel(cat)}</span>
    <h2 style="margin:13px 0 7px">${esc(p.title)}</h2>
    <p style="color:var(--muted)">${esc(p.description)}</p>
    <div style="background:var(--soft);padding:14px;border-radius:14px;margin-top:17px">
      <b>Связаться:</b><br>${esc(p.contact)}
    </div>
    <p class="hint">${esc(p.date || 'Недавно')}</p>
  `, 'Объявление');
}



document.addEventListener('DOMContentLoaded', () => {
  applyPalette(localStorage.getItem(STORAGE_PALETTE) || 'violet');
  updateUserLabel();

  document.getElementById('openAddTop')?.addEventListener('click', openAdd);
  document.getElementById('openAddHero')?.addEventListener('click', openAdd);
  document.getElementById('openAddFeed')?.addEventListener('click', openAdd);

  document.getElementById('scrollToFeed')?.addEventListener('click', () => {
    document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('search')?.addEventListener('input', renderPosts);

  document.querySelectorAll('.filter').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter, btn));
  });

  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('modalBack')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalBack') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('userLabel')?.addEventListener('click', askUserName);

  renderPosts();
});