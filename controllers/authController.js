const trade = require('wstrade-api');
const cookies = require("cookie-parser");

// Sign Up Functions
const sign_up_get = (req, res) => {
    context = {
        title: "Sign Up",

    }
    res.render('signup', context)
}

// Sign In Functions
const sign_in_get = (req, res) => {
    context = {
        title: 'Sign in',
        email: '',
        password: '',
        errors: {
            email: '',
            password: '',
            otp: ''
        }
    }
    res.render('signin', context)
}

const sign_in_post = (req, res) => {
    email = req.body.email;
    password = req.body.password.trim();

    if (req.body.otp) {
        otp = req.body.otp
        console.log(email)
        console.log(password)
        console.log(otp)
        trade.auth.on('otp', otp)
        trade.auth.login(email, password)
            .then((result) => {
                res.cookie('wealth_simpler', trade.auth.tokens(), { httpOnly: true, maxAge: trade.auth.tokens().expires })
                res.redirect("/dashboard")
            })
            .catch((err) => {
                console.log(err)
                if (err.status == 401) {
                    context = {
                        title: 'Sign in',
                        email: email,
                        password: password,
                        errors: {
                            email: '',
                            password: '',
                            otp: 'Authorization Failed'
                        }
                    }
                }
            })
    } else {
        handleOtp(res, email, password)
    }
}

const handleOtp = (res, email, password) => {
    context = {
        title: 'Sign in',
        email: email,
        password: password,
        errors: {
            email: '',
            password: '',
            otp: 'One time password needed'
        }
    }
    trade.auth.login(email, password)
        .then((result) => {
            console.log("Login Successful")
        })
        .catch((err) => {
            console.log(err)
        })
    res.render('signin', context)
}


module.exports = {
    sign_in_get,
    sign_in_post,
    sign_up_get,
}