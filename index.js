import axios from 'axios';
import dotenv, { parse } from 'dotenv';
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
 * 
 * Float properties
 * @property {Number} floatvalue
 * @property {Number} paintseed
 * @property {Number} paintindex
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

/**
 * Populates the float values of the items in the inventory
 * @param {ParsedInventoryItem[]} parsedInventory 
 * @param {steamid64} steamid64 
 * @returns {Promise<ParsedInventoryItem[]>}
 */
const addFloatsToParsedInventory = async (parsedInventory, steamid64) => {
    const parsedInventoryWithFloats = [];

    for (const item of parsedInventory) {
        try {
            if (!item.inspect_url) {
                console.error('No inspect url found for item:', item.market_hash_name);
                continue;
            }

            // replace %owner_steamid% with the steamid64 of the user
            // and %assetid% with the assetid of the item
            const parsedInspectUrl = item.inspect_url.replace('%owner_steamid%', steamid64).replace('%assetid%', item.assetid);

            const response = await axios.get(
                'https://csinventoryapi.com/api/v1/inspect?api_key=' + API_KEY + '&url=' + parsedInspectUrl
            );
            
            const { floatvalue, paintseed, paintindex } = response.data.iteminfo;

            parsedInventoryWithFloats.push({
                ...item,
                inspect_url: parsedInspectUrl,
                floatvalue,
                paintseed,
                paintindex
            });

            await new Promise(r => setTimeout(r, 10000));
            console.log('Fetched float values for item:', item.market_hash_name);
        } catch (error) {
            console.log(error);
            console.error('Failed to fetch float values for item:', item.market_hash_name);
        }
    }

    return parsedInventoryWithFloats;
}

const getInventoryWithFloats = async (steamid64) => {
    const inventory = await getUserInventory(steamid64);
    const parsedInventory = await parseInventory(inventory);
    const inventoryWithFloats = await addFloatsToParsedInventory(parsedInventory, steamid64);
    console.log(inventoryWithFloats);
}

// Change the steamid64 to the user you want to fetch the inventory of
getInventoryWithFloats('76561198166295458');