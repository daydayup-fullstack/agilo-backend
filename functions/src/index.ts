import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";

interface HomepageDataType {
  user: User;
  workspace: Workspace;
  allProjects: Project[];
}

interface User {
  id: string;
  avatar: string;
  colorIndex: number;
  email: string;
  firstName: string;
  lastName: string;
  privateProjects: string[];
  starredProjects: string[];
  workspaces: string[];
}

interface Project {
  id: string;
  name: string;
  colorIndex: number;
  iconIndex: number;
  createdOn: number;
  dueDate: number;
  columnOrder: string[];
  activeUsers: string[];
}

interface Workspace {
  id: string;
  type: string;
  projectsInOrder: string[];
  members: string[];
  description?: string;
  name: string;
}

interface Column {
  title: string;
  taskIds: string[];
}

interface Task {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  createdOn: any;
  dueDate?: any;
  authorId: string;
  assignedUserIds: string[];
  projectIds: string[];
  likedBy: string[];
  attachments: string[];
}

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

  const result = {
    workspace: workspace,
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

    const result = {
      user: user,
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
    .where("projectId", "array-contains", projectId)
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

  const result = { columns: columns, tasks: tasks };

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

// --- add project --->
app.post("/projects", async (req, res, next) => {
  const { name, colorIndex, iconIndex, workspace, projectOrder } = req.body;

  try {
    await db.collection("projects").doc().set({
      name,
      colorIndex,
      iconIndex,
      createdOn: admin.firestore.Timestamp.now(),
      columns: null,
      columnOrder: [],
      workspace,
    });

    const newProjectId = db.collection("/workspaces").doc().id;

    await db.doc(`/workspaces/${workspace}`).update({
      projectOrder: [...projectOrder, newProjectId],
    });

    res.status(200).send(`Project ${newProjectId} - successfully added`);
  } catch (e) {
    console.log(e);
  }
});

// --- delete project ---
app.delete("/projects/:projectId", async (req, res) => {
  const { workspace, projectOrder } = req.body;
  const projectId = req.params.projectId;

  try {
    await db.doc(`/projects/${projectId}`).delete();
    await db.doc(`/workspaces/${workspace}`).update({
      projectOrder,
    });

    res
      .status(200)
      .send({ message: `project ${projectId} is successfully deleted.` });
  } catch (e) {
    console.log(e);
  }
});

// todo: --- update project --- can be so many things to update

// --- add task ---
app.post("/projects/:projectId/tasks", async (req, res) => {
  const projectId = req.params.projectId;
  let { name, description, authorId, columnId, taskIds } = req.body;

  const taskId = db.collection("tasks").doc().id;
  const storyId = db.collection("stories").doc().id;

  await db.collection("stories").doc(storyId).set({
    what: "CREATED",
    when: admin.firestore.Timestamp.now(),
    who: authorId,
    taskId,
  });

  await db
    .collection("tasks")
    .doc(taskId)
    .set({
      name,
      description,
      authorId,
      projectId,
      isCompleted: false,
      createdOn: admin.firestore.Timestamp.now(),
      assignedUserIds: [],
      attachments: [],
      stories: [storyId],
    });

  await db.doc(`/columns/${columnId}`).update({
    taskIds: [taskId, ...taskIds],
  });

  res.status(200).json({
    task: taskId,
    message: "Task added successfully",
  });
});

// --- delete task ---
app.delete(
  "/projects/:projectId/columns/:columnId/tasks/:taskId",
  async (req, res) => {
    const projectId = req.params.projectId;
    const columnId = req.params.columnId;
    const taskId = req.params.taskId;
    const task = req.body;

    // res.status(200).json({
    //   projectId: projectId,
    //   columnId: columnId,
    //   taskId: taskId,
    //   task: task,
    // });

    try {
      // delete task from its containing column
      const columnRef = db.doc(`columns/${columnId}`);
      const snapshot = (await columnRef.get()) as any;
      const newTaskIds = snapshot.data().taskIds;
      const index = newTaskIds.indexOf(taskId);
      newTaskIds.splice(index, 1);
      await columnRef.update({ taskIds: newTaskIds });

      if (task.projectIds.length === 1 && task.projectIds[0] === projectId) {
        // delete the task itself
        await db.doc(`/tasks/${taskId}`).delete();
      } else {
        // todo - only delete project id from task's projectIds, and update the database
        const index = task.projectIds.indexOf(projectId);
        const newProjectIds = [...task.projectIds];
        newProjectIds.splice(index, 1);

        await db.doc(`/tasks/${taskId}`).update({
          projectIds: newProjectIds,
        });

        res.status(200).json({ message: `task ${taskId} is deleted` });
      }
    } catch (e) {
      console.log(e);
    }
  }
);

// todo: --- update task ---

// todo:  --- add column ---

// todo:  --- delete column ---

// todo: --- update column ---

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

export const api = functions.https.onRequest(app);
