const mongoose = require('mongoose')

const { ObjectId } = mongoose.Schema.Types

const submissionSchema = mongoose.Schema({
  text: {
    type: String
  },
  user: {
    type: ObjectId,
    ref: 'User'
  },
  segment: {
    type: ObjectId,
    ref: 'Segment'
  }
})

module.exports = mongoose.model('Submission', submissionSchema)
