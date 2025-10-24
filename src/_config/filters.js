import { DateTime } from "luxon";

export default function (eleventyConfig) {
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// --- ФИНАЛЬНЫЙ ФИКС ДЛЯ РУССКОЙ ДАТЫ ---
		const dt = DateTime.fromJSDate(dateObj, { zone: zone || "utc" });
		if (!dt.isValid) {
			return "Invalid Date"; // Оставляем проверку на всякий случай
		}
		// 1. Устанавливаем русский язык
		// 2. Используем полный формат даты (напр. "1 октября 2025 г.")
		return dt.setLocale("ru").toLocaleString(DateTime.DATE_FULL);
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if (!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if (n < 0) {
			return array.slice(n);
		}
		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return the keys used in an object
	eleventyConfig.addFilter("getKeys", (target) => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter(
			(tag) => ["all", "nav", "post", "posts"].indexOf(tag) === -1
		);
	});

	// === ВОТ ОН, НЕДОСТАЮЩИЙ ФИЛЬТР ===
	eleventyConfig.addFilter("sortAlphabetically", (strings) =>
		(strings || []).sort((b, a) => b.localeCompare(a))
	);
	// ===================================
}
