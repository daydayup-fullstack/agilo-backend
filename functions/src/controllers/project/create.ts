import * as admin from "firebase-admin";

const createProject = async (ctx: any) => {
    const {
        name,
        colorIndex,
        iconIndex,
        workspace,
        projectOrder,
        id,
    } = ctx.req.body;

    ctx.body = {
        name,
        colorIndex,
        id,
    };
    // const db = ctx.db;
    //
    // try {
    //     await db.collection("projects").doc(id).set({
    //         name,
    //         colorIndex,
    //         iconIndex,
    //         createdOn: admin.firestore.Timestamp.now(),
    //         columnOrder: [],
    //         workspace,
    //         activeUsers: [],
    //     });
    //
    //     await db.doc(`/workspaces/${workspace}`).update({
    //         projectOrder: [...projectOrder, id],
    //     });
    //
    //     ctx.status = 201;
    //     ctx.body = {
    //         message: `Project - ${id} is created`,
    //     };
    // } catch (e) {
    //     console.log(e);
    //     ctx.status = e.status || 500;
    //     ctx.body = {
    //         message: e.message,
    //     };
    // }
};

export default createProject;
