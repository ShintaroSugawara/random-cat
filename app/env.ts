import { prependOnceListener } from "process";

if (!process.env.CAT_API_KEY) {
    throw new Error("環境変数 CAT_API_KEY が設定されていません");
}

export const CAT_API_KEY = process.env.CAT_API_KEY;