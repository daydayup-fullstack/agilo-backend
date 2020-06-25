import {HomepageDataType, User} from "../../interface";
import loadProjects from "../../services/loadProjects";
import {db} from "../../index";

const getUsers = async (ctx: any) => {
    const userId = ctx.params.id;

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
        const data = await loadProjects(workspaceId);

        const wpSnapshot = await db
            .collection(`/workspaces`)
            .where("members", "array-contains", userId)
            .get();

        let allWorkspaces = {};

        wpSnapshot.docs.forEach((doc) => {
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

        ctx.status = 500;
        ctx.body = {
            message: `Internal server error - ${error.message}`,
        };
    }
};

export default getUsers;
