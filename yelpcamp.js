var express              =require("express"),
    app                  =express(),
    bodyParser           =require("body-parser"),
    mongoose             =require("mongoose"),
    passport             =require("passport"),
    flash                =require("connect-flash"),
    User                 =require("./useryelpcamp"),
    LocalStrategy        =require("passport-local"),
    methodOverride       =require("method-override"),
    passportLocalMongoose=require("passport-local-mongoose");

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname+"/public"));
app.use(require("express-session")({
	secret:"Rusty",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());
app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
	next();
})
app.use(methodOverride("_method"));
var middleware=require("./middleware/index.js");



app.set("view engine","ejs");


mongoose.connect("mongodb://localhost/yelpcamp4");

var Campground=require("./campground"),
    seeddb    =require("./seed"),
    Comment   =require("./comment");


//seeddb();

//----sign up form 
app.get("/register",function(req,res){
	res.render("registeryelpcamp");
})
app.post("/register",function(req,res){
	var newUser=new User({username:req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			req.flash("error",err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success","successfully registered,wlecome "+user.username);
			res.redirect("/campground");
		})
	})
})
//---log in form
app.get("/login",function(req,res){
	res.render("loginyelpcamp");
});
app.post("/login",passport.authenticate("local",
{
    
    successRedirect:"/campground",
    failureRedirect:"/login"
    }),
	function(req,res){

	});
//----log out form
app.get("/logout",function(req,res){
	req.logout();
	req.flash("success","logged you out");
	res.redirect("/campground");
})

app.get("/",function(req,res){
	res.render("landing");
})
//---campground display pages

app.get("/campground",function(req,res){
	
	Campground.find({},function(err,camps){
	if(!err){
		res.render("campground",{camp:camps})
		}
})

})
app.post("/campground",middleware.isLoggedIn,function(req,res){
	var s=req.body.camping;
	var i=req.body.place;
	var d=req.body.des;
	var p=req.body.price;
	var author={
		id:req.user._id,
		username:req.user.username
	}
	Campground.create({
		name: s,
		image: i,
		description: d,
		author:author,
		price:p
	},function() {
   res.redirect("/campground");
	})
	

})
app.get("/campground/new",middleware.isLoggedIn,function(req,res){
	res.render("camp");
})
app.get("/campground/:id",function(req,res){
    console.log(req.params.id);
    Campground.findById(req.params.id).populate("comments").exec(function(err,camping){
    	console.log(err+"mohit");
    	if(!err){
             console.log(camping+"mohitsingh");
             res.render("show",{camping: camping});
    	}
    })
	
})
//---update and destroy 
app.get("/campground/:id/edit",middleware.check,function(req,res){
	
          Campground.findById(req.params.id,function(err,foundCampground){
                res.render("campgroundedit",{campground:foundCampground});
                });	
})
app.put("/campground/:id",middleware.check,function(req,res){
	Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updateCampground){
		if(!err){
			req.flash("success","successfully updated");
			res.redirect("/campground/"+req.params.id);
		}
	})
})
///delete the post
app.delete("/campground/:id",middleware.check,function(req,res){
	Campground.findByIdAndRemove(req.params.id,function(err){
		if(!err){
			req.flash("success","successfully removed")
			res.redirect("/campground");
		}
	})
})
//---------comment
app.get("/campground/:id/comment/new",middleware.isLoggedIn,function(req,res){
     Campground.findById(req.params.id,function(err,campground){
     	if(!err){
             res.render("yecom",{campground:campground});
     	}
     })
})
app.post("/campground/:id/comment",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(!err){
          var i=req.body.title;
			Comment.create({
				title:i
			},function(err,comment){
		        console.log(i+"shanu");
                    if(!err){
                    	console.log(req.user.username+"divya");
               
                comment.author.id=req.user._id;
                comment.author.username=req.user.username;
                comment.save();
		        campground.comments.push(comment);
				campground.save();
				console.log(comment+"saloni");
				res.redirect("/campground/"+campground._id);
			}
			})
		}
	})
})
//---comment update and destroy
app.get("/campground/:id/comment/:comment_id/edit",middleware.checkComment,function(req,res){
	Comment.findById(req.params.comment_id,function(err,comment){
		if(!err){
			res.render("commentedit",{campground_id:req.params.id,comment:comment});
		}
	})
})
app.put("/campground/:id/comment/:comment_id",middleware.checkComment,function(req,res){
	Comment.findByIdAndUpdate(req.params.comment_id,req.body.title,function(err,comment){
		if(err){
			console.log(err);
		}
		else{
			req.flash("success","successfully updated");
			res.redirect("/campground/"+req.params.id);
		}
	})
})
app.delete("/campground/:id/comment/:comment_id",middleware.checkComment,function(req,res){
	Comment.findByIdAndRemove(req.params.comment_id,function(err,mohit){
		if(!err){
			req.flash("success","successfully removed");
			res.redirect("/campground/"+req.params.id);
		}
	})
})



//---port functioning

app.listen(3000,function(){
	console.log("yelpcamp has been started");
})