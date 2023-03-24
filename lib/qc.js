const axios = require("axios").default

module.exports = qc = async (client, message) => {
    try {
        let result
        let { pushname } = await client.getContactById(message.id?.participant?._serialized || message.id.participant || message.from)
        let jsonstik = {
            type: "quote",
            format: "webp",
            backgroundColor: "#FFFFFF",
            width: 512,
            height: 768,
            scale: 2,
            messages: [
                {
                entities: [],
                avatar: true,
                from: {
                    id: 1,
                    name: pushname || 'Unknown',
                    photo: {
                    url: await client.getProfilePicUrl(message.id.participant?._serialized || message.id.participant || message.from) || "https://i0.wp.com/telegra.ph/file/134ccbbd0dfc434a910ab.png",
                    },
                },
                text: message.body.startsWith(prefix) ? message.body.slice(4) : message.body,
                replyMessage: {},
                },
            ],
        };
    
        await axios.post('https://bot.lyo.su/quote/generate', jsonstik)
        .then(res => {
            result = res.data.result.image
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}