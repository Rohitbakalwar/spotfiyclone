const mongoose = require("mongoose");

const songSchema = mongoose.Schema({
    title:String,
    artist:String,
    album:String,
    year:String,
    category:[{
        type:String,
        enum:['hindi','punjabi']
    }],
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
        }
    ],
    size:Number,
    poster:String,
    filename:{
        type:String,
        required:true
    }

})

module.exports = mongoose.model('song',songSchema);