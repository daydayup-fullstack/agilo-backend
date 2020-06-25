import {Project, Workspace} from "../interface";
import {db} from "../index";

const loadProjects = async (workspaceId: string): Promise<any> => {
    const workspaceSnapshot = await db.doc(`/workspaces/${workspaceId}`).get();

    let {
        type,
        projectOrder,
        members,
        description,
        name,
    } = workspaceSnapshot.data() as any;

    const workspace = {
        id: workspaceId,
        type,
        projectsInOrder: projectOrder,
        members,
        name,
        description,
    } as Workspace;

    let projectsSnapshot = await db
        .collection("projects")
        .where("workspace", "==", workspaceId)
        .get();

    const projectsData = projectsSnapshot.docs.map((doc) => {
        let {
            createdOn,
            columnOrder,
            colorIndex,
            iconIndex,
            name,
            activeUsers,
        } = doc.data() as Project;

        return {
            id: doc.id,
            createdOn,
            columnOrder,
            colorIndex,
            iconIndex,
            name,
            activeUsers,
        };
    });

    const membersSnaphot = await db
        .collection("/users")
        .where("workspaces", "array-contains", workspaceId)
        .get();

    const allMembers = membersSnaphot.docs.map((doc) => {
        return {
            id: doc.id,
            ...doc.data(),
        };
    });

    const result = {
        workspace: {...workspace, allMembers},
        allProjects: projectsData,
    };
    return result;
};

export default loadProjects;
