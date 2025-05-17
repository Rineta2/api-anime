"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dataFetcher_1 = require("../../../services/dataFetcher");
const error_1 = require("../../../helpers/error");
const SamehadakuParserExtra_1 = __importDefault(require("./SamehadakuParserExtra"));
const path_1 = __importDefault(require("path"));
class SamehadakuParser extends SamehadakuParserExtra_1.default {
    parseHome() {
        return this.scrape({
            path: "/",
            initialData: {
                recent: { href: "", samehadakuUrl: "", animeList: [] },
                batch: { href: "", samehadakuUrl: "", batchList: [] },
                movie: { href: "", samehadakuUrl: "", animeList: [] },
            },
        }, async ($, data) => {
            data.recent.href = this.generateHref("recent");
            data.recent.samehadakuUrl = this.generateSourceUrl($(".wp-block-button__link").attr("href"));
            data.batch.href = this.generateHref("batch");
            data.batch.samehadakuUrl = this.generateSourceUrl($(".widget-title h3 .linkwidget").attr("href"));
            data.movie.href = this.generateHref("movies");
            data.movie.samehadakuUrl = this.generateSourceUrl($(".widgets h3 .linkwidget").attr("href"));
            const animeWrapperElements = $(".post-show").toArray();
            animeWrapperElements.forEach((animeWrapperEl, index) => {
                const animeElements = $(animeWrapperEl).find("ul li").toArray();
                animeElements.forEach((animeEl) => {
                    const card = this.parseAnimeCard1($(animeEl), index === 0 ? "anime" : "batch");
                    (index === 0 ? data.recent.animeList : data.batch.batchList).push(card);
                });
            });
            const animeMovieElements = $(".widgetseries ul li").toArray();
            animeMovieElements.forEach((animeMovieElement) => {
                const card = this.parseAnimeCard3($, $(animeMovieElement));
                if (card.title && card.animeId && Array.isArray(card.genreList)) {
                    data.movie.animeList.push(card);
                }
            });
            const isEmpty = data.recent.animeList.length === 0 &&
                data.batch.batchList.length === 0 &&
                data.movie.animeList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseAllGenres() {
        return this.scrape({
            path: "/daftar-anime-2",
            initialData: { genreList: [] },
        }, async ($, data) => {
            const genreElements = $(".filter_act.genres .tax_fil").toArray();
            genreElements.forEach((genreElement) => {
                const oriUrl = `${this.baseUrl}/genre/${$(genreElement).find("input").attr("value")}`;
                const title = $(genreElement).text().trim();
                const samehadakuUrl = this.generateSourceUrl(oriUrl);
                const genreId = this.generateSlug(oriUrl);
                const href = this.generateHref("genres", genreId);
                data.genreList.push({
                    title,
                    genreId,
                    href,
                    samehadakuUrl,
                });
            });
            const isEmpty = data.genreList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseAllAnimes() {
        return this.scrape({
            path: "/daftar-anime-2/?list",
            initialData: { list: [] },
        }, async ($, data) => {
            const listElements = $(".listpst .listbar").toArray();
            listElements.forEach((listElement) => {
                const animeList = [];
                const startWith = $(listElement).find(".listabj").text();
                const animeElements = $(listElement).find(".listttl ul li a").toArray();
                animeElements.forEach((animeElement) => {
                    const card = this.parseLinkCard($(animeElement), "anime");
                    animeList.push({
                        title: card.title,
                        animeId: card.slug,
                        href: card.href,
                        samehadakuUrl: card.samehadakuUrl,
                    });
                });
                data.list.push({
                    startWith,
                    animeList,
                });
            });
            const isEmpty = data.list.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseSchedule() {
        return this.scrape({
            path: "/jadwal",
            initialData: { days: [] },
        }, async ($, data) => {
            const dayElements = $(".schedule .tab-dates").toArray();
            dayElements.forEach((dayElement) => {
                const day = $(dayElement).text().trim();
                const animeList = [];
                const animeElements = $(dayElement).next().find(".animepost").toArray();
                animeElements.forEach((animeElement) => {
                    const card = this.parseAnimeCard4($(animeElement));
                    animeList.push(card);
                });
                data.days.push({
                    day,
                    animeList,
                });
            });
            const isEmpty = data.days.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseRecentAnime(page) {
        return this.scrape({
            path: `/anime-terbaru/page/${page}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            const animeElements = $(".post-show ul li").toArray();
            animeElements.forEach((animeElement) => {
                const card = this.parseAnimeCard1($(animeElement), "anime");
                data.animeList.push(card);
            });
            pagination = this.parsePagination($);
            const isEmpty = data.animeList.length === 0;
            this.checkEmptyData(isEmpty);
            return { data, pagination };
        });
    }
    parseOngoingAnimes(page, order) {
        return this.scrape({
            path: `/daftar-anime-2/page/${page}/?status=Currently%20Airing&order=${order}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseCompletedAnimes(page, order) {
        return this.scrape({
            path: `/daftar-anime-2/page/${page}/?status=Finished%20Airing&order=${order}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parsePopularAnimes(page) {
        return this.scrape({
            path: `/daftar-anime-2/page/${page}/?order=popular`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseMovies(page) {
        return this.scrape({
            path: `/anime-movie/page/${page}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseBatches(page) {
        return this.scrape({
            path: `/daftar-batch/page/${page}`,
            initialData: { data: { batchList: [] } },
        }, async ($, { data, pagination }) => {
            data.batchList = this.parseAnimeCard2List($, "batch").animeList;
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseSearch(q, page) {
        return this.scrape({
            path: `/page/${page}/?s=${q}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseGenreAnimes(genreId, page) {
        return this.scrape({
            path: `/genre/${genreId}/page/${page}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseAnimeDetails(animeId) {
        return this.scrape({
            path: `/anime/${animeId}`,
            initialData: {
                title: "",
                poster: "",
                score: { value: "", users: "" },
                japanese: "",
                synonyms: "",
                english: "",
                status: "",
                type: "",
                source: "",
                duration: "",
                episodes: 0,
                season: "",
                studios: "",
                producers: "",
                aired: "",
                trailer: "",
                synopsis: { paragraphs: [], connections: [] },
                genreList: [],
                batchList: [],
                episodeList: [],
            },
        }, async ($, data) => {
            const info = this.parseDetails($);
            const batchElements = $(".listbatch a").toArray();
            batchElements.forEach((batchElement) => {
                const oriUrl = $(batchElement).attr("href");
                const title = $(batchElement).text().trim();
                const samehadakuUrl = this.generateSourceUrl(oriUrl);
                const batchId = this.generateSlug(oriUrl);
                const href = this.generateHref("batch", batchId);
                data.batchList.push({
                    title,
                    batchId,
                    href,
                    samehadakuUrl,
                });
            });
            const genreElements = $(".genre-info a").toArray();
            genreElements.forEach((genreElement) => {
                const card = this.parseLinkCard($(genreElement), "genres");
                data.genreList.push({
                    title: card.title,
                    genreId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            const episodeElements = $(".lstepsiode ul li .eps a").toArray();
            episodeElements.forEach((episodeElement) => {
                const card = this.parseLinkCard($(episodeElement), "episode");
                data.episodeList.push({
                    title: this.num(card.title.split(" ")[0]),
                    episodeId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            data.title = $(".infoanime h1.entry-title").text().replace("Nonton Anime", "").trim();
            data.poster = this.str($(".infoanime .thumb img").attr("src"));
            data.score.value = $(".rating-area [itemprop=ratingValue]").text();
            data.score.users = $(".rating-area [itemprop=ratingCount]").text();
            data.episodes = this.num(info.totalEpisode);
            data.studios = info.studio;
            data.aired = info.released;
            data.trailer = this.str($(".trailer-anime iframe").attr("src"));
            data.synopsis = this.parseSynopsis($);
            delete info["totalEpisode"];
            delete info["studio"];
            delete info["released"];
            data = { ...data, ...info };
            const isEmpty = !data.title && data.episodeList.length === 0 && data.genreList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseAnimeEpisode(episodeId, originUrl) {
        return this.scrape({
            path: `/${episodeId}`,
            initialData: {
                title: "",
                animeId: "",
                poster: "",
                releasedOn: "",
                defaultStreamingUrl: "",
                hasPrevEpisode: false,
                prevEpisode: null,
                hasNextEpisode: false,
                nextEpisode: null,
                synopsis: { paragraphs: [], connections: [] },
                genreList: [],
                server: { qualities: [] },
                downloadUrl: { formats: [] },
                recommendedEpisodeList: [],
                movie: { href: "", samehadakuUrl: "", animeList: [] },
            },
            axiosConfig: {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-User": "?1",
                    "Upgrade-Insecure-Requests": "1",
                },
                timeout: 10000,
                validateStatus: (status) => status < 500,
            },
        }, async ($, data) => {
            try {
                const getDefaultStreaming = async () => {
                    try {
                        const el = $($(".east_player_option")[0]);
                        if (!el.length) {
                            console.log("No player option found");
                            return "";
                        }
                        const postData = el.attr("data-post");
                        const numeData = el.attr("data-nume");
                        const typeData = el.attr("data-type");
                        if (!postData || !numeData || !typeData) {
                            console.log("Missing player data:", { postData, numeData, typeData });
                            return "";
                        }
                        console.log("Fetching streaming data:", {
                            post: postData,
                            nume: numeData,
                            type: typeData,
                        });
                        const proxyUrl = `${originUrl}/api/proxy`;
                        const result = await (0, dataFetcher_1.wajikFetch)(proxyUrl, originUrl, {
                            method: "POST",
                            responseType: "text",
                            headers: {
                                "Content-Type": "application/json",
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                                Accept: "application/json, text/javascript, */*; q=0.01",
                                "Accept-Language": "en-US,en;q=0.9",
                                Origin: originUrl,
                                Referer: originUrl,
                            },
                            data: JSON.stringify({
                                url: `${this.baseUrl}/wp-admin/admin-ajax.php`,
                                method: "POST",
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                                    Accept: "application/json, text/javascript, */*; q=0.01",
                                    "Accept-Language": "en-US,en;q=0.9",
                                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                    "X-Requested-With": "XMLHttpRequest",
                                    Origin: this.baseUrl,
                                    Referer: this.baseUrl,
                                },
                                data: new URLSearchParams({
                                    action: "player_ajax",
                                    post: postData,
                                    nume: numeData,
                                    type: typeData,
                                }).toString(),
                            }),
                            timeout: 10000,
                        });
                        if (!result || !result.data) {
                            console.log("No streaming data received");
                            return "";
                        }
                        const streamingUrl = this.generateSrcFromIframeTag(result.data);
                        console.log("Generated streaming URL:", streamingUrl);
                        return streamingUrl;
                    }
                    catch (error) {
                        console.error("Error getting default streaming:", error);
                        return "";
                    }
                };
                data.title = $("h1.entry-title").text();
                const breadcrumbLinks = $("#breadcrumbs li a").toArray();
                const animeLink = breadcrumbLinks.find((link) => $(link).text().includes("Season"));
                data.animeId = animeLink ? this.generateSlug($(animeLink).attr("href")) : "";
                data.poster = this.str($(".thumb img").attr("src"));
                data.releasedOn = $(".time-post").text().trim();
                data.defaultStreamingUrl = await getDefaultStreaming();
                data.downloadUrl = this.parseDownloadUrl($);
                console.log("Default streaming URL:", data.defaultStreamingUrl);
                if (data.defaultStreamingUrl.includes("api.wibufile.com")) {
                    data.defaultStreamingUrl =
                        originUrl +
                            path_1.default
                                .join("/", this.baseUrlPath, `wibufile?url=${data.defaultStreamingUrl}`)
                                .replace(/\\/g, "/");
                    console.log("Modified wibufile URL:", data.defaultStreamingUrl);
                }
                const serverElements = $(".server_option ul li .east_player_option").toArray();
                const serverQualities = [
                    { title: "unknown", serverList: [] },
                    { title: "360p", serverList: [] },
                    { title: "480p", serverList: [] },
                    { title: "720p", serverList: [] },
                    { title: "1080p", serverList: [] },
                    { title: "4k", serverList: [] },
                ];
                let fixedServerQualities = [];
                serverQualities.forEach((quality) => {
                    serverElements.forEach((serverElement) => {
                        if (!$(serverElement).attr("style")?.includes("not-allowed")) {
                            const title = $(serverElement).text().trim();
                            if (title.toLowerCase().includes(quality.title)) {
                                fixedServerQualities.push(title);
                            }
                        }
                    });
                });
                serverQualities.forEach((quality) => {
                    serverElements.forEach((serverElement) => {
                        if (!$(serverElement).attr("style")?.includes("not-allowed")) {
                            const title = $(serverElement).text().trim();
                            const postData = this.str($(serverElement).attr("data-post"));
                            const numeData = this.str($(serverElement).attr("data-nume"));
                            const typeData = this.str($(serverElement).attr("data-type"));
                            const serverId = this.enrawr(`${postData}-${numeData}-${typeData}`);
                            const href = this.generateHref("server", serverId);
                            if (title.toLowerCase().includes(quality.title)) {
                                quality.serverList.push({ title, serverId, href });
                            }
                            else {
                                if (!fixedServerQualities.includes(title) && quality.title === "unknown") {
                                    quality.serverList.push({ title, serverId, href });
                                }
                            }
                        }
                    });
                });
                data.server.qualities = serverQualities;
                const navigationElements = $(".naveps .nvs:not(.nvsc) a").toArray();
                navigationElements.forEach((navigationElement, index) => {
                    const card = this.parseLinkCard($(navigationElement), "episode");
                    if (card.slug !== "#") {
                        if (index === 0) {
                            data.prevEpisode = {
                                title: "Prev",
                                episodeId: card.slug,
                                href: card.href,
                                samehadakuUrl: card.samehadakuUrl,
                            };
                        }
                        else {
                            data.nextEpisode = {
                                title: "Next",
                                episodeId: card.slug,
                                href: card.href,
                                samehadakuUrl: card.samehadakuUrl,
                            };
                        }
                    }
                });
                data.hasPrevEpisode = data.prevEpisode ? true : false;
                data.hasNextEpisode = data.nextEpisode ? true : false;
                data.movie.href = this.generateHref("movies");
                data.movie.samehadakuUrl = this.generateSourceUrl($(".widgets h3 .linkwidget").attr("href"));
                const movieElements = $(".widgetseries ul li").toArray();
                movieElements.forEach((movieElement) => {
                    const card = this.parseAnimeCard3($, $(movieElement));
                    data.movie.animeList.push(card);
                });
                const connectionElements = $(".desc a").toArray();
                connectionElements.forEach((connectionElement) => {
                    const card = this.parseLinkCard($(connectionElement), "anime");
                    data.synopsis.connections?.push({
                        title: card.title,
                        animeId: card.slug,
                        href: card.href,
                        samehadakuUrl: card.samehadakuUrl,
                    });
                });
                $(".desc a").remove();
                const paragraph = $(".desc").text().trim();
                data.synopsis.paragraphs.push(paragraph);
                const genreElements = $(".genre-info a").toArray();
                genreElements.forEach((genreElement) => {
                    const card = this.parseLinkCard($(genreElement), "genres");
                    data.genreList.push({
                        title: card.title,
                        genreId: card.slug,
                        href: card.href,
                        samehadakuUrl: card.samehadakuUrl,
                    });
                });
                const animeElements = $(".lstepsiode ul li").toArray();
                animeElements.forEach((animeElement) => {
                    const title = $(animeElement).find(".epsleft .lchx").text();
                    const poster = this.str($(animeElement).find(".epsright img").attr("src"));
                    const releaseDate = $(animeElement).find(".epsleft .date").text();
                    const oriUrl = $(animeElement).find(".epsright a").attr("href");
                    const samehadakuUrl = this.generateSourceUrl(oriUrl);
                    const animeId = this.generateSlug(oriUrl);
                    const href = this.generateHref("episode", animeId);
                    data.recommendedEpisodeList.push({
                        title,
                        poster,
                        releaseDate,
                        episodeId,
                        href,
                        samehadakuUrl,
                    });
                });
                const isEmpty = !data.title && data.genreList.length === 0 && data.downloadUrl.formats.length === 0;
                this.checkEmptyData(isEmpty);
                return data;
            }
            catch (error) {
                console.error("Error parsing anime episode:", error);
                throw error;
            }
        });
    }
    async parseServerUrl(serverId, originUrl) {
        const data = { url: "" };
        const serverIdArr = this.derawr(serverId).split("-");
        const post = serverIdArr[0];
        const nume = serverIdArr[1];
        const type = serverIdArr[2];
        try {
            const maxRetries = 3;
            let retryCount = 0;
            let lastError;
            while (retryCount < maxRetries) {
                try {
                    const proxyUrl = `${originUrl}/api/proxy`;
                    console.log(`Attempt ${retryCount + 1} to fetch from proxy:`, proxyUrl);
                    const url = await (0, dataFetcher_1.wajikFetch)(proxyUrl, originUrl, {
                        method: "POST",
                        responseType: "text",
                        headers: {
                            "Content-Type": "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                            Accept: "application/json, text/javascript, */*; q=0.01",
                            "Accept-Language": "en-US,en;q=0.9",
                            Origin: originUrl,
                            Referer: originUrl,
                        },
                        data: JSON.stringify({
                            url: `${this.baseUrl}/wp-admin/admin-ajax.php`,
                            method: "POST",
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                                Accept: "application/json, text/javascript, */*; q=0.01",
                                "Accept-Language": "en-US,en;q=0.9",
                                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                "X-Requested-With": "XMLHttpRequest",
                                Origin: this.baseUrl,
                                Referer: this.baseUrl,
                            },
                            data: new URLSearchParams({
                                action: "player_ajax",
                                post: post || "",
                                nume: nume || "",
                                type: type || "",
                            }).toString(),
                        }),
                        timeout: 10000,
                    });
                    if (!url || !url.data) {
                        throw new Error("No data received from server");
                    }
                    data.url = this.generateSrcFromIframeTag(url.data);
                    if (data.url.includes("api.wibufile.com")) {
                        data.url =
                            originUrl +
                                path_1.default.join("/", this.baseUrlPath, `wibufile?url=${data.url}`).replace(/\\/g, "/");
                    }
                    const isEmpty = !data.url || data.url === "No iframe found";
                    if (isEmpty) {
                        throw new Error("No valid streaming URL found");
                    }
                    return data;
                }
                catch (error) {
                    lastError = error;
                    console.error(`Attempt ${retryCount + 1} failed:`, error.message);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                }
            }
            console.error("All retry attempts failed:", lastError);
            throw lastError;
        }
        catch (error) {
            console.error("Error getting server URL:", error);
            (0, error_1.setResponseError)(400);
            throw error;
        }
    }
    parseWibuFile(url) {
        return (0, dataFetcher_1.wajikFetch)(url, this.baseUrl);
    }
    parseAnimeBatch(batchId) {
        return this.scrape({
            path: `/batch/${batchId}`,
            initialData: {
                title: "",
                animeId: "",
                poster: "",
                japanese: "",
                synonyms: "",
                english: "",
                status: "",
                type: "",
                source: "",
                score: "",
                duration: "",
                episodes: 0,
                season: "",
                studios: "",
                producers: "",
                aired: "",
                releasedOn: "",
                synopsis: { paragraphs: [], connections: [] },
                genreList: [],
                downloadUrl: { formats: [] },
                recommendedAnimeList: [],
            },
        }, async ($, data) => {
            const details = this.parseDetails($);
            data.title = $(".entry-title").text();
            data.animeId = this.generateSlug($($("#breadcrumbs li a").toArray()[2]).attr("href"));
            data.episodes = this.num(details.totalEpisode);
            data.studios = details.studio;
            data.aired = details.released;
            data.releasedOn = $(".year").text().split("-")[1].trim();
            data.poster = this.str($(".thumb-batch img").attr("src"));
            data.synopsis = this.parseSynopsis($);
            data.downloadUrl = this.parseDownloadUrl($);
            delete details["totalEpisode"];
            delete details["studio"];
            delete details["released"];
            delete details["genre"];
            const genreElements = $($(".infox .spe span")[11]).find("a").toArray();
            genreElements.forEach((genreElement) => {
                const card = this.parseLinkCard($(genreElement), "genres");
                data.genreList.push({
                    title: card.title,
                    genreId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            const animeElements = $(".widget-post .animepost").toArray();
            animeElements.forEach((animeElement) => {
                const title = this.str($(animeElement).find("a").attr("title"));
                const poster = this.str($(animeElement).find("img").attr("src"));
                const oriUrl = $(animeElement).find("a").attr("href");
                const samehadakuUrl = this.generateSourceUrl(oriUrl);
                const animeId = this.generateSlug(oriUrl);
                const href = this.generateHref("anime", animeId);
                data.recommendedAnimeList.push({
                    title,
                    poster,
                    animeId,
                    href,
                    samehadakuUrl,
                });
            });
            data = { ...data, ...details };
            const isEmpty = !data.title && data.downloadUrl.formats.length === 0 && data.genreList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    generateSourceUrl(oriUrl) {
        if (!oriUrl)
            return "";
        const url = new URL(oriUrl);
        url.hostname = "samehadaku.now";
        return url.toString();
    }
}
exports.default = SamehadakuParser;
