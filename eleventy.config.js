import {
	IdAttributePlugin,
	InputPathToUrlTransformPlugin,
	HtmlBasePlugin,
} from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import Image from "@11ty/eleventy-img";
import pluginFilters from "./src/_config/filters.js"; // Обновите путь, если нужно

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function (eleventyConfig) {
	// --- КОПИРОВАНИЕ СТАТИЧНЫХ ФАЙЛОВ И ПАПОК ---
	// Копируем все, что не является шаблонами, в итоговую сборку
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/fonts"); // Если у вас есть папка со шрифтами
	eleventyConfig.addPassthroughCopy("src/img"); // Если есть папка с изображениями
	eleventyConfig.addPassthroughCopy({ "src/public/": "/" });
	eleventyConfig.addPassthroughCopy(
		"src/blog/**/*.{jpg,jpeg,png,gif,svg,webp}"
	); // Копируем картинки из постов

	// --- ШОРТКОД ДЛЯ ИЗОБРАЖЕНИЙ ---
	eleventyConfig.addNunjucksAsyncShortcode(
		"image",
		async function (src, alt, sizes = "100vw") {
			if (!src) {
				return;
			}
			let filepath = `${this.page.inputPath.substring(
				0,
				this.page.inputPath.lastIndexOf("/")
			)}/${src}`;

			let metadata = await Image(filepath, {
				widths: [400, 800, 1200, "auto"],
				formats: ["webp", "jpeg"],
				outputDir: "./_site/img/", // Итоговая папка для картинок
				urlPath: "/img/",
			});

			let imageAttributes = {
				alt,
				sizes,
				loading: "lazy",
				decoding: "async",
			};

			const pictureHTML = Image.generateHTML(metadata, imageAttributes);
			const largestImage = metadata.jpeg[metadata.jpeg.length - 1];

			return `<a href="${largestImage.url}" class="lightbox-trigger">${pictureHTML}</a>`;
		}
	);

	// --- ПЛАГИНЫ И ПРОЧАЯ КОНФИГУРАЦИЯ ---
	eleventyConfig.addWatchTarget("src/css/**/*.css");

	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 },
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed/feed.xml",
		collection: { name: "posts", limit: 10 },
		metadata: {
			language: "ru",
			title: "Блог SetHubble",
			subtitle: "Новости, обновления и инсайты.",
			base: "https://blog.sethubble.ru/",
			author: { name: "SetHubble" },
		},
	});

	eleventyConfig.addPlugin(pluginFilters);
	eleventyConfig.addPlugin(IdAttributePlugin);

	eleventyConfig.addShortcode("currentBuildDate", () =>
		new Date().toISOString()
	);

	// --- ГЛАВНОЕ ИЗМЕНЕНИЕ: Указываем правильные папки ---
	return {
		templateFormats: ["md", "njk", "html"],
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		dir: {
			input: "src", // Исходники теперь в 'src'
			includes: "_includes", // Папка _includes ищется ВНУТРИ 'src'
			data: "_data", // Папка _data ищется ВНУТРИ 'src'
			output: "_site", // Результат сборки
		},
	};
}
