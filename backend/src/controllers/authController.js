const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const registerUser = async(req,res)=>{
    try{
        const{name,email,password,role}=req.body;

        //checking if user already exist
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message:'User already exists'});
        }
        //Hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        //create user
        const user = await User.create({
            name,email,password:hashedPassword,role
        });
        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            role:user.role,
        });

    } catch(error){
        console.log(error);
        res.status(500).json({
            message:'server error'
        });

    }

};

const loginUser = async(req,res)=>{
    try{
        const {email,password} = req.body;
           //check if user already exists
           const user = await User.findOne({email});
           if(!user){
            return res.status(400).json({message:'Invalid credentials'});

           }
           //compare passowrd
           const isMatch = await bcrypt.compare(password,user.password);
           if(!isMatch){
            return res.status(400).json({message:'Invalid credentilas'});
           }
           //creating jwt token
           const token = jwt.sign(
            {id:user._id,role:user.role},
            process.env.JWT_SECRET,
            {expiresIn:'1d'}
           );
           res.json({
            _id:user._id,
            name:user.name,
            email:user.email,
            role:user.role,
            token,
           });

    }catch{
        res.status(500).json({message:'server error'});
    }
};

module.exports = {registerUser,loginUser};