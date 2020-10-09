import * as admin from "firebase-admin";

interface ReqBodyType {
    name: string;
    emails: string[]
}

const createWorkspace = async (ctx: any) => {
    const db = ctx.db;
    // const workspaceId = db.collection("/workspaces").doc().id;
    const workspaceId = "blah blah blah"
    const projectId = db.collection("/projects").doc().id;
    const {userId} = ctx.params;
    const {name, emails} = ctx.req.body as ReqBodyType;

    const batch = db.batch();

    try {
        const usersRef = db.collection("users");
        let users = [];

        // when there are multiple emails existed
        // find the corresponding userId

        if (emails.length > 0) {
            users = await Promise.all(emails.map(async (email) => {
                try {
                    const query = await usersRef.where("email", "==", email).get();

                    if (query.empty) {
                        console.log(`User registered under ${email} is not found`);
                        return "";
                    } else {
                        return query.docs[0].id;
                    }
                } catch (e) {
                    console.log(e);
                }
            }));
        }

        // add creater's userId to the top of the array

        let members = [userId, ...users];

        // compose sharedWorkspace object & sharedStartingProject object

        const sharedWorkspace = {
            type: "team",
            members: members,
            projectOrder: []
        }

        const sharedStartingProject = {
            workspace: workspaceId,
            columnOrder: [],
            colorIndex: Math.floor(Math.random() * 16),
            iconIndex: Math.floor(Math.random() * 28),
            createdOn: admin.firestore.Timestamp.now(),
            name: `Welcome to ${name}`,
        }

        // populate the shared workspace with welcome empty project

        const projectRef = db.doc(`/projects/${projectId}`);
        batch.set(projectRef, sharedStartingProject);

        // adding members references to the shared workspace

        const workspaceRef = db.doc(`/workspaces/${workspaceId}`);
        batch.set(workspaceRef, sharedWorkspace)

        // adding the sharedWorkspace id to the each users' workspace array

        members.forEach((memberId: string) => {
            // add workspaceId to each of the user workspace
            const userRef = db.doc(`/users/${memberId}`);
            userRef.update({
                workspaces: admin.firestore.FieldValue.arrayUnion(workspaceId)
            })
        })

        ctx.status = 201;
        ctx.body = {
            sharedWorkspace,
            sharedStartingProject
        };
    } catch (e) {
        console.log(e);
        ctx.status = e.status || 500;
        ctx.body = {
            message: e.message,
        };
    }
}

export default createWorkspace;
