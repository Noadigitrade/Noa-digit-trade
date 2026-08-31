// ===============================
// NOA DIGIT TRADE - SUPABASE
// ===============================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';

let type = 'buy';


// ===============================
// PAGE CHARGÉE
// ===============================

document.addEventListener('DOMContentLoaded', () => {

  // ===============================
  // ONGLET ACHETER / VENDRE
  // ===============================

  document.querySelectorAll('.tab').forEach(button => {

    button.addEventListener('click', () => {

      document.querySelectorAll('.tab')
        .forEach(item => item.classList.remove('active'));

      button.classList.add('active');

      type = button.dataset.type;

    });

  });


  // ===============================
  // BOUTON COMMENCER
  // ===============================

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


  // ===============================
  // CONNEXION
  // ===============================

  const login = document.getElementById('login');

  if (login) {

    login.addEventListener('click', () => {

      alert(
        'La connexion sera disponible prochainement.'
      );

    });

  }


  // ===============================
  // ENVOI DE LA COMMANDE
  // ===============================

  const submit = document.getElementById('submit');

  if (submit) {

    submit.addEventListener('click', async () => {

      const amountElement =
        document.getElementById('amount');

      const walletElement =
        document.getElementById('wallet');

      const networkElement =
        document.getElementById('network');

      const message =
        document.getElementById('msg');


      // Vérification des éléments
      if (
        !amountElement ||
        !walletElement ||
        !networkElement ||
        !message
      ) {

        console.error(
          'Erreur : un élément du formulaire est introuvable.'
        );

        return;

      }


      const amount =
        amountElement.value.trim();

      const wallet =
        walletElement.value.trim();

      const network =
        networkElement.value;


      // ===============================
      // VALIDATION
      // ===============================

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


      // ===============================
      // DÉSACTIVER LE BOUTON
      // ===============================

      submit.disabled = true;

      submit.textContent =
        'Envoi en cours...';


      try {

        // ===============================
        // ENVOI À SUPABASE
        // ===============================

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/orders`,
          {
            method: 'POST',

            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
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


        // ===============================
        // ERREUR SUPABASE
        // ===============================

        if (!response.ok) {

          const errorText =
            await response.text();

          console.error(
            'Erreur Supabase :',
            errorText
          );

          throw new Error(
            errorText ||
            'Erreur lors de la création de la commande.'
          );

        }


        // ===============================
        // SUCCÈS
        // ===============================

        console.log(
          'Commande créée avec succès'
        );


        message.textContent =
          `Demande ${
            type === 'buy'
              ? 'd’achat'
              : 'de vente'
          } envoyée avec succès : ${amount} USDT (${network}).`;


        // ===============================
        // NETTOYAGE
        // ===============================

        amountElement.value = '';

        walletElement.value = '';


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
