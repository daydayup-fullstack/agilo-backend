const createColumn = async (ctx: any) => {
    const db = ctx.db;
    const {id, title, projectId} = ctx.req.body;

    // column - {id: clientGenereated, title: string}

    try {
        // add column
        await db.collection(`/columns`).doc(id).set({
            title,
            projectId,
            taskIds: [],
        });

        ctx.body = {
            message: `new column ${id} has been successfully created`,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
};

export default createColumn;
