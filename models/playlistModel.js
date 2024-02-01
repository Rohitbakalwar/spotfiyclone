const mongoose = require('mongoose');

const playlistSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'user'
    },
    songs:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'song'
    }],

    poster:{
        type:String,
    default:"/images/music.png"
    },
})

module.exports = mongoose.model('playlist',playlistSchema);