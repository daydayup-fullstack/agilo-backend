import getUsers from "./controllers/user/get";
import updateUser from "./controllers/user/update";
import * as Router from "@koa/router";
import getProject from "./controllers/project/get";
import getWorkspace from "./controllers/workspace/get";
import createProject from "./controllers/project/create";
import deleteProject from "./controllers/project/delete";

const router = new Router();

// === user ===
router.get("/users/:id", getUsers);
router.put("/users/:id", updateUser);

// === project ===
router.get("/projects/:id", getProject);
router.post("/projects", createProject);
router.delete("/workspaces/:workspaceId/projects/:projectId", deleteProject);

// // === workspace ===
router.get("/workspaces/:id", getWorkspace);

export default router;
