require("dotenv").config();
const mongoose = require('mongoose');

// Define the Theme schema
const themeSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

// Define the Set schema
const setSchema = new mongoose.Schema({
  set_num: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  year: { type: Number, required: true },
  num_parts: { type: Number, required: true },
  theme_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true },
  img_url: { type: String }
});

// Create models
const Theme = mongoose.model("Theme", themeSchema);
const Set = mongoose.model("Set", setSchema);

// Initialize MongoDB connection
async function initialize() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connection to MongoDB has been established successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Get all sets with themes
async function getAllSets() {
  try {
    const sets = await Set.find().populate('theme_id');
    return sets;
  } catch (error) {
    console.error("Error getting all sets:", error);
    throw error;
  }
}

// Get a specific set by set number
async function getSetByNum(setNum) {
  try {
    const set = await Set.findOne({ set_num: setNum }).populate('theme_id');
    if (set) {
      return set;
    } else {
      throw `Set not found with set_num: ${setNum}`;
    }
  } catch (error) {
    console.error("Error getting set by set_num:", error);
    throw error;
  }
}

// Get sets by theme name
async function getSetsByTheme(theme) {
  try {
    const sets = await Set.find().populate({
      path: 'theme_id',
      match: { name: { $regex: new RegExp(theme, 'i') } }
    });

    if (sets.length > 0) {
      return sets;
    } else {
      throw `No sets found for theme: ${theme}`;
    }
  } catch (error) {
    console.error("Error getting sets by theme:", error);
    throw error;
  }
}

// Add a new set
async function addSet(setData) {
  try {
    const newSet = new Set(setData);
    await newSet.save();
    return newSet;
  } catch (error) {
    throw new Error('Error adding set: ' + error.message);
  }
}

// Get all themes
async function getAllThemes() {
  try {
    const themes = await Theme.find();
    return themes;
  } catch (error) {
    throw new Error('Error fetching themes: ' + error.message);
  }
}

// Edit a set
async function editSet(set_num, setData) {
  try {
    const set = await Set.findOne({ set_num: set_num });
    if (set) {
      Object.assign(set, setData);
      await set.save();
      console.log('Set updated successfully');
      return set;
    } else {
      throw new Error(`Set with set number ${set_num} not found`);
    }
  } catch (error) {
    throw new Error(`Error updating set: ${error}`);
  }
}

// Delete a set
async function deleteSet(setNum) {
  try {
    const result = await Set.deleteOne({ set_num: setNum });
    if (result.deletedCount === 0) {
      throw new Error('Set not found');
    }
  } catch (error) {
    throw new Error('Error deleting set: ' + error.message);
  }
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };
