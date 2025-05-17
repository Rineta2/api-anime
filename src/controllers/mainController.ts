import type { NextFunction, Request, Response } from "express";
import { setResponseError } from "@helpers/error";
import { otakudesuInfo } from "@otakudesu/index";
import { samehadakuInfo } from "@samehadaku/index";
import generatePayload from "@helpers/payload";
import path from "path";
import fs from "fs";
import axios from "axios";

const mainController = {
  getMainView(req: Request, res: Response, next: NextFunction): void {
    try {
      const getViewFile = (filePath: string) => {
        return path.join(__dirname, "..", "public", "views", filePath);
      };

      res.sendFile(getViewFile("home.html"));
    } catch (error) {
      next(error);
    }
  },

  getMainViewData(req: Request, res: Response, next: NextFunction): void {
    try {
      function getData() {
        const animeSources = {
          otakudesu: otakudesuInfo,
          samehadaku: samehadakuInfo,
        };

        const data = {
          message: "WAJIK ANIME API IS READY 🔥🔥🔥",
          sources: Object.values(animeSources),
        };

        const newData: { message: string; sources: any[] } = {
          message: data.message,
          sources: [],
        };

        data.sources.forEach((source) => {
          const exist = fs.existsSync(path.join(__dirname, "..", "anims", source.baseUrlPath));

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

      res.json(generatePayload(res, { data }));
    } catch (error) {
      next(error);
    }
  },

  async proxy(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const response = await axios({
        url,
        method,
        data,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "en-US,en;q=0.9",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Origin: new URL(url).origin,
          Referer: url,
          ...headers,
        },
        timeout: 10000,
        validateStatus: (status) => status < 500, // Terima semua response kecuali 5xx
      });

      console.log("Proxy response:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Kirim response sesuai dengan content type
      if (response.headers["content-type"]?.includes("application/json")) {
        res.json(response.data);
      } else {
        res.send(response.data);
      }
    } catch (error: any) {
      console.error("Proxy error:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
      });

      // Jika error dari target server
      if (error.response) {
        res.status(error.response.status).json({
          statusCode: error.response.status,
          statusMessage: error.response.statusText,
          message: error.message,
          data: error.response.data,
        });
      } else {
        // Jika error sebelum mendapat response
        res.status(500).json({
          statusCode: 500,
          statusMessage: "Internal Server Error",
          message: error.message,
        });
      }
    }
  },

  _404(req: Request, res: Response, next: NextFunction): void {
    next(setResponseError(404, "halaman tidak ditemukan"));
  },
};

export default mainController;
