const getWorkspaces = async (ctx: any) => {
    const {userId} = ctx.params;
    const db = ctx.db;

    try {

        const snapshot = await db.collection("/workspaces")
            .where("members", "array-contains", userId)
            .get();

        let allWorkspaces = {};

        let workspaces: string[] = [];

        snapshot.docs.forEach((doc: any) => {

            workspaces = [...workspaces, doc.id];

            allWorkspaces = {
                ...allWorkspaces,
                [doc.id]: {
                    id: doc.id,
                    ...doc.data(),
                },
            }
        })


        ctx.status = 200;
        ctx.body = {
            message: `user ${userId} workspaces retrieved`,
            workspaces: workspaces,
            allWorkspaces: allWorkspaces
        };
    } catch (e) {
        console.log(e);

        ctx.status = e.status || 500;
        ctx.body = {
            message: e.message,
        };
    }

}

export default getWorkspaces;
