import {db} from "../../index";

const getProject = async (ctx: any) => {
    const projectId = ctx.params.id;

    try {
        const projectSnapshot = await db
            .collection("projects")
            .doc(projectId)
            .get();

        if (!projectSnapshot.data()) {
            ctx.status = 404;
            ctx.body = {
                message: `Project - ${projectId} is not found.`,
            };
            return;
        }

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

        ctx.body = {columns: columns, tasks: tasks};
    } catch (e) {
        console.log(e);
        ctx.status = e.status || 500;
        ctx.body = {
            message: e.message,
        };
    }
};

export default getProject;
