const updateUser = async (ctx: any) => {
    const db = ctx.db;
    const userId = ctx.params.id;
    const {body} = ctx.req;

    try {
        const userRef = db.doc(`/users/${userId}`);
        const doc = await userRef.get();

        if (!doc.exists) {
            ctx.status = 404;
            ctx.body = {
                message: `User - ${userId} is not found.`,
            };
            return;
        }

        const result = await userRef.update({
            ...body,
        });

        ctx.body = {
            message: `User - ${userId} is updated.`,
            result: result,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            message: `Something went wrong! ${e.error}`,
        };
    }
};

export default updateUser;
