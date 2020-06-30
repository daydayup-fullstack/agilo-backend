const updateColumn = async (ctx: any) => {
    const db = ctx.db;
    const {id} = ctx.params;

    try {
        if (!ctx.req.body) {
            ctx.throw(`Column - ${id} is not found`, 404);
        }

        await db.doc(`/columns/${id}`).update({
            ...ctx.req.body,
        });

        ctx.body = {
            message: `column ${id} has been successfully updated`,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
};

export default updateColumn;
