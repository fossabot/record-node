const RecordLog = require('../log')

module.exports = function logs (self) {
  return async (logAddress) => {

    let log = null

    if (!logAddress || logAddress === 'me') {
      log = self._log
    } else {
      // TODO: replicate: false, localOnly
      log = new RecordLog(self._orbitdb, logAddress)
      await log.load()
    }

    return {
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
    }
  }
}
