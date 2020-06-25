const handshake = async (ctx: any) => {
    ctx.body = {
        message: "Hello world!",
    };
};

export default handshake;
