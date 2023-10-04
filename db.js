const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config();
const URL = process.env.DATABASE_URL;

const connectTOMongo=async ()=>{
    try{
        await mongoose.connect(URL);
        console.log('Successfully connected to Database');
    }catch(error){
        console.log('Unable to connect to mongo '+error)
    }
}
module.exports = connectTOMongo;