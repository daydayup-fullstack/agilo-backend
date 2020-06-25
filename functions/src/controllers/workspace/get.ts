import loadProjects from "../../services/loadProjects";
import {db} from "../../index";

const getWorkspace = async (ctx: any) => {
    const workspaceId = ctx.params.id;
    try {
        const snapshot = await db.doc(`/workspaces/${workspaceId}`).get();

        if (!snapshot.data()) {
            ctx.status = 404;
            ctx.body = {
                message: `workspace - ${workspaceId} is not found.`,
            };
        }

        const data = await loadProjects(workspaceId);

        ctx.body = {
            workspace: data.workspace,
            allProjects: data.allProjects,
        };
    } catch (e) {
        console.log(e);
        ctx.status = 500;
        ctx.body = {
            message: `Internal Server Error: ${e.error}`,
        };
    }
};

export default getWorkspace;
