import * as admin from "firebase-admin";

const deleteProject = async (ctx: any) => {
    const db = ctx.db;
    const {workspaceId, projectId} = ctx.params;

    try {
        const workspaceRef = db.doc(`/workspaces/${workspaceId}`);
        const batch = db.batch();

        batch.update(workspaceRef, {
            projectOrder: admin.firestore.FieldValue.arrayRemove(projectId),
        });

        const projectRef = db.doc(`/projects/${projectId}`);
        batch.delete(projectRef);

        const tasksRef = await db
            .collection("/tasks")
            .where("projectIds", "array-contains", projectId)
            .get();

        tasksRef.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });

        const columnsRef = await db
            .collection("/columns")
            .where("projectId", "==", projectId)
            .get();

        columnsRef.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        ctx.body = {
            message: `project ${projectId} is successfully deleted.`,
            ref: tasksRef,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            message: e.message,
        };
    }
};

export default deleteProject;
