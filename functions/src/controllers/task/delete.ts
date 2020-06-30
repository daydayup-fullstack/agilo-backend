const deleteTask = async (ctx: any) => {
    const db = ctx.db;
    const {id} = ctx.params;

    try {
        await db.doc(`/tasks/${id}`).delete();
        ctx.body = {
            message: `Task - ${id} has been deleted`,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
};

export default deleteTask;
