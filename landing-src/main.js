/**
 * SetHubble Landing Page - Main Script
 * Version: 5.0 (Critical, Non-blocking UI Logic)
 * Описание: Этот скрипт отвечает за базовую интерактивность,
 * которая не требует тяжелых библиотек.
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

	// --- 2. Переключатель ролей "Автор/Партнер" ---
	const audienceTriggers = document.querySelector(".audience-triggers");
	if (audienceTriggers) {
		audienceTriggers.addEventListener("click", (e) => {
			const trigger = e.target.closest(".audience-trigger");
			if (!trigger || trigger.classList.contains("active")) return;

			audienceTriggers.querySelector(".active")?.classList.remove("active");
			document.querySelector(".audience-content.active")?.classList.remove("active");
			
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
                const targetMode = this.dataset.mode;
                if (typeof window.setSimulatorMode === "function") {
                    window.setSimulatorMode(targetMode);
                }
                simulatorSection.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    // --- 4. Логика для отложенной загрузки калькулятора ---
    const simulatorNode = document.getElementById('simulator');
    if (simulatorNode) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Если функция initSimulator уже загрузилась из calculator.js
                if (typeof initSimulator === 'function') {
                    initSimulator();
                } else {
                    // Если calculator.js еще не успел загрузиться, ждем его
                    document.addEventListener('calculatorLoaded', initSimulator);
                }
                observer.disconnect(); // Отключаем, чтобы не вызывать повторно
            }
        }, { rootMargin: "200px" }); // Начинаем за 200px до появления блока

        observer.observe(simulatorNode);
    }
});
