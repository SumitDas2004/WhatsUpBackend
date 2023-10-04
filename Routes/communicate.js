const express = require('express');
const app = express.Router();
const authenticate = require('../middleWare/authentication');
const Chat = require('../Modules/Chat');
const User = require('../Modules/User')

app.post('/sendmessage', authenticate, async(req, res)=>{
    try{
    const {sender, receiver, content} = req.body;
    const message= await Chat.create({
        receiver: receiver,
        sender: sender,
        content: content
    });
    const senderObject = await User.findOne({email:sender});
    const receiverObject = await User.findOne({email:receiver});
    senderObject.friends.map((e)=>{
        if(e.friend.equals(receiverObject._id)){
            e.lastMessage = message._id;
            return;
        }
    })
    receiverObject.friends.map((e)=>{
        if(e.friend.equals(senderObject._id)){
            e.lastMessage = message._id;
            return;
        }
    })
    await senderObject.save();
    await receiverObject.save();
    res.status(200).json({message: message})
    }catch(e){
        res.status(500).send({message:'Internal server error:('})
    }
});
app.post('/getallmessages', authenticate, async(req, res)=>{
    try{
    const {sender, receiver} = req.body;
    const messages = await Chat.find({$or:[{sender:sender, receiver:receiver}, {sender:receiver, receiver:sender}]}).sort({"createdAt":1});

    return res.status(200).json({messages:messages})
    }catch(e){
        res.status(500).send({message:'Internal server error:('});
    }
})

app.put('/readmessage',authenticate, async(req, res)=>{
const message = await Chat.findById(req.body._id);
message.read = true;
await message.save();
res.status(200);
})
module.exports = app;