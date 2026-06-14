import express from 'express';
import { getCurrentUser, loginUser, registerUser, updatePassword, updateProfile, debugListUsers } from '../controllers/userControllers.js';
import authMiddleware from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/debug-list", debugListUsers);

//protected Routes 

userRouter.get("/me", authMiddleware, getCurrentUser);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.put("/password", authMiddleware, updatePassword);

export default userRouter;