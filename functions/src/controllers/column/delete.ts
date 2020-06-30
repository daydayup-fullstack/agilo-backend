const deleteColumn = async (ctx: any) => {
    const {id} = ctx.params;
    const db = ctx.db;

    try {
        const batch = db.batch();
        //  delete the column
        const columnRef = db.collection("/columns").doc(id);
        const column = await columnRef.get();

        let taskIds = column.data()["taskIds"] as string[];

        batch.delete(columnRef);

        //  delete all the tasks under this column
        taskIds.forEach((id) => {
            const taskRef = db.collection("/tasks").doc(id);
            batch.delete(taskRef);
        });

        await batch.commit();

        ctx.body = {
            message: `column ${id} has been successfully deleted.`,
            data: taskIds,
        };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = {
            error: `Oops! ${e.message}`,
        };
    }
};

export default deleteColumn;
