const crypto = require('crypto')
const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  region: 'ap-southeast-2',
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  accessKeyId: process.env.ACCESS_KEY_ID
})

const config = {
  bucket_name: 'crowdscriptttt',
  uploadExpiry: 60, // 10 min
  downloadExpiry: 60 * 60 * 24, // 1 days
  fileMinSize: 100,
  fileMaxSize: 8 * 1000 * 1000 * 1000 // 1 Gb
}

const generateUUID = (size = 15) => {
  return crypto.randomBytes(Math.ceil(size * 3 / 4))
    .toString('base64')
    .slice(0, size)
    .replace(/\+/g, 'a')
    .replace(/\//g, 'b')
}

const getDownloadLink = async (key) => {
  const params = {
    Bucket: config.bucket_name,
    Key: key
  }
  await s3.headObject(params).promise() // key exists?
  return s3.getSignedUrl('getObject', params)
}

const generateKey = (contentType) => {
  if (contentType === 'audio/mpeg') return `${generateUUID()}.mp3`
  else if (contentType === 'text/plain') return `${generateUUID()}.srt`
  else throw new Error('Invalid content type')
}

const getUploadLink = async (key, contentType) => {
  const params = {
    Bucket: config.bucket_name,
    Key: key,
    Expires: config.uploadExpiry,
    ContentType: contentType
  }

  return s3.getSignedUrl('putObject', params)
}

const deleteLink = (key) => {
  const params = {
    Bucket: config.bucket_name,
    Key: key
  }
  return s3.deleteObject(params).promise()
}

module.exports = { getDownloadLink, generateKey, getUploadLink, deleteLink }
