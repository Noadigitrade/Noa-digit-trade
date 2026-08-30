// ===============================
// NOA DIGIT TRADE - SUPABASE
// ===============================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';

let type = 'buy';


// ===============================
// ON ATTEND QUE LA PAGE SOIT CHARGÉE
// ===============================

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------
  // Onglets Acheter / Vendre
  // -------------------------------

  document.querySelectorAll('.tab').forEach(button => {

    button.addEventListener('click', () => {

      document.querySelectorAll('.tab')
        .forEach(item => item.classList.remove('active'));

      button.classList.add('active');

      type = button.dataset.type;
    });

  });


  // -------------------------------
  // Bouton Commencer
  // -------------------------------

  const start = document.getElementById('start');

  if (start) {
    start.addEventListener('click', () => {

      const order = document.getElementById('order');

      if (order) {
        order.scrollIntoView({
          behavior: 'smooth'
        });
      }

    });
  }


  // -------------------------------
  // Connexion
  // -------------------------------

  const login = document.getElementById('login');

  if (login) {
    login.addEventListener('click', () => {

      alert(
        'La connexion sera disponible prochainement.'
      );

    });
  }


  // -------------------------------
  // ENVOI DE LA COMMANDE
  // -------------------------------

  const submit = document.getElementById('submit');

  if (submit) {

    submit.addEventListener('click', async () => {

      const amount =
        document.getElementById('amount').value.trim();

      const wallet =
        document.getElementById('wallet').value.trim();

      const network =
        document.getElementById('network').value;

      const message =
        document.getElementById('msg');


      // Vérification
      if (!amount || !wallet) {

        message.textContent =
          'Veuillez remplir le montant et l’adresse du portefeuille.';

        return;
      }


      if (Number(amount) <= 0) {

        message.textContent =
          'Le montant doit être supérieur à 0.';

        return;
      }


      // Désactiver le bouton pendant l'envoi
      submit.disabled = true;

      submit.textContent =
        'Envoi en cours...';


      try {

        // -------------------------------
        // Création de la commande
        // -------------------------------

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/orders`,
          {
            method: 'POST',

            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },

            body: JSON.stringify({

              type: type,

              crypto_amount: Number(amount),

              network: network,

              wallet_address: wallet,

              status: 'pending'

            })
          }
        );


        // -------------------------------
        // Gestion de l'erreur Supabase
        // -------------------------------

        if (!response.ok) {

          const errorText =
            await response.text();

          console.error(
            'Erreur Supabase :',
            errorText
          );

          throw new Error(
            errorText || 'Erreur lors de la création de la commande.'
          );
        }


        // -------------------------------
        // Succès
        // -------------------------------

        const data =
          await response.json();

        console.log(
          'Commande créée :',
          data
        );


        message.textContent =
          `Demande ${
            type === 'buy'
              ? 'd’achat'
              : 'de vente'
          } envoyée avec succès : ${amount} USDT (${network}).`;


        // Nettoyage
        document.getElementById('amount').value = '';
        document.getElementById('wallet').value = '';


      } catch (error) {

        console.error(error);

        message.textContent =
          `Erreur : ${error.message}`;

      } finally {

        submit.disabled = false;

        submit.textContent =
          'Envoyer la demande';

      }

    });

  }

});
