const trade = require('wstrade-api');

const requireAuth = (req, res, next) => {
    //console.log(req.cookies)
    const token = req.cookies.wealth_simpler;
    if (token) {
        try {
            trade.auth.use(token)
            console.log('User Authenticated')
            next()
        } catch (error) {
            console.log(error)
            res.redirect('/signin')
        }
    } else {
        res.redirect('/signin')
    }
}


module.exports = {
    requireAuth,
}