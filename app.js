const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongooseValidator = require('mongoose-unique-validator');
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const { result } = require('lodash');
const app = express();
const dir = __dirname + '/';
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(session({
    secret: "asdfloi1234134324jk234123jk4gjkgjgjkhasdfljkasdfafd.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// setting up mongoDB
mongoose.set('useCreateIndex', true);
const mongod = process.env.MONGODB_SERVER_ADDR;
mongoose.connect(mongod, { useNewUrlParser: true, useUnifiedTopology: true });


const usrSchema = new mongoose.Schema({
    name: String,
    mailID: String,
    msg: String
});

const User = new mongoose.model('User', usrSchema);

const newsLetterSchema = new mongoose.Schema({
    mailID: {
        type: String,
        index: true,
        unique: true
    }
});

newsLetterSchema.plugin(mongooseValidator);

const Subscriber = new mongoose.model('Subscriber', newsLetterSchema);

const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});

adminSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin", adminSchema);

passport.use(Admin.createStrategy());
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());



// setting mongodb ends here



// routes
app.get('/', (req, res) => {
    res.sendFile(dir + 'index.html');

})

app.get('/pricing', (req, res) => {
    res.sendFile(dir + 'pricing.html');
});

app.get('/pricingService', (req, res) => {
    res.redirect('https://artchitects-production-final.herokuapp.com/#service');
    // when we deploy this site on server we need to change the domain here
})

app.get('/history', (req, res) => {
    res.sendFile(dir + 'history.html');
});

app.get('/historyService', (req, res) => {
    res.redirect('https://artchitects-production-final.herokuapp.com/#service');
    // when we deploy this site on server we need to change the domain here
});

app.get('/hamburgerService', (req, res) => {
    res.redirect('https://artchitects-production-final.herokuapp.com/#service');
})
app.post('/register', (req, res) => {
    User.find({ mailID: req.body.umail }, (err, data) => {
        if (err) { console.log(err); }
        else {
            if (data === null) {
                console.log("Duplicate data found");
                console.log(data);
            } else {
                const usr = new User({
                    name: _.trim(req.body.uname),
                    mailID: _.trim(req.body.umail),
                    msg: _.trim(req.body.umsg)
                });
                usr.save();
                console.log("New data added to DB");
            }
        }
    });
    res.redirect('/');
});

app.post('/newsLetterSignUp', (req, res) => {
    const mail = req.body.subscribedMail;
    const m = new Subscriber({
        mailID: _.trim(mail)
    });
    m.save((e) => {
        if (e) { console.log("duplicate data found"); }
    });
    res.redirect('/');
});

app.route('/adminReg')
    .get((req, res) => {
        res.sendFile(__dirname + "/admin_registration.html");
    })
    .post((req, res) => {
        Admin.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect('/newsLetter-Emails')
                });
            }
        });
    });

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
})

app.route('/admin-login')
    .get((req, res) => {
        res.render("admin_login");
    })
    .post((req, res) => {
        const ad = new Admin({
            username: req.body.username,
            password: req.body.password
        });
        req.login(ad, (err) => {
            if (err) console.log(err);
            else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect('/newsLetter-Emails');
                });
            }
        })

    });

app.get('/newsLetter-emails', (req, res) => {
    if (req.isAuthenticated()) {
        Subscriber.find({}, (err, data) => {
            if (err) console.log(err);
            else {
                res.render("subscriptions", { list: data });
            }
        });
    } else {
        res.redirect('/');
    }
});

app.get('/user-data', (req, res) => {
    if (req.isAuthenticated()) {
        User.find({}, (err, data) => {
            if (err) console.log(err);
            else {
                res.render("user-data", { userData: data });
            }
        });
    } else {
        res.redirect('/');
    }
});
// routs ends here


let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, (data) => {
    console.log("Server is running on port " + port);
});

