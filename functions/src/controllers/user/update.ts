import {db} from "../../index";

const updateUser = async (ctx: any) => {
    const userId = ctx.params.id;

    try {
        const userRef = db.doc(`/users/${userId}`);
        const doc = await userRef.get();

        if (!doc.exists) {
            ctx.status = 404;
            ctx.body = {
                message: `User - ${userId} is not found.`,
            };
            return;
        } else {
            const result = await userRef.update({
                ...ctx.body,
            });

            ctx.body = {
                message: `User - ${userId} is updated.`,
                result: result,
            };
        }
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            message: e.error,
        };
    }
};

export default updateUser;
