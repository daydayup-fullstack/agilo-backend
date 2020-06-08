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
  dueData: number;
  columnOrder: string[];
  activeUsers: string[];
}

interface Story {
  who: string;
  what: string;
  when: any;
  from?: any;
  to?: any;
  payload?: any;
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
  likedBy: string[];
  attachments: string[];
  stories: Story[];
}

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccount.json")),
});

const app = express();
const db = admin.firestore();

// --- handshake ---
app.get("/", (req, res) => {
  res.send({
    status: "success",
    message: "hello world!",
  });
});

// Level 1 --- user info after login ---> Home
// Load default workspace, projects in order, project basic information
app.get("/users/:id", async (req, res, next) => {
  const userId = req.params.id;
  const workspaceId = req.params.workspaceId;

  try {
    const snapshot = await db.doc(`/users/${userId}`).get();

    let user = {
      id: snapshot.id,
      ...snapshot.data(),
    } as User;

    const workspaceId = user.workspaces[0];
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
      user: user,
      workspace: workspace,
      allProjects: projectsData,
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

// Level 3 (possible) --- task details ---> stories
// load more information about particular task
app.get("/projects/:projectId/tasks/:taskId", async (req, res, next) => {
  const taskId = req.params.taskId;

  const stories = await db
    .collection("stories")
    .where("taskId", "==", taskId)
    .get();

  const result = {
    stories: stories.docs.map((doc) => doc.data()),
  };

  res.json(result);
});

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


// ============ get users under a particular workspace  ===================
app.get("/workspace/:workspaceId/members", async (req, res) => {
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
