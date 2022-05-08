const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')
const middleware = require('../utils/middleware')
const Comment = require('../models/comment')


blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({}).populate('user', { username: 1, id: 1, name: 1 }).populate('comments', { comment: 1, id: 1, name: 1, username: 1 })

    response.json(blogs)

})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {

    try {
        const blog = await Blog.findById(request.params.id)
        const user = request.user 

        const decodedToken = jwt.verify(request.token, process.env.SECRET)

        if (!request.token || !decodedToken.id) {
            return response.status(401).json({ error: 'token missing or invalid' })
        }
      
        if (blog.user.toString() === user.id.toString()) {
            await Blog.findByIdAndRemove(request.params.id)
            response.status(204).end()
        } else {
            return response.status(401).json({ error: 'you do not have permission to delete this blog' })
        }
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError')
            response.status(401).json({ error: 'token missing or invalid' })
    } 

})


blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
    try {

        // const token = getTokenFrom(request)

        const body = request.body
        const user = request.user

        const decodedToken = jwt.verify(request.token, process.env.SECRET)

        if (!request.token || !decodedToken.id) {
            return response.status(401).json({ error: 'token missing or invalid' })
        }

        if(!body.title || !body.url) return response.status(400).json({ error: 'title or url is missing' })

        const blog = new Blog({
            title: body.title,
            author: body.author,
            url: body.url,
            likes: body.likes | 0,
            user: user._id
        })

        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()

        response.json(savedBlog)

    } catch (error) {
        if (error.name === 'JsonWebTokenError')
            response.status(401).json({ error: 'token missing or invalid' })
    } 
})

blogsRouter.post("/:id/comments", async (request, response) => {  
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id)
    updatedBlog.comments = updatedBlog.comments.concat(request.body.comment);
    updatedBlog.save()
    response.status(200).json(updatedBlog)
  });



blogsRouter.put('/:id', async (request, response) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        comments: body.comments,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
        .populate('user', { username: 1, id: 1, name: 1 })
        .populate('comments', { comment: 1, id: 1, name: 1, username: 1 })
    response.json(updatedBlog)

})


module.exports = blogsRouter 
