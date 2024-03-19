import mongoose from "mongoose";

// A schema for the skill
const skillSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });

// Compile our model
const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
