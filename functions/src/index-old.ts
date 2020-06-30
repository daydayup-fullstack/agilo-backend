import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import {Column, HomepageDataType, Project, User, Workspace} from "./interface";


admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccount.json")),
});

const app = express();
const db = admin.firestore();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});

// --- handshake ---
app.get("/", (req, res) => {
    res.send({
        status: "success",
        message: "hello world!",
    });
});
const loadProjects = async (workspaceId: string): Promise<any> => {
    const workspaceSnapshot = await db.doc(`/workspaces/${workspaceId}`).get();

    let {
        type,
        projectOrder,
        members,
        description,
        name,
    } = workspaceSnapshot.data() as any;

    const workspace = {
        id: workspaceId,
        type,
        projectsInOrder: projectOrder,
        members,
        name,
        description,
    } as Workspace;

    let projectsSnapshot = await db
        .collection("projects")
        .where("workspace", "==", workspaceId)
        .get();


    const projectsData = projectsSnapshot.docs.map((doc) => {
        let {
            createdOn,
            columnOrder,
            colorIndex,
            iconIndex,
            name,
            activeUsers,
        } = doc.data() as Project;

        return {
            id: doc.id,
            createdOn,
            columnOrder,
            colorIndex,
            iconIndex,
            name,
            activeUsers,
        };
    });

    const membersSnaphot = await db
        .collection("/users")
        .where("workspaces", "array-contains", workspaceId)
        .get();

    const allMembers = membersSnaphot.docs.map((doc) => {
        return {
            id: doc.id,
            ...doc.data(),
        };
    });

    const result = {
        workspace: {...workspace, allMembers},
        allProjects: projectsData,
    };
    return result;
};

// Level 1 --- user info after login ---> Home
// Load default workspace, projects in order, project basic information
app.get("/users/:id", async (req, res, next) => {
    const userId = req.params.id;

    try {
        const snapshot = await db.doc(`/users/${userId}`).get();

        let user = {
            id: snapshot.id,
            ...snapshot.data(),
        } as User;

        const workspaceId = user.workspaces[0];
        const data = await loadProjects(workspaceId);

        const wpSnapshot = await db
            .collection(`/workspaces`)
            .where("members", "array-contains", userId)
            .get();
        let allWorkspaces = {};

        wpSnapshot.docs.forEach((doc) => {
            allWorkspaces = {
                ...allWorkspaces,
                [doc.id]: {
                    id: doc.id,
                    ...doc.data(),
                },
            };
        });

        const result = {
            user: {...user, allWorkspaces},
            workspace: data.workspace,
            allProjects: data.allProjects,
        } as HomepageDataType;

        res.status(200).json(result);
    } catch (e) {
        console.log(e);
    }
});

// Level 2 --- project detail ---> Project view
// Load all the tasks under selected projects, showing columns in order, task basic information
// get columns and tasks
app.get("/projects/:id", async (req, res, next) => {
    const projectId = req.params.id;

    const snapshot = await db
        .collection("tasks")
        .where("projectIds", "array-contains", projectId)
        .get();

    const columnSnapshot = await db
        .collection("columns")
        .where("projectId", "==", projectId)
        .get();

    let tasks = {};
    let columns = {};

    snapshot.docs.map((doc) => {
        tasks = {
            ...tasks,
            [doc.id]: {
                id: doc.id,
                ...doc.data(),
            },
        };
    });

    columnSnapshot.docs.map((doc) => {
        columns = {
            ...columns,
            [doc.id]: {
                id: doc.id,
                ...doc.data(),
            },
        };
    });

    const result = {columns: columns, tasks: tasks};

    res.status(200).json(result);
});

// --- get workspace ---
app.get("/workspaces/:workspaceId", async (req, res) => {
    const workspaceId = req.params.workspaceId;
    try {
        const data = await loadProjects(workspaceId);

        const result = {
            workspace: data.workspace,
            allProjects: data.allProjects,
        };

        res.status(200).json(result);
    } catch (e) {
        console.log(e);
    }
});

// todo --- add user ---
// todo --- add workspace ---

// --- put user ---
app.put("/users/:userId", async (req, res) => {
    const {userId} = req.params;

    try {
        await db.doc(`/users/${userId}`).update({
            ...req.body,
        });

        res.status(200).json({message: `user ${userId} updated!`});
    } catch (e) {
        res.status(500).json({error: e});
    }
});

// --- add project --->
app.post("/projects", async (req, res, next) => {
    const {name, colorIndex, iconIndex, workspace, projectOrder, id} = req.body;

    try {
        await db.collection("projects").doc(id).set({
            name,
            colorIndex,
            iconIndex,
            createdOn: admin.firestore.Timestamp.now(),
            columnOrder: [],
            workspace,
            activeUsers: [],
        });

        await db.doc(`/workspaces/${workspace}`).update({
            projectOrder: [...projectOrder, id],
        });

        res.status(201).send(`Project ${id} - successfully added`);
    } catch (e) {
        console.log(e);
    }
});

// --- delete project ---
app.delete("/workspaces/:workspaceId/projects/:projectId", async (req, res) => {
    const {workspaceId, projectId} = req.params;

    try {
        const workspaceRef = db.doc(`/workspaces/${workspaceId}`);
        await workspaceRef.update({
            projectOrder: admin.firestore.FieldValue.arrayRemove(projectId),
        });

        await db.doc(`/projects/${projectId}`).delete();
        res
            .status(200)
            .send({message: `project ${projectId} is successfully deleted.`});
    } catch (e) {
        console.log(e);
    }
});

app.put(`/projects/:projectId`, async (req, res) => {
    const {projectId} = req.params;

    try {
        if (req.body) {
            await db.doc(`/projects/${projectId}`).update({
                ...req.body,
            });
            res.status(200).json({
                message: `project ${projectId} updated`,
            });
        }
    } catch (e) {
        console.log(e);
    }
});

// --- delete task ---
app.delete("/tasks/:taskId", async (req, res) => {
    const {taskId} = req.params;

    try {
        await db.doc(`/tasks/${taskId}`).delete();
        res.status(200).json({message: `task ${taskId} deleted`});
    } catch (e) {
        console.log(e);
    }
});

app.put(`/tasks/:taskId`, async (req, res) => {
    const {taskId} = req.params;
    try {
        // check to see if the task exists
        const taskRef = db.doc(`/tasks/${taskId}`);

        const doc = await taskRef.get();

        // if so , update the task
        if (doc.exists) {
            await taskRef.update({
                ...req.body,
            });

            res
                .status(200)
                .json({message: `task ${taskId} has been successfully updated`});
        } else {
            // otherwise, create a new task
            const {authorId, projectIds, columnId, name} = req.body;

            await db.collection("/tasks").doc(taskId).set({
                name,
                authorId,
                projectIds,
                isCompleted: false,
                likedBy: [],
                createdOn: admin.firestore.Timestamp.now(),
                assignedUserIds: [],
                attachments: [],
            });

            const columnSnapshot = await db.doc(`/columns/${columnId}`).get();
            const column = columnSnapshot.data() as Column;

            await db.doc(`/columns/${columnId}`).update({
                taskIds: [taskId, ...column.taskIds],
            });

            res.status(201).json({data: req.body});
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({message: e});
    }
});

app.post(`/columns`, async (req, res) => {
    const {id, title, projectId} = req.body;

    // column - {id: clientGenereated, title: string}

    try {
        // add column
        await db.collection(`/columns`).doc(id).set({
            title,
            projectId,
            taskIds: [],
        });

        res.status(201).json({
            message: `new column ${id} has been successfully created`,
        });
    } catch (e) {
        console.log(e);
    }
});

app.delete("/columns/:columnId", async (req, res) => {
    const {columnId} = req.params;

    try {
        //  delete the column
        await db.doc(`/columns/${columnId}`).delete();

        //  delete all the tasks under this column
        res.status(200).json({
            message: `column ${columnId} has been successfully deleted.`,
        });
    } catch (e) {
        console.log(e);
    }
});

app.put("/columns/:columnId", async (req, res) => {
    const {columnId} = req.params;

    try {
        if (req.body) {
            await db.doc(`/columns/${columnId}`).update({
                ...req.body,
            });

            res.status(200).json({
                message: `column ${columnId} has been successfully updated`,
            });
        }
    } catch (e) {
        console.log(e);
    }
});

// ============ get users under a particular workspace  ===================
app.get("/workspaces/:workspaceId/members", async (req, res) => {
    const workspaceId = req.params.workspaceId;

    try {
        const snaphot = await db
            .collection("/users")
            .where("workspaces", "array-contains", workspaceId)
            .get();

        const result = snaphot.docs.map((doc) => {
            return {
                id: doc.id,
                ...doc.data(),
            };
        });

        res.status(200).json(result);
    } catch (e) {
        console.log(e);
    }
});

// ============== init workspace with user id =========================
app.options("/initUser/:userId", async (req, res) => {
    const {userId} = req.params;
    const workspaceId = db.collection("/workspaces").doc().id;
    const projectId = db.collection("/projects").doc().id;

    // project
    await db.doc(`/projects/${projectId}`).set({
        workspace: workspaceId,
        columnOrder: [],
        colorIndex: Math.floor(Math.random() * 16),
        iconIndex: Math.floor(Math.random() * 28),
        createdOn: admin.firestore.Timestamp.now(),
        name: "Welcome",
    });
    // workspace
    await db.doc(`/workspaces/${workspaceId}`).set({
        type: "personal",
        members: [userId],
        projectOrder: [projectId], // todo - add project id in it
        userId: userId,
    });
    // user
    await db.doc(`/users/${userId}`).set({
        avatar: "",
        colorIndex: Math.floor(Math.random() * 16),
        email: "",
        firstName: "Guest",
        lastName: "Guest",
        workspaces: [workspaceId],
        privateProjects: [],
        starredProjects: [projectId],
    });

    res.status(201).json({
        message: "init anonymous user - success",
        userId: userId,
    });
});

export const api = functions.https.onRequest(app);
