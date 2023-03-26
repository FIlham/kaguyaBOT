// This is the System of Menfess for KaguyaBOT made by F. Ilham.
// You can use this file on your bot/source code. but dont delete this credit text :)

const fs = require("fs")

/**
 * The Menfess Classes
 * @param {Object} opts The menfess options
 * @param {String} opts.dirpath The directory path of menfess database
 */
class Menfess {
    constructor() {  }

    /**
     * @typedef {Object} IMenfess
     * @property {String} userJid The jid of menfess user
     * @property {String} crushJid The jid of her crush menfess user
     * @property {Boolean} startChat To initialize the menfess user is chat with his crush on bot
     */

    /**
     * The default directory menfess
     * @returns {String}
     */
    static dirpath = "./dbMenfess"

    /**
     * Create the dirpath
     * @returns {Boolean} Is created?
     */
    static createDirpath = () => {
        let checkDir = fs.existsSync(this.dirpath)
        if (checkDir) {
            return false
        } else {
            fs.mkdirSync(this.dirpath)
        }
    }

    /**
     * To get user of menfess
     * @param {String} userJid The user jid
     * @returns {IMenfess} The data of menfess user
     */
    static getUser = (userJid) => {
        try {
            const users = (fs.readdirSync(`${this.dirpath}`)).filter(x => x.endsWith(".json"))
            let menData = {}
            for (let check of users) {
                let dataUser = JSON.parse(fs.readFileSync(`${this.dirpath}/${check}`))
                if (Object.values(dataUser).includes(userJid)) return menData = dataUser
            }
            return JSON.parse(menData)
        } catch (error) {
            new Error(error)
            return {}
        }
    }

    /**
     * To add user of menfess
     * @param {String} userJid The user jid
     * @returns {Boolean} The data it's create?
     */
    static addUser = (userJid) => {
        const objData = {
            userJid,
            crushJid: null,
            startChat: false
        }
        fs.writeFile(`${this.dirpath}/${userJid}.json`, JSON.stringify(objData), (err) => {
            if (err) {
                throw new Error("can't adding the data user", { cause: err })
            }
        })
        return true
    }

    /**
     * To delete user of menfess
     * @param {String} userJid The user jid
     * @returns {Boolean} The data it's delete?
     */
    static deleteUser = (userJid) => {
        fs.unlink(`${this.dirpath}/${userJid}.json`, (err) => {
            if (err) {
                throw new Error("cant delete the data user", { cause: err })
            }
        })
        return true
    }

    /**
     * To update the data menfess user
     * @param {IMenfess} IMenfess The menfess user object data
     * @returns {Promise<IMenfess>} The data is updated with menfess user object
     */
    static updateUser = (IMenfess) => {
        let userData = this.getUser(IMenfess.userJid) || {}
        userData.userJid = IMenfess.userJid
        userData.crushJid = IMenfess.crushJid
        userData.startChat = IMenfess.startChat
        fs.writeFile(`${this.dirpath}/${IMenfess.userJid}.json`, JSON.stringify(userData), (err) => {
            if (err) {
                throw new Error("can't adding the data user", { cause: err })
            }
        })
        return userData
    }

    /**
     * To check the crush
     * @param {String} crushJid The crush jid
     * @returns {Promise<IMenfess>} The data of crush etc.
     */
    static checkCrush = async (crushJid) => {
        const users = (fs.readdirSync(`${this.dirpath}`)).filter(x => x.endsWith(".json"))
        let menData = {}
        for (let check of users) {
            let dataUser = this.getUser(check.replace(".json", ""))
            if (dataUser.crushJid == crushJid) return menData = dataUser
        }
        return menData
    }
}

module.exports = Menfess