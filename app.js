const express = require('express');
const morgan = require('morgan');
const { render } = require('ejs');
const authRoutes = require('./routes/authRoutes')
const dashRoutes = require('./routes/dashRoutes')
const authMiddleware = require('./middleware/authMiddleware')
const cookieParser = require('cookie-parser')


const app = express();
app.listen(3000);
console.log("listening")


var context;
app.set('view engine', 'ejs')
app.use('/css', express.static('./node_modules/bootstrap/dist/css'))
app.use('/js', express.static('./node_modules/bootstrap/dist/js'))
app.use('/chart_js', express.static('./node_modules/chart.js/dist'))
app.use('/chart_js_annotations', express.static('./node_modules/chartjs-plugin-annotation/dist'))


app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'));
app.use(cookieParser())


app.get('/', (req, res) => {
    res.redirect('/signin')
})

app.use('/dashboard', dashRoutes)
app.use('/', authRoutes)

app.use((req, res) => {
    context = {
        title: "404",

    }
    res.status(404).render('404', context)
})