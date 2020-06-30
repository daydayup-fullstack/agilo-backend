const getMembers = async (ctx: any) => {
    const {id} = ctx.params;
    const db = ctx.db;

    try {
        const snaphot = await db
            .collection("/users")
            .where("workspaces", "array-contains", id)
            .get();

        ctx.body = snaphot.docs.map((doc: any) => {
            return {
                id: doc.id,
                ...doc.data(),
            };
        });
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
};

export default getMembers;
