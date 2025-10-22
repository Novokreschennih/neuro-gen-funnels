/**
 * SetHubble Landing Page Interactive Script
 * Version: 2.7 (Final Stable)
 */
document.addEventListener("DOMContentLoaded", function () {
	function throttle(func, limit) {
		let inThrottle;
		return function () {
			const args = arguments;
			const context = this;
			if (!inThrottle) {
				func.apply(context, args);
				inThrottle = true;
				setTimeout(() => (inThrottle = false), limit);
			}
		};
	}

	// --- THEME TOGGLE LOGIC ---
	const themeToggle = document.getElementById("theme-toggle");
	if (themeToggle) {
		themeToggle.addEventListener("click", () => {
			const htmlEl = document.documentElement;
			htmlEl.classList.toggle("light-theme");
			localStorage.setItem(
				"theme",
				htmlEl.classList.contains("light-theme") ? "light" : "dark"
			);
			// Re-render chart on theme change
			if (typeof window.renderSimulator === "function") {
				setTimeout(() => window.renderSimulator(), 50);
			}
		});
	}

	// --- SCROLL REVEAL ANIMATIONS ---
	const observerOptions = {
		root: null,
		rootMargin: "0px",
		threshold: 0.1,
	};
	let chartJsLoaded = false;
	const scrollObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const el = entry.target;
				const delay = parseInt(el.dataset.delay) || 0;
				setTimeout(() => {
					el.classList.add("is-visible");
					if (el.id === "simulator" && !chartJsLoaded) {
						chartJsLoaded = true;
						const chartScript = document.createElement("script");
						chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
						chartScript.onload = () => {
							if (typeof window.renderSimulator === "function") {
								window.renderSimulator();
							}
						};
						document.body.appendChild(chartScript);
					}
				}, delay);
				observer.unobserve(el);
			}
		});
	}, observerOptions);
	document.querySelectorAll(".animate-on-scroll").forEach((el) => {
		scrollObserver.observe(el);
	});

	// --- HERO CANVAS PARTICLES (DESKTOP ONLY) ---
	if (window.matchMedia("(min-width: 769px)").matches) {
		const canvas = document.getElementById("hero-canvas");
		if (canvas) {
			const ctx = canvas.getContext("2d");
			let particles = [];
			let mouse = { x: null, y: null, radius: 150 };
			const setCanvasSize = () => {
				const header = document.querySelector(".header");
				if (header) {
					canvas.width = header.offsetWidth;
					canvas.height = header.offsetHeight;
				}
			};
			class Particle {
				constructor() {
					this.x = Math.random() * canvas.width;
					this.y = Math.random() * canvas.height;
					this.size = Math.random() * 2 + 0.5;
					this.baseX = this.x;
					this.baseY = this.y;
					this.density = Math.random() * 30 + 1;
					this.vx = (Math.random() - 0.5) * 0.5;
					this.vy = (Math.random() - 0.5) * 0.5;
					this.alpha = Math.random() * 0.5 + 0.2;
				}
				update() {
					this.x += this.vx;
					this.y += this.vy;
					if (mouse.x) {
						let dx = mouse.x - this.x;
						let dy = mouse.y - this.y;
						let distance = Math.sqrt(dx * dx + dy * dy);
						if (distance < mouse.radius) {
							let forceDirectionX = dx / distance;
							let forceDirectionY = dy / distance;
							let force = (mouse.radius - distance) / mouse.radius;
							let directionX = forceDirectionX * force * this.density;
							let directionY = forceDirectionY * force * this.density;
							this.x -= directionX * 0.1;
							this.y -= directionY * 0.1;
						}
					}
					if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
					if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
				}
				draw() {
					ctx.beginPath();
					ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
					ctx.closePath();
					ctx.fillStyle = `rgba(200, 220, 255, ${this.alpha})`;
					ctx.fill();
				}
			}
			const initParticles = () => {
				particles = [];
				const particleCount = Math.floor(
					(canvas.width * canvas.height) / 15000
				);
				for (let i = 0; i < particleCount; i++) {
					particles.push(new Particle());
				}
			};
			const connect = () => {
				for (let a = 0; a < particles.length; a++) {
					for (let b = a; b < particles.length; b++) {
						let distance =
							(particles[a].x - particles[b].x) ** 2 +
							(particles[a].y - particles[b].y) ** 2;
						if (distance < 15000) {
							let opacityValue = 1 - distance / 15000;
							ctx.strokeStyle = `rgba(99, 102, 241, ${
								opacityValue * 0.2
							})`;
							ctx.lineWidth = 1;
							ctx.beginPath();
							ctx.moveTo(particles[a].x, particles[a].y);
							ctx.lineTo(particles[b].x, particles[b].y);
							ctx.stroke();
						}
					}
				}
			};
			const animateParticles = () => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				particles.forEach((p) => {
					p.update();
					p.draw();
				});
				connect();
				requestAnimationFrame(animateParticles);
			};
			window.addEventListener(
				"resize",
				throttle(() => {
					setCanvasSize();
					initParticles();
				}, 200)
			);
			document.querySelector(".header").addEventListener(
				"mousemove",
				throttle((e) => {
					const rect = canvas.getBoundingClientRect();
					mouse.x = e.clientX - rect.left;
					mouse.y = e.clientY - rect.top;
				}, 50)
			);
			document.querySelector(".header").addEventListener("mouseleave", () => {
				mouse.x = null;
				mouse.y = null;
			});
			setCanvasSize();
			initParticles();
			animateParticles();
		}
	}

	// --- AUDIENCE TABS ---
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

	// =================================================================
	// --- SIMULATOR LOGIC ---
	// =================================================================
	const simulatorElement = document.getElementById("simulator");
	if (!simulatorElement) return;

	const SIMULATION_MONTHS = 12;
	const MAX_COMMISSION_SUM = 80;
	const els = {
		simulatorTitleSpan: document.getElementById("simulatorTitleSpan"),
		price: document.getElementById("price"),
		initialPartners: document.getElementById("initialPartners"),
		partnerDuplication: document.getElementById("partnerDuplication"),
		priceValue: document.getElementById("priceValue"),
		initialPartnersValue: document.getElementById("initialPartnersValue"),
		partnerDuplicationValue: document.getElementById(
			"partnerDuplicationValue"
		),
		classic: {
			levels: document.getElementById("classicLevels"),
			levelsValue: document.getElementById("classicLevelsValue"),
			l1: document.getElementById("classicL1"),
			l2: document.getElementById("classicL2"),
			l1Row: document.getElementById("classicL1Row"),
			l2Row: document.getElementById("classicL2Row"),
			subtitle: document.getElementById("classicSubtitle"),
			partners: document.getElementById("classicTotalPartners"),
			income: document.getElementById("classicAuthorIncome"),
		},
		sethubble: {
			levels: document.getElementById("sethubbleLevels"),
			levelsValue: document.getElementById("sethubbleLevelsValue"),
			l1: document.getElementById("sethubbleL1"),
			l2plus: document.getElementById("sethubbleL2plus"),
			l1Row: document.getElementById("sethubbleL1Row"),
			l2plusRow: document.getElementById("sethubbleL2plusRow"),
			warning: document.getElementById("sethubbleWarning"),
			subtitle: document.getElementById("sethubbleSubtitle"),
			l2plusLabel: document.getElementById("sethubbleL2plusLabel"),
			partners: document.getElementById("sethubbleTotalPartners"),
			income: document.getElementById("sethubbleAuthorIncome"),
		},
		conclusionText: document.getElementById("conclusionText"),
		chartCtx: document.getElementById("salesChart")?.getContext("2d"),
		modeSwitcher: document.getElementById("simulatorModeSwitcher"),
		modeButtons: document.querySelectorAll(".mode-switch-btn"),
		simulatorSubtitle: document.getElementById("simulatorSubtitle"),
		priceLabel: document.getElementById("priceLabel"),
		initialPartnersLabel: document.getElementById("initialPartnersLabel"),
		duplicationLabel: document.getElementById("duplicationLabel"),
		classicIncomeLabel: document.getElementById("classicIncomeLabel"),
		sethubbleIncomeLabel: document.getElementById("sethubbleIncomeLabel"),
		classicPartnersLabel: document.getElementById("classicPartnersLabel"),
		sethubblePartnersLabel: document.getElementById("sethubblePartnersLabel"),
	};
	let salesChartInstance = null;
	let currentMode = "author";
	const config = {
		general: { price: 100, partners: 10, sales: 2 },
		classic: { levels: 2, commissions: [30, 5] },
		sethubble: { levels: 5, commissions: { l1: 40, l2plus: 5 } },
	};
	const formatNumber = (num) => Math.round(num).toLocaleString("ru-RU");
	function animateCounter(element, targetValue, isCurrency = false) {
		let startValue =
			parseFloat(element.textContent.replace(/[^0-9.-]+/g, "")) || 0;
		const duration = 1000;
		let startTime = null;
		function animationStep(currentTime) {
			if (!startTime) startTime = currentTime;
			const progress = Math.min((currentTime - startTime) / duration, 1);
			const easeProgress = 1 - (1 - progress) ** 3;
			const currentValue =
				startValue + (targetValue - startValue) * easeProgress;
			element.textContent = isCurrency
				? "$" + formatNumber(currentValue)
				: formatNumber(currentValue);
			if (progress < 1) requestAnimationFrame(animationStep);
			else
				element.textContent = isCurrency
					? "$" + formatNumber(targetValue)
					: formatNumber(targetValue);
		}
		requestAnimationFrame(animationStep);
	}
	function runSimulation(modelConfig, mode) {
		const { levels, commissions } = modelConfig;
		const {
			price,
			partners: monthlyRecruits,
			sales: duplicationRate,
		} = config.general;
		let partnersByLevel = Array(levels).fill(0);
		let totalPayout = 0;
		let totalSalesCount = 0;
		let monthlyPartnersChart = [0];
		for (let month = 1; month <= SIMULATION_MONTHS; month++) {
			let newPartnersThisMonth = Array(levels).fill(0);
			if (levels > 0) {
				newPartnersThisMonth[0] = monthlyRecruits;
				totalSalesCount += monthlyRecruits;
				totalPayout += monthlyRecruits * price * (commissions[0] / 100);
			}
			for (let level = 0; level < levels - 1; level++) {
				const newRecruitsFromDepth = Math.round(
					partnersByLevel[level] * duplicationRate
				);
				newPartnersThisMonth[level + 1] += newRecruitsFromDepth;
				totalSalesCount += newRecruitsFromDepth;
				totalPayout +=
					newRecruitsFromDepth * price * (commissions[level + 1] / 100);
			}
			partnersByLevel = partnersByLevel.map(
				(p, i) => p + newPartnersThisMonth[i]
			);
			monthlyPartnersChart.push(partnersByLevel.reduce((a, b) => a + b, 0));
		}
		const totalPartners = partnersByLevel.reduce((a, b) => a + b, 0);
		if (mode === "author") {
			const totalRevenue = totalSalesCount * price;
			const authorIncome =
				levels > 0
					? totalRevenue - totalPayout
					: monthlyRecruits * SIMULATION_MONTHS * price;
			return { totalPartners, income: authorIncome, monthlyPartnersChart };
		} else {
			const partnerIncome = totalPayout;
			return { totalPartners, income: partnerIncome, monthlyPartnersChart };
		}
	}
	function fadeSwitchText(element, newText) {
		if (!element || element.innerText === newText) return;
		element.style.opacity = "0";
		setTimeout(() => {
			element.innerText = newText;
			element.style.opacity = "1";
		}, 200);
	}
	window.setSimulatorMode = function (newMode) {
		if (newMode === currentMode) return;
		currentMode = newMode;
		els.modeSwitcher.dataset.mode = newMode;
		els.modeButtons.forEach((btn) =>
			btn.classList.toggle("active", btn.dataset.mode === newMode)
		);
		if (newMode === "author") {
			fadeSwitchText(els.simulatorTitleSpan, "Калькулятор Дохода Автора");
			fadeSwitchText(
				els.simulatorSubtitle,
				"Рассчитайте свой чистый доход как владелец продукта, за вычетом комиссий партнерам."
			);
			fadeSwitchText(els.priceLabel, "Цена Вашего Продукта");
			fadeSwitchText(els.initialPartnersLabel, "Личных продаж в месяц");
			fadeSwitchText(els.duplicationLabel, "Дупликация (продаж партнером)");
			fadeSwitchText(els.classicIncomeLabel, "Ваш чистый доход");
			fadeSwitchText(els.sethubbleIncomeLabel, "Ваш чистый доход");
			fadeSwitchText(els.classicPartnersLabel, "Партнеров в сети (год)");
			fadeSwitchText(els.sethubblePartnersLabel, "Партнеров в сети (год)");
		} else {
			fadeSwitchText(els.simulatorTitleSpan, "Калькулятор Дохода Партнёра");
			fadeSwitchText(
				els.simulatorSubtitle,
				"Рассчитайте свой комиссионный доход, продвигая чужой продукт и строя свою команду."
			);
			fadeSwitchText(els.priceLabel, "Цена Продукта");
			fadeSwitchText(els.initialPartnersLabel, "Моих личных продаж в месяц");
			fadeSwitchText(els.duplicationLabel, "Дупликация в моей команде");
			fadeSwitchText(els.classicIncomeLabel, "Ваш комиссионный доход");
			fadeSwitchText(els.sethubbleIncomeLabel, "Ваш комиссионный доход");
			fadeSwitchText(els.classicPartnersLabel, "Партнеров в команде (год)");
			fadeSwitchText(els.sethubblePartnersLabel, "Партнеров в команде (год)");
		}
		window.renderSimulator();
	};
	function updateSimulatorUI() {
		els.priceValue.textContent = "$" + config.general.price;
		els.initialPartnersValue.textContent = config.general.partners;
		els.partnerDuplicationValue.textContent = config.general.sales;
		els.classic.levelsValue.textContent = config.classic.levels;
		els.classic.l1Row.classList.toggle("hidden", config.classic.levels < 1);
		els.classic.l2Row.classList.toggle("hidden", config.classic.levels < 2);
		let classicSubtitle = "Нет партнерки";
		if (config.classic.levels > 0) {
			classicSubtitle = `${
				config.classic.levels
			} ур.: ${config.classic.commissions
				.slice(0, config.classic.levels)
				.join("% + ")}%`;
		}
		els.classic.subtitle.textContent = classicSubtitle;
		els.sethubble.levelsValue.textContent = config.sethubble.levels;
		els.sethubble.l1Row.classList.toggle("hidden", config.sethubble.levels < 1);
		els.sethubble.l2plusRow.classList.toggle(
			"hidden",
			config.sethubble.levels < 2
		);
		if (config.sethubble.levels > 1) {
			els.sethubble.l2plusLabel.textContent = `Комиссия ур. 2-${config.sethubble.levels}, %`;
		}
		let sethubbleSubtitle = "Нет партнерки";
		if (config.sethubble.levels > 0) {
			let commsStr = `${config.sethubble.commissions.l1}%`;
			if (config.sethubble.levels > 1)
				commsStr += ` + ${config.sethubble.levels - 1}x${
					config.sethubble.commissions.l2plus
				}%`;
			sethubbleSubtitle = `${config.sethubble.levels} уровней: ${commsStr}`;
		}
		els.sethubble.subtitle.textContent = sethubbleSubtitle;
	}
	function validateSetHubbleCommissions(changedInputId) {
		const { levels } = config.sethubble;
		if (levels < 1) {
			els.sethubble.warning.textContent = "";
			return;
		}
		let l1 = parseInt(els.sethubble.l1.value) || 0;
		let l2plus = parseInt(els.sethubble.l2plus.value) || 0;
		const currentTotal = levels > 1 ? l1 + (levels - 1) * l2plus : l1;
		if (currentTotal > MAX_COMMISSION_SUM) {
			if (changedInputId === "sethubbleL1" && levels > 1) {
				l2plus = Math.max(
					0,
					Math.floor((MAX_COMMISSION_SUM - l1) / (levels - 1))
				);
				els.sethubble.l2plus.value = l2plus;
			} else {
				l1 = Math.max(0, MAX_COMMISSION_SUM - (levels - 1) * l2plus);
				els.sethubble.l1.value = l1;
			}
			els.sethubble.warning.textContent = `⚠️ Сумма ограничена ${MAX_COMMISSION_SUM}%, чтобы оставалась прибыль.`;
			config.sethubble.commissions.l1 = l1;
			config.sethubble.commissions.l2plus = l2plus;
		} else {
			els.sethubble.warning.textContent = "";
		}
	}
	window.renderSimulator = function () {
		if (!window.Chart || !els.chartCtx) return;

		const classicCommsArray = [
			parseInt(els.classic.l1.value) || 0,
			parseInt(els.classic.l2.value) || 0,
		];
		const classicSimConfig = {
			levels: config.classic.levels,
			commissions: classicCommsArray,
		};
		const sethubbleCommsArray = Array(config.sethubble.levels)
			.fill(0)
			.map((_, i) =>
				i === 0
					? config.sethubble.commissions.l1
					: config.sethubble.commissions.l2plus
			);
		const sethubbleSimConfig = {
			levels: config.sethubble.levels,
			commissions: sethubbleCommsArray,
		};
		const classicResults = runSimulation(classicSimConfig, currentMode);
		const sethubbleResults = runSimulation(sethubbleSimConfig, currentMode);
		animateCounter(els.classic.partners, classicResults.totalPartners);
		animateCounter(els.classic.income, classicResults.income, true);
		animateCounter(els.sethubble.partners, sethubbleResults.totalPartners);
		animateCounter(els.sethubble.income, sethubbleResults.income, true);
		let incomeFactor = "неизмеримо";
		if (classicResults.income > 0.01) {
			const factor = sethubbleResults.income / classicResults.income;
			incomeFactor =
				factor < 1.1
					? "почти столько же"
					: `<span class="highlight">в ${factor.toFixed(1)} раз(а)</span>`;
		} else if (sethubbleResults.income > 0) {
			incomeFactor = "значительно";
		}
		const incomeType =
			currentMode === "author" ? "чистого дохода" : "комиссионного дохода";
		els.conclusionText.innerHTML = `Модель SetHubble принесет вам ${incomeFactor} больше <b>${incomeType}</b> за год.`;
		
		// ✅ [КЛЮЧЕВОЙ ФИКС ДЛЯ ГРАФИКА]
		const styles = getComputedStyle(simulatorElement);
		const grayColor = styles.getPropertyValue("--text-gray").trim();
		const legendColor = styles.getPropertyValue("--text-light").trim();
		const gridColor = styles.getPropertyValue("--glass-border").trim();
		
		if (salesChartInstance) salesChartInstance.destroy();
		const labels = Array.from({ length: SIMULATION_MONTHS + 1 }, (_, i) =>
			i === 0 ? "Старт" : `${i} мес`
		);
		const chartLabel =
			currentMode === "author" ? "Партнеры в сети" : "Партнеры в команде";
		salesChartInstance = new Chart(els.chartCtx, {
    type: "line",
    data: {
        labels,
        datasets: [
            {
                label: `${chartLabel} (Classic)`,
                data: classicResults.monthlyPartnersChart,
                // ✅ ИСПРАВЛЕНО: Возвращаем статичные цвета для 100% надежности
                borderColor: '#ec4899', // Розовый цвет для "Классики"
                borderWidth: 2,
                backgroundColor: "rgba(236, 72, 153, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: `${chartLabel} (SetHubble)`,
                data: sethubbleResults.monthlyPartnersChart,
                // ✅ ИСПРАВЛЕНО: Возвращаем статичные цвета для 100% надежности
                borderColor: '#00f7ff', // Неоновый цвет для "SetHubble"
                borderWidth: 3,
                backgroundColor: "rgba(0, 247, 255, 0.2)",
                fill: true,
                tension: 0.4,
            },
        ],
    },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: "index", intersect: false },
				plugins: {
					legend: {
						position: "top",
						labels: { color: legendColor, font: { family: "Inter" } },
					},
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: gridColor },
						ticks: { color: grayColor },
					},
					x: { grid: { display: false }, ticks: { color: grayColor } },
				},
			},
		});
	};
	const throttledRender = throttle(window.renderSimulator, 150);
	function handleInputChange(e) {
		const { id, value } = e.target;
		const val = parseFloat(value);
		switch (id) {
			case "price":
				config.general.price = val;
				break;
			case "initialPartners":
				config.general.partners = parseInt(val);
				break;
			case "partnerDuplication":
				config.general.sales = val;
				break;
			case "classicLevels":
				config.classic.levels = parseInt(val);
				break;
			case "sethubbleLevels":
				config.sethubble.levels = parseInt(val);
				validateSetHubbleCommissions(id);
				break;
			default:
				const model = id.startsWith("classic") ? "classic" : "sethubble";
				const key = id.replace(model, "").toLowerCase();
				if (key === "l1" || key === "l2plus") {
					config[model].commissions[key] = parseInt(val) || 0;
				} else if (key === "l2") {
					config.classic.commissions[1] = parseInt(val) || 0;
				}
				if (model === "sethubble") validateSetHubbleCommissions(id);
				break;
		}
		updateSimulatorUI();
		throttledRender();
	}
	document.querySelectorAll(".simulator input").forEach((input) => {
		const eventType = input.type === "range" ? "input" : "change";
		input.addEventListener(eventType, handleInputChange);
	});
	els.modeSwitcher.addEventListener("click", (e) => {
		const btn = e.target.closest(".mode-switch-btn");
		if (btn) setSimulatorMode(btn.dataset.mode);
	});
	// Initialization
	els.price.value = config.general.price;
	els.initialPartners.value = config.general.partners;
	els.partnerDuplication.value = config.general.sales;
	els.classic.levels.value = config.classic.levels;
	els.classic.l1.value = config.classic.commissions[0];
	els.classic.l2.value = config.classic.commissions[1];
	els.sethubble.levels.value = config.sethubble.levels;
	els.sethubble.l1.value = config.sethubble.commissions.l1;
	els.sethubble.l2plus.value = config.sethubble.commissions.l2plus;
	updateSimulatorUI();
	// Smart scroll from header
	const pathLinks = document.querySelectorAll(".path-link");
	if (pathLinks.length && simulatorElement) {
		pathLinks.forEach((link) => {
			link.addEventListener("click", function (event) {
				event.preventDefault();
				const targetMode = this.dataset.mode;
				if (window.setSimulatorMode) {
					window.setSimulatorMode(targetMode);
				}
				simulatorElement.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			});
		});
	}
});