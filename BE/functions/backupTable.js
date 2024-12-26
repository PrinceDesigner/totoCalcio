const functions = require('firebase-functions');
const supabase = require('./supaClient');
const { error, info, log } = require("firebase-functions/logger");
const { Buffer } = require('buffer');  // Importa il modulo Buffer

exports.exportAllTables = functions.https.onRequest(async (req, res) => {
    try {
        log('Inizio esportazione tabelle...');
        const tables = await getAllTables();
        const exportedData = {};

        for (const table of tables) {
            log(`Recupero dati dalla tabella: ${table}`);
            const data = await fetchTableData(table);
            exportedData[table] = data;
        }

        // Salva i file CSV nello storage di Supabase
        const storagePath = 'public/All/';
        log(`Inizio salvataggio dei dati nello storage per path: ${storagePath}`);
        await saveToStorage(exportedData, storagePath);

        res.status(200).send({ message: 'Export e upload riusciti!', files: Object.keys(exportedData) });
    } catch (error) {
        log(`Errore: ${error.message}`);
        res.status(500).send({ error: error.message });
    }
});

// Funzione per recuperare i dati della tabella
async function fetchTableData(tableName) {
    const url = `${supabase.supabaseUrl}/rest/v1/${tableName}`;
    log(`Fetching data from table: ${tableName}`);
    const response = await fetch(url, {
        method: "GET",
        headers: {
            apikey: supabase.supabaseKey,
            Authorization: `Bearer ${supabase.supabaseKey}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Errore durante il recupero della tabella ${tableName}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

// Recupera i nomi delle tabelle
async function getAllTables() {
    log('Recupero delle tabelle pubbliche...');
    const { data, error } = await supabase.rpc('get_public_tables');

    if (error) {
        throw new Error(`Errore nel recupero delle tabelle: ${error.message}`);
    }

    log(`Tabelle recuperate: ${data.map(row => row.table_name).join(', ')}`);
    return data.map(row => row.table_name);
}

// Funzione per convertire i dati JSON in formato CSV
function jsonToCSV(data, headers) {
    const csvRows = [];
    csvRows.push(headers.join(','));  // Aggiungere l'intestazione
    data.forEach(row => {
        const values = headers.map(header => row[header]);
        csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
}

// Funzione per salvare i dati nello storage di Supabase
async function saveToStorage(data, storagePath) {
    log(`Inizio salvataggio dei dati nello storage per path: ${storagePath}`);
    for (const table in data) {
        const csvContent = jsonToCSV(data[table], Object.keys(data[table][0]));  // Assicurarsi che i dati siano in formato CSV

        // Converte il contenuto CSV in Buffer
        const bufferContent = Buffer.from(csvContent, 'utf-8');

        const filePath = `${storagePath}${table}.csv`;
        log(' ${supabase.supabaseKey ',supabase.supabaseKey)
        const { data: storageData, error } = await supabase.storage
            .from('backupTable')
            .upload(filePath, bufferContent, {
                headers: {
                    Authorization: `Bearer ${supabase.supabaseKey}`
                }
            });

        if (error) {
            log(`Errore nell'upload di ${storagePath}${table}.csv: ${JSON.stringify(error)}`);

            throw new Error(`Errore nell'upload di ${storagePath}${table}.csv: ${error.message}`);
        }

        log(`File ${table}.csv salvato nello storage di Supabase.`);
    }
}
