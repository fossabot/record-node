const extend = require('deep-extend')
const debug = require('debug')

const components = require('./components')

const RecordLog = require('./log')

const getDefaultConfig = () => {
  const defaults = {
    orbitPath: '',
  }

  return defaults
}

class RecordNode {
  constructor (ipfs, OrbitDB, options = {}) {

    this.logger = debug('record:node')
    this.logger.log = console.log.bind(console) // log to stdout instead of stderr
    this.logger.err = debug('record:node:err')

    const defaults = getDefaultConfig()
    this._options = extend(defaults, options)
    this.logger(this._options)

    this._ipfs = ipfs
    this._orbitdb = new OrbitDB(this._ipfs, this._options.orbitPath)
    this._log = new RecordLog(this._orbitdb)

    this._contacts = {}

    //this.loadContacts()

    /* const ipfsConfig = await this._ipfs.config.get()
     * const ipfsInfo = await this._ipfs.id()
     * this.logger(`IPFS ID: ${ipfsInfo.id}`)
     * this.logger(`IPFS Config: ${JSON.stringify(ipfsConfig, null, 2)}`)
     * this.logger(`Orbit ID: ${this._orbitdb.id}`)
     * this.logger(`Orbit Dir: ${this._orbitdb.directory}`)
     */

    this.info = components.info(this)
    this.logs = components.logs(this)

  }

  async load() {
    await this._log.load()
    this.logger(`Log Address: ${this._log._log.address}`)
  }

  loadContacts () {
    this.logger('Loading Contacts')

    this._log.contacts.all().forEach(async (contact) => {
      const { address } = contact.content
      if (this._contacts[address]) { return }

      this.logger(`Loading contact: ${address}`)
      const log = new RecordLog(this._orbitdb, address)
      await log.load()
      this._contacts[address] = log
    })
    this.logger(`All contacts loaded`)
  }
}

module.exports = RecordNode
