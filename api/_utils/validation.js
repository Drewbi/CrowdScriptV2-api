module.exports.validateFields = (fields) => (req, res, next) => {
  const invalid = fields.some(field => req.body[field] === undefined)
  invalid
    ? res.status(400).json({ message: 'Invalid request body' })
    : next()
}
