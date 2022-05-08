const mongoose = require('mongoose')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
    await Blog.deleteMany({})
  
    const blogs = helper.initialBlogs.map((blog) => new Blog(blog))
    const PromiseArr = blogs.map((blog) => blog.save())
    await Promise.all(PromiseArr)
})
  
// getting entries
describe('getting blog entries', () => {

    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    }, 100000)

    test('entry id is without _', async () => {
        const response = await api.get('/api/blogs')
        const blogObjects = helper.intialBlogs
        for (let i = 0; i < blogObjects.length; i++) {
            expect(response.body[i].id).toBeDefined()
        }
    })

})

//adding entries
describe('adding entries', () => {

    test('adding entires with token', async () => {
        let token = null

        const testUser = await new User({
            username: 'joshyee',
            passwordHash: await bcrypt.hash('password123', 10),
        }).save()

        const userForToken = { username: 'joshyee', id: testUser.id }
        token = jwt.sign(userForToken, process.env.SECRET)
        return token

    })

    test('a new blog can be added', async () => {
        
        const testUser = await new User({
            username: 'joshyee',
            passwordHash: await bcrypt.hash('password123', 10),
        }).save()

        const userForToken = { username: 'joshyee', id: testUser.id }
        let token = jwt.sign(userForToken, process.env.SECRET)

        const newBlog = {
            title: 'Coding is super fun!',
            author: 'Josh Yee',
            url: 'joshyee.com',
            likes: 7,
            userId: '4259fdaf8b7a0a78218b8f99',
        }

        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAfterAdding = await helper.blogsInDb()

        const contents = blogsAfterAdding.map(blog => blog.title)

        expect(contents).toContain('Coding is super fun!')
        expect(blogsAfterAdding).toHaveLength(helper.initialBlogs.length + 1)

    })

    test('if likes not defined, default to 0', async () => {

        const testUser = await new User({
            username: 'joshyee',
            passwordHash: await bcrypt.hash('password123', 10),
        }).save()

        const userForToken = { username: 'joshyee', id: testUser.id }
        let token = jwt.sign(userForToken, process.env.SECRET)

        const newBlog = {
            title: 'Coding is super fun!',
            author: 'Josh Yee',
            url: 'joshyee.com',
            userId: '4259fdaf8b7a0a78218b8f99',
        }

        const response = await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(200)
                    
        expect(response.body.likes).toBe(0)

    }) 

    test('if new blog doesnt have title and url send 400 bad request', async () => {

        const testUser = await new User({
            username: 'joshyee',
            passwordHash: await bcrypt.hash('password123', 10),
        }).save()

        const userForToken = { username: 'joshyee', id: testUser.id }
        let token = jwt.sign(userForToken, process.env.SECRET)

        const newBlog = {
            author: 'Josh Lee',
            likes: 1, 
            userId: '6259fdaf8b7a0a78218b8f99',
        }

        await api 
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(400)

    })

})

describe('Deleting & Updating Functionality', () => {
    beforeEach(async () => {
        await Blog.deleteMany({})
        await User.deleteMany({})

        const testUser = await new User({
            username: 'joshyee',
            passwordHash: await bcrypt.hash('password123', 10),
        }).save()
    
        const userForToken = { username: 'joshyee', id: testUser.id }
        let token = jwt.sign(userForToken, process.env.SECRET)
    
        const newBlog = {
            title: 'Coding is super fun!',
            author: 'Josh Yee',
            url: 'joshyee.com',
            userId: '4259fdaf8b7a0a78218b8f99',
        }
    
        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(200)
    
        return token
    })
    
    test.only('delete blog entries', async () => {

        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        const testUser = await new User({
            username: 'joshyee',
            passwordHash: await bcrypt.hash('password123', 10),
        }).save()
    
        const userForToken = { username: 'joshyee', id: testUser.id }
        let token = jwt.sign(userForToken, process.env.SECRET)

        await api
            .delete(`/api/blogs/${blogToDelete._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(0)

        const contents = blogsAtEnd.map(blog => blog.title)

        expect(contents).not.toContain(blogToDelete.title)

    })

    test('update entries', async () => {

        const update = {
            title: 'How to be Awesome',
            author: 'Josh Yee',
            likes: 7,
            url: 'www.joshyee.com'
        }

        const putResponse = await api
            .put(`/api/blogs/${helper.intialBlogs[1]._id}`)
            .send(update)
            .expect(200)

        expect(putResponse.body.title).toBe(update.title)
        expect(putResponse.body.author).toBe(update.author)
        expect(putResponse.body.likes).toBe(update.likes)
        expect(putResponse.body.url).toBe(update.url)

    })
    
})


describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})
  
        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })
  
        await user.save()
    })
  
    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()
  
        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        }
  
        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)
  
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)
  
        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        }
    
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('username must be unique')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })
})


afterAll(() => {
    mongoose.connection.close()
})