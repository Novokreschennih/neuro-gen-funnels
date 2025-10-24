// --- ФУНКЦИЯ ДЛЯ LIGHTBOX ---
function initLightbox() {
    const triggers = document.querySelectorAll('a.lightbox-trigger');
    if (triggers.length === 0) return;

    const lightboxHTML = `
        <div id="lightbox">
            <span id="lightbox-close">&times;</span>
            <img id="lightbox-image" src="">
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);

    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeButton = document.getElementById('lightbox-close');

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        setTimeout(() => { lightboxImage.setAttribute('src', ''); }, 300);
    };

    document.addEventListener('click', function (e) {
        const trigger = e.target.closest('a.lightbox-trigger');
        if (trigger) {
            e.preventDefault();
            const imgSrc = trigger.getAttribute('href');
            lightboxImage.setAttribute('src', imgSrc);
            lightbox.classList.add('active');
        }
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') {
            closeLightbox();
        }
    });
    closeButton.addEventListener('click', closeLightbox);
}

// --- ФУНКЦИЯ ДЛЯ АНИМАЦИЙ ПРИ СКРОЛЛЕ ---
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.postlist-item, .featured-post, .latest-news, .post-content, .links-nextprev, .blog-header, .footer');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    const delay = entry.target.classList.contains('postlist-item') ? index * 100 : 0;
                    
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, delay);

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.01 // <-- ГЛАВНЫЙ ФИКС ДЛЯ СТАТЕЙ
        });
        
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        animatedElements.forEach(el => {
            el.classList.add('is-visible');
        });
    }
}

// --- ГЛАВНЫЙ ОБРАБОТЧИК: ЗАПУСКАЕМ ВСЁ ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ ---
document.addEventListener('DOMContentLoaded', function() {
    // --- ЭФФЕКТ "АВРОРА"-ФОН ---
    document.body.addEventListener('mousemove', e => {
        const { clientX, clientY } = e;
        const x = Math.round((clientX / window.innerWidth) * 100);
        const y = Math.round((clientY / window.innerHeight) * 100);
        document.documentElement.style.setProperty('--glow-x', `${x}%`);
        document.documentElement.style.setProperty('--glow-y', `${y}%`);
    });

    // Запускаем наши функции
    initLightbox();
    initScrollAnimations();
});