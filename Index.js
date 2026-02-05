// index.js

import Discord from "discord.js";
import fetch from "node-fetch";
import cron from "node-cron";

// Création du client Discord
const client = new Discord.Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"]
});

// Variables d'environnement
const channelId = process.env.CHANNEL_ID;
const apiKey = process.env.FLIGHT_API_KEY;
const priceThreshold = parseInt(process.env.PRICE_THRESHOLD);

// Fonction pour vérifier les prix du vol
async function checkFlightPrice() {
  const origin = "SCL";       // Santiago
  const destination = "EZE";  // Buenos Aires
  const departureDate = "2026-03-17";
  const returnDate = "2026-03-27";

  // Exemple avec l'API Skyscanner (ou Kiwi)
  const url = `https://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/CL/CLP/es-CL/${origin}/${destination}/${departureDate}/${returnDate}?apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.Quotes || data.Quotes.length === 0) {
      console.log("Pas de données disponibles.");
      return;
    }

    // Prix minimum du vol
    const minPrice = Math.min(...data.Quotes.map(q => q.MinPrice || Infinity));
    console.log(`Dernier prix minimum : CLP ${minPrice}`);

    // Envoi dans Discord si le prix est en-dessous du seuil
    if (minPrice <= priceThreshold) {
      const channel = await client.channels.fetch(channelId);
      channel.send(
        `🛫 **Prix bas détecté !**\nSantiago → Buenos Aires\n17/03 → 27/03\nPrix : **CLP ${minPrice}**\n👉 https://www.skyscanner.net/transport/flights/scl/eze/`
      );
    }
  } catch (err) {
    console.error("Erreur API vols :", err);
  }
}

// Quand le bot est prêt
client.on("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  // Vérifie toutes les 6h
  cron.schedule("0 */6 * * *", () => {
    console.log("Vérification des prix...");
    checkFlightPrice();
  });
});

// Connexion Discord
client.login(process.env.DISCORD_TOKEN);
