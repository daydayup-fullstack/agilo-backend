import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Koa from "koa";
import * as cors from "@koa/cors";
import * as Router from "@koa/router";
import getUsers from "./controllers/user/get";
import updateUser from "./controllers/user/update";
// import createProject from "./controllers/project/create";
// import getProject from "./controllers/project/get";
// import getWorkspace from "./controllers/workspace/get";

admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccount.json")),
});

const app = new Koa();
const router = new Router();
app.use(router.routes()).use(router.allowedMethods());
app.use(cors());

app.context.db = admin.firestore();

// === user ===
router.get("/users/:id", getUsers);
router.put("/users/:id", updateUser);
//
// // === project ===
// router.get("/projects/:id", getProject);
// router.post("/projects", createProject);
//
// // === workspace ===
// router.get("/workspaces/:id", getWorkspace);

export const api = functions.https.onRequest(app.callback());
