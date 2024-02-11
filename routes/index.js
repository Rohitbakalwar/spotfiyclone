var express = require('express');
const { default: mongoose } = require('mongoose');
const {v4:uuidv4} = require("uuid")
var router = express.Router();
const passport = require("passport");
const userModel = require("../models/userModel");
const songModel = require("../models/songModel");
const playlistModel = require("../models/playlistModel");
const multer = require("multer");
const id3 = require("node-id3");
const {Readable} = require('stream');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));



mongoose.connect("mongodb://0.0.0.0/spotifyclone").then(()=>{
  console.log("connected to database");
}).catch((err)=>{
  console.log(err)
})

const conn = mongoose.connection;
var gfsBucket,gfsBucketPoster;
conn.once("open",()=>{
  gfsBucket =new mongoose.mongo.GridFSBucket(conn.db,{
    bucketName:"audio"
  })
  gfsBucketPoster = new mongoose.mongo.GridFSBucket(conn.db,{
    bucketName:"poster"
  })
})

router.get("/",isLoggedIn, async(req,res,next)=>{
  const currentUser = await userModel.findOne({
    _id:req.user._id
  }).populate('playlist').populate({
    path:'playlist',
    populate:{
      path:'songs',
      model:'song'
    }
  })
  res.render("index",{currentUser});
})

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.get('/login',(req,res)=>{
  res.render('login')
})

router.get('/profile',isLoggedIn,(req,res)=>{
  res.render("profile")
})

router.get('/poster/:posterName',(req,res)=>{
  gfsBucketPoster.openDownloadStreamByName(req.params.posterName).pipe(res)
})

router.get('/stream/:musicStream', async(req,res)=>{
  const currentSong = await songModel.findOne({
    filename:req.params.musicStream
  })



   const stream = gfsBucket.openDownloadStreamByName  (req.params.musicStream)

   res.set('content-Type','audio/mpeg');
   res.set('content-Length',currentSong.size + 1)
   res.set('content-Range',`bytes 0-${currentSong.size - 1}/${currentSong.size}`)
   res.status(206)

   stream.pipe(res)

})

router.get('/search',(req,res,next)=>{
  res.render('search')
})

router.post('/search', async (req, res, next) => {

  // console.log(req.body)
  const searchedMusic = await songModel.find({
    title: { $regex: req.body.search }
  })

  res.json({
    song: searchedMusic
  })

})


/*authenticate routes*/

router.post('/register',function(req,res){
  var newUser = new userModel ({
    username:req.body.username,
    email:req.body.email,
    fullname:req.body.fullname
  })
userModel.register(newUser, req.body.password)
.then((u)=>{
  passport.authenticate('local')(req,res, async function(){
    
    const songs =  await songModel.find();
    const defaultPlaylist = await playlistModel.create({
      name: req.body.username,
      owner:req.user._id,
      songs:songs.map(song=>song._id)
    })

    const newUser = await userModel.findOne({
      _id: req.user._id
    })

    newUser.playlist.push(defaultPlaylist._id);

    await newUser.save();

    res.redirect('/')
  })
})
.catch((err)=>{
  res.send(err)
})
})

router.post('/login',passport.authenticate('local',{
  successRedirect:"/",
  failureRedirect:"/login"
}),(req,res)=>{})

router.get('/logout',(req,res,next)=>{
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
})

function isLoggedIn(req,res,next)
{
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect('/login')
  }
}

function isAdmin(req,res,next){
  if(req.user.isAdmin) return next();
  else return res.redirect("/")
}

/*authenticate routes*/



router.get("/uploadMusic", isLoggedIn,isAdmin,(req,res)=>{
  res.render("uploadMusic");
})

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.post('/uploadMusic',isLoggedIn,isAdmin,upload.array('song'), async (req,res,next)=>{
  
  await Promise.all(req.files.map(async file=>{

    
    const unqiueFileName = uuidv4();
    const songData = (id3.read(file.buffer));  
    Readable.from(file.buffer).pipe(gfsBucket.openUploadStream(unqiueFileName));
    Readable.from(songData.image.imageBuffer).pipe(gfsBucketPoster.openUploadStream( unqiueFileName + "poster"));
    
    await songModel.create({
      title:songData.title,
      artist:songData.artist,
      album:songData.album,
      size:file.size,
      year:songData.year,
      poster:unqiueFileName + "poster",
      filename:unqiueFileName,
      
    })
  }))
    
  res.send(" songs uploaded")
})

module.exports = router;


