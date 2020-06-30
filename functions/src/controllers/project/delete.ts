import * as admin from "firebase-admin";

const deleteProject = async (ctx: any) => {
    const db = ctx.db;
    const {workspaceId, projectId} = ctx.params;

    try {
        const workspaceRef = db.doc(`/workspaces/${workspaceId}`);
        await workspaceRef.update({
            projectOrder: admin.firestore.FieldValue.arrayRemove(projectId),
        });

        await db.doc(`/projects/${projectId}`).delete();
        ctx.body = {
            message: `project ${projectId} is successfully deleted.`,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            message: `Something went wrong! ${e.error}`,
        };
    }
};

export default deleteProject;
