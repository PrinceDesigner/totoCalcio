// dateUtils.js
import moment from 'moment-timezone';

export const checkAndUpdateDateStatus = async (inputDate, updateStatus) => {
    if (!inputDate) {
        console.warn('Data non valida, impossibile calcolare.');
        updateStatus(null);
        return;
    }

    try {
        // Calcola se la data è passata
        const isPast = isDatePast(inputDate);
        console.log('Risultato calcolo isPast:', isPast);

        // Aggiorna lo stato con il risultato calcolato
        updateStatus(isPast);
    } catch (error) {
        console.error('Errore durante il controllo della data:', error);
    }
};

export const isDatePast = (inputDate) => {
    if (!inputDate) {
        return null;
    }

    const date = moment.tz(inputDate, "Europe/Rome");
    const currentDate = moment().utc(true).tz("Europe/Rome");

    return date.isBefore(currentDate);
};
