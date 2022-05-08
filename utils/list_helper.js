const blog = require('../models/blog')
const User = require('../models/user')



const totalLikes = blogs => {
    if (blogs.length === 0) {
        return 0
    }
    if (blogs.length === 1) {
        return blogs[0].likes
    }
    const reduced = blogs.reduce((acc, item) => {
        return { likes: acc.likes + item.likes }
    })
    return reduced.likes
}

const favoriteBlog = blogs => {
    const bestBlog = blogs.reduce((allBlogs, currentBlog) => 
        allBlogs.likes > currentBlog.likes 
            ? allBlogs 
            : currentBlog
    )
    return bestBlog
}

const mostBlogs = blogs => {
    const authors = {}
    for (let entry of blogs) {
        if (authors[entry.author]) {
            authors[entry.author] += 1
        } else {
            authors[entry.author] = 1
        }
    }

    const mostBlogsAuthor = Object.keys(authors).reduce((acc, current) => authors[acc] > authors[current] ? acc : current)
    return {
        author: mostBlogsAuthor,
        entries: authors[mostBlogsAuthor]
    }

}

const mostLikes = blogs => {
    const authors = {}
    for (let entry of blogs) {
        if (authors[entry.author]) {
            authors[entry.author] += entry.likes
        } else {
            authors[entry.author] = entry.likes
        }
    }
    const mostLikedauthor = Object.keys(authors).reduce((acc, current) => authors[acc] > authors[current] ? acc : current)
    return {
        author: mostLikedauthor,
        likes: authors[mostLikedauthor]
    }
}

const blogsInDb = async () => {
    const blogs = await blog.find({})
    return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

module.exports = {
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes,
    blogsInDb,
    usersInDb
}