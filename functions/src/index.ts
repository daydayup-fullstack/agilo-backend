import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Koa from "koa";
import * as cors from "@koa/cors";
import router from "./router";

admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccount.json")),
});

const app = new Koa();
app.context.db = admin.firestore();

app.use(cors());
app.use(router.routes()).use(router.allowedMethods());

export const api = functions.https.onRequest(app.callback());
