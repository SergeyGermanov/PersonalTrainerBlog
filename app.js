//Initialisation
var express = require("express");
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Mail
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

// Handlebars
var handlebars = require('express-handlebars');
var Handlebars = require('handlebars');

app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');


// Reverse helper Handlebars
Handlebars.registerHelper('reverse', function (arr) {
    arr.reverse();
});

// SQLite init
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('base.db');

// Cookies init
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// Sessions init
var session = require('express-session');
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: "compsci719"
}));

// Files and dir init
var formidable = require('formidable');

// Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// Hash bcrypt
var bcrypt = require('bcrypt');

//Initialize port
app.set("port", process.env.PORT || 8080);

//Initialize folder
app.use(express.static(path.join(__dirname, 'public')));


//Authorisation
getUser = function (username, callback) {
    username = username.toLowerCase();
    db.all('SELECT * FROM user WHERE username = ?', [username], function (err, rows) {
        if (rows.length > 0) {
            callback(rows[0]);
        } else {
            callback(null);
        }
    });
};

var localStrategy = new LocalStrategy(
    function (username, password, done) {

        getUser(username, function (user) {

            if (!user) {
                return done(null, false, { message: 'Invalid user' });
            };

            if (bcrypt.compareSync(user.password, password)) {
                return done(null, false, { message: 'Invalid password' });
            };

            done(null, user);
        });
    }
);

passport.serializeUser(function (user, done) {
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    getUser(username, function (user) {
        done(null, user);
    });
});

passport.use('local', localStrategy);

app.use(passport.initialize());
app.use(passport.session());


//home and login
app.get("/login", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/");
    }
    else {
        var data = {
            bgPicture: 'banner_login',
            loginFail: req.query.loginFail
        }
        res.render('login', data);
    }
});


app.post('/login', passport.authenticate('local',
    {
        successRedirect: '/',
        failureRedirect: '/login?loginFail=true'
    }
));


//Start the site
app.get('/' || '/index', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;

    }
    var data = {
        bgPicture: 'about-bg',
        heading: '"Train for life',
        subheading: 'Not for summer"',
        username: username
    }
    res.render('index', data);
});


//articles (edit/add/view/delete)
app.get('/articles/:article_ID', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
    }
    var articleID = req.params.article_ID;

    db.all("select a.article_ID, a.title, a.content, a.username, u.fname || ' ' || u.lname as 'fullName' from article a, user u where a.article_ID = ? and a.username = u.username", [articleID], function (err, rows) {
        var article = rows[0];
        var data = {
            bgPicture: "blog-bg",
            username: username,
            article_ID: articleID,
            title: article.title,
            content: article.content,
            fullName: article.fullName
        }
        db.all("select c.comment_ID, c.comment_content, c.username, u.avatar, c.article_ID from comment c, user u where c.username = u.username and c.article_ID = ?", [articleID], function (err, rows) {
            res.render('articleDetails', data);
        });
    });
});






app.get('/blog', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
    }
    db.all("SELECT a.title, a.article_ID, substr(a.content, 1, 500) || '...' as 'articleContent', u.fname || ' ' || u.lname as 'fullName' FROM user u, article a WHERE a.username = u.username", function (err, rows) {
        var articles = rows;
        var data = {
            bgPicture: "blog-bg",
            username: username,
            articles: articles
        }
        res.render('blog', data);
    });
});

// app.get('/bootcamps', function (req, res) {
//     if (req.isAuthenticated()) {
//         var username = req.user.username;
//         var avatar = req.user.avatar;
//     }
//     var data = {
//         bgPicture: "Bootcamps-bg",
//         avatar: avatar,
//         username: username
//         // heading: "Man must explore, and this is exploration at its greatest",
//         // subheading: "Problems look mighty small from 150 miles up",
//         // posted: "Posted by",
//         // link: "Start Bootstrap",
//         // date: "on August 24, 2018",
//         // extraInfoHeading: true
//     }
//     res.render('bootcamps', data);
// });


app.get('/fitnessweekends', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
    }
    var data = {
        bgPicture: "FitnessWeekends",
        username: username
    }
    res.render('fitnessweekends', data);
});


app.get('/onlinetraining', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
    }
    var data = {
        bgPicture: "OnlineTraining",
        username: username
    }
    res.render('onlinetraining', data);
});

app.get('/contact', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
    }
    var data = {
        bgPicture: "contact-bg",
        username: username
    }
    res.render('contact', data);
});

var config = require('./public/js/text');

//Using bodyparser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

//Authentification to mail server
var smtpTransport = nodemailer.createTransport(smtpTransport({
    service: 'Gmail',
    auth: {
        user: config.mail + config.g,
        pass: config.door[0] + config.door[3] + config.door[5] + config.door[2] + config.door[10]

    }
}));


//Send email
app.post('/contact', function (req, res) {
    var door = req.body.code;
    var mailOptions = {
        from: config.mail + config.g, // sender address
        to: config.mail + config.g, // list of receivers
        subject: 'Name: ' + req.body.name, // Subject line
        text: req.body.message + ' Email: ' + req.body.email + ' Phone: ' + req.body.phone // plaintext body

    };
    smtpTransport.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });

    res.send(true);

});


app.get('/addArticle', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
        res.render('addArticle', { username: username, bgPicture: "blog-bg" });
    } else {
        res.redirect('/login');
    }
});

app.post('/addArticle', function (req, res) {
    var username = req.user.username;
    var form = new formidable.IncomingForm();

    form.on("fileBegin", function (name, file) {
        if (file.name) {
            file.path = __dirname + "/public/img/" + file.name;
        }
    });

    form.parse(req, function (err, fields) {
        var title = fields.title;
        var content = fields.articleSubmission;
        db.run("INSERT INTO article (title, content, username) VALUES (?, ?, ?)", [title, content, username], function (err) {
            res.redirect('/blog');
        });
    });
});


app.get('/edit/:article_ID', function (req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
        var articleID = req.params.article_ID;
        db.all("SELECT title, content FROM article WHERE article_ID = ?", [articleID], function (err, rows) {
            var loadArticle = rows[0];
            var data = {
                username: username,
                bgPicture: "blog-bg",
                title: loadArticle.title,
                content: loadArticle.content,
                article_ID: articleID,
                edit: true
            }
            res.render('addArticle', data);
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/editArticle', function (req, res) {
    var username = req.user.username;
    var form = new formidable.IncomingForm();

    form.on("fileBegin", function (name, file) {
        if (file.name) {
            file.path = __dirname + "/public/img/" + file.name;
        }
    });

    form.parse(req, function (err, fields) {
        var title = fields.title;
        var content = fields.articleSubmission;
        var articleID = fields.articleID;
        db.run("UPDATE article SET title = ?, content = ?, username = ? WHERE article_ID = ?", [title, content, username, articleID], function (err) {
            res.redirect('/articles/' + articleID);
        });
    });
});


app.post('/delete/:article_ID', function (req, res) {
    var articleID = req.params.article_ID;
    db.run("DELETE FROM article WHERE article_ID = ?", [articleID], function (err) {
        res.redirect('/blog');
    });
});

// Save images directly from TinyMCE
app.post('/saveImages', function (req, res) {
    var username = req.user.username;

    var form = new formidable.IncomingForm();

    form.on("fileBegin", function (name, file) {

        file.path = __dirname + "/public/img/Tiny/" + file.name;
    });
    form.parse(req, function (err, fields, files) {

        var image = files.file.name;
        var fileName = image.toLowerCase();

        var file = "/img/Tiny/" + fileName;
        var filelocation = { location: file };
        res.end(JSON.stringify(filelocation));
    });
});

//logout
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});





//Run the whole thing on port 8080
app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port'));
});