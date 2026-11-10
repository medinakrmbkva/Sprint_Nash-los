const STORAGE_POSTS  = 'nashlos_posts';
const STORAGE_SAVED  = 'nashlos_saved';
const SCHEMA_VERSION = 2;


const SEED = [
  { id: 1, type: 'found', title: 'Найдены беспроводные наушники', category: 'Электроника', place: 'Библиотека', price: 'Хозяин, отзовись!', description: 'Нашла наушники в чёрном кейсе возле читального зала. Передам владельцу после уточнения деталей.', author: 'Алина', contact: '@alina', date: 'Сегодня', emoji: '🎧' },
  { id: 2, type: 'rent', title: 'Учебник по математике', category: 'Учебники и конспекты', place: 'Главный корпус', price: '100 ₽ / неделя', description: 'Учебник в хорошем состоянии. Можно взять на неделю, пишите заранее.', author: 'Данияр', contact: '@daniyar', date: 'Сегодня', emoji: '📘' },
  { id: 3, type: 'lost', title: 'Потерялась связка ключей', category: 'Личные вещи', place: 'Столовая', price: 'Вознаграждение', description: 'Три ключа на синем брелоке. Возможно, оставила на столике в столовой.', author: 'Маша', contact: '@masha', date: 'Вчера', emoji: '🔑' },
  { id: 4, type: 'exchange', title: 'Обменяю конспекты по истории', category: 'Учебники и конспекты', place: 'Главный корпус', price: 'Обмен на информатику', description: 'Аккуратные конспекты за весь семестр. Ищу конспекты по информатике.', author: 'София', contact: '@sofia', date: 'Вчера', emoji: '📝' },
  { id: 5, type: 'found', title: 'Найден зелёный термос', category: 'Личные вещи', place: 'Общежитие', price: 'Бесплатно', description: 'Термос стоит у вахты общежития. Чтобы забрать, назови марку и опиши наклейку.', author: 'Тимур', contact: '@timur', date: '2 дня назад', emoji: '🍶' },
  { id: 6, type: 'rent', title: 'Калькулятор для учёбы', category: 'Электроника', place: 'Библиотека', price: '50 ₽ / день', description: 'Научный калькулятор, исправный. Подойдёт для контрольной и подготовки.', author: 'Кирилл', contact: '@kirill', date: '2 дня назад', emoji: '🧮' },
  { id: 7, type: 'lost', title: 'Потерян студенческий билет', category: 'Личные вещи', place: 'Главный корпус', price: 'Очень важно найти', description: 'Студенческий билет в прозрачном чехле. Если кто-то видел — пожалуйста, напишите.', author: 'Лейла', contact: '@leila', date: '3 дня назад', emoji: '🪪' },
  { id: 8, type: 'exchange', title: 'Отдам папку для черчения', category: 'Учебники и конспекты', place: 'Главный корпус', price: 'Обмен на блокнот', description: 'Папка формата А3, почти новая. Буду рада обменять на чистый блокнот.', author: 'Настя', contact: '@nastya', date: '3 дня назад', emoji: '📁' }
];

const LABELS = {
  lost: 'Потеряли',
  found: 'Нашли',
  rent: 'Аренда',
  exchange: 'Обмен',
  help: 'Помощь'
};

let posts = loadPosts();
let saved = loadSaved();
let activeFilter = 'all';
let searchTerm = '';
let placeFilter = 'all';
let sortMode = 'new';


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
  } catch {
    return [];
  }
}

function persistPosts(list) {
  try {
    localStorage.setItem(STORAGE_POSTS, JSON.stringify(list));
    localStorage.setItem(STORAGE_POSTS + '_v', String(SCHEMA_VERSION));
  } catch (e) {
    toast('Не удалось сохранить: возможно, превышен размер хранилища');
    console.error(e);
  }
}

function persistSaved() {
  try {
    localStorage.setItem(STORAGE_SAVED, JSON.stringify(saved));
  } catch (e) {
    console.error(e);
  }
}



function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
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
      const media = p.image
        ? `<img src="${p.image}" alt="${esc(p.title)}">`
        : (p.emoji || '📌');
      return `
        <article class="post" data-id="${p.id}">
          <div class="post-img">
            <span class="tag">${LABELS[type] || 'Объявление'}</span>
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

  document.querySelectorAll('[data-tab]').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === activeFilter));
  document.querySelectorAll('[data-category]').forEach(b =>
    b.classList.toggle('selected', b.dataset.category === activeFilter));
  document.querySelectorAll('[data-nav]').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === activeFilter));

  const heading = document.getElementById('listingHeading');
  const sub = document.getElementById('listingSub');
  if (heading) heading.textContent = activeFilter === 'all' ? 'Свежие объявления' : (LABELS[activeFilter] || 'Объявления');
  if (sub) sub.textContent = activeFilter === 'all'
    ? 'Возможно, здесь уже есть то, что ты ищешь'
    : 'Объявления из выбранного раздела';

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
  const si = document.getElementById('searchInput');
  const sp = document.getElementById('searchPlace');
  const sc = document.getElementById('searchCategory');
  if (si) si.value = '';
  if (sp) sp.value = 'all';
  if (sc) sc.value = 'all';
  render();
}

function toggleSave(id) {
  saved = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
  persistSaved();
  render();
  toast(saved.includes(id) ? 'Добавлено в избранное' : 'Удалено из избранного');
}



function openModal(id) {
  document.getElementById(id)?.classList.add('show');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('show');
}

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

  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <div class="modal-head">
      <h2>Объявление</h2>
      <button class="close" data-close="detailModal">×</button>
    </div>
    ${media}
    <span class="eyebrow">${LABELS[type] || 'Объявление'}</span>
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
      navigator.clipboard?.writeText(p.contact)
        .then(() => toast('Контакт скопирован'))
        .catch(() => toast('Контакт: ' + p.contact));
    } else {
      toast('Автор не указал контакт');
    }
  });
}

function showHelp(title = 'Помощь и правила') {
  document.getElementById('helpTitle').textContent = title;
  document.getElementById('helpBody').innerHTML = `
    <p><strong>«Нашлось!»</strong> — студенческая доска объявлений для поиска потерянных вещей, публикации находок, аренды и обмена учебными материалами.</p>
    <p><strong>1. Будь внимателен.</strong> Не публикуй пароли и чужие контакты без разрешения.</p>
    <p><strong>2. Проверяй владельца.</strong> Проси описать отличительные признаки вещи.</p>
    <p><strong>3. Общайся уважительно.</strong> Договаривайся о встрече в общественном месте кампуса.</p>
    <p><strong>4. Это учебный прототип.</strong> Объявления сохраняются только в этом браузере.</p>
  `;
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
      ? arr.map(p => `<p><strong>${esc(p.title)}</strong><br><span style="color:var(--muted)">${LABELS[normalizeType(p.type)] || ''} · ${esc(p.place)} · ${esc(p.price || '')}</span></p>`).join('')
      : '<p>Пока нет сохранённых объявлений. Нажми ♡ на карточке, чтобы добавить её сюда.</p>';
  } else if (which === 'myPosts') {
    title.textContent = 'Мои объявления';
    body.innerHTML = '<p>В прототипе авторство хранится локально. Здесь будут отображаться объявления, созданные с этого устройства.</p>';
  } else if (which === 'help') {
    showHelp();
    return;
  } else {
    title.textContent = 'Мой профиль';
    body.innerHTML = `
      <p>Привет! Это твой локальный профиль в прототипе «Нашлось!».</p>
      <p>Здесь можно смотреть избранное и свои объявления.</p>
      <p><strong>Роль:</strong> студент</p>
      <p><strong>Избранных:</strong> ${saved.length}</p>
    `;
  }
  openModal('profileModal');
}



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
    emoji: type === 'lost' ? '🔎' : type === 'found' ? '✅' : type === 'rent' ? '📚' : '🔁'
  };

  posts.unshift(post);
  persistPosts(posts);
  e.target.reset();
  notice.textContent = '';
  notice.classList.remove('error');
  closeModal('createModal');
  resetFilters();
  toast('Объявление опубликовано');
}


document.addEventListener('DOMContentLoaded', () => {
  
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.addEventListener('click', () => setFilter(b.dataset.nav));
  });


  document.querySelectorAll('[data-tab]').forEach(b => {
    b.addEventListener('click', () => setFilter(b.dataset.tab));
  });

 
  document.querySelectorAll('[data-category]').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.category === 'help') { showHelp(); return; }
      setFilter(b.dataset.category);
    });
  });

  
  document.getElementById('allCategories')?.addEventListener('click', () => setFilter('all'));

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


  document.getElementById('sortSelect')?.addEventListener('change', e => {
    sortMode = e.target.value;
    render();
  });


  ['openAddTop', 'openAddHero', 'openAddFeed', 'sideCreate'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => openCreate());
  });


  document.getElementById('rulesBtn')?.addEventListener('click', () => showHelp('Правила сервиса'));
  document.getElementById('footerRules')?.addEventListener('click', () => showHelp('Правила сервиса'));
  document.getElementById('footerHelp')?.addEventListener('click', () => showHelp());
  document.getElementById('footerAbout')?.addEventListener('click', () => showHelp('О проекте'));


  document.getElementById('savedTop')?.addEventListener('click', () => showProfile('saved'));
  document.getElementById('profileBtn')?.addEventListener('click', () =>
    document.getElementById('profileMenu')?.classList.toggle('open'));
  document.querySelectorAll('[data-profile]').forEach(b =>
    b.addEventListener('click', () => showProfile(b.dataset.profile)));

  
  document.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', () => closeModal(b.dataset.close)));
  document.querySelectorAll('.modal-back').forEach(m =>
    m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-back.show').forEach(m => closeModal(m.id));
      document.getElementById('profileMenu')?.classList.remove('open');
    }
  });


  document.getElementById('createForm')?.addEventListener('submit', handleCreate);

 
  render();
});