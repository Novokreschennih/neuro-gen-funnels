import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import Image from "@11ty/eleventy-img";

import pluginFilters from "./_config/filters.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
	// --- КОЛЛЕКЦИИ ---
	eleventyConfig.addCollection("posts", collectionApi => collectionApi.getFilteredByGlob("./content/blog/**/*.md"));
	eleventyConfig.addCollection("news", collectionApi => collectionApi.getFilteredByGlob("./content/news/**/*.md"));

	// --- КОПИРОВАНИЕ ФАЙЛОВ ---
	eleventyConfig.addPassthroughCopy({ "./public/": "/" });
	eleventyConfig.addPassthroughCopy("./css/");
	eleventyConfig.addPassthroughCopy("./js/");
	eleventyConfig.addPassthroughCopy({ "landing-src/": "/" });
	eleventyConfig.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");
	eleventyConfig.addPassthroughCopy("content/**/*.{jpg,jpeg,png,gif,svg,webp}");

	// --- ШОРТКОД ДЛЯ КАРТИНОК С ФУНКЦИЕЙ ЛАЙТБОКСА (ГЛАВНЫЙ ФИКС) ---
	eleventyConfig.addNunjucksAsyncShortcode("image", async function(src, alt, sizes = "100vw") {
		if (!src) { return; }
		let filepath = `${this.page.inputPath.substring(0, this.page.inputPath.lastIndexOf('/'))}/${src}`;
		
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
		
		// Генерируем HTML для тега <picture>
		const pictureHTML = Image.generateHTML(metadata, imageAttributes);

		// Получаем URL самой большой картинки для ссылки лайтбокса
		const largestImage = metadata.jpeg[metadata.jpeg.length - 1];
		
		// Оборачиваем <picture> в ссылку <a> с классом для JS
		return `<a href="${largestImage.url}" class="lightbox-trigger">${pictureHTML}</a>`;
	});
	// -----------------------------------------------------------------

	// --- ОСТАЛЬНАЯ КОНФИГУРАЦИЯ (ОРИГИНАЛЬНАЯ) ---
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if (data.draft) data.title = `${data.title} (draft)`;
		if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") return false;
	});

	eleventyConfig.addWatchTarget("css/**/*.css");

	eleventyConfig.addBundle("css", { toFileDirectory: "dist", bundleHtmlContentFromSelector: "style" });
	eleventyConfig.addBundle("js", { toFileDirectory: "dist", bundleHtmlContentFromSelector: "script" });

	eleventyConfig.addPlugin(pluginSyntaxHighlight, { preAttributes: { tabindex: 0 } });
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", outputPath: "/feed/feed.xml", stylesheet: "pretty-atom-feed.xsl",
		collection: { name: "posts", limit: 10, },
		metadata: {
			language: "ru", title: "Блог SetHubble", subtitle: "Новости, обновления и инсайты.",
			base: "https://blog.sethubble.ru/", author: { name: "SetHubble" }
		}
	});

	eleventyConfig.addPlugin(pluginFilters);
	eleventyConfig.addPlugin(IdAttributePlugin);

	eleventyConfig.addShortcode("currentBuildDate", () => (new Date()).toISOString());
};

export const config = {
	templateFormats: ["md", "njk", "html", "liquid", "11ty.js"],
	markdownTemplateEngine: "njk",
	htmlTemplateEngine: "njk",
	dir: {
		input: "content", includes: "../_includes",
		data: "../_data", output: "_site"
	},
};
