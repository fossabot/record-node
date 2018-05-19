const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const EventEmitter = require('events')
const extend = require('deep-extend')
const path = require('path')
const os = require('os')
const fs = require('fs')
const debug = require('debug')
const Repo = require('ipfs-repo')
const Keystore = require('orbit-db-keystore')

const api = require('./api')
const RecordLog = require('./log')

const recorddir = path.resolve(os.homedir(), './.record')
if (!fs.existsSync(recorddir))
  fs.mkdirSync(recorddir)

const keystorePath = path.resolve(recorddir, './keystore')

const defaults = {
  init: true,
  apiPort: 3000,
  orbitPath: path.resolve(recorddir, './orbitdb'),
  ipfsConfig: {
    repo: path.resolve(recorddir, './ipfs'),
    init: true,
    pass: '2662d47e3d692fe8c2cdb70b907ebb12b216a9d9ca5110dd336d12e7bf86073b',
    EXPERIMENTAL: {
      dht: true,
      pubsub: true
    },

    /* config: {
     *   Addresses: {
     *     Swarm: [
     *   	"/ip4/0.0.0.0/tcp/4002",
     *   	"/ip4/127.0.0.1/tcp/4003/ws",
     *   	"/dns4/wrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star"
     *     ]
     *   }
     * },
     * libp2p: {
     *   modules: {
     *     transport: [wstar],
     *     discovery: [wstar.discovery]
     *   }
     * }
     */

    config: {
      Addresses: {
	Swarm: [
	  '/ip4/0.0.0.0/tcp/4002',
	  '/ip4/0.0.0.0/tcp/4003/ws',
	  //'/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star',
	  '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
	]
      }
    }
  }
}


class RecordNode extends EventEmitter {
  constructor(options) {
    super()

    this._started = false
    this._ipfs = null
    this._orbitdb = null
    this._options = extend(defaults, options || {})

    this.logger = debug('record:node')
    this.logger.log = console.log.bind(console) // log to stdout instead of stderr
    this.logger.err = debug('record:node:err')

    this._start()
  }

  _keystoreExists() {
    return fs.existsSync(keystorePath)
    
    // return new Promise(resolve => {
    //   const repo = new Repo(this._options.ipfsConfig.repo)
    //   repo.exists((err, bool) => {
    // 	resolve(bool)
    //   })
    // })
  }


  async _start() {
    this.logger('Starting RecordNode')

    const keystoreExists = this._keystoreExists()
    this.logger(`keystore exists: ${keystoreExists}`)
    if (!this._options.init && !keystoreExists) {
      this.logger('[notice] Create keystore before starting')
      return
    }

    const self = this
    this._ipfs = new IPFS(this._options.ipfsConfig)
    this._ipfs.on('error', (e) => this.emit('error', e))
    this._ipfs.on('ready', async () => {

      self._orbitdb = new OrbitDB(self._ipfs, self._options.orbitPath, {
	keystore: self._keystore
      })

      const ipfsConfig = await self._ipfs.config.get()
      const ipfsInfo = await self._ipfs.id()
      self.logger(`IPFS ID: ${ipfsInfo.id}`)
      self.logger(`IPFS Config: ${JSON.stringify(ipfsConfig, null, 2)}`)
      self.logger(`Orbit ID: ${self._orbitdb.id}`)
      self.logger(`Orbit Dir: ${self._orbitdb.directory}`)

      self._log = new RecordLog(self._orbitdb)
      await self._log.load()
      self.logger(`Log Address: ${self._log._log.address}`)

      self._api = api(self)
      const { apiPort } = self._options
      self._api.listen(apiPort, () => self.logger(`RecordNode API listening on port ${apiPort}`))

      self._started = true
      self.logger('RecordNode Ready')
      self.emit('ready')

      const contacts = self._log.contacts.all()
      self.logger(`Found ${contacts.length} contacts to load/sync`)
      self._contacts = []
      contacts.forEach(async (contact) => {
	const log = new RecordLog(self._orbitdb, contact.content.address)
	await log.load()
	self._contacts.push(log)
      })
      self.logger(`All contacts loaded`)

    })
  }

  import(seed) {
    if (!seed) {
      //TODO: create new identity
    }

    //TODO: if seed - import identity from seed

    //TODO: if privkey - import identity from privkey
  }

}

module.exports = RecordNode
