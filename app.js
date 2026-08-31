// ==========================================
// NOA DIGIT TRADE - APPLICATION
// SUPABASE AUTH + ORDERS
// ==========================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ==========================================
// INITIALISATION SUPABASE
// ==========================================

const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==========================================
// VARIABLES
// ==========================================

let type = 'buy';


// ==========================================
// PAGE CHARGÉE
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {

  // Vérifier la connexion
  await checkSession();

  // Boutons
  setupTabs();
  setupStartButton();
  setupLoginButton();
  setupSubmitButton();

});


// ==========================================
// VÉRIFIER LA SESSION
// ==========================================

async function checkSession() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  updateLoginButton(session);

}


// ==========================================
// ÉCOUTER LES CHANGEMENTS DE SESSION
// ==========================================

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    updateLoginButton(session);

  }
);


// ==========================================
// BOUTON CONNEXION
// ==========================================

function updateLoginButton(session) {

  const login = document.getElementById('login');

  if (!login) return;


  if (session) {

    login.textContent = 'Mon compte';

    login.onclick = () => {
      showAccountModal(session.user);
    };

  } else {

    login.textContent = 'Se connecter';

    login.onclick = () => {
      showAuthModal();
    };

  }

}


// ==========================================
// ONGLET ACHETER / VENDRE
// ==========================================

function setupTabs() {

  document.querySelectorAll('.tab').forEach(button => {

    button.addEventListener('click', () => {

      document
        .querySelectorAll('.tab')
        .forEach(item =>
          item.classList.remove('active')
        );

      button.classList.add('active');

      type = button.dataset.type;

    });

  });

}


// ==========================================
// BOUTON COMMENCER
// ==========================================

function setupStartButton() {

  const start =
    document.getElementById('start');

  if (!start) return;


  start.addEventListener('click', () => {

    const order =
      document.getElementById('order');

    if (order) {

      order.scrollIntoView({
        behavior: 'smooth'
      });

    }

  });

}


// ==========================================
// BOUTON LOGIN
// ==========================================

function setupLoginButton() {

  const login =
    document.getElementById('login');

  if (!login) return;

  login.addEventListener('click', () => {
    showAuthModal();
  });

}


// ==========================================
// FENÊTRE CONNEXION / INSCRIPTION
// ==========================================

function showAuthModal() {

  closeModal();


  const modal =
    document.createElement('div');

  modal.id = 'authModal';

  modal.innerHTML = `

    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.55);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:9999;
      padding:20px;
    ">

      <div style="
        width:100%;
        max-width:420px;
        background:white;
        border-radius:20px;
        padding:28px;
        box-shadow:0 20px 50px rgba(0,0,0,.25);
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:20px;
        ">

          <h2 id="authTitle" style="margin:0">
            Se connecter
          </h2>

          <button
            id="closeAuth"
            type="button"
            style="
              border:0;
              background:none;
              font-size:25px;
              cursor:pointer;
            "
          >
            ×
          </button>

        </div>


        <input
          id="authEmail"
          type="email"
          placeholder="Adresse email"
          autocomplete="email"
          style="
            width:100%;
            padding:14px;
            margin-bottom:12px;
            border:1px solid #d0d5dd;
            border-radius:10px;
            font-size:16px;
          "
        >


        <input
          id="authPassword"
          type="password"
          placeholder="Mot de passe"
          autocomplete="current-password"
          style="
            width:100%;
            padding:14px;
            margin-bottom:16px;
            border:1px solid #d0d5dd;
            border-radius:10px;
            font-size:16px;
          "
        >


        <button
          id="authSubmit"
          type="button"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:10px;
            background:#111827;
            color:white;
            font-weight:700;
            font-size:16px;
            cursor:pointer;
          "
        >
          Se connecter
        </button>


        <p
          id="authMessage"
          style="
            margin-top:15px;
            line-height:1.5;
          "
        ></p>


        <button
          id="switchAuth"
          type="button"
          style="
            width:100%;
            margin-top:10px;
            padding:10px;
            border:0;
            background:none;
            cursor:pointer;
            color:#344054;
          "
        >
          Créer un compte
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(modal);


  let mode = 'login';


  const title =
    document.getElementById('authTitle');

  const submit =
    document.getElementById('authSubmit');

  const switchButton =
    document.getElementById('switchAuth');

  const message =
    document.getElementById('authMessage');


  document
    .getElementById('closeAuth')
    .addEventListener('click', closeModal);


  // ========================================
  // CONNEXION / INSCRIPTION
  // ========================================

  submit.addEventListener('click', async () => {

    const email =
      document
        .getElementById('authEmail')
        .value
        .trim();

    const password =
      document
        .getElementById('authPassword')
        .value;


    if (!email || !password) {

      message.textContent =
        'Veuillez remplir tous les champs.';

      return;

    }


    if (password.length < 6) {

      message.textContent =
        'Le mot de passe doit contenir au moins 6 caractères.';

      return;

    }


    submit.disabled = true;

    submit.textContent =
      'Patientez...';


    try {

      let result;


      // -------------------------------
      // CONNEXION
      // -------------------------------

      if (mode === 'login') {

        result =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });


      }

      // -------------------------------
      // INSCRIPTION
      // -------------------------------

      else {

        result =
          await supabaseClient.auth.signUp({
            email,
            password
          });

      }


      if (result.error) {

        throw result.error;

      }


      // -------------------------------
      // SUCCÈS CONNEXION
      // -------------------------------

      if (mode === 'login') {

        message.textContent =
          'Connexion réussie.';

        setTimeout(() => {

          closeModal();

        }, 800);

      }


      // -------------------------------
      // SUCCÈS INSCRIPTION
      // -------------------------------

      else {

        message.textContent =
          'Compte créé. Vérifiez votre adresse email pour confirmer votre compte.';

      }


    } catch (error) {

      console.error(error);

      message.textContent =
        `Erreur : ${error.message}`;

    } finally {

      submit.disabled = false;

      submit.textContent =
        mode === 'login'
          ? 'Se connecter'
          : 'Créer mon compte';

    }

  });


  // ========================================
  // CHANGER LOGIN / INSCRIPTION
  // ========================================

  switchButton.addEventListener('click', () => {

    mode =
      mode === 'login'
        ? 'signup'
        : 'login';


    if (mode === 'login') {

      title.textContent =
        'Se connecter';

      submit.textContent =
        'Se connecter';

      switchButton.textContent =
        'Créer un compte';

    } else {

      title.textContent =
        'Créer un compte';

      submit.textContent =
        'Créer mon compte';

      switchButton.textContent =
        'J'ai déjà un compte';

    }

    message.textContent = '';

  });

}


// ==========================================
// FENÊTRE MON COMPTE
// ==========================================

function showAccountModal(user) {

  closeModal();


  const modal =
    document.createElement('div');

  modal.id = 'accountModal';


  modal.innerHTML = `

    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.55);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:9999;
      padding:20px;
    ">

      <div style="
        width:100%;
        max-width:420px;
        background:white;
        border-radius:20px;
        padding:28px;
      ">

        <h2>
          Mon compte
        </h2>

        <p>
          <strong>Email :</strong><br>
          ${user.email}
        </p>

        <button
          id="logout"
          type="button"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:10px;
            background:#111827;
            color:white;
            font-weight:700;
            cursor:pointer;
          "
        >
          Se déconnecter
        </button>

        <button
          id="closeAccount"
          type="button"
          style="
            width:100%;
            margin-top:10px;
            padding:12px;
            border:1px solid #d0d5dd;
            border-radius:10px;
            background:white;
            cursor:pointer;
          "
        >
          Fermer
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(modal);


  document
    .getElementById('closeAccount')
    .addEventListener('click', closeModal);


  document
    .getElementById('logout')
    .addEventListener('click', async () => {

      const {
        error
      } = await supabaseClient.auth.signOut();


      if (error) {

        alert(
          `Erreur : ${error.message}`
        );

        return;

      }


      closeModal();

    });

}


// ==========================================
// FERMER LES FENÊTRES
// ==========================================

function closeModal() {

  const auth =
    document.getElementById('authModal');

  const account =
    document.getElementById('accountModal');


  if (auth) {
    auth.remove();
  }


  if (account) {
    account.remove();
  }

}


// ==========================================
// ENVOYER UNE COMMANDE
// ==========================================

function setupSubmitButton() {

  const submit =
    document.getElementById('submit');

  if (!submit) return;


  submit.addEventListener('click', async () => {

    const amount =
      document
        .getElementById('amount')
        .value
        .trim();


    const wallet =
      document
        .getElementById('wallet')
        .value
        .trim();


    const network =
      document
        .getElementById('network')
        .value;


    const message =
      document.getElementById('msg');


    // -------------------------------
    // VALIDATION
    // -------------------------------

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


    // -------------------------------
    // SESSION
    // -------------------------------

    const {
      data: {
        session
      }
    } =
      await supabaseClient.auth.getSession();


    if (!session) {

      message.textContent =
        'Veuillez vous connecter avant d’envoyer une demande.';

      showAuthModal();

      return;

    }


    submit.disabled = true;

    submit.textContent =
      'Envoi en cours...';


    try {

      // -------------------------------
      // CRÉATION COMMANDE
      // -------------------------------

      const response =
        await fetch(
          `${SUPABASE_URL}/rest/v1/orders`,
          {

            method: 'POST',

            headers: {

              'apikey':
                SUPABASE_KEY,

              'Authorization':
                `Bearer ${session.access_token}`,

              'Content-Type':
                'application/json',

              'Prefer':
                'return=minimal'

            },


            body: JSON.stringify({

              type: type,

              crypto_amount:
                Number(amount),

              network: network,

              wallet_address:
                wallet,

              status:
                'pending'

            })

          }
        );


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


      console.log(
        'Commande créée avec succès'
      );


      message.textContent =
        `Demande ${
          type === 'buy'
            ? 'd’achat'
            : 'de vente'
        } envoyée avec succès : ${amount} USDT (${network}).`;


      document
        .getElementById('amount')
        .value = '';


      document
        .getElementById('wallet')
        .value = '';


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
