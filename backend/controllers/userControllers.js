import User from '../models/userModels.js';
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES = '24h'

const createToken = (userId) => 
    jwt.sign({ id: userId}, JWT_SECRET, {expiresIn: TOKEN_EXPIRES});


// DIAGNOSTIC HELPER to list users (temporary)
export async function debugListUsers(req, res) {
    try {
        const users = await User.find({}).select("name email");
        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}


//REGISTER A USER
export async function registerUser(req,res){
    const {name,email,password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    if(!validator.isEmail(email)){
        return res.status(400).json({
            success: false,
            message: "Invalid email"
        });
    }
    if(password.length < 8){
        return res.status(400).json({
            success:false,
            message:"Password must be atlest of 8 characters"
        })
    }

    try {
        const cleanedEmail = email.trim();
        console.log("Registration attempt for:", { name, email: cleanedEmail });
        const existingUser = await User.findOne({ 
            email: { $regex: new RegExp("^" + cleanedEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") } 
        });
        if (existingUser){
            console.log("Registration failed: User already exists:", cleanedEmail);
            return res.status(400).json({
                success:false,
                message:"User already present"
            });
        }

        const hashed = await bcrypt.hash(password,10);
        console.log("Password hashed successfully");
        const user = await User.create({name, email: cleanedEmail, password: hashed});
        console.log("User created in DB:", { id: user._id, name: user.name, email: user.email });
        const token = createToken(user._id);
        res.status(201).json({
            success: true,
            token,
            user: {id: user._id, name: user.name, email: user.email}
        });
        
    } 
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success:false,
            message: "Server Error"
        });
        
    }
}

// to login a user
export async function loginUser(req,res) {
    const {email, password} = req.body;
        if(!email || !password ) {
            return res.status(404).json({
                success:false,
                message: "Both fields are required"
            });
        }


    try {
        const cleanedEmail = email.trim();
        console.log("Login attempt for email:", cleanedEmail);
        const user = await User.findOne({ 
            email: { $regex: new RegExp("^" + cleanedEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") } 
        });
        if(!user) {
            console.log("Login failed: User not found for email:", cleanedEmail);
            return res.status(401).json({
                success:false,
                message: "Invalid email or password"
            });
        }
        console.log("User found in DB:", { id: user._id, name: user.name, email: user.email });

        const match = await bcrypt.compare(password,user.password);
        console.log("Password match result:", match);
        if(!match) {
             console.log("Login failed: Password mismatch for email:", email);
             return res.status(401).json({
                success:false,
                message: "Invalid email or password"
            });

        }

        const token = createToken(user._id);
        res.json({
            success:true,
            token,
           user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })

        
    } 
       catch (error) {
        console.error(error);
        res.status(500).json({
            success:false,
            message: "Server Error"
        });
     
    }  
}

// to get login user details
export async function getCurrentUser(req,res){
    try {
        const user = await User.findById(req.user._id).select("name email");
        if(!user){
            return res.status(404).json({
                success:false,
                message: "User not found"
            });
        }
        res.json({success: true, user});


    } 
       catch (error) {
        console.error(error);
        res.status(500).json({
            success:false,
            message: "Server Error"
        });
    }
}

// to update a user profile
export async function updateProfile(req,res){
    const {name, email} = req.body;
    if(!name || !email || !validator.isEmail(email)){
        return res.status(400).json({
            success: false,
            message: "Valid email and name are required"
        });
    }


try {
    const exists = await User.findOne({email,_id:{$ne: req.user.id}});
    if(exists){
        return res.status(409).json({
            success: false,
            message: "Email already in use"
        });

    }
    const user = await User.findByIdAndUpdate(
        req.user.id,
        {name,email},
        {new: true, runValidators: true, select: "name email"}
    );
    res.json({
        success: true,
        user
    })


    
} 

catch (error) {
        console.error(error);
        res.status(500).json({
            success:false,
            message: "Server Error"
        });
    }
}

    // to change user password
    export async function updatePassword(req,res) {
        const { currentPassword, newPassword} = req.body;
        if(!currentPassword || !newPassword || newPassword.length < 8 ){
            return res.status(400).json({
                success:false,
                message: "Password invalid or too short"
            });
        }
        try {
            const user = await User.findById(req.user.id).select("password");
            if(!user) {
                return res.status(404).json({
                    success:false,
                    message: "User not found"
                })
            }

            const match = await bcrypt.compare(currentPassword, user.password);
            if(!match){
                return res.status(401).json({
                    success:false,
                    message: "Current Password is incorrect"
                });
            }

            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
            res.json({
                success:true,
                message:"Password changed"
            });
            
        } 
        
        catch (error) {
            console.error(error);
        res.status(500).json({
            success:false,
            message: "Server Error"
        });
            
        }
    }