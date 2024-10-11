import axios from 'axios';

const API_KEY = process.env.CSINVENTORYAPI_API_KEY;

// typedef inventory

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
 * Fetches the inventory of a user
 * 
 * @param {string} steamid64 of the user
 * @returns {Promise<Inventory>} the user's inventory
 */
const getUserInventory = async (steamid64) => {
    if (!API_KEY) {
        throw new Error('No API key provided');
    }
    const response = await axios.get(
        `https://csinventoryapi.com/api/v1/inventory?api_key=${API_KEY}&steamid64=${steamid64}`
    );

    return response.data;
}

const parseInventory = async (inventory) => {

}

const addFloatsToParsedInventory = async (parsedInventory) => {

}

const getInventoryWithFloats = async (steamid64) => {

}