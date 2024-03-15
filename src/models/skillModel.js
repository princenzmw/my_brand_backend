import mongoose from "mongoose";

// A schema for the skill
const skillSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: String,
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compile our model
const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
