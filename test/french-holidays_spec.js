const assert = require('assert')
const { EventEmitter } = require('events')
const https = require('https')

const helper = require('node-red-node-test-helper')
const frenchHolidaysNode = require('../french-holidays/french-holidays')

helper.init(require.resolve('node-red'))

describe('french-holidays node', function () {
  let originalHttpsGet

  beforeEach(function (done) {
    /*
     * https est un module natif partagé par tout le processus.
     * On conserve donc impérativement sa méthode originale avant
     * chaque test.
     */
    originalHttpsGet = https.get

    helper.startServer(done)
  })

  afterEach(function (done) {
    /*
     * La restauration doit avoir lieu même lorsque le test échoue,
     * sinon les tests suivants continueraient à utiliser le mock.
     */
    https.get = originalHttpsGet

    helper
      .unload()
      .then(function () {
        helper.stopServer(done)
      })
      .catch(done)
  })

  it('should handle ENOTFOUND from the school holidays API without crashing Node-RED', function (done) {
    let publicHolidayApiCalls = 0
    let schoolHolidayApiCalls = 0
    let outputMessageCount = 0

    /*
     * On remplace temporairement https.get.
     *
     * L’API des jours fériés répond correctement.
     * L’API des vacances scolaires émet ENOTFOUND sur la requête.
     */
    https.get = function (url, callback) {
      const request = new EventEmitter()

      /*
       * Première API appelée par le node :
       * https://calendrier.api.gouv.fr/...
       */
      if (url.includes('calendrier.api.gouv.fr')) {
        publicHolidayApiCalls += 1

        const response = new EventEmitter()

        /*
         * Une vraie réponse HTTP est asynchrone.
         * nextTick permet de reproduire ce comportement et laisse
         * au node le temps d’enregistrer ses listeners.
         */
        process.nextTick(function () {
          callback(response)

          response.emit(
            'data',
            JSON.stringify({
              '2099-01-01': 'Jour férié de test'
            })
          )

          response.emit('end')
        })

        return request
      }

      /*
       * Deuxième API appelée par le node :
       * https://data.education.gouv.fr/...
       */
      if (url.includes('data.education.gouv.fr')) {
        schoolHolidayApiCalls += 1

        /*
         * ENOTFOUND est émis par ClientRequest.
         *
         * Aucun objet response n’existe lorsque la résolution DNS
         * échoue. Le callback de https.get n’est donc jamais appelé.
         */
        process.nextTick(function () {
          const error = new Error(
            'getaddrinfo ENOTFOUND data.education.gouv.fr'
          )

          error.code = 'ENOTFOUND'
          error.errno = -3008
          error.syscall = 'getaddrinfo'
          error.hostname = 'data.education.gouv.fr'

          request.emit('error', error)
        })

        return request
      }

      /*
       * Le test doit échouer si le node contacte une adresse
       * inattendue.
       */
      throw new Error(`Unexpected URL: ${url}`)
    }

    const flow = [
      {
        id: 'holidays-node',
        type: 'french-holidays',
        name: 'French holidays test',
        academy: 'Rennes',
        geo: 'Métropole',
        wires: [['output-node']]
      },
      {
        id: 'output-node',
        type: 'helper'
      }
    ]

    helper.load(frenchHolidaysNode, flow, function (loadError) {
      if (loadError) {
        done(loadError)
        return
      }

      const node = helper.getNode('holidays-node')
      const outputNode = helper.getNode('output-node')

      /*
       * En cas d’erreur, Promise.all ne doit jamais atteindre
       * le traitement qui envoie msg.payload.
       */
      outputNode.on('input', function () {
        outputMessageCount += 1
      })

      /*
       * Avec un handler Node-RED à trois paramètres :
       *
       * node.on('input', function (msg, send, done) {})
       *
       * l’appel done(error) est transformé par Node-RED en
       * node.error(error, msg).
       *
       * node-red-node-test-helper expose cet appel avec
       * l’événement call:error.
       */
      node.on('call:error', function (errorCall) {
        try {
          const reportedError = errorCall.firstArg

          /*
           * Les deux API doivent avoir été appelées exactement
           * une fois.
           */
          assert.strictEqual(publicHolidayApiCalls, 1)
          assert.strictEqual(schoolHolidayApiCalls, 1)

          /*
           * L’erreur doit avoir été transmise à Node-RED.
           */
          assert(reportedError instanceof Error)
          assert.strictEqual(reportedError.code, 'ENOTFOUND')
          assert.strictEqual(
            reportedError.hostname,
            'data.education.gouv.fr'
          )
          assert.match(
            reportedError.message,
            /getaddrinfo ENOTFOUND data\.education\.gouv\.fr/
          )

          /*
           * La gestion centralisée ne doit remonter l’erreur
           * qu’une seule fois.
           */
          assert.strictEqual(node.error.callCount, 1)

          /*
           * Le node doit afficher son statut d’erreur.
           */
          assert.strictEqual(node.status.callCount, 1)

          const status = node.status.firstCall.firstArg

          assert.deepStrictEqual(status, {
            fill: 'red',
            shape: 'ring',
            text: 'getaddrinfo ENOTFOUND data.education.gouv.fr'
          })

          /*
           * Aucun résultat partiel ou invalide ne doit être envoyé
           * au node suivant.
           */
          assert.strictEqual(outputMessageCount, 0)

          done()
        } catch (assertionError) {
          done(assertionError)
        }
      })

      /*
       * Déclenche le handler input du node.
       */
      node.receive({
        payload: {}
      })
    })
  })
})