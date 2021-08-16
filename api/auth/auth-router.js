const router = require('express').Router()
const bcrypt = require('bcryptjs')

// Require `checkUsernameFree`, `checkUsernameExists` and `checkPasswordLength`
// middleware functions from `auth-middleware.js`. You will need them here!
const { checkUsernameFree, checkUsernameExists, checkPasswordLength } = require('./auth-middleware')
const Users = require('../users/users-model')

/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "user_id": 2,
    "username": "sue"
  }

  response on username taken:
  status 422
  {
    "message": "Username taken"
  }

  response on password three chars or less:
  status 422
  {
    "message": "Password must be longer than 3 chars"
  }
 */
router.post('/register', checkUsernameFree, checkPasswordLength,  async (req, res, next) => {
  try {
    const { username, password } = req.body
    const hash = bcrypt.hashSync(password, 16)
    const user = { username, password: hash }
    const createdUser = await Users.add(user)
    res.status(201).json(createdUser)
  } catch (err) {
    next(err)
  }
})

/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "message": "Welcome sue!"
  }

  response on invalid credentials:
  status 401
  {
    "message": "Invalid credentials"
  }
 */
router.post('/login', checkUsernameExists,  async (req, res, next) => {
  try {
    const { username, password } = req.body
    const [user] = await Users.findBy(username)
    if(bcrypt.compareSync(password, user.password)) {
        req.session.user = user
        res.json({ message: `Welcome ${username}, have a cookie.`})
    } else {
        next({ status: 401, message: 'Bad credentials.'})
    }
  } catch (err) {
    next(err)
  }
})


/**
  3 [GET] /api/auth/logout

  response for logged-in users:
  status 200
  {
    "message": "logged out"
  }

  response for not-logged-in users:
  status 200
  {
    "message": "no session"
  }
 */
router.get('/logout', async (req, res, next) => {
    if( req.session) {
        res.session.destroy((err) => {err ? res.json({ message: 'Sorry ya cannot leave.'}) : res.json({ message: 'logged out'})})
    } else {
        next({ status: 200, message: "No session"})
    }
  })


// Don't forget to add the router to the `exports` object so it can be required in other modules
module.exports = router