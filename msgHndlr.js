const { MessageMedia } = require("whatsapp-web.js")
const moment = require("moment-timezone")
const { color, humanFileSize, processTime } = require("./utils")
const axios = require("axios").default
const syntaxerror = require("syntax-error")
const util = require("util")
const fs = require("fs")
const { menu, groupofc, infobot, owner } = require("./lib/text")
const qc = require("./lib/qc")
const yts = require("yt-search")
const Menfess = require("./lib/Menfess")
const WP = require("wattpad.js")
const wp = new WP()
const { owners, stickerAuthor, stickerName } = require("./config.json")
const { Game, rewards } = require("./lib/Game")

moment.tz.setDefault("Asia/Jakarta").locale("id")
module.exports = msgHndlr = async (client, message) => {
    try {
        const { from, id, hasMedia, timestamp, type,hasQuotedMsg } = message
        const { mentionedJidList } = message._data
        let body = message.body || ""
        let quotedMsg = hasQuotedMsg ? await message.getQuotedMessage() : {}
        global.prefix = /^[./!#%^&=\,;:()]/.test(body) ? body.match(/^[./!#%^&=\,;:()]/gi) : '#'
        
        const sender = id.participant || from
        const user = await client.getContactById(sender)
        const pushname = user.pushname || "Unknown"
        const chat = await message.getChat()
        const command = body.startsWith(prefix) ? body.slice(1).split(" ").shift().toLowerCase() : ""
        const isCmd  = body.startsWith(prefix)
        const args = body.split(" ").slice(1)
        const q = args.join(" ")
        const groupMetadata = chat?.groupMetadata
        const groupAdmins = groupMetadata?.participants.filter(x => x.isAdmin).map(x => x.id._serialized)

        const isOwner = owners.includes(sender)
        const isBotAdmin = groupAdmins?.includes(client.info.me._serialized)
        const isAdmin = groupAdmins?.includes(sender)
        const apiKaguya = "https://proud-bear-baseball-cap.cyclic.app"

        // Game Variable
        const game = new Game(sender)
        const checkUser = Game.parseDB(sender).find(x => x.jid == sender)
        const actionCmd = rewards().map(x => x.action)

        await client.sendPresenceAvailable()
        await client.sendSeen(from)
        Menfess.createDirpath()

        // Menfess Chat
        if (!isCmd && !chat.isGroup) {
            let menUser = Menfess.getUser(sender) || await Menfess.checkCrush(sender) || {}
            let forWho = menUser.crushJid == sender ? menUser.userJid : menUser.crushJid
            if (menUser.startChat) {
                await message.forward(forWho)
            }
        }

        // Game Functions
        if (actionCmd.includes(command)) {
            logMsg(command, pushname)
            if (chat.isGroup) return message.reply("Perintah hanya dapat dilakukan di personal chat")
            if (!checkUser) return message.reply("Akun anda tidak terdaftar di database")
            const didAction = Game.takeAction(sender, command)
            return message.reply(`Success!\nYou go ${command} and get ${didAction?.lengthItem} ${didAction?.item} and ${didAction?.xp} experience`)
        }

        // Functions
        function logMsg(cmd, pushname) {
            return console.log(color("[CMD]", "green"), color(moment(timestamp*1000).format("DD/MM/YY HH:mm:ss"), "yellow"), "FROM", color(pushname, "green"), "=>", color(prefix+cmd, "green"))
        }

        function getFilesize(bs64) {
            return humanFileSize(Buffer.byteLength(Buffer.from(bs64, "base64")))
        }

        function monospace(text) {
            return "```" + text + "```"
        }


        switch (command) {
            // OWNER/UTILS
            case "help":
            case "menu": {
                logMsg(command, pushname)
                return message.reply(menu(pushname))
            }
            break
            case "speed": {
                logMsg(command, pushname)
                return message.reply(`_Speed_\n${processTime(timestamp, moment())} second`)
            }
            break
            case "groupofc":
            case "group": {
                logMsg(command, pushname)
                return message.reply(groupofc())
            }
            break
            case "infobot":
            case "info": {
                logMsg(command, pushname)
                return message.reply(infobot())
            }
            break
            case "owner":
            case "creator": {
                logMsg(command, pushname)
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
                    return message.reply(media, from, { sendMediaAsSticker: true, stickerAuthor, stickerName })
                } else if (quotedMsg && (quotedMsg.type == "image" || quotedMsg.type == "video")) {
                    let media = await (await message.getQuotedMessage()).downloadMedia()
                    return message.reply(media, from, { sendMediaAsSticker: true, stickerAuthor, stickerName })
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
                    return message.reply(qcmedia, from, { sendMediaAsSticker: true, stickerAuthor, stickerName })
                } else if (hasQuotedMsg) {
                    let qcdata = await qc(client, await message.getQuotedMessage())
                    let qcmedia = new MessageMedia("image/jpeg", qcdata, "quotedC.webp")
                    return message.reply(qcmedia, from, { sendMediaAsSticker: true, stickerAuthor, stickerName })
                }
            }
            break
            
            // DOWNLOADER
            case "ytmp3": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan link youtube")
                axios.get(`${apiKaguya}/api/youtubedl?url=${args[0]}`)
                .then(async ({ data }) => {
                    let mp3data = data.result
                    if (Number(mp3data.mp3.size.split(" MB")[0]) >= 40.00) return message.reply("Karena filesize/ukuran file besar, bot tidak bisa mengunduh audio")
                    let caption = `*Judul*: ${mp3data.title}\n*Filesize:* ${mp3data.mp3.size}\n\nSilahkan Tunggu Beberapa Menit...`
                    await message.reply((await MessageMedia.fromUrl(mp3data.thumbnail, { unsafeMime: true, filename: "thumbnail" })), from, { caption })
                    await message.reply(await MessageMedia.fromUrl(await mp3data.mp3.dlink, { unsafeMime: true, filename: mp3data.title +".mp3" }), from, { sendMediaAsDocument: true })
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break
            case "ytmp4":
            case "yt": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan link youtube")
                axios.get(`${apiKaguya}/api/youtubedl?url=${args[0]}`)
                .then(async ({ data }) => {
                    let mp4data = data.result
                    if (Number(mp4data.mp4.size.split(" MB")[0]) >= 40.00) return message.reply("Karena filesize/ukuran file besar, bot tidak bisa mengunduh audio")
                    let caption = `*Judul*: ${mp4data.title}\n*Filesize:* ${mp4data.mp4.size}\n\nSilahkan Tunggu Beberapa Menit...`
                    await message.reply((await MessageMedia.fromUrl(mp4data.thumbnail, { unsafeMime: true, filename: "thumbnail" })), from, { caption })
                    await message.reply(await MessageMedia.fromUrl(await mp4data.mp4.dlink, { unsafeMime: true, filename: mp4data.title +".mp4" }), from, { sendMediaAsDocument: true })
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
                axios.get(`${apiKaguya}/api/instagramdl?url=${args[0]}`)
                .then(async ({ data }) => {
                    let igdata = data.result
                    let caption = "*_Instagram Downloader by @kaguyaShinomiya_*"
                    for (let i = 0; i < igdata.dlink.length; i++) {
                        let media = await MessageMedia.fromUrl(igdata.dlink[i], { unsafeMime: true, filename: "igdl@kaguyaShinomiya" })
                        await message.reply(media, from, { caption, sendMediaAsDocument: (Number((await getFilesize(media.data).split(" MB")[0])) >= 16.00) })
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
                axios.get(`${apiKaguya}/api/tiktokdl?url=${args[0]}`)
                .then(async ({ data }) => {
                    let ttdata = data.result
                    let caption = `*Author*: ${ttdata.nick}\n*Description*: ${ttdata.video_info.trim()}`
                    let media = await MessageMedia.fromUrl(ttdata.mp4, { unsafeMime: true, filename: ttdata.video_info.trim() })
                    await message.reply(media, from, { caption, sendMediaAsDocument: (Number((await getFilesize(media.data).split(" MB")[0])) >= 16.00) })
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break
            case "play": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan kata kunci lagu")
                let vids = await yts(q)
                axios.get(`${apiKaguya}/api/youtubedl?url=${vids.videos[0].url}`)
                .then(async ({ data }) => {
                    let mp3data = data.result
                    if (Number(mp3data.mp3.size.split(" MB")[0]) >= 40.00) return message.reply("Karena filesize/ukuran file besar, bot tidak bisa mengunduh audio")
                    let caption = `*Judul*: ${mp3data.title}\n*Filesize:* ${mp3data.mp3.size}\n\nSilahkan Tunggu Beberapa Menit...`
                    await message.reply((await MessageMedia.fromUrl(mp3data.thumbnail, { unsafeMime: true, filename: "thumbnail" })), from, { caption })
                    await message.reply(await MessageMedia.fromUrl(await mp3data.mp3.dlink, { unsafeMime: true, filename: mp3data.title +".mp3" }), from, { sendMediaAsDocument: true })
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break
            // case "mediafire":
            // case "mf": {
            //     logMsg(command, pushname)
            //     if (args.length === 0) return message.reply("Masukkan url mediafire")
            //     mediafdl(q)
            //     .then(async res => {
            //         let media = await MessageMedia.fromUrl(res.dlink, { unsafeMime: true, filename: res.title })
            //         let caption = `*Title*: ${res.title}\n*Filesize*: ${res.filesize}`
            //         if (Number(res.filesize.split(" MB")[0]) >= 70.00) return message.reply("Filesize tidak ngotak")
            //         return message.reply(media, from, { sendMediaAsDocument: true, caption })
            //     })
            // }
            // break
            case "facebook":
            case "fb": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan url facebook")
                axios.get(`${apiKaguya}/api/facebookdl?url=${args[0]}`)
                .then(async ({ data }) => {
                    let res = data.result
                    let media = await MessageMedia.fromUrl(res.hd.dlink || res.sd.dlink, { unsafeMime: true })
                    if (Number(getFilesize(media.data).split(" MB")[0]) >= 70.00) return message.reply("Filesize tidak ngotak")
                    return message.reply(media, from, { sendMediaAsDocument: true, caption: `*Duration*: ${res.duration}` })
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break
            case "pinterest":
            case "pin": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan url pinterest")
                axios.get(`${apiKaguya}/api/pinterestdl?url=${args[0]}`)
                .then(async ({ data }) => {
                    let res = data.result
                    let media = await MessageMedia.fromUrl(res.dlink, { unsafeMime: true })
                    if (Number(getFilesize(media.data).split(" MB")[0]) >= 70.00) return message.reply("Filesize tidak ngotak")
                    return message.reply(media, from, { sendMediaAsDocument: Number(getFilesize(media.data).split(" MB")[0]) >= 15.00 })
                })
                .catch(err => {
                    console.log(err)
                    message.reply("Error Ditemukan! Silahkan Hubungi Admin")
                })
            }
            break

            // FUN
            case "menfess": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply(`Menfess adalah fitur untuk mengirimkan pesan yang berisi pernyataan suka terhadap crush. Contoh penggunaan ada dibawah

*${prefix}menfess* = Untuk mengirimkan pesan pernyataan suka kepada crush\nContoh : ${prefix}menfess target|nama_samaranmu|pesan\n${prefix}menfess 62xxxxxx|seseorang|hai aku suka kamu
*${prefix}menfess start* = Untuk memulai obrolan. (Hanya bisa dilakukan oleh si crush)\nContoh : ${prefix}menfess start
*${prefix}menfess stop* = Untuk mengakhiri obrolan. (Hanya bisa dilakukan oleh si crush)\nContoh : ${prefix}menfess stop
*${prefix}menfess reset* = Untuk mereset database menfess (Hanya bisa dilakukan oleh owner)\nContoh : ${prefix}menfess reset

Data anda akan sepenuhnya aman dan tidak akan mengalami kebocoran`)
                if (chat.isGroup) return message.reply("Khusus pesan pribadi (PC only !)")
                let [menArg, hisName, text] = q.split("|")
                const isOnWa = (menArg !== "start" && menArg !== "stop" && menArg !== "reset") ? await client.isRegisteredUser(menArg) : false
                if (!isOnWa && (menArg !== "start" && menArg !== "stop" && menArg !== "reset") ) return message.reply("Targetmu tidak terdaftar di WhatsApp")
                const contactJid = (menArg !== "start" && menArg !== "stop" && menArg !== "reset") ? await client.getNumberId(menArg) : false
                const timeMsg = moment(timestamp*1000).format("DD/MM/YY HH:mm:ss")
                const menCrush = await Menfess.checkCrush(sender)
                const menUser = Menfess.getUser(sender)
                const checkArg = Menfess.getUser(menArg + "@c.us")
                const textMen = `_Hai, kamu dapat pesan confess nih_

Waktu Dikirim : ${monospace(timeMsg)}
Pengirim (nama samaran) : ${monospace(hisName)}
Pesan :
${monospace(text)}

*${prefix}menfess start* = Untuk memulai obrolan
*${prefix}menfess stop* = Untuk mengakhiri obrolan`
                if (menArg && isOnWa) {
                    if (menArg == sender.split("@")[0]) return message.reply("Jangan jadikan diri sendiri sebagai target crush!")
                    if (menUser.crushJid && menUser.crushJid !== menArg + "@c.us") return message.reply("Anda sudah punya crush, ngotak dong!")
                    if (menArg == client.info.me._serialized) return message.reply("Jangan bot juga yang dijadikan crush")
                    if (fs.existsSync(`${Menfess.dirpath}/${menArg}@c.us.json`)) Menfess.deleteUser(`${menArg}@c.us`)
                    if ((checkArg.userJid && checkArg.crushJid) && checkArg.userJid !== sender && checkArg.crushJid !== sender) return message.reply("Crush mu sedang di crushin orang lain:/")
                    const resdata = await Menfess.updateUser({ userJid: sender, crushJid: contactJid._serialized, startChat: false })
                    await client.sendMessage(resdata.crushJid, `${textMen}`)
                    await message.reply("Sukses !\nBerhasil mengirim pesan menfess ke crushmu, tunngu sampai dia membalasnya di bot ini :)")
                } else if (menArg == "start") {
                    if (sender !== menCrush.crushJid) return message.reply("Anda belum pernah di _crush in_ siapapun!")
                    const resdata = await Menfess.updateUser({ userJid: menUser.userJid, crushJid: menUser.crushJid, startChat: true })
                    await message.reply("Anda telah membuka obrolan. Silahkan kalian mengobrol dengan hangat satu sama lain~")
                    await client.sendMessage(resdata.userJid, "Crush anda telah membuka obrolan. Silahkan kalian mengobrol dengan hangat satu sama lain~")
                } else if (menArg == "stop") {
                    if (sender !== menCrush.crushJid) return message.reply("Anda belum pernah di _crush in_ siapapun!")
                    const resdata = await Menfess.updateUser({ userJid: menUser.userJid, crushJid: false, startChat: false })
                    await message.reply("Anda telah memutus obrolan, sekarang anda tidak bisa mengobrol lagi dengannya sampai dia mengirim pesan menfess lagi")
                    await client.sendMessage(resdata.userJid, "Crush anda telah memutus obrolan, anda tidak memiliki crush di database sekarang")
                } else if (menArg == "reset" && isOwner) {
                    let dbs = fs.readdirSync(Menfess.dirpath)
                    for (let x of dbs) {
                        let db = Menfess.getUser(x.replace(".json", ""))
                        await client.sendMessage(db.userJid, "Owner telah mereset database menfess kalian")
                        db.crushJid ? await client.sendMessage(db.userJid, "Owner telah mereset database menfess kalian") : false
                        Menfess.deleteUser(db.userJid)
                    }
                    await message.reply("Sukses !")
                }
            }
            break
            case "wattpadsearch":
            case "wpsearch": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan judul novel")
                let wps = await wp.Stories.search(q)
                let text = `*Berikut Hasil Dari Pencarian Novel ${q}*\n`
                let number = 1
                for (let i = 0; i < wps.stories.length; i++) {
                    text += `\n${number}. *${wps.stories[i].title.trim()}* (by _${wps.stories[i].user.name}_)\nDetails? ${prefix}wpdetails ${wps.stories[i].id}\n`
                    number++
                }
                await message.reply(text)
            }
            break
            case "wattpaddetails":
            case "wpdetails": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan id novel")
                let wpd = await wp.Stories.detail(args[0])
                let caption = `*${wpd.title.trim()}*\n\nPenulis : ${monospace(wpd.user.name)}\nDibaca : ${monospace(wpd.readCount)}\nDikomen : ${monospace(wpd.commentCount)}\n\n"${wpd.description}"`
                let media = await MessageMedia.fromUrl(wpd.cover, { unsafeMime: true })
                let text = `Silahkan pilih chapter/bab yang ingin kamu baca\n`
                let number = 1
                for (let i = 0; i < wpd.parts.length; i++) {
                    text += `\n${number}. ${wpd.parts[i].title}\n_Read?_ ${prefix}wpread ${wpd.parts[i].id}\n`
                    number++
                }
                await message.reply(media, from, { media, caption })
                await message.reply(text)
            }
            break
            case "wattpadread":
            case "wpread": {
                logMsg(command, pushname)
                if (args.length === 0) return message.reply("Masukkan id chapter novel")
                let wpr = await wp.Stories.read(args[0])
                await message.reply(wpr.text.trim())
            }
            break

            // GAME
            case "createaccount": {
                logMsg(command, pushname)
                if (chat.isGroup) return message.reply("Perintah hanya dapat dilakukan di personal chat")
                if (checkUser) return message.reply("Akun anda sudah terdaftar di database")
                const create = Game.addUser(sender)
                return message.reply(`Berhasil Mendaftarkan Akun Anda\n\nJID: @${create.jid.split("@")[0]}\nXP: ${create.xp}\nMoney: ${Game.formatMoney(create.money)}\nLast Action: ${create.lastAction}\nCek Inventory? *${prefix}inventory*`, from, {
                    mentions: [user]
                })
            }
            break
            case "me":
            case "profile": {
                logMsg(command, pushname)
                if (!checkUser) return message.reply("Akun anda tidak terdaftar di database")
                const pp = await MessageMedia.fromUrl(await client.getProfilePicUrl(sender), { unsafeMime: true })
                const caption = `Personal Info\n*JID*: @${checkUser.jid.split("@")[0]} (${pushname})\n*Bio*: ${await user.getAbout() || ""}\n\nGame Info\n*XP*: ${checkUser.xp}\n*Money*: ${Game.formatMoney(checkUser.money)}\n*Last Action*: ${checkUser.lastAction}\nCek Inventory? *${prefix}inventory*`
                return message.reply(pp, from, {
                    caption,
                    mentions: [user]
                })
            }
            break
            case "inventory":
            case "inv": {
                logMsg(command, pushname)
                if (chat.isGroup) return message.reply("Perintah hanya dapat dilakukan di personal chat")
                if (!checkUser) return message.reply("Akun anda sudah terdaftar di database")
                const invs = checkUser.inventory
                const lenInv = invs.map(x => x.lengthItem).reduce((previous, current) => previous + current, 0)
                let text = `Isi Inventory Anda\n\nKapasitas = 100\nIsi = ${lenInv}\n`
                let num = 1
                for (let i = 0; i < invs.length; i++) {
                    text += `\n${num}. *${invs[i].item.toUpperCase()}*\nJumlah: ${invs[i].lengthItem}`
                    num++
                }
                return message.reply(text)
            }
            break
            case "store": {
                logMsg(command, pushname)
                if (chat.isGroup) return message.reply("Perintah hanya dapat dilakukan di personal chat")
                if (!checkUser) return message.reply("Akun anda sudah terdaftar di database")
                const stores = JSON.parse(fs.readFileSync("./database/dbStore.json"))
                let text = "Isi Dari Store\n"
                let num = 1
                for (let i = 0; i < stores.length; i++) {
                    text += `\n${num}. ID Item: ${stores[i].id}\nNama Item: ${stores[i].item}\n_Beli Item? ${prefix}buyitem ${stores[i].id}_`
                }
                return message.reply(text)
            }
            break
            case "buyitem":
            case "buy": {
                logMsg(command, pushname)
                if (chat.isGroup) return message.reply("Perintah hanya dapat dilakukan di personal chat")
                if (!checkUser) return message.reply("Akun anda sudah terdaftar di database")
                if (!q) return message.reply(`Masukkan id item`)
                const stores = JSON.parse(fs.readFileSync("./database/dbStore.json"))
                const [idItem, modal] = q.split("|")
                if (modal) {
                    try {
                        console.log(idItem, modal)
                        const buy = Game.buyItem(sender, Number(idItem), modal)
                        return message.reply(`Berhasil Membeli Item\n\nID Item: ${buy.id}\nNama Item: ${buy.item}\nHarga Item: ${modal + buy.price[modal]}`)
                    } catch (error) {
                        console.log(error)
                        return message.reply(error+"")
                    }
                } else {
                    const item = stores.find(x => x.id == args[0])
                    let text = `ID Item: ${item.id}\nNama Item: ${item.item}\nHarga Item:`
                    for (let i = 0; i < Object.keys(item.price).length; i++) {
                        text += `\n- ${Object.keys(item.price)[i]}: ${Object.values(item.price)[i]}`
                    }
                    return message.reply(text + `\n\n_Konfirmasi Beli? ${prefix}buyitem ${item.id}|modal_\n_Contoh: ${prefix}buyitem ${item.id}|raw_meat_`)
                }
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