const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    username:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type:String
    },
    friends:{
        type: [{'friend':{type:Schema.Types.ObjectId, ref:'user'}, 'lastMessage':{type:Schema.Types.ObjectId, ref:'chat', default:null}}]
    },
    friendRequests:{
        type:[String]
    },
    notifications:{
        type:[String]
    },
    picture:{
        type:String,
        default:'https://res.cloudinary.com/dgajofeja/image/upload/v1697100260/akjmt1tl070y3ss6qodq.png'
    },
    description:{
        type:String,
        default:"Hey Whatsup!!"
    }
})
const User = mongoose.model('user', userSchema);
User.createIndexes();
module.exports = User;

