import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Koa from "koa";
import * as cors from "@koa/cors";
import * as Router from "@koa/router";
import * as bodyParser from "koa-bodyparser";

admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccount.json")),
});

const db = admin.firestore();
const app = new Koa();
const router = new Router();

app.use(router.routes()).use(router.allowedMethods());
app.use(cors());
app.use(bodyParser());

router.get("/", async (ctx) => {
    ctx.body = {
        message: "Hello world!",
    };
});

export const api = functions.https.onRequest(app.callback());
