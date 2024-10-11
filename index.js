import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.CSINVENTORYAPI_KEY;

if (!API_KEY) {
    throw new Error('No API key provided');
}

/**
 * @typedef {Object} Inventory
 * 
 * @property {Array} assets
 * @property {Array} descriptions
 * @property {Number} total_inventory_count
 * @property {Number} success
 * @property {Number} rwgrsn
 */

/**
 * @typedef {Object} ParsedInventoryItem
 * 
 * These are from assets[]
 * @property {Number} appid
 * @property {String} classid
 * @property {String} instanceid
 * @property {String} assetid
 * @property {String} contextid
 * 
 * These are from descriptions[]
 * @property {String} icon_url
 * @property {Number} tradable
 * @property {String | null} inspect_url
 * @property {String} name
 * @property {String} market_hash_name
 * @property {String} name_color
 * You can fetch many more properties from descriptions[]
 */

/**
 * Fetches the inventory of a user
 * 
 * @param {string} steamid64 of the user
 * @returns {Promise<Inventory>} the user's inventory
 */
const getUserInventory = async (steamid64) => {
    const response = await axios.get(
        `https://csinventoryapi.com/api/v1/inventory?api_key=${API_KEY}&steamid64=${steamid64}`
    );

    if (response.data.success !== 1) {
        throw new Error('Failed to fetch inventory');
    }

    if (response.data.total_inventory_count === 0) {
        throw new Error('No items found.');
    }

    if (!response.data.assets || !response.data.descriptions) {
        throw new Error('No assets found.');
    }

    return response.data;
}

/**
 * 
 * @param {Inventory} inventory 
 * @returns {Promise<ParsedInventoryItem[]>}
 */
const parseInventory = async (inventory) => {
    const parsedInventory = [];

    for (let i = 0; i < inventory.assets.length; i++) {
        const asset = inventory.assets[i];
        const description = inventory.descriptions.find(d => d.classid === asset.classid);

        if (!description) {
            continue;
        }

        parsedInventory.push({
            appid: asset.appid,
            classid: asset.classid,
            instanceid: asset.instanceid,
            assetid: asset.assetid,
            contextid: asset.contextid,
            icon_url: description.icon_url,
            tradable: description.tradable,
            inspect_url: description.actions && description.actions[0] && description.actions[0].link || null,
            name: description.name,
            market_hash_name: description.market_hash_name,
            name_color: description.name_color
        });
    }

    return parsedInventory;
}

const addFloatsToParsedInventory = async (parsedInventory) => {

}

const getInventoryWithFloats = async (steamid64) => {
    const inventory = await getUserInventory(steamid64);
    const parsedInventory = await parseInventory(inventory);
    console.log(parsedInventory);
}

getInventoryWithFloats('76561198166295458');