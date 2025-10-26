/**
 * SetHubble - Main Shared Script
 * Version: 8.1 (Lightbox Added)
 * Описание: Этот скрипт содержит общую логику для всего сайта:
 * тема, переключатели, якоря и лайтбокс.
 */
document.addEventListener("DOMContentLoaded", function () {
	// --- 1. Переключатель темы ---
	const themeToggle = document.getElementById("theme-toggle");
	if (themeToggle) {
		themeToggle.addEventListener("click", () => {
			const htmlEl = document.documentElement;
			if (htmlEl.classList.contains("light-theme")) {
				htmlEl.classList.remove("light-theme");
				localStorage.setItem("theme", "dark");
			} else {
				htmlEl.classList.add("light-theme");
				localStorage.setItem("theme", "light");
			}
			if (typeof window.renderSimulator === "function") {
				setTimeout(() => window.renderSimulator(), 50);
			}
		});
	}

	// --- 2. Переключатель ролей "Автор/Партнер" (в секции "Два пути к доходу") ---
	const audienceTriggers = document.querySelector(".audience-triggers");
	if (audienceTriggers) {
		audienceTriggers.addEventListener("click", (e) => {
			const trigger = e.target.closest(".audience-trigger");
			if (!trigger || trigger.classList.contains("active")) return;

			audienceTriggers.querySelector(".active")?.classList.remove("active");
			document
				.querySelector(".audience-content.active")
				?.classList.remove("active");

			trigger.classList.add("active");
			const content = document.getElementById(trigger.dataset.target);
			if (content) {
				content.classList.add("active");
			}
		});
	}

	// --- 3. Ссылки-якоря, ведущие к калькулятору ---
	const pathLinks = document.querySelectorAll(".path-link");
	const simulatorSection = document.getElementById("simulator");
	if (pathLinks.length && simulatorSection) {
		pathLinks.forEach((link) => {
			link.addEventListener("click", function (event) {
				event.preventDefault();
				// Эта функция будет определена в calculator.js
				if (typeof window.setSimulatorMode === "function") {
					window.setSimulatorMode(this.dataset.mode);
				}
				simulatorSection.scrollIntoView({ behavior: "smooth", block: "start" });
			});
		});
	}

	// --- 4. ✅ ЛОГИКА ЛАЙТБОКСА (ДОБАВЛЕНО) ---
	const lightboxTriggers = document.querySelectorAll("a.lightbox-trigger");
	if (lightboxTriggers.length > 0) {
		// Создаем HTML-элементы лайтбокса один раз
		const lightbox = document.createElement("div");
		lightbox.id = "lightbox";

		const lightboxImage = document.createElement("img");
		const closeButton = document.createElement("span");
		closeButton.id = "lightbox-close";
		closeButton.innerHTML = "&times;";

		lightbox.appendChild(lightboxImage);
		lightbox.appendChild(closeButton);
		document.body.appendChild(lightbox);

		// Функция для закрытия
		const closeLightbox = () => {
			lightbox.classList.remove("active");
		};

		// Навешиваем слушатели на все картинки-триггеры
		lightboxTriggers.forEach((trigger) => {
			trigger.addEventListener("click", function (e) {
				e.preventDefault(); // Отменяем стандартный переход по ссылке
				lightboxImage.src = this.href; // Устанавливаем src для большой картинки
				lightbox.classList.add("active"); // Показываем лайтбокс
			});
		});

		// Закрытие по клику на фон, крестик или клавишу Escape
		closeButton.addEventListener("click", closeLightbox);
		lightbox.addEventListener("click", (e) => {
			if (e.target === e.currentTarget) {
				// Клик именно по фону, а не по картинке
				closeLightbox();
			}
		});
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				closeLightbox();
			}
		});
	}
});
