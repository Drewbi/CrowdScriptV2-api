const mongoose = require('mongoose')
const User = mongoose.model('User')
const Submission = mongoose.model('Submission')

const { generateSalt, generateHash } = require('../_utils/password')

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().lean()
    const sanitisedUsers = users.map(user => {
      delete user.salt
      delete user.hash
      return user
    })
    return res.status(200).json({ users: sanitisedUsers })
  } catch (err) {
    res.status(400).json({ message: 'Error occured finding user' })
  }
}

const getUserById = async (req, res, next) => {
  const { id } = req.params
  try {
    const user = await User.findOne({ _id: id }).lean()
    if (!user) res.status(404).json({ message: 'Unable to find user' })
    else {
      delete user.salt
      delete user.hash
      res.status(200).json({ user })
    }
  } catch (err) {
    if (err.name === 'CastError') res.status(401).json({ message: 'Invalid Id' })
    else res.status(400).json({ message: 'Error occured finding user' })
  }
}

const getUserFromJWT = async (req, res, next) => {
  const id = res.locals.user
  try {
    const user = await User.findOne({ _id: id }).lean()
    if (!user) res.status(404).json({ message: 'Unable to find user' })
    else {
      delete user.salt
      delete user.hash
      res.status(200).json({ user })
    }
  } catch (err) {
    if (err.name === 'CastError') res.status(401).json({ message: 'Invalid Id' })
    else res.status(400).json({ message: 'Error occured finding user' })
  }
}

const createUser = async (req, res, next) => {
  const {
    name, email, credit, password
  } = req.body
  const user = new User()
  user.name = name
  user.email = email
  user.credit = credit
  const salt = generateSalt()
  user.salt = salt
  user.hash = generateHash(password, salt)
  try {
    const result = await user.save()
    return res.status(200).json({ id: result._id, name, email, credit })
  } catch (err) {
    if (err.code === 11000) { return res.status(409).json({ message: 'Email already registered' }) }
    return res.status(400).json({ message: 'Error registering', error: err })
  }
}

const banUser = async (req, res, next) => {
  const { id } = req.params
  try {
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const result = await user.updateOne({ banned: true })
    if (result.ok === 1) {
      try {
        await Submission.deleteMany({ user: id })
      } catch (err) {
        return res.status(500).json({ message: 'Failed to delete user sessions' })
      }
    } else return res.status(400).json({ message: 'Failed to delete user' })
    res.status(200).json({ message: 'Successfully deleted user' })
  } catch (err) {
    if (err.name === 'CastError') res.status(401).json({ message: 'Invalid Id' })
    else res.status(400).json({ message: 'Error occured finding user' })
  }
}

const editUser = async (req, res) => {
  const { id } = req.params
  try {
    const { banned, credit, name } = req.body
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (banned !== undefined) user.banned = banned
    if (credit !== undefined) user.credit = credit
    if (name !== undefined) user.name = name
    await user.save()
    res.status(200).json({ message: 'Successfully edited user' })
  } catch (err) {
    if (err.name === 'CastError') res.status(401).json({ message: 'Invalid Id' })
    else res.status(400).json({ message: 'Error occured finding user' })
  }
}

const deleteUser = async (req, res, next) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found' })
  const result = await user.deleteOne()
  return result
    ? res.status(200).json({ message: 'Successfully deleted user' })
    : res.status(400).json({ message: 'Failed to delete user' })
}

module.exports = { getAllUsers, getUserById, getUserFromJWT, createUser, banUser, editUser, deleteUser }
