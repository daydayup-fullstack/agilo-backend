import * as admin from "firebase-admin";
import {Column} from "../../interface";

const updateTask = async (ctx: any) => {
    const db = ctx.db;
    const {id} = ctx.params;
    try {
        // check to see if the task exists
        const taskRef = db.doc(`/tasks/${id}`);

        const doc = await taskRef.get();

        // if so , update the task
        if (doc.exists) {
            await taskRef.update({
                ...ctx.req.body,
            });

            ctx.body = {
                message: `task ${id} has been successfully updated`,
            };
        } else {
            // otherwise, create a new task
            const {authorId, projectIds, columnId, name} = ctx.req.body;

            await db.collection("/tasks").doc(id).set({
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
                taskIds: [id, ...column.taskIds],
            });

            ctx.status = 201;
            ctx.body = {
                message: `task - ${id} is created`,
            };
        }
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
};

export default updateTask;
