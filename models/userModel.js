 const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

 const userSchema = mongoose.Schema({
    username:String,
    email:String,
    contact:String,
    fullname:String,
    playlists:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'playlist',
    }],
    liked:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"song"
    }],
    profileImage:{
        type:String,
    },
    isAdmin:{
        type:Boolean,
        default:false
    }
 })

userSchema.plugin(plm); 

 module.exports = mongoose.model("user",userSchema);