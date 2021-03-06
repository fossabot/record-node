const express = require('express')
const router = express.Router()

router.get('/?', async (req, res) => {
  try {
    const { url } = req.query
    const data = await req.app.locals.resolve(url)
    res.send(data)
  } catch (err) {
    res.send({ error: err })
  }
})

module.exports = router
