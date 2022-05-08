const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')


usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1, likes: 1, id: 1 })
  
    response.json(users)
})

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body

    //check pw and username provided and greater than 3 characters
    if (!username || !password) {
        return response.status(400).send({ message: 'Must provide both username and password' })
    }
    if (username.length < 3) {
        return response.status(400).send({ message: 'Username is too short' })
    }
    if (password.length < 3) {
        return response.status(400).send({ message: 'Password is too short' })
    }

    // check if user is existing in db
    const existingUser = await User.findOne({ username })
    if (existingUser) {
        return response.status(401).json({
            error: 'username must be unique'
        })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
        username,
        name,
        passwordHash
    })

    const savedUser = await user.save()

    response.status(201).json(savedUser)

})



module.exports = usersRouter
