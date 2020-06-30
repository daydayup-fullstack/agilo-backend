import {HomepageDataType, User} from "../../interface";
import loadProjects from "../../services/loadProjects";

const getUsers = async (ctx: any) => {
    const userId = ctx.params.id;
    const db = ctx.db;

    try {
        const snapshot = await db.doc(`/users/${userId}`).get();

        if (!snapshot.data()) {
            ctx.status = 404;
            ctx.body = {
                message: `User - ${userId} is not found.`,
            };
        }

        let user = {
            id: snapshot.id,
            ...snapshot.data(),
        } as User;

        const workspaceId = user.workspaces[0];
        const data = await loadProjects(ctx, workspaceId);

        const wpSnapshot = await db
            .collection(`/workspaces`)
            .where("members", "array-contains", userId)
            .get();

        let allWorkspaces = {};

        wpSnapshot.docs.forEach((doc: any) => {
            allWorkspaces = {
                ...allWorkspaces,
                [doc.id]: {
                    id: doc.id,
                    ...doc.data(),
                },
            };
        });

        ctx.body = {
            user: {...user, allWorkspaces},
            workspace: data.workspace,
            allProjects: data.allProjects,
        } as HomepageDataType;
    } catch (error) {
        console.log(error);

        ctx.status = error.status || 500;
        ctx.body = {
            message: error.message,
        };
    }
};

export default getUsers;
