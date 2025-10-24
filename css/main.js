/**
 * SetHubble - Main Shared Script
 * Version: 6.0
 * Описание: Этот скрипт содержит общую логику для всего сайта,
 * например, переключатель темы.
 */
document.addEventListener("DOMContentLoaded", function () {
	// --- Переключатель темы ---
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
			// Если на странице есть калькулятор и он инициализирован,
			// перерисовываем график с новыми цветами
			if (typeof window.renderSimulator === "function") {
				setTimeout(() => window.renderSimulator(), 50);
			}
		});
	}

    // --- Логика для отложенной загрузки калькулятора (только для лендинга) ---
    const simulatorNode = document.getElementById('simulator');
    if (simulatorNode && typeof initSimulator === 'function') {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                initSimulator(); // Запускаем инициализацию калькулятора
                observer.disconnect(); // Отключаемся, чтобы не делать это дважды
            }
        }, { rootMargin: "200px" });

        observer.observe(simulatorNode);
    }
});
