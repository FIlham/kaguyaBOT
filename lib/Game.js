// This is the System of Game for KaguyaBOT made by F. Ilham.
// You can use this file on your bot/source code. but dont delete this credit text :)

const fs = require("fs")
const DB_GAME = "./database/dbGame.json"
const DB_STORE = "./database/dbStore.json"
const rewards = () => {
    return [
        {
            action: "fishing",
            rewards: {
                item: "fish",
                xp: Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000,
                lengthItem: Math.floor(Math.random() * (3 - 1 + 1)) + 1
            },
        },
        {
            action: "hunt",
            rewards: {
                item: "raw meat",
                xp: Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000,
                lengthItem: Math.floor(Math.random() * (8 - 3 + 1)) + 3
            },
        },
        {
            action: "cuttingtree",
            rewards: {
                item: "wood",
                xp: Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000,
                lengthItem: Math.floor(Math.random() * (8 - 3 + 1)) + 3
            }
        }
    ]
}

/**
 * @typedef {Object} Inventory
 * @property {string} item
 * @property {number} lengthItem
 */

/**
 * @typedef {Object} Reward
 * @property {string} item
 * @property {number} xp
 * @property {number} lengthItem
 */

/**
 * @typedef {Object} Store
 * @property {number} id
 * @property {string} item
 * @property {Price} price
 */

/**
 * @typedef {Object} Price
 * @property {number} fishing
 * @property {number} raw_meat
 * @property {number} wood
 */

/**
 * @enum {string}
 * @readonly
 */
const LastAction = {
    NEW_ACCOUNT: "New Create Account",
    DONE_FISHING: "Done Go Fishing",
    DONE_HUNT: "Done Go Hunt",
    DONE_CUTTING: "Done Go Cutting the Tree's"
}

/**
 * The Class of Game
 * 
 * @param {string} jid The JID of User
 * @param {number} xp The XP of User
 * @param {number} money The Money of User
 * @param {string} lastAction The Last Action of User
 * @param {Inventory[]} inventory The Inventory of User
 */
class Game {
    constructor(jid, xp, money, lastAction, inventory) {
        /**
         * The JID of User
         * @type {string}
         */
        this.jid = jid

        /**
         * The XP of User
         * @type {string}
         */
        this.xp = xp

        /**
         * The Money of User
         * @type {string}
         */
        this.money = money

        /**
         * The Last Action of User
         * @type {string}
         */
        this.lastAction = lastAction

        /**
         * The Inventory of User
         * @type {Inventory[]}
         */
        this.inventory = inventory
    }

    /**
     * Add User to Database
     * 
     * @param {string} jid The JID of User
     * @returns {Game}
     */
    static addUser(jid) {
        const parseDir = this.parseDB(jid)
        const obj = {
            jid,
            xp: 0,
            money: 0,
            lastAction: LastAction.NEW_ACCOUNT,
            inventory: []
        }
        parseDir.push(obj)
        fs.writeFileSync(DB_GAME, JSON.stringify(parseDir))
        return new Game(jid, 0, 0, LastAction.NEW_ACCOUNT, [])
    }

    /**
     * Parse User in Database
     * 
     * @returns {Game[]}
     */
    static parseDB() {
        const parseDir = JSON.parse(fs.readFileSync(DB_GAME))
        return parseDir
    }

    /**
     * Take The Action of User
     * 
     * @param {string} jid The JID of User
     * @param {string} action The Action of User
     * @returns {?Reward}
     */
    static takeAction(jid, action) {
        const parseDir = this.parseDB()
        const iUser = parseDir.findIndex(x => x.jid == jid)
        if (action == "fishing") {
            const reward = rewards()[0].rewards
            parseDir[iUser].xp += reward.xp
            parseDir[iUser].lastAction = LastAction.DONE_FISHING
            fs.writeFileSync(DB_GAME, JSON.stringify(parseDir))
            this._addInventory(iUser, reward)
            return { item: reward.item, xp: reward.xp, lengthItem: reward.lengthItem }
        } else if (action == "hunt") {
            const reward = rewards()[1].rewards
            parseDir[iUser].xp += reward.xp
            parseDir[iUser].lastAction = LastAction.DONE_HUNT
            fs.writeFileSync(DB_GAME, JSON.stringify(parseDir))
            this._addInventory(iUser, reward)
            return { item: reward.item, xp: reward.xp, lengthItem: reward.lengthItem }
        } else if (action == "cuttingtree") {
            const reward = rewards()[2].rewards
            parseDir[iUser].xp += reward.xp
            parseDir[iUser].lastAction = LastAction.DONE_CUTTING
            fs.writeFileSync(DB_GAME, JSON.stringify(parseDir))
            this._addInventory(iUser, reward)
            return { item: reward.item, xp: reward.xp, lengthItem: reward.lengthItem }
        }
    }

    /**
     * Format The Money
     * 
     * @param {number} money - The Money
     * @returns {string}
     */
    static formatMoney(money) {
        const formatter = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        })
        return formatter.format(money).slice(0, -3)
    }

    /**
     * Add Inventory
     * 
     * @private
     * @param {number} iUser
     * @param {Reward} reward
     * @returns
     */
    static _addInventory(iUser, reward) {
        const parseDir = this.parseDB()
        const iItem = parseDir[iUser].inventory.findIndex(x => x.item == reward.item)
        if (iItem === -1) {
            parseDir[iUser].inventory.push({ item: reward.item, lengthItem: reward.lengthItem })
            fs.writeFileSync(DB_GAME, JSON.stringify(parseDir))
        } else {
            parseDir[iUser].inventory[iItem].lengthItem += reward.lengthItem
            fs.writeFileSync(DB_GAME, JSON.stringify(parseDir))
        }
    }

    /**
     * Buy Item is Store
     * 
     * @param {string} jid The JID of User
     * @param {number} idItem The ID of Item
     * @param {string} modal The Modal of User
     * @returns {?Store}
     */
    static buyItem(jid, idItem, modal) {
        const store = JSON.parse(fs.readFileSync(DB_STORE))
        const parseDir = this.parseDB()
        const iUser = parseDir.findIndex(x => x.jid == jid)
        const iItem = store.findIndex(x => x.id === idItem)
        if (iItem === -1) {
            throw new Error("There are no item with that ID")
        } else {
            if (parseDir[iUser].inventory.find(x => x.item == modal.toLowerCase())) {
                const checkModal = parseDir[iUser].inventory.findIndex(x => x.item == modal.replace("_", " "))
                if (parseDir[iUser].inventory[checkModal].lengthItem < store[iItem].price[modal]) {
                    throw new Error("Modal is not enough")
                } else {
                    parseDir[iUser].inventory[checkModal].lengthItem -= store[iItem].price[modal]
                    parseDir[iUser].money += Number(store[iItem].item.match(/\d+/g)[0])
                    fs.writeFileSync(DB_GAME, JSON.stringify(parseDir))
                    return store[iItem]
                }
            }
        }
    }
}

module.exports.Game = Game
module.exports.rewards = rewards