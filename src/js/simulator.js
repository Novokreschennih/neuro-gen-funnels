/**
 * SetHubble Dual-Mode Simulator Script
 * Version: 2.4 (Final Fix - with throttle function)
 * 
 * Changelog:
 * - ADDED the missing 'throttle' helper function at the top of the script.
 *   This resolves the "throttle is not defined" ReferenceError.
 */

// ✅ [ИСПРАВЛЕНО] Добавлена недостающая функция throttle
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    try {
        // --- 1. ПРОВЕРКА И ИНИЦИАЛИЗАЦИЯ ---
        
        const simulatorContainer = document.getElementById('simulator');
        if (!simulatorContainer) {
            return;
        }

        function getElement(id, required = true) {
            const el = document.getElementById(id);
            if (!el && required) {
                throw new Error(`Критический элемент с ID "${id}" не найден на странице.`);
            }
            return el;
        }

        // --- 2. КЭШИРОВАНИЕ ЭЛЕМЕНТОВ С ПРОВЕРКОЙ ---

        const els = {
            price: getElement('price'),
            initialPartners: getElement('initialPartners'),
            partnerDuplication: getElement('partnerDuplication'),
            priceValue: getElement('priceValue'),
            initialPartnersValue: getElement('initialPartnersValue'),
            partnerDuplicationValue: getElement('partnerDuplicationValue'),
            classic: {
                levels: getElement('classicLevels'),
                levelsValue: getElement('classicLevelsValue'),
                l1: getElement('classicL1'),
                l2: getElement('classicL2'),
                l1Row: getElement('classicL1Row'),
                l2Row: getElement('classicL2Row'),
                subtitle: getElement('classicSubtitle'),
                partners: getElement('classicTotalPartners'),
                income: getElement('classicAuthorIncome'),
            },
            sethubble: {
                levels: getElement('sethubbleLevels'),
                levelsValue: getElement('sethubbleLevelsValue'),
                l1: getElement('sethubbleL1'),
                l2plus: getElement('sethubbleL2plus'),
                l1Row: getElement('sethubbleL1Row'),
                l2plusRow: getElement('sethubbleL2plusRow'),
                warning: getElement('sethubbleWarning'),
                subtitle: getElement('sethubbleSubtitle'),
                l2plusLabel: getElement('sethubbleL2plusLabel'),
                partners: getElement('sethubbleTotalPartners'),
                income: getElement('sethubbleAuthorIncome'),
            },
            conclusionText: getElement('conclusionText'),
            chartCanvas: getElement('salesChart'),
            modeSwitcher: getElement('simulatorModeSwitcher'),
            modeButtons: document.querySelectorAll('.mode-switch-btn'),
            simulatorSubtitle: getElement('simulatorSubtitle'),
            priceLabel: getElement('priceLabel'),
            initialPartnersLabel: getElement('initialPartnersLabel'),
            duplicationLabel: getElement('duplicationLabel'),
            classicIncomeLabel: getElement('classicIncomeLabel'),
            sethubbleIncomeLabel: getElement('sethubbleIncomeLabel'),
            classicPartnersLabel: getElement('classicPartnersLabel'),
            sethubblePartnersLabel: getElement('sethubblePartnersLabel'),
        };

        const chartCtx = els.chartCanvas.getContext('2d');
        if (!chartCtx) {
            throw new Error('Не удалось получить 2D-контекст для canvas графика.');
        }

        // --- 3. ОСНОВНАЯ ЛОГИКА КАЛЬКУЛЯТОРА ---

        const SIMULATION_MONTHS = 12;
        const MAX_COMMISSION_SUM = 80;
        let salesChartInstance = null;
        let currentMode = 'author';

        const config = {
            general: { price: 100, partners: 10, sales: 2 },
            classic: { levels: 2, commissions: [30, 5] },
            sethubble: { levels: 5, commissions: { l1: 40, l2plus: 5 } }
        };

        const formatNumber = (num) => Math.round(num).toLocaleString('ru-RU');

        function animateCounter(element, targetValue, isCurrency = false) {
            let startValue = parseFloat(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
            const duration = 1000;
            let startTime = null;
            function animationStep(currentTime) {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentValue = startValue + (targetValue - startValue) * easeProgress;
                element.textContent = isCurrency ? '$' + formatNumber(currentValue) : formatNumber(currentValue);
                if (progress < 1) requestAnimationFrame(animationStep);
                else element.textContent = isCurrency ? '$' + formatNumber(targetValue) : formatNumber(targetValue);
            }
            requestAnimationFrame(animationStep);
        }
        
        function runSimulation(modelConfig, mode) {
            const { levels, commissions } = modelConfig;
            const { price, partners: monthlyRecruits, sales: duplicationRate } = config.general;
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
            if (mode === 'author') {
                const totalRevenue = totalSalesCount * price;
                const authorIncome = levels > 0 ? (totalRevenue - totalPayout) : (monthlyRecruits * SIMULATION_MONTHS * price);
                return { totalPartners, income: authorIncome, monthlyPartnersChart };
            } else {
                const partnerIncome = totalPayout;
                return { totalPartners, income: partnerIncome, monthlyPartnersChart };
            }
        }
        
        function setSimulatorMode(newMode) {
            if (newMode === currentMode) return;
            currentMode = newMode;
            els.modeSwitcher.dataset.mode = newMode;
            els.modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === newMode));
            if (newMode === 'author') {
                els.simulatorSubtitle.innerText = 'Рассчитайте свой чистый доход как владелец продукта, за вычетом комиссий партнерам.';
                els.priceLabel.innerText = 'Цена Вашего Продукта';
                els.initialPartnersLabel.innerText = 'Личных продаж в месяц';
                els.duplicationLabel.innerText = 'Дупликация (продаж партнером)';
                els.classicIncomeLabel.innerText = 'Ваш чистый доход';
                els.sethubbleIncomeLabel.innerText = 'Ваш чистый доход';
                els.classicPartnersLabel.innerText = 'Партнеров в сети (год)';
                els.sethubblePartnersLabel.innerText = 'Партнеров в сети (год)';
            } else {
                els.simulatorSubtitle.innerText = 'Рассчитайте свой комиссионный доход, продвигая чужой продукт и строя свою команду.';
                els.priceLabel.innerText = 'Цена Продукта';
                els.initialPartnersLabel.innerText = 'Моих личных продаж в месяц';
                els.duplicationLabel.innerText = 'Дупликация в моей команде';
                els.classicIncomeLabel.innerText = 'Ваш комиссионный доход';
                els.sethubbleIncomeLabel.innerText = 'Ваш комиссионный доход';
                els.classicPartnersLabel.innerText = 'Партнеров в команде (год)';
                els.sethubblePartnersLabel.innerText = 'Партнеров в команде (год)';
            }
            renderSimulator();
        }
        
        function updateUI() {
            els.priceValue.textContent = '$' + config.general.price;
            els.initialPartnersValue.textContent = config.general.partners;
            els.partnerDuplicationValue.textContent = config.general.sales;
            els.classic.levelsValue.textContent = config.classic.levels;
            els.classic.l1Row.classList.toggle('hidden', config.classic.levels < 1);
            els.classic.l2Row.classList.toggle('hidden', config.classic.levels < 2);
            let classicSubtitle = 'Нет партнерки';
            if (config.classic.levels > 0) classicSubtitle = `${config.classic.levels} ур.: ${config.classic.commissions.slice(0, config.classic.levels).join('% + ')}%`;
            els.classic.subtitle.textContent = classicSubtitle;
            els.sethubble.levelsValue.textContent = config.sethubble.levels;
            els.sethubble.l1Row.classList.toggle('hidden', config.sethubble.levels < 1);
            els.sethubble.l2plusRow.classList.toggle('hidden', config.sethubble.levels < 2);
            if (config.sethubble.levels > 1) els.sethubble.l2plusLabel.textContent = `Комиссия ур. 2-${config.sethubble.levels}, %`;
            let sethubbleSubtitle = 'Нет партнерки';
            if (config.sethubble.levels > 0) {
                let commsStr = `${config.sethubble.commissions.l1}%`;
                if (config.sethubble.levels > 1) commsStr += ` + ${config.sethubble.levels - 1}x${config.sethubble.commissions.l2plus}%`;
                sethubbleSubtitle = `${config.sethubble.levels} уровней: ${commsStr}`;
            }
            els.sethubble.subtitle.textContent = sethubbleSubtitle;
        }

        function validateSetHubble(changedInputId) {
            const { levels } = config.sethubble; if (levels < 1) { els.sethubble.warning.textContent = ''; return; }
            let l1 = parseInt(els.sethubble.l1.value) || 0;
            let l2plus = parseInt(els.sethubble.l2plus.value) || 0;
            const totalCommission = levels > 1 ? l1 + (levels - 1) * l2plus : l1;
            if (totalCommission > MAX_COMMISSION_SUM) {
                if (changedInputId === 'sethubbleL1' && levels > 1) {
                    l2plus = Math.max(0, Math.floor((MAX_COMMISSION_SUM - l1) / (levels - 1)));
                    els.sethubble.l2plus.value = l2plus;
                } else {
                    l1 = Math.max(0, MAX_COMMISSION_SUM - ((levels - 1) * l2plus));
                    els.sethubble.l1.value = l1;
                }
                els.sethubble.warning.textContent = `⚠️ Сумма ограничена ${MAX_COMMISSION_SUM}%, чтобы оставалась прибыль.`;
                config.sethubble.commissions.l1 = l1;
                config.sethubble.commissions.l2plus = l2plus;
            } else {
                els.sethubble.warning.textContent = '';
            }
        }

        function renderSimulator() {
            const classicComms = [parseInt(els.classic.l1.value) || 0, parseInt(els.classic.l2.value) || 0];
            const classicSimConfig = { levels: config.classic.levels, commissions: classicComms };
            const sethubbleComms = Array(config.sethubble.levels).fill(0).map((_, i) => i === 0 ? config.sethubble.commissions.l1 : config.sethubble.commissions.l2plus);
            const sethubbleSimConfig = { levels: config.sethubble.levels, commissions: sethubbleComms };
            const classicResults = runSimulation(classicSimConfig, currentMode);
            const sethubbleResults = runSimulation(sethubbleSimConfig, currentMode);
            animateCounter(els.classic.partners, classicResults.totalPartners);
            animateCounter(els.classic.income, classicResults.income, true);
            animateCounter(els.sethubble.partners, sethubbleResults.totalPartners);
            animateCounter(els.sethubble.income, sethubbleResults.income, true);
            let incomeFactor = "неизмеримо";
            if (classicResults.income > 0) {
                const factor = sethubbleResults.income / classicResults.income;
                incomeFactor = factor < 1.1 ? 'почти столько же' : `<span class="highlight">в ${(factor).toFixed(1)} раз(а)</span>`;
            }
            const incomeType = currentMode === 'author' ? 'чистого дохода' : 'комиссионного дохода';
            els.conclusionText.innerHTML = `Модель SetHubble принесет вам ${incomeFactor} больше <b>${incomeType}</b> за год.`;
            if (salesChartInstance) salesChartInstance.destroy();
            const labels = Array.from({length: SIMULATION_MONTHS + 1}, (_, i) => i === 0 ? 'Старт' : `${i} мес`);
            const chartLabel = currentMode === 'author' ? 'Партнеры в сети' : 'Партнеры в команде';
            salesChartInstance = new Chart(chartCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: `${chartLabel} (Classic)`, data: classicResults.monthlyPartnersChart, borderColor: '#ec4899', borderWidth: 2, backgroundColor: 'rgba(236, 72, 153, 0.1)', fill: true, tension: 0.4 },
                        { label: `${chartLabel} (SetHubble)`, data: sethubbleResults.monthlyPartnersChart, borderColor: '#00f7ff', borderWidth: 3, backgroundColor: 'rgba(0, 247, 255, 0.2)', fill: true, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'top', labels: { color: '#e2e8f0', font: { family: 'Inter' } } } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                    }
                }
            });
        };

        const throttledRender = throttle(renderSimulator, 150);

        function handleInputChange(e) {
            const { id, value } = e.target;
            switch(id) {
                case 'price': config.general.price = parseFloat(value); break;
                case 'initialPartners': config.general.partners = parseInt(value); break;
                case 'partnerDuplication': config.general.sales = parseFloat(value); break;
                case 'classicLevels': config.classic.levels = parseInt(value); break;
                case 'classicL1': config.classic.commissions[0] = parseInt(value) || 0; break;
                case 'classicL2': config.classic.commissions[1] = parseInt(value) || 0; break;
                case 'sethubbleLevels': config.sethubble.levels = parseInt(value); validateSetHubble(id); break;
                case 'sethubbleL1': config.sethubble.commissions.l1 = parseInt(value) || 0; validateSetHubble(id); break;
                case 'sethubbleL2plus': config.sethubble.commissions.l2plus = parseInt(value) || 0; validateSetHubble(id); break;
            }
            updateUI();
            throttledRender();
        }
        
        document.querySelectorAll('.simulator input').forEach(input => {
            const eventType = input.type === 'range' ? 'input' : 'change'; 
            input.addEventListener(eventType, handleInputChange);
        });

        els.modeSwitcher.addEventListener('click', (e) => {
            const btn = e.target.closest('.mode-switch-btn');
            if (btn) setSimulatorMode(btn.dataset.mode);
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
        
        updateUI();
        renderSimulator();
        
    } catch (error) {
        console.error("==============================================");
        console.error("ОШИБКА ИНИЦИАЛИЗАЦИИ КАЛЬКУЛЯТОРА");
        console.error("==============================================");
        console.error("Причина ->", error.message);
        console.error("Это означает, что в HTML-файле (calculator.njk) отсутствует элемент с ID, который ищет скрипт, или есть опечатка в его названии.");
        console.error("Пожалуйста, проверьте написание ID, указанного в сообщении выше, в вашем HTML.");
        console.error("Полный стек ошибки для отладки:", error);
    }
});