import * as admin from "firebase-admin";

const initUser = async (ctx: any) => {
    const db = ctx.db;
    const {userId} = ctx.params;
    const workspaceId = db.collection("/workspaces").doc().id;
    const projectId = db.collection("/projects").doc().id;

    const batch = db.batch();

    // project
    const projectRef = db.doc(`/projects/${projectId}`);
    batch.set(projectRef, {
        workspace: workspaceId,
        columnOrder: [],
        colorIndex: Math.floor(Math.random() * 16),
        iconIndex: Math.floor(Math.random() * 28),
        createdOn: admin.firestore.Timestamp.now(),
        name: "Welcome",
    });

    // workspace
    const workspaceRef = db.doc(`/workspaces/${workspaceId}`);
    batch.set(workspaceRef, {
        type: "personal",
        members: [userId],
        projectOrder: [projectId], // todo - add project id in it
        userId: userId,
    });
    // user
    const userRef = db.doc(`/users/${userId}`);
    batch.set(userRef, {
        avatar: "",
        colorIndex: Math.floor(Math.random() * 16),
        email: "",
        firstName: "Guest",
        lastName: "Guest",
        workspaces: [workspaceId],
        privateProjects: [],
        starredProjects: [projectId],
    });

    await batch.commit();

    ctx.body = {
        message: "init anonymous user - success",
        userId: userId,
    };
};

export default initUser;
