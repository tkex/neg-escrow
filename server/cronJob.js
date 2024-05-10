import cron from 'node-cron';
import { TradeModel } from './models/Trade.js';

export const setupCronJobs = () => {    

    // Ein Cron-Job (jede Stunde prüfen)
    // Wenn refaktorisiert wird, dann Modelle in derselben Datei importieren dh. import { TradeModel } from './models/Trade';
    cron.schedule('0 * * * *', async () => {

        console.log('Cron-Job gestartet: Überprüfe Handelsanfragen auf Timeout.');

        // Jetziger Zeitpunkt
        const now = new Date();

        // Alle Handelsanfragen, die über 48 Stunden sind
        const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

        try {
            // Finde Handelsanfragen, die älter als 48 Stunden sind und noch im Status 'pending' stehen
            const trades = await TradeModel.find({
                createdAt: { $lte: twoDaysAgo },
                status: 'pending'
            });

            if (trades.length > 0) {

                console.log(`Es wurden ${trades.length} Handelsanfragen gefunden, die abgebrochen werden.`);

                for (const trade of trades) {
                    trade.status = 'cancelled';
                    await trade.save();
                }

                console.log('Alle betroffenen Handelsanfragen wurden erfolgreich abgebrochen.');
            } else {

                console.log('Keine Handelsanfragen zum Abbrechen gefunden.');
            }
        } catch (error) {

            console.error('Fehler beim Ausführen des Cron-Jobs:', error);
        }
    });
};
