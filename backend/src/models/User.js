const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true

    },
    
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:['customer','restaurant','delivery'],
        default:'customer',
    },
    location: {
  lat: { type: Number },
  lng: { type: Number }
},
},
       { timestamps:true});
   
       module.exports = mongoose.model('User',userSchema);