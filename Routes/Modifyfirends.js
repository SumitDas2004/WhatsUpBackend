const express = require('express');
const app = express.Router();
const User = require('../Modules/User')
const Chat = require('../Modules/Chat')
const authenticate = require('../middleWare/authentication')

const fetchUserData = async (id) => {
    const user = await User.findById(id);
    return {
        username: user.username,
        email: user.email,
        picture: user.picture,
        description: user.description
    }
}

const getUserDetails = async (friends) => {
    const friendDetails = [];
    if (friends.length == 0) return friendDetails;

    await Promise.all(friends.map(async(e) => {
        const details = await fetchUserData(e.friend?e.friend:e);
        friendDetails.push({...details, 'lastMessage':e.lastMessage?await Chat.findById(e.lastMessage):""});
    }))
    return friendDetails;
}

app.get('/getfriends', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) {
            return res.status(404).json({ 'message': 'Authorization failed, login first!!' });
        }
        const f = await getUserDetails(user.friends)
        return res.status(200).json({'friends':f});

    } catch (e) {
        return res.status(500).json({ 'message': 'Some internal error occured.' });
    }
})


app.put('/sendfriendrequest', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) {
            return res.status(404).json({ 'message': 'Authorization failed, login first!!' });
        }
        const friend = await User.findOne({ email: req.body.email });
        if (!friend) {
            return res.status(404).json({ 'message': 'User doesn\'t exist.' });
        }
        if (user.friendRequests.includes(friend.id)) {
            return res.status(404).json({ 'message': 'You already have pending request from the user. Do accept that.' });
        }

        let alreadyFriend = false;
        user.friends.map(e=>{
            if(e.friend.toString()===friend.id)alreadyFriend=true;
        })
        if(alreadyFriend)return res.status(200).json({ 'message': 'User is already your friend' });

        if (friend.id === req.id) {
            return res.status(404).json({ 'message': 'Can\'t send friend request to self!' });
        }
        if (friend.friendRequests.includes(user.id)) {
            return res.status(404).json({ 'message': 'you already have pending request to this user.' });
        }
        friend.friendRequests.push(user.id);
        await friend.save();
        return res.status(200).json({ 'message': 'Friend request sent successfully.' });
    } catch (e) {
        return res.status(500).json({ 'message': 'Some internal error occured :(' });
    }
})

app.get('/getfriendrequests', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) {
            return res.status(404).json({ 'message': 'Authorization failed, login first!!' });
        }
        const userDetails = await getUserDetails(user.friendRequests)
        res.status(200).json({ 'friendrequests': userDetails });
    } catch (e) {
        return res.status(500).json({ 'message': 'Some internal error occured.' });
    }
})

app.put('/acceptfriendrequest', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) {
            return res.status(404).json({ 'message': 'Authorization failed, login first!!' });
        }
        const friend = await User.findOne({ email: req.body.email });
        const occurence = user.friendRequests.indexOf(friend.id);
        let alreadyFriend = false;
        
        user.friends.map(e=>{
            if(e.friend.toString()===friend.id)alreadyFriend=true;
        })
        if(alreadyFriend)return res.status(200).json({ 'message': 'User is already your friend' });

        user.friendRequests.splice(occurence, 1);
        user.friends.push({'friend':friend._id, lastMessage:null});
        friend.friends.push({'friend':user._id, lastMessage:null});
        friend.notifications.push(`${user.username} has accepted your friend request.`);
        await user.save();
        await friend.save();
        return res.status(200).json({ 'message': 'Successfully added user to your friend list.' });
    } catch (e) {
        return res.status(500).json({ 'message': 'Some internal error occured :(' });
    }
})

app.put('/rejectfriendrequest', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) {
            return res.status(404).json({ 'message': 'Authorization failed, login first!!' });
        }
        const friend = await User.findOne({ email: req.body.email });
        const occurence = user.friendRequests.indexOf(friend.id);
        user.friendRequests.splice(occurence, 1);
        await user.save();
        return res.status(200).json({ 'message': 'Successfully rejected friend request.' });
    } catch (e) {
        return res.status(500).json({ 'message': 'Some internal error occured :(' });
    }
})

app.put('/clearnotification', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) {
            return res.status(404).json({ 'message': 'Authorization failed, login first!!' });
        }
        user.notifications.splice(req.body.index, 1);
        await user.save();
        return res.status(200).json({ 'message': 'cleared notification.' });
    } catch (e) {
        return res.status(500).json({ 'message': 'Some internal error occured :(' });
    }
})

app.get('/fetchallnotifications', authenticate, async (req, res) => {
    try{
    const user = await User.findById(req.id);
    if (!user) {
        return res.status(404).json({ 'message': 'Authorization failed, login first!!' });
    }
    return res.status(200).json({ 'notifications': user.notifications });
}catch(e){
    return res.status(500).json({ 'message': 'Some internal error occured :(' });
}
})

module.exports = app;