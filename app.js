const dotenv=require('dotenv').config();
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs')
const mongoose=require('mongoose');
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const FacebookStrategy= require('passport-facebook').Strategy;
const findOrCreate=require('mongoose-findorcreate');

//Create a variable for the Express App
const app=express();

//Middlewares
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());




//Create a variable for the Database URL
const dbURI= 'mongodb://0.0.0.0:27017/usersDB';

//Connect Database to Mongoose
mongoose.connect(dbURI,{UseNewUrlParser: true, useUnifiedTopology:true});


//Create User Database Schema

const userDataSchema=new mongoose.Schema({
    firstName:{
        type:String
    },
    lastName:{
        type:String
    },
    address:String,
    country:{
        type:String
    },
    email:{
        type:String
    },
    password:{
        type:String
    },
    facebookId:{
      type:String
    }
});

//Plugins
userDataSchema.plugin(passportLocalMongoose);
userDataSchema.plugin(findOrCreate);

//Create User Model
const UserData=new mongoose.model('UserData',userDataSchema);

//Create Strategy
passport.use(UserData.createStrategy());

//Serialize Users
passport.serializeUser((user,done)=>{
  done(null,user.id);
});

//Deserialize Users
passport.deserializeUser((id,done)=>{
  UserData.findById(id,(err,user)=>{
    done(err,user);
  });
});

//FACEBOOK LOGIN STRATEGY
passport.use(new FacebookStrategy({
  clientID: process.env.CLIENT_ID_FB,
  clientSecret: process.env.CLIENT_SECRET_FB,
  callbackURL: "http://localhost:3000/auth/facebook/mai",
  userProfileUrl:''
},
function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

//HOME ROUTE
app.get('/',(req,res)=>{
  console.log('Homepage');
  // RENDER TO HOMEPAGE
    res.send('Homepage')
});

//REGISTER REQUESTS
app.route('/register')
.get((req,res)=>{
  console.log('Register Page');
  //RENDER TO REGISTER PAGE
  res.send('register')
})
.post((req, res)=>{

  UserData.register({username: req.body.username, firstName:req.body.firstName,lastName:req.body.lastName,email:req.body.email,country:req.body.country}, req.body.password,(err, user)=>{
    if (err) {
      console.log(err);
      console.log('Not working');
      //RENDER TO REGISTER PAGE
      res.send("register");
    } else {
      passport.authenticate("local")(req, res,()=>{
        console.log('Registered to a new sign up page');
        //RENDER TO THE SECRETS PAGE
        res.send("Secrets");
      });
    }
  });

});

//FACEBOOK ROUTES
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/mai',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log('Secrets')
    res.render('mai');
  });

// Login Requests
app.route('/login')
.get((req,res)=>{
  res.render('login')
})
.post((req, res)=>{

  const users = new UserData({
    username: req.body.username,
    password: req.body.password
  });

  req.login(users,(err)=>{
    if (err) {
      console.log(err);
      console.log('User doesnt exist')
    } else {
      passport.authenticate("local")(req, res,()=>{
        console.log('Succesfully logged in')
        res.send("secrets");
      });
    }
  });

});



app.listen(process.env.PORT|| 3000,()=>{
    console.log('Server started on port 3000');
});