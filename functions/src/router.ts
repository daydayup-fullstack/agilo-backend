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
import createColumn from "./controllers/column/create";
import deleteColumn from "./controllers/column/delete";
import updateColumn from "./controllers/column/update";
import getMembers from "./controllers/workspace/getMembers";
import initUser from "./controllers/user/initUser";
import createWorkspace from "./controllers/workspace/create";
import updateMembers from "./controllers/workspace/updateMembers";
import getWorkspaces from "./controllers/user/getWorkspaces";

const router = new Router();

// === user ===
router.get("/users/:id", getUsers);
router.put("/users/:id", updateUser);
router.post("/users/:userId/workspaces", createWorkspace);
router.get("/users/:userId/workspaces", getWorkspaces);

// === project ===
router.get("/projects/:id", getProject);
router.post("/projects", createProject);
router.delete("/workspaces/:workspaceId/projects/:projectId", deleteProject);
router.put("/projects/:id", updateProject);

// // === workspace ===
router.get("/workspaces/:id", getWorkspace);
router.get("/workspaces/:id/members", getMembers);
router.put("/workspaces/:id/members", updateMembers);

// === task ===
router.delete("/tasks/:id", deleteTask);
router.put("/tasks/:id", updateTask);

// === column ===
router.post("/columns", createColumn);
router.delete("/columns/:id", deleteColumn);
router.put("/columns/:id", updateColumn);

// === init user ===
router.post("/initUser/:userId", initUser);

export default router;
