const { MessageMedia } = require("whatsapp-web.js")
const moment = require("moment-timezone")
const { color, secondsConvert, humanFileSize, processTime } = require("./utils")
const axios = require("axios").default
const syntaxerror = require("syntax-error")
const util = require("util")
const fs = require("fs")
const YouTube = require("./lib/YouTube")
const { instagramdl, tiktokdl } = require("./lib/scraper")
const { menu, groupofc, infobot, owner } = require("./lib/text")
const qc = require("./lib/qc")

moment.tz.setDefault("Asia/Jakarta").locale("id")
module.exports = msgHndlr = async (client, message) => {
    try {
        const { from, id, hasMedia, timestamp, type,hasQuotedMsg } = message
        const { mentionedJidList } = message._data
        global.prefix = "#"
        let body = message.body || ""
        let quotedMsg = hasQuotedMsg ? await message.getQuotedMessage() : {}
        
        const sender = id.participant || from
        const pushname = (await client.getContactById(sender)).pushname
        const chat = await message.getChat()
        const command = body.startsWith(prefix) ? body.slice(1).split(" ").shift().toLowerCase() : ""
        const args = body.split(" ").slice(1)
        const q = args.join(" ")
        const groupMetadata = chat?.groupMetadata
        const groupAdmins = groupMetadata?.participants.filter(x => x.isAdmin).map(x => x.id._serialized)

        const isOwner = sender == "6285745351659@c.us" // change your whatsapp owner number
        const isBotAdmin = groupAdmins?.includes(client.info.me._serialized)
        const isAdmin = groupAdmins?.includes(sender)

        await client.sendPresenceAvailable()
        await client.sendSeen(from)

        // Functions
        function logMsg(cmd, pushname) {
            return console.log(color("[CMD]", "green"), color(moment(timestamp*1000).format("DD/MM/YY HH:mm:ss"), "yellow"), "FROM", color(pushname, "green"), "=>", color(prefix+cmd, "green"))
        }

        switch (command) {
            // OWNER/UTILS
            case "help":
            case "menu": {
                return message.reply(menu(pushname))
            }
            break
            case "speed": {
                return message.reply(`_Speed_\n${processTime(timestamp, moment())} second`)
            }
            break
            case "groupofc":
            case "group": {
                return message.reply(groupofc())
            }
            break
            case "infobot":
            case "info": {
                return message.reply(infobot())
            }
            break
            case "owner":
            case "creator": {
                return message.reply(owner())
            }
            break
            case "ping": {
                logMsg(command, pushname)
                return message.reply("PONG!")
            }
            break
            case ">": {
                logMsg(command, pushname)
                if (!isOwner) return message.reply("Khusus Owner!")
                let _return;
                let _syntax = '';
                let _text = body.slice(2);
                try {
                    try {
                        let i = 15
                        let exec = new (async () => { }).constructor('print', 'message', 'require', 'client', 'from', 'axios', 'fs', 'exec', 'MessageMedia', 'chat', _text);
                        _return = await exec.call(client, (...args) => {
                            if (--i < 1) return
                            console.log(...args)
                            return message.reply(util.format(...args))
                        }, message, require, client, from, axios, fs, exec, MessageMedia, chat);
                    } catch (e) {
                        let err = syntaxerror(_text, 'Execution Function', {
                            allowReturnOutsideFunction: true,
                            allowAwaitOutsideFunction: true
                        })
                        if (err) _syntax = '```' + err + '```\n\n'
                        _return = e
                    } finally {
                        return message.reply(_syntax + util.format(_return))
                    }
                } catch (error) {
                    message.reply(util.format(error))
                    console.log(error);
                }
            }
            break

            // CREATOR
            case "sticker":
            case "stiker":
            case "stc":
            case "s": {
                logMsg(command, pushname)
                if (hasMedia && (type == "image" || type == "video")) {
                    let media = await message.downloadMedia()
                    return message.reply(media, from, { sendMediaAsSticker: true, stickerName: "Sticker", stickerAuthor: "@kaguyaShinomiya" })
                } else if (quotedMsg && (quotedMsg.type == "image" || quotedMsg.type == "video")) {
                    let media = await (await message.getQuotedMessage()).downloadMedia()
                    return message.reply(media, from, { sendMediaAsSticker: true, stickerName: "Sticker", stickerAuthor: "@kaguyaShinomiya" })
                } else {
                    return message.reply("Silahkan reply/kirim pesan media dengan caption *#sticker*")
                }
            }
            break
            case "qc": {
                logMsg(command, pushname)
                if (!q && !hasQuotedMsg) return message.reply("Silahkan kirim/balas pesan teks")
                if (q.length > 20) return message.reply("Maksimal 20 huruf!")
                if (q && !hasQuotedMsg) {
                    let qcdata = await qc(client, message)
                    let qcmedia = new MessageMedia("image/jpeg", qcdata, "quotedC.webp")
                    return message.reply(qcmedia, from, { sendMediaAsSticker: true, stickerName: "Sticker", stickerAuthor: "@kaguyaShinomiya" })
                } else if (hasQuotedMsg) {
                    let qcdata = await qc(client, await message.getQuotedMessage())
                    let qcmedia = new MessageMedia("image/jpeg", qcdata, "quotedC.webp")
                    return message.reply(qcmedia, from, { sendMediaAsSticker: true, stickerName: "Sticker", stickerAuthor: "@kaguyaShinomiya" })
                }
            }
            break
            
            // DOWNLOADER
            case "ytmp3": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan link youtube")
                YouTube.mp3(q)
                .then(async mp3data => {
                    let caption = `*Judul*: ${mp3data.meta.title}\n*Durasi*: ${secondsConvert(mp3data.meta.seconds)}\n*Filesize:* ${humanFileSize(mp3data.size)}\n\nSilahkan Tunggu Beberapa Menit...`
                    await message.reply((await MessageMedia.fromUrl(mp3data.meta.image, { unsafeMime: true, filename: "thumbnail" })), from, { caption })
                    await message.reply(await MessageMedia.fromFilePath(mp3data.path), from, { sendMediaAsDocument: true })
                    fs.unlinkSync(mp3data.path)
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break
            case "ytmp4": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan link youtube")
                YouTube.mp4(q)
                .then(async mp4data => {
                    let caption = `*Judul*: ${mp4data.title}\n*Durasi*: ${secondsConvert(mp4data.duration)}\n*Kualitas:* ${mp4data.quality}\n\nSilahkan Tunggu Beberapa Menit...`
                    await message.reply((await MessageMedia.fromUrl(mp4data.thumb.url, { unsafeMime: true, filename: "thumbnail" })), from, { caption })
                    await message.reply(await MessageMedia.fromUrl(mp4data.videoUrl, { unsafeMime: true, filename: mp4data.title}), from, { sendMediaAsDocument: true })
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break
            case "instagram":
            case "ig": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan link instagram")
                instagramdl(args[0])
                .then(async igdata => {
                    let caption = "*_Instagram Downloader by @kaguyaShinomiya_*"
                    for (let i = 0; i < igdata.url_list.length; i++) {
                        await message.reply(await MessageMedia.fromUrl(igdata.url_list[i], { unsafeMime: true, filename: "igdl@kaguyaShinomiya" }), from, { caption, sendMediaAsDocument: true })
                    }
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break
            case "tiktok":
            case "tt": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan link tiktok")
                tiktokdl(args[0])
                .then(async ttdata => {
                    let caption = `*Author*: ${ttdata.nick}\n*Description*: ${ttdata.video_info.trim()}`
                    await message.reply(await MessageMedia.fromUrl(ttdata.mp4, { unsafeMime: true, filename: ttdata.video_info.trim() }), from, { caption, sendMediaAsDocument: true })
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break

            // RANDOM
            case "anime": {
                logMsg(command, pushname)
                let animeimg = await axios.get("https://nekos.life/api/v2/img/wallpaper")
                return message.reply(await MessageMedia.fromUrl(animeimg.data.url, { unsafeMime: true, filename: "anime" }))
            }
            break
            case "animeneko":
            case "neko": {
                logMsg(command, pushname)
                let animeimg = await axios.get("https://nekos.life/api/v2/img/neko")
                return message.reply(await MessageMedia.fromUrl(animeimg.data.url, { unsafeMime: true, filename: "anime" }))
            }
            break
            case "quotes":
                logMsg(command, pushname)
                let quoterand = (await axios.get("https://api.quotable.io/quotes/random")).data
                let quotext = `*"${quoterand[0].content}"*\n\n_${quoterand[0].author}_`
                return message.reply(quotext)
            break
            case "fakta": {
                logMsg(command, pushname)
                let facts = await axios.get("https://raw.githubusercontent.com/FIlham/fakta-random/main/faktarandom.json")
                let factrand = facts.data[Math.floor(Math.random() * facts.data.length)]
                return message.reply(factrand)
            }
            break

            // GROUP
            case "groupinfo": {
                logMsg(command, pushname)
                if (!chat.isGroup) return message.reply("Hanya untuk group chat!")
                let author = await client.getContactById(chat.owner._serialized)
                let gcinfo = `*Subject*: ${chat.groupMetadata.subject}\n*Date Creation*: ${moment(chat.groupMetadata.creation*1000).format("DD-MM-YY hh:mm:ss")}\n*Author*: @${chat.groupMetadata.owner.user} (${author.pushname})\n*Description*:\n${chat.groupMetadata.desc}`
                let gcpp = await MessageMedia.fromUrl(await client.getProfilePicUrl(from), { unsafeMime: true, filename: "gcpp" })
                await message.reply(gcpp, from, { caption: gcinfo, mentions: [author] })
            }
            break
            case "kick": {
                logMsg(command, pushname)
                if (!chat.isGroup) return message.reply("Hanya untuk group chat!")
                if (!isAdmin) return message.reply("Anda bukanlah admin grup")
                if (!isBotAdmin) return message.reply("Jadikan bot admin grup terlebih dahulu")
                if (args.length !== 0 && !hasQuotedMsg) {
                    let members = mentionedJidList
                    for (let i = 0; i < members.length; i++) {
                        await chat.removeParticipants([members[i]])
                    }
                    await message.reply("Sukses !")
                } else if (hasQuotedMsg) {
                    let member = quotedMsg.id.participant._serialized
                    await chat.removeParticipants([member])
                    await message.reply("Sukses !")
                } else {
                    await message.reply("Silahkan tag/balas pesan member yang ingin di kick")
                }
            }
            break
            case "add": {
                logMsg(command, pushname)
                if (!chat.isGroup) return message.reply("Hanya untuk group chat!")
                if (!isAdmin) return message.reply("Anda bukanlah admin grup")
                if (!isBotAdmin) return message.reply("Jadikan bot admin grup terlebih dahulu")
                if (q && !hasQuotedMsg) {
                    let members = q.includes("-") ? q.replace(" ", "").split("-").join("").slice(1) + "@c.us" : q + "@c.us"
                    await chat.addParticipants([members])
                    await message.reply("Sukses !")
                } else if (hasQuotedMsg) {
                    let member = quotedMsg.id.participant._serialized
                    await chat.addParticipants([member])
                    await message.reply("Sukses !")
                } else {
                    await message.reply("Silahkan kirim nomor/balas pesan member yang ingin di tambahkan")
                }
            }
            break
            case "promote":
            case "pm": {
                logMsg(command, pushname)
                if (!chat.isGroup) return message.reply("Hanya untuk group chat!")
                if (!isAdmin) return message.reply("Anda bukanlah admin grup")
                if (!isBotAdmin) return message.reply("Jadikan bot admin grup terlebih dahulu")
                if (q && !hasQuotedMsg) {
                    let members = mentionedJidList
                    for (let i = 0; i < members.length; i++) {
                        await chat.promoteParticipants([members[i]])
                    }
                    message.reply("Sukses !")
                } else if (hasQuotedMsg) {
                    let member = quotedMsg.id.participant._serialized
                    await chat.promoteParticipants([member])
                    message.reply("Sukses !")
                } else {
                    message.reply("Silahkan tag/balas pesan member yang ingin di promote")
                }
            }
            break
            case "demote":
            case "dm": {
                logMsg(command, pushname)
                if (!chat.isGroup) return message.reply("Hanya untuk group chat!")
                if (!isAdmin) return message.reply("Anda bukanlah admin grup")
                if (!isBotAdmin) return message.reply("Jadikan bot admin grup terlebih dahulu")
                if (q && !hasQuotedMsg) {
                    let members = mentionedJidList
                    for (let i = 0; i < members.length; i++) {
                        await chat.demoteParticipants([members[i]])
                    }
                    message.reply("Sukses !")
                } else if (hasQuotedMsg) {
                    let member = quotedMsg.id.participant._serialized
                    await chat.demoteParticipants([member])
                    message.reply("Sukses !")
                } else {
                    message.reply("Silahkan tag/balas pesan member yang ingin di demote")
                }
            }
            break
            case "groupsettings": {
                logMsg(command, pushname)
                if (!chat.isGroup) return message.reply("Hanya untuk group chat!")
                if (args[0]?.toLowerCase() == "close") {
                    if (!isAdmin) return message.reply("Anda bukanlah admin grup")
                    if (!isBotAdmin) return message.reply("Jadikan bot admin grup terlebih dahulu")
                    await chat.setMessagesAdminsOnly(true)
                    message.reply("Sukses !")
                } else if (args[0]?.toLowerCase() == "open") {
                    if (!isAdmin) return message.reply("Anda bukanlah admin grup")
                    if (!isBotAdmin) return message.reply("Jadikan bot admin grup terlebih dahulu")
                    await chat.setMessagesAdminsOnly(false)
                    message.reply("Sukses !")
                } else {
                    message.reply(`Silahkan pilih pengaturan grup\n\n${prefix+command} close - Menutup grup\n${prefix+command} open - Membuka grup`)
                }
            }
            break
        }
    } catch (err) {
        console.log(err)
        message.reply("Ups, ada kesalahan! silahkan hubungi owner")
    }
}