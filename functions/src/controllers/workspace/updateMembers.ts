import * as admin from "firebase-admin";

interface ReqBodyType {
    workspaceId: string;
    emails: string[];
}

const updateMembers = async (ctx: any) => {
    const {id} = ctx.params;
    const db = ctx.db;
    const {emails} = ctx.req.body as ReqBodyType;
    const workspaceRef = db.doc(`/workspaces/${id}`);

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

        // got all the userId by looking for each email address
        users.forEach((userId: string) => {
            if (userId) {
                const userRef = db.doc(`/users/${userId}`);
                userRef.update({
                    workspaces: admin.firestore.FieldValue.arrayUnion(id)
                })
                workspaceRef.update({
                    members: admin.firestore.FieldValue.arrayUnion(userId)
                })
            }
        })

        ctx.status = 200;
        ctx.body = {
            message: `Workspace ${id} updated`,
            members: emails,
            users: users
        }


    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
}

export default updateMembers;
