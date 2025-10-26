// eleventy.config.js (ФИНАЛЬНАЯ ВЕРСИЯ С ВОССТАНОВЛЕННЫМИ КОЛЛЕКЦИЯМИ)

import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import Image from "@11ty/eleventy-img";
import pluginFilters from "./src/_config/filters.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function (eleventyConfig) {
	// ✅ ВОЗВРАЩЕНО И ИСПРАВЛЕНО: Определения коллекций
	eleventyConfig.addCollection("posts", (collectionApi) =>
		collectionApi.getFilteredByGlob("./src/content/blog/**/*.md")
	);
	eleventyConfig.addCollection(
		"news",
		(collectionApi) =>
			collectionApi.getFilteredByGlob("./src/content/news/**/*.md") // Предполагая, что новости в src/news/
	);

	// --- КОПИРОВАНИЕ СТАТИЧНЫХ ФАЙЛОВ И ПАПОК ---
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/fonts");
	eleventyConfig.addPassthroughCopy({ "src/public/": "/" });
	eleventyConfig.addPassthroughCopy("src/**/*.{jpg,jpeg,png,gif,svg,webp}");
	eleventyConfig.addPassthroughCopy("src/_redirects");

	// --- ШОРТКОД ДЛЯ ИЗОБРАЖЕНИЙ ---
	eleventyConfig.addNunjucksAsyncShortcode(
		"image",
		async function (src, alt, sizes = "100vw") {
			if (!src) {
				return;
			}
			let filepath = `./src${this.page.filePathStem.substring(
				0,
				this.page.filePathStem.lastIndexOf("/")
			)}/${src}`;
			if (src.startsWith("/")) {
				filepath = `./src${src}`;
			}

			let metadata = await Image(filepath, {
				widths: [400, 800, 1200, "auto"],
				formats: ["webp", "jpeg"],
				outputDir: "./_site/img/",
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
	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed/feed.xml",
		collection: {
			name: "posts", // Теперь эта коллекция снова существует
			limit: 10,
		},
		metadata: {
			language: "ru",
			title: "Блог SetHubble",
			subtitle: "Новости, обновления и инсайты.",
			base: "https://sethubble.ru/",
			author: { name: "SetHubble" },
		},
	});

	eleventyConfig.addPlugin(pluginFilters);

	eleventyConfig.addShortcode("currentBuildDate", () =>
		new Date().toISOString()
	);

	return {
		templateFormats: ["md", "njk", "html"],
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		dir: {
			input: "src",
			includes: "_includes",
			data: "_data",
			output: "_site",
		},
	};
}
