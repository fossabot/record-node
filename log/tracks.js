const TrackEntry = require('./TrackEntry')

module.exports = function tracks(self) {

  function filterEntries(mapper) {
    return (doc) => {
      if (doc.type !== 'track')
	return false

      return mapper ? mapper(doc) : true
    }
  }
  
  return {
    all: (mapper) => {
      const all = self._log.query(filterEntries(mapper))
      return all
    },

    add: async (data) => {
      const entry = new TrackEntry().create(data)
      const hash = await self._log.put(entry)
      return hash
    },

    get: (key) => {
      const data = self._log.get(key).map((e) => e.payload.value)
      return data
    },

    del: async (key) => {
      const hash = await self._log.del(key)
      return hash
    },


    crate: () => {
      return this.all((doc) => doc.content.crate = true)
    }
  }
}
