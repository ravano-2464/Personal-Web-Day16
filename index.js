const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const upload = require("./src/middleware/uploadFile");
const app = express();
const port = 7000;

// sequalize
const { development } = require("./src/config/config.json");
const { Sequelize, QueryTypes } = require("sequelize");
const SequelizePool = new Sequelize(development);

// use hbs for view engine
app.set("view engine", "hbs");
// menambahkan path
app.set("views", "src/views");
app.use("/assets", express.static("src/assets"));
app.use("/uploads", express.static("src/uploads"));
app.use(express.urlencoded({ extended: false })); // body parser
app.use(
  session({
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1 * 60 * 60 * 1000,
    },
    resave: false,
    store: session.MemoryStore(),
    secret: "session-storage",
    saveUninitialized: true,
  })
);
app.use(flash());

// routing
app.get("/", home);
app.get("/contact", contact);
app.get("/my-project", myProject);
app.post("/my-project", upload.single("image"), handleMyProject);

app.get("/my-testimonials", myTestimonials);
app.get("/detail-project/:id", detailProject);
app.get("/register", register);
app.post("/register", handleRegister);
app.get("/login", login);
app.post("/login", handleLogin);
app.get("/logout", handleLogout);

app.get("/delete/:id", handleDeleteProject);
app.get("/edit-my-project/:id", editMyProject);
app.post("/edit-my-project/:id", upload.single("image"), editMyProjectForm);

function register(req, res) {
  const titlePage = "Register";
  res.render("register", {
    titlePage,
    handleLogin: req.session.handleLogin,
    user: req.session.user,
  });
}

async function handleRegister(req, res) {
  try {
    const { name, email, password } = req.body;

    const checkEmail = await SequelizePool.query(
      `SELECT * FROM public.user WHERE email = '${email}'`,
      { type: QueryTypes.SELECT }
    );

    if (checkEmail.length > 0) {
      req.flash("failed", "❌ Email already registered. Please Use Or Crate A Different One!!!");
      return res.redirect("/register");
    }

    bcrypt.hash(password, 10, async function (err, hashPass) {
      await SequelizePool.query(
        `INSERT INTO public.user (name, email, password, "createdAt", "updatedAt")
        VALUES ('${name}','${email}','${hashPass}' ,NOW(), NOW())`
      );
    });

    res.redirect("/login");
  } catch (error) {
    throw error;
  }
}

function login(req, res) {
  const titlePage = "Login";
  res.render("login", {
    titlePage,
    handleLogin: req.session.handleLogin,
    user: req.session.user,
  });
}

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    const checkEmail = await SequelizePool.query(
      `SELECT * FROM public.user WHERE email = '${email}'`,
      { type: QueryTypes.SELECT }
    );

    if (checkEmail.length === 0) {
      req.flash("failed", "❌ You Must Register Your Email And Password At Register Form!!!");
      return res.redirect("/login");
    }

    bcrypt.compare(password, checkEmail[0].password, function (err, result) {
      if (!result) {
        return res.redirect("/login");
      } else {
        req.session.handleLogin = true;
        req.session.user = checkEmail[0].name;
        req.session.idUsers = checkEmail[0].id;
        req.flash("success", "✅👋🏻 Welcome!!! Now You Are Succesfully Logged To Your Account!!!");
        return res.redirect("/");
      }
    });
  } catch (error) {
    throw error;
  }
}

async function home(req, res) {
  try {
    let projectNew;

    if (req.session.handleLogin) {
      const author = req.session.idUsers;
      projectNew = await SequelizePool.query(
        `SELECT public.myproject.id, public.myproject.project_name, public.myproject.description, public.myproject.duration, public.myproject.image, public.myproject.author,
         public.myproject."createdAt", public.myproject."updatedAt", public.myproject.technologies, public.user.name FROM public.myproject INNER JOIN public.user ON public.myproject.author = public.user.id where author = ${author} ORDER BY public.myproject.id DESC`,
        { type: QueryTypes.SELECT }
      );
    } else {
      projectNew = await SequelizePool.query(
        `SELECT public.myproject.id, public.myproject.project_name, public.myproject.description, public.myproject.duration, public.myproject.image, public.myproject.author,
         public.myproject."createdAt", public.myproject."updatedAt", public.myproject.technologies, public.user.name FROM public.myproject INNER JOIN public.user ON public.myproject.author = public.user.id ORDER BY public.myproject.id DESC`,
        { type: QueryTypes.SELECT }
      );
    }

    const titlePage = "Home";

    const dataNew = projectNew.map((res) => ({
      ...res,
      handleLogin: req.session.handleLogin,
    }));

    res.render("index", {
      titlePage,
      handleLogin: req.session.handleLogin,
      user: req.session.user,
      data: dataNew,
    });
  } catch (error) {
    throw error;
  }
}

function contact(req, res) {
  const titlePage = "Contact";
  res.render("contact", {
    titlePage,
    handleLogin: req.session.handleLogin,
    user: req.session.user,
  });
}

async function myProject(req, res) {
  const titlePage = "My Project";

  res.render("my-project", {
    data: titlePage,
    handleLogin: req.session.handleLogin,
    user: req.session.user,
  });
}

function myTestimonials(req, res) {
  const titlePage = "My Testimonials";
  res.render("my-testimonials", {
    titlePage,
    handleLogin: req.session.handleLogin,
    user: req.session.user,
  });
}

async function detailProject(req, res) {
  const titlePage = "Detail Project";
  const { id } = req.params;
  const dataDetail = await SequelizePool.query(
    "SELECT * FROM public.myproject where id = " + id
  );

  res.render("detail-project", {
    data: dataDetail[0][0],
    titlePage,
    handleLogin: req.session.handleLogin,
    user: req.session.user,
  });
}

async function handleMyProject(req, res) {
  try {
    const { projectName, startDate, endDate, description, techIcon } = req.body;

    const author = req.session.idUsers;

    const image = req.file.filename;

    const dateOne = new Date(startDate);
    const dateTwo = new Date(endDate);
    const time = Math.abs(dateTwo - dateOne);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));
    const months = Math.floor(time / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(time / (1000 * 60 * 60 * 24) / 365);

    let duration = [];

    if (days < 24) {
      duration += days + " Days";
    } else if (months < 12) {
      duration += months + " Month";
    } else if (years < 365) {
      duration += years + " Years";
    }

    await SequelizePool.query(
      `INSERT INTO public.myproject(project_name, start_date, end_date, description, duration, image, author, "createdAt", "updatedAt", technologies) 
      VALUES ('${projectName}','${startDate}','${endDate}','${description}','${duration}','${image}',${author}, NOW(), NOW(), '{${techIcon}}')`
    );

    res.redirect("/");
  } catch (error) {
    throw error;
  }
}

async function editMyProject(req, res) {
  const { id } = req.params;
  const data = await SequelizePool.query(
    "SELECT * FROM public.myproject where id = " + id
  );

  res.render("edit-my-project", {
    data: data[0][0],
    handleLogin: req.session.handleLogin,
    user: req.session.user,
  });
}

async function editMyProjectForm(req, res) {
  try {
    const { id } = req.params;

    const { projectName, startDate, endDate, description, techIcon } = req.body;

    const dateOne = new Date(startDate);
    const dateTwo = new Date(endDate);
    const time = Math.abs(dateTwo - dateOne);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));
    const months = Math.floor(time / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(time / (1000 * 60 * 60 * 24) / 365);

    let duration = [];

    if (days < 24) {
      duration += days + " Days";
    } else if (months < 12) {
      duration += months + " Month";
    } else if (years < 365) {
      duration += years + " Years";
    }

    let image = "";

    if (req.file) {
      image = req.file.filename;
      console.log(image);
    }

    let updateImage = `UPDATE public.myproject SET project_name='${projectName}', start_date='${startDate}', end_date='${endDate}', 
        description='${description}',duration='${duration}',"updatedAt"=now(), technologies='{${techIcon}}' `;

    if (image !== "") {
      updateImage += `, image = '${image}'`;
    }

    updateImage += `where id = ${id}`;

    await SequelizePool.query(updateImage);

    res.redirect("/");
  } catch (error) {
    throw error;
  }
}

async function handleDeleteProject(req, res) {
  const { id } = req.params;
  const data = await SequelizePool.query(
    "DELETE FROM public.myproject where id = " + id
  );

  res.redirect("/");
}

function handleLogout(req, res) {
  req.session.handleLogin = false;
  req.session.user = null;
  res.redirect("/");
}

app.listen(port, () => {
  console.log(`Server Berjalan Di Port ${port}`);
});