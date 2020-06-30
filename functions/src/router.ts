import * as Router from "@koa/router";
import getUsers from "./controllers/user/get";
import updateUser from "./controllers/user/update";
import getProject from "./controllers/project/get";
import getWorkspace from "./controllers/workspace/get";
import createProject from "./controllers/project/create";
import deleteProject from "./controllers/project/delete";
import updateProject from "./controllers/project/update";
import updateTask from "./controllers/task/update";
import deleteTask from "./controllers/task/delete";

const router = new Router();

// === user ===
router.get("/users/:id", getUsers);
router.put("/users/:id", updateUser);

// === project ===
router.get("/projects/:id", getProject);
router.post("/projects", createProject);
router.delete("/workspaces/:workspaceId/projects/:projectId", deleteProject);
router.put("/projects/:id", updateProject);

// // === workspace ===
router.get("/workspaces/:id", getWorkspace);

// === task ===
router.delete("/tasks/:id", deleteTask);
router.put("/tasks/:id", updateTask);
export default router;
