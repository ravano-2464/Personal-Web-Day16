const express = require('express')
const path = require('path')
const app = express()
const port = 5000
const config = require('./src/config/config.json')
const { Sequelize, QueryTypes } = require('sequelize')
const sequelize = new Sequelize(config.development)
const bcrypt = require('bcrypt')
const session = require('express-session')
const flash = require('express-flash')
const myprojectModel = require('./src/models').myproject
const upload = require('./src/middlewares/uploadFile')

// app.set = buat setting varible global, configuratoin, dll
app.set("view engine", "hbs")
app.set("views", path.join(__dirname, 'src/views'))

app.use("/assets", express.static(path.join(__dirname, 'src/assets')))
app.use("/uploads", express.static(path.join(__dirname, 'src/uploads')))
app.use(express.urlencoded({ extended: false })) // body parser, extended : false -> querystring, extended : true -> menggunakan querystring third party -> qs
app.use(flash())
app.use(session({
    name: "data",
    secret: 'rahasiabanget',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

app.get('/', home)
app.get('/contact', contact)
app.get('/my-project', myproject)
app.post('/delete-my-project/:id', deletemyproject)

app.get('/add-my-project', addmyprojectView)
app.post('/add-my-project', upload.single("image"), addmyproject)

app.get('/update-my-project/:id', updatemyprojectView)
app.post('/update-my-project', upload.single("image"), updatemyproject)

app.get('/my-project-detail/:id', myprojectDetail)
app.get('/testimonial', testimonial)

app.get('/register', registerView)
app.post('/register', register)
app.get('/login', loginView)
app.post('/login', login)

async function home(req, res) {
    const id = 4

    const query = `SELECT * FROM profiles WHERE id=${id}`
    const obj = await sequelize.query(query, { type: QueryTypes.SELECT })
    console.log("ini  data profile", obj)

    res.render('index', { data: obj[0], user: req.session.user })
}

function contact(req, res) {
    res.render('contact')
}

async function myproject(req, res) {
    const query = `SELECT my-project.id, my-project.title, my-project.content, my-project.image, 
    users.name AS author, my-project."createdAt", my-project."updatedAt" FROM my-project LEFT JOIN users ON
    my-project."authorId" = users.id`
    const obj = await sequelize.query(query, { type: QueryTypes.SELECT })
    // const data = await my-projectModel.findAll()
    // console.log("data", data)
    console.log("data my-project", obj)

    const isLogin = req.session.isLogin
    const user = req.session.user

    // res.render('my-project', { data })
    res.render('my-project', { data: obj, isLogin, user })
}

function addmyprojectView(req, res) {
    res.render('add-my-project')
}

async function addmyproject(req, res) {
    const { title, content } = req.body

    const image = req.file.filename
    const authorId = req.session.user.id

    // console.log("Title :", title)
    // console.log("Content :", content)

    // const datamy-project = { title, content }

    // data.unshift(datamy-project)
    const query = `INSERT INTO my-project(title, content, image, "authorId") VALUES ('${title}', '${content}','${image}','${authorId}')`
    const obj = await sequelize.query(query, { type: QueryTypes.INSERT })

    console.log("data berhasil di insert", obj)

    res.redirect('/my-project')
}

async function updatemyprojectView(req, res) {
    const { id } = req.params

    // const dataFilter = data[parseInt(id)]
    // dataFilter.id = parseInt(id)
    // console.log("dataFilter", dataFilter)
    const query = `SELECT * FROM my-project WHERE id=${id}`
    const obj = await sequelize.query(query, { type: QueryTypes.SELECT })

    console.log("update my-project view", obj)

    res.render('update-my-project', { data: obj[0] })
}

async function updatemyproject(req, res) {
    const { title, content, id } = req.body

    let image = ""
    if (req.file) {
        image = req.file.filename
    }

    if (!image) {
        const query = `SELECT my-project.id, my-project.title, my-project.content, my-project.image, 
        users.name AS author, my-project."createdAt", my-project."updatedAt" FROM my-project LEFT JOIN users ON
        my-project."authorId" = users.id WHERE my-project.id=${id}`
        const obj = await sequelize.query(query, { type: QueryTypes.SELECT })
        image = obj[0].image
    }

    // console.log("Id :", id)
    // console.log("Title :", title)
    // console.log("Content :", content)

    // data[parseInt(id)] = {
    //     title,
    //     content,
    // }
    const query = `UPDATE my-project SET title='${title}',content='${content}', image='${image}' WHERE id=${id}`
    const obj = await sequelize.query(query, { type: QueryTypes.UPDATE })

    console.log("my-project berhasil di update!", obj)

    res.redirect('/my-project')
}


async function deletemyproject(req, res) {
    const { id } = req.params

    // data.splice(id, 1)
    const query = `DELETE FROM my-project WHERE id=${id}`
    const obj = await sequelize.query(query, { type: QueryTypes.DELETE })

    console.log("berhasil delete my project", obj)

    res.redirect('/my-project')
}

async function myprojectDetail(req, res) {
    const { id } = req.params // destructuring

    const query = `SELECT my-project.id, my-project.title, my-project.content, my-project.image, 
    users.name AS author, my-project."createdAt", my-project."updatedAt" FROM my-project LEFT JOIN users ON
    my-project."authorId" = users.id WHERE my-project.id=${id}`
    const obj = await sequelize.query(query, { type: QueryTypes.SELECT })
    // const data = await my-projectModel.findOne({
    //     where: { id }
    // })

    console.log("myprojectDetail", obj)

    res.render('my-project-detail', { data: obj[0] })
}

function testimonial(req, res) {
    res.render('testimonial')
}

function loginView(req, res) {
    res.render('login')
}

async function login(req, res) {
    const { email, password } = req.body
    const query = `SELECT * FROM users WHERE email='${email}'`
    const obj = await sequelize.query(query, { type: QueryTypes.SELECT })

    if (!obj.length) {
        console.error("user not registered!")
        req.flash('danger', 'Login failed : email is wrong!')
        return res.redirect('/login')
    }

    bcrypt.compare(password, obj[0].password, (err, result) => {
        if (err) {
            req.flash('danger', 'Login failed : internal server error!')
            console.error("Login : Internal Server Error!")
            return res.redirect('/login')
        }

        if (!result) {
            console.error("Password is wrong!")
            req.flash('danger', 'Login failed : password is wrong!')
            return res.redirect('/login')
        }

        console.log('Login success!')
        req.flash('success', 'Login success!')
        req.session.isLogin = true
        req.session.user = {
            id: obj[0].id,
            name: obj[0].name,
            email: obj[0].email
        }

        res.redirect('/')
    })
}

async function register(req, res) {
    const { name, email, password } = req.body

    console.log("Name:", name)
    console.log("Email:", email)
    console.log("Password:", password)

    const salt = 10

    bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
            console.error("Password failed to be encrypted!")
            req.flash('danger', 'Register failed : password failed to be encrypted!')
            return res.redirect('/register')
        }

        console.log("Hash result :", hash)
        const query = `INSERT INTO users(name, email, password) VALUES ('${name}', '${email}','${hash}')`

        await sequelize.query(query, { type: QueryTypes.INSERT })
        req.flash('success', 'Register success!')
        res.redirect('/')
    })
}

function registerView(req, res) {
    res.render('register')
}

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`)
})