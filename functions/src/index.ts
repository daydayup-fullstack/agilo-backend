import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";

interface HomepageDataType {
  id: string;
  avatar: string;
  colorIndex: number;
  email: string;
  firstName: string;
  lastName: string;
  privateProjects: string[];
  starredProjects: string[];
  workspaces: string[];
  currentWorkspace: {
    id: string;
    type: string;
    projectOrder: string[];
    members?: string;
    description?: string;
    name?: string;

    projects: any;
  };
}

interface Project {
  id: string;
  colorIndex: number;
  iconIndex: number;
  name: string;
  createdOn: any;
  columnOrder: string[];
  columns?: any;
}

interface Story {
  who: string;
  what: string;
  when: any;
  from?: any;
  to?: any;
  payload?: any;
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

interface Workspace {
  id: string;
  description?: string;
  members?: string[];
  name: string;
  type: string;
  projectOrder: string[];
}

interface Column {
  title: string;
  taskIds: string[];
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

// --- user info after login ---> Home
// Load default workspace, projects in order, project basic information
app.get("/users/:id", async (req, res, next) => {
  const userId = req.params.id;
  try {
    const snapshot = await db.doc(`/users/${userId}`).get();

    let user = {
      id: snapshot.id,
      ...snapshot.data(),
    } as HomepageDataType;

    const defaultWorkspaceId = user.workspaces[0];
    const workspaceSnapshot = await db
      .doc(`/workspaces/${defaultWorkspaceId}`)
      .get();

    let {
      type,
      projectOrder,
      members,
      description,
      name,
    } = workspaceSnapshot.data() as any;

    if (type === "team") {
      user.currentWorkspace = {
        id: defaultWorkspaceId,
        type,
        projectOrder,
        members,
        name,
        description,
        projects: {},
      };
    } else {
      user.currentWorkspace = {
        id: defaultWorkspaceId,
        type,
        projectOrder,
        projects: {},
      };
    }

    let projectsSnapshot = await db
      .collection("projects")
      .where("workspace", "==", defaultWorkspaceId)
      .get();

    const projectsData = projectsSnapshot.docs.map((doc) => {
      let {
        createdOn,
        columnOrder,
        colorIndex,
        iconIndex,
        name,
        columns,
      } = doc.data() as Project;

      return {
        id: doc.id,
        createdOn,
        columnOrder,
        colorIndex,
        iconIndex,
        name,
        columns,
      };
    });

    let data = {};

    projectsData.map((p) => {
      data = { ...data, [p.id]: p };
    });

    user.currentWorkspace.projects = data;

    res.status(200).json(user);
  } catch (e) {
    console.log(e);
  }
});

// --- project detail ---> Project view
// Load all the tasks under selected projects, showing columns in order, task basic information
app.get("/projects/:id", async (req, res, next) => {
  const projectId = req.params.id;

  const snapshot = await db
    .collection("tasks")
    .where("projectId", "array-contains", projectId)
    .get();

  let tasks = {};

  snapshot.docs.map((doc) => {
    tasks = {
      ...tasks,
      [doc.id]: {
        id: doc.id,
        ...doc.data(),
      },
    };
  });

  res.status(200).json(tasks);
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

// --- task details ---> stories, attachments
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

// --- add task ---
app.post("/projects/:projectId/tasks", async (req, res) => {
  const projectId = req.params.projectId;
  let { name, description, authorId, columns, targetColumn } = req.body;

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

  // todo - default add task to first column

  const updatedTaskIds = [taskId, ...columns[targetColumn].taskIds];
  columns[targetColumn].taskIds = updatedTaskIds;

  await db.doc(`/projects/${projectId}`).update({
    columns: columns,
  });

  res.status(200).json({
    task: taskId,
    column: targetColumn,
    message: "Task added successfully",
    columns: columns,
  });
});

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

app.get("/users", async (req, res) => {
  const snapshot = await db.collection("users").get();
  let result = {};
  snapshot.docs.map((doc) => {
    result = {
      ...result,
      [doc.id]: {
        id: doc.id,
        ...doc.data(),
      },
    };
  });
  res.json(result);
});

export const api = functions.https.onRequest(app);
