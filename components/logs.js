const RecordLog = require('../log')
const promisify = require('promisify-es6')

module.exports = function logs (self) {
  return promisify(async (logAddress, callback) => {
    let log = null

    if (!logAddress || logAddress === 'me') {
      log = self._log
    } else {
      // TODO: localOnly
      const opts = {
        replicate: false
      }
      log = new RecordLog(self._orbitdb, logAddress, opts)
      await log.load()
    }

    callback(null, {
      contacts: {
        add: async (address, alias) => {
          const data = await log.contacts.findOrCreate({ address, alias })
          self.loadContacts()
          return data
        },
        get: () => {
          return log.contacts.all()
        }
      },

      tracks: {
        add: async (title, url) => {
          const data = await log.tracks.findOrCreate({ url, title })
          return data
        },

        get: () => {
          return log.tracks.all()
        }
      }
    })
  })
}
