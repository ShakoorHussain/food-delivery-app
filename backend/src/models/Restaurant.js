const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    cuisine: {
        type: [String],
        default: []
    },
    rating: {
        type: Number,
        default: 0
    },
    menu: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    location: {
  lat: { type: Number, default: 31.5204 },
  lng: { type: Number, default: 74.3587 }
},
});

module.exports = mongoose.model('Restaurant', restaurantSchema);