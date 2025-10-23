/**
 * SetHubble Landing Page Interactive Script
 * Version: 4.1 (Re-introducing non-blocking animations)
 */
document.addEventListener("DOMContentLoaded", function () {

	// --- 1. Инициализация базовых UI-элементов (не зависят от внешних библиотек) ---
	
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
    
    const pathLinks = document.querySelectorAll(".path-link");
    const simulatorSection = document.getElementById("simulator");
	if (pathLinks.length && simulatorSection) {
        pathLinks.forEach((link) => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                const targetMode = this.dataset.mode;
                if (window.setSimulatorMode) {
                    window.setSimulatorMode(targetMode);
                }
                simulatorSection.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

	// --- 2. Инициализация калькулятора (зависит от Chart.js) ---

	const simulatorNode = document.getElementById('simulator');
	if (simulatorNode) {
		const loadChartLibrary = (callback) => {
			if (typeof Chart !== 'undefined') {
				callback();
				return;
			}
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
			script.onload = () => callback();
			script.onerror = () => {
				console.error("Chart.js failed to load.");
                const chartError = document.getElementById('chart-error');
                if(chartError) chartError.style.display = 'block';
			};
			document.body.appendChild(script);
		};

		loadChartLibrary(initSimulator);
	}

	function initSimulator() {
		const SIMULATION_MONTHS = 12;
		const MAX_COMMISSION_SUM = 80;
		const els = {
			price: document.getElementById("price"),
			initialPartners: document.getElementById("initialPartners"),
			partnerDuplication: document.getElementById("partnerDuplication"),
			priceValue: document.getElementById("priceValue"),
			initialPartnersValue: document.getElementById("initialPartnersValue"),
			partnerDuplicationValue: document.getElementById("partnerDuplicationValue"),
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
		};

		if (!els.price) return;

		let salesChartInstance = null;
		let currentMode = "author";
		const config = {
			general: { price: 100, partners: 10, sales: 2 },
			classic: { levels: 2, commissions: [30, 5] },
			sethubble: { levels: 5, commissions: { l1: 40, l2plus: 5 } },
		};
		const formatNumber = (num) => Math.round(num).toLocaleString("ru-RU");

		// ✅ ВОЗВРАЩЕНО: Функция плавной анимации счетчика
		function animateCounter(element, targetValue, isCurrency = false) {
			let startValue = parseFloat(element.textContent.replace(/[^0-9.-]+/g, "")) || 0;
			if(isNaN(startValue)) startValue = 0;
			const duration = 1000;
			let startTime = null;
			function animationStep(currentTime) {
				if (!startTime) startTime = currentTime;
				const progress = Math.min((currentTime - startTime) / duration, 1);
				const easeProgress = 1 - Math.pow(1 - progress, 3);
				const currentValue = startValue + (targetValue - startValue) * easeProgress;
				element.textContent = isCurrency ? "$" + formatNumber(currentValue) : formatNumber(currentValue);
				if (progress < 1) requestAnimationFrame(animationStep);
				else element.textContent = isCurrency ? "$" + formatNumber(targetValue) : formatNumber(targetValue);
			}
			requestAnimationFrame(animationStep);
		}

		function runSimulation(modelConfig, mode) {
			const { levels, commissions } = modelConfig;
			const { price, partners: monthlyRecruits, sales: duplicationRate, } = config.general;
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
					const newRecruitsFromDepth = Math.round(partnersByLevel[level] * duplicationRate);
					newPartnersThisMonth[level + 1] += newRecruitsFromDepth;
					totalSalesCount += newRecruitsFromDepth;
					totalPayout += newRecruitsFromDepth * price * (commissions[level + 1] / 100);
				}
				partnersByLevel = partnersByLevel.map((p, i) => p + newPartnersThisMonth[i]);
				monthlyPartnersChart.push(partnersByLevel.reduce((a, b) => a + b, 0));
			}
			const totalPartners = partnersByLevel.reduce((a, b) => a + b, 0);
			if (mode === "author") {
				const totalRevenue = totalSalesCount * price;
				const authorIncome = levels > 0 ? totalRevenue - totalPayout : monthlyRecruits * SIMULATION_MONTHS * price;
				return { totalPartners, income: authorIncome, monthlyPartnersChart };
			} else {
				const partnerIncome = totalPayout;
				return { totalPartners, income: partnerIncome, monthlyPartnersChart };
			}
		}
		
        window.setSimulatorMode = function (newMode) {
			if (newMode === currentMode) return;
			currentMode = newMode;
			els.modeSwitcher.dataset.mode = newMode;
			els.modeButtons.forEach((btn) =>
				btn.classList.toggle("active", btn.dataset.mode === newMode)
			);
			const simulatorSubtitle = document.getElementById("simulatorSubtitle");
			const priceLabel = document.getElementById("priceLabel");
			const initialPartnersLabel = document.getElementById("initialPartnersLabel");
			const duplicationLabel = document.getElementById("duplicationLabel");
			const classicIncomeLabel = document.getElementById("classicIncomeLabel");
			const sethubbleIncomeLabel = document.getElementById("sethubbleIncomeLabel");

			if (newMode === "author") {
				simulatorSubtitle.innerText = "Рассчитайте свой чистый доход как владелец продукта, за вычетом комиссий партнерам.";
				priceLabel.innerText = "Цена Вашего Продукта";
				initialPartnersLabel.innerText = "Личных продаж в месяц";
				duplicationLabel.innerText = "Дупликация (продаж партнером)";
				classicIncomeLabel.innerText = "Ваш чистый доход";
				sethubbleIncomeLabel.innerText = "Ваш чистый доход";
			} else {
				simulatorSubtitle.innerText = "Рассчитайте свой комиссионный доход, продвигая чужой продукт и строя свою команду.";
				priceLabel.innerText = "Цена Продукта";
				initialPartnersLabel.innerText = "Моих личных продаж в месяц";
				duplicationLabel.innerText = "Дупликация в моей команде";
				classicIncomeLabel.innerText = "Ваш комиссионный доход";
				sethubbleIncomeLabel.innerText = "Ваш комиссионный доход";
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
				classicSubtitle = `${config.classic.levels} ур.: ${[config.classic.commissions[0], config.classic.commissions[1]].slice(0, config.classic.levels).join("% + ")}%`;
			}
			els.classic.subtitle.textContent = classicSubtitle;
			els.sethubble.levelsValue.textContent = config.sethubble.levels;
			els.sethubble.l1Row.classList.toggle("hidden", config.sethubble.levels < 1);
			els.sethubble.l2plusRow.classList.toggle("hidden", config.sethubble.levels < 2);
			if (config.sethubble.levels > 1) {
				els.sethubble.l2plusLabel.textContent = `Комиссия ур. 2-${config.sethubble.levels}, %`;
			}
			let sethubbleSubtitle = "Нет партнерки";
			if (config.sethubble.levels > 0) {
				let commsStr = `${config.sethubble.commissions.l1}%`;
				if (config.sethubble.levels > 1)
					commsStr += ` + ${config.sethubble.levels - 1}x${config.sethubble.commissions.l2plus}%`;
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
					l2plus = Math.max(0, Math.floor((MAX_COMMISSION_SUM - l1) / (levels - 1)));
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
			if (typeof Chart === 'undefined' || !els.chartCtx) return;

			const classicCommsArray = [parseInt(els.classic.l1.value) || 0, parseInt(els.classic.l2.value) || 0];
			const classicSimConfig = { levels: config.classic.levels, commissions: classicCommsArray };
			const sethubbleCommsArray = Array(config.sethubble.levels).fill(0).map((_, i) => (i === 0 ? config.sethubble.commissions.l1 : config.sethubble.commissions.l2plus));
			const sethubbleSimConfig = { levels: config.sethubble.levels, commissions: sethubbleCommsArray };
			
            const classicResults = runSimulation(classicSimConfig, currentMode);
			const sethubbleResults = runSimulation(sethubbleSimConfig, currentMode);
			
			// ✅ ВОЗВРАЩЕНО: Используем плавную анимацию для счетчиков
            animateCounter(els.classic.partners, classicResults.totalPartners);
			animateCounter(els.classic.income, classicResults.income, true);
			animateCounter(els.sethubble.partners, sethubbleResults.totalPartners);
			animateCounter(els.sethubble.income, sethubbleResults.income, true);

			let incomeFactor = "неизмеримо";
			if (classicResults.income > 0 && sethubbleResults.income > classicResults.income) {
				const factor = sethubbleResults.income / classicResults.income;
				incomeFactor = `<span class="highlight">в ${factor.toFixed(1)} раз(а)</span>`;
			} else {
                incomeFactor = "почти столько же";
            }

			const incomeType = currentMode === "author" ? "чистого дохода" : "комиссионного дохода";
			els.conclusionText.innerHTML = `Модель SetHubble принесет вам ${incomeFactor} больше <b>${incomeType}</b> за год.`;
			
            if (salesChartInstance) salesChartInstance.destroy();
			
            const labels = Array.from({ length: SIMULATION_MONTHS + 1 }, (_, i) => i === 0 ? "Старт" : `${i} мес`);
			const chartLabel = currentMode === "author" ? "Партнеры в сети" : "Партнеры в команде";
			
            const styles = getComputedStyle(simulatorNode);
			const grayColor = styles.getPropertyValue("--text-gray").trim();
			const legendColor = styles.getPropertyValue("--text-light").trim();
			const gridColor = styles.getPropertyValue("--glass-border").trim();

			salesChartInstance = new Chart(els.chartCtx, {
				type: "line",
				data: {
					labels,
					datasets: [
						{ label: `${chartLabel} (Classic)`, data: classicResults.monthlyPartnersChart, borderColor: '#ec4899', borderWidth: 2, backgroundColor: "rgba(236, 72, 153, 0.1)", fill: true, tension: 0.4 },
						{ label: `${chartLabel} (SetHubble)`, data: sethubbleResults.monthlyPartnersChart, borderColor: '#00f7ff', borderWidth: 3, backgroundColor: "rgba(0, 247, 255, 0.2)", fill: true, tension: 0.4 },
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: { mode: "index", intersect: false },
					plugins: { legend: { position: "top", labels: { color: legendColor, font: { family: "Inter" } } } },
					scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: grayColor } }, x: { grid: { display: false }, ticks: { color: grayColor } } },
				},
			});
		};

		function handleInputChange(e) {
			const { id, value } = e.target;
			const val = parseFloat(value) || 0;
			switch (id) {
				case "price": config.general.price = val; break;
				case "initialPartners": config.general.partners = parseInt(val); break;
				case "partnerDuplication": config.general.sales = val; break;
				case "classicLevels": config.classic.levels = parseInt(val); break;
				case "sethubbleLevels": config.sethubble.levels = parseInt(val); validateSetHubbleCommissions(id); break;
                case "classicL1": config.classic.commissions[0] = val; break;
                case "classicL2": config.classic.commissions[1] = val; break;
                case "sethubbleL1": config.sethubble.commissions.l1 = val; validateSetHubbleCommissions(id); break;
                case "sethubbleL2plus": config.sethubble.commissions.l2plus = val; validateSetHubbleCommissions(id); break;
			}
			updateSimulatorUI();
			window.renderSimulator();
		}
		
        document.querySelectorAll(".simulator input").forEach((input) => {
			const eventType = input.type === "range" ? "input" : "change";
			input.addEventListener(eventType, handleInputChange);
		});
		
        els.modeSwitcher.addEventListener("click", (e) => {
			const btn = e.target.closest(".mode-switch-btn");
			if (btn) window.setSimulatorMode(btn.dataset.mode);
		});
		
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
		window.renderSimulator();
	}
});