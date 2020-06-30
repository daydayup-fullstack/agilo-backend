import getUsers from "./controllers/user/get";
import updateUser from "./controllers/user/update";
import * as Router from "@koa/router";
import getProject from "./controllers/project/get";
import getWorkspace from "./controllers/workspace/get";
import createProject from "./controllers/project/create";

const router = new Router();

// === user ===
router.get("/users/:id", getUsers);
router.put("/users/:id", updateUser);

// === project ===
router.get("/projects/:id", getProject);
router.post("/projects", createProject);

// // === workspace ===
router.get("/workspaces/:id", getWorkspace);

router.post("/test", async (ctx) => {
    const {body} = ctx.req as any;
    ctx.body = {
        message: "success",
        body: body,
    };
});
export default router;
