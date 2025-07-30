/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");


// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});
const functions = require("firebase-functions");
const {BigQuery} = require("@google-cloud/bigquery");
const bigquery = new BigQuery();

exports.insertIncidenciaToBigQuery = functions.https.onRequest(
    async (req, res) => {
      try {
        // Solo aceptar POST
        if (req.method !== "POST") {
          return res.status(405).send("Método no permitido");
        }

        const data = req.body;

        // Ajusta el dataset y tabla a los tuyos
        const datasetId = "TU_DATASET";
        const tableId = "incidencias";

        // Inserta la fila
        await bigquery
            .dataset(datasetId)
            .table(tableId)
            .insert([data]);

        res.status(200).send("Incidencia insertada en BigQuery");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error al insertar en BigQuery");
      }
    });
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
