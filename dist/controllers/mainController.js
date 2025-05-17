"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("../helpers/error");
const index_1 = require("../anims/otakudesu/index");
const index_2 = require("../anims/samehadaku/index");
const payload_1 = __importDefault(require("../helpers/payload"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const mainController = {
    getMainView(req, res, next) {
        try {
            const getViewFile = (filePath) => {
                return path_1.default.join(__dirname, "..", "public", "views", filePath);
            };
            res.sendFile(getViewFile("home.html"));
        }
        catch (error) {
            next(error);
        }
    },
    getMainViewData(req, res, next) {
        try {
            function getData() {
                const animeSources = {
                    otakudesu: index_1.otakudesuInfo,
                    samehadaku: index_2.samehadakuInfo,
                };
                const data = {
                    message: "WAJIK ANIME API IS READY 🔥🔥🔥",
                    sources: Object.values(animeSources),
                };
                const newData = {
                    message: data.message,
                    sources: [],
                };
                data.sources.forEach((source) => {
                    const exist = fs_1.default.existsSync(path_1.default.join(__dirname, "..", "anims", source.baseUrlPath));
                    if (exist) {
                        newData.sources.push({
                            title: source.title,
                            route: source.baseUrlPath,
                        });
                    }
                });
                return newData;
            }
            const data = getData();
            res.json((0, payload_1.default)(res, { data }));
        }
        catch (error) {
            next(error);
        }
    },
    async proxy(req, res, next) {
        try {
            const { url, method = "GET", data, headers = {} } = req.body;
            if (!url) {
                throw new Error("URL is required");
            }
            console.log("Proxy request:", {
                url,
                method,
                headers,
                data: data ? "Data present" : "No data",
            });
            try {
                new URL(url);
            }
            catch (error) {
                throw new Error("Invalid URL format");
            }
            const response = await (0, axios_1.default)({
                url,
                method,
                data,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept: "application/json, text/javascript, */*; q=0.01",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                    Origin: new URL(url).origin,
                    Referer: url,
                    ...headers,
                },
                timeout: 10000,
                validateStatus: (status) => status < 500,
                maxRedirects: 5,
                maxContentLength: 50 * 1024 * 1024,
            });
            console.log("Proxy response:", {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                contentType: response.headers["content-type"],
            });
            if (response.headers["content-type"]?.includes("application/json")) {
                res.json(response.data);
            }
            else {
                res.send(response.data);
            }
        }
        catch (error) {
            console.error("Proxy error:", {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers,
            });
            if (error.response) {
                res.status(error.response.status).json({
                    statusCode: error.response.status,
                    statusMessage: error.response.statusText,
                    message: error.message,
                    data: error.response.data,
                });
            }
            else {
                res.status(500).json({
                    statusCode: 500,
                    statusMessage: "Internal Server Error",
                    message: error.message,
                });
            }
        }
    },
    _404(req, res, next) {
        next((0, error_1.setResponseError)(404, "halaman tidak ditemukan"));
    },
};
exports.default = mainController;
