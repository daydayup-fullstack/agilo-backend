const updateProject = async (ctx: any) => {
    const db = ctx.db;
    const {id} = ctx.params;

    try {
        const projectRef = db.doc(`/projects/${id}`);
        const project = await projectRef.get();

        if (!project.data()) {
            ctx.throw(404, `Project - ${id} cannot be located.`);
        }

        const result = await projectRef.update({
            ...ctx.req.body,
        });

        ctx.status = 200;
        ctx.body = {
            message: `project ${id} updated`,
            result: result,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
};

export default updateProject;
