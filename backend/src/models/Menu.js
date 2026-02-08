const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    restaurant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Restaurant',
        required:true
    },
    name:{
        type:String,
        required:true,
        trim:true
    },

   description: {
         type:String,
         trim:true
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    image:{
        type:String // for uRL
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});
module.exports = mongoose.model('Menu',menuSchema);