import mongoose from "mongoose";

export const connectDB = async() => {
    await mongoose.connect("mongodb+srv://snapbytesofficial_db_user:mrkanhu03042026@cluster0.3b6kbzs.mongodb.net/Expense").then(()=> console.log("DB CONNECTED"));


}