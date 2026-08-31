// ==========================================
// NOA DIGIT TRADE
// SUPABASE AUTH + ORDERS
// ACHAT / VENTE + PAIEMENT MOBILE
// ==========================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ==========================================
// TAUX
// ==========================================

const BUY_RATE = 600;
const SELL_RATE = 570;

// Montant minimum : 2 000 FCFA pour chaque opération.
const MIN_FIAT_AMOUNT = 2000;
const MIN_SELL_USDT = MIN_FIAT_AMOUNT / SELL_RATE;


// ==========================================
// SUPABASE
// ==========================================

if (!window.supabase) {
  console.error('Supabase JS n’a pas été chargé.');
}

const supabaseClient =
  window.supabase.createClient(
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

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log('Noa Digit Trade démarré.');

    setupTabs();
    setupStartButton();
    setupAuth();
    setupSubmitButton();
    setupCalculation();

    await checkSession();
  }
);


// ==========================================
// SESSION
// ==========================================

async function checkSession() {

  try {

    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) {
      console.error('Erreur session :', error);
      updateLoginButton(null);
      return;
    }

    updateLoginButton(data.session);

  } catch (error) {

    console.error(
      'Erreur vérification session :',
      error
    );

    updateLoginButton(null);
  }
}


supabaseClient.auth.onAuthStateChange(
  (_event, session) => {
    updateLoginButton(session);
  }
);


// ==========================================
// BOUTON MON COMPTE
// ==========================================

function updateLoginButton(session) {

  const login =
    document.getElementById('login');

  if (!login) return;

  login.onclick = null;

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
// ONGLET ACHAT / VENTE
// ==========================================

function setupTabs() {

  const tabs =
    document.querySelectorAll('.tab');

  tabs.forEach(button => {

    button.addEventListener(
      'click',
      () => {

        tabs.forEach(item => {
          item.classList.remove('active');
        });

        button.classList.add('active');

        type = button.dataset.type;

        console.log(
          'Type sélectionné :',
          type
        );

        updateCalculationMode();
      }
    );
  });
}


// ==========================================
// COMMENCER
// ==========================================

function setupStartButton() {

  const start =
    document.getElementById('start');

  if (!start) return;

  start.addEventListener(
    'click',
    () => {

      const order =
        document.getElementById('order');

      if (order) {
        order.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  );
}


// ==========================================
// CALCUL
// ==========================================

function setupCalculation() {

  const amountInput =
    document.getElementById('amount');

  if (!amountInput) return;

  amountInput.addEventListener(
    'input',
    updateCalculation
  );

  updateCalculationMode();
  updateCalculation();
}


// ==========================================
// MODE ACHAT / VENTE
// ==========================================

function updateCalculationMode() {

  const amountInput =
    document.getElementById('amount');

  const amountLabel =
    document.getElementById('amountLabel');

  const calculation =
    document.getElementById('calculation');

  const rateText =
    document.getElementById('rateText');

  const minAmountText =
    document.getElementById('minAmountText');

  if (!amountInput) return;


  if (type === 'buy') {

    if (amountLabel) {
      amountLabel.textContent =
        'Montant à payer (FCFA)';
    }

    amountInput.placeholder =
      'Ex. 10000';

    if (rateText) {
      rateText.textContent =
        `Taux d'achat : 1 USDT = ${BUY_RATE.toLocaleString('fr-FR')} FCFA`;
    }

    if (minAmountText) {
      minAmountText.textContent =
        `Montant minimum : ${formatNumber(MIN_FIAT_AMOUNT, 0)} FCFA`;
    }

    amountInput.min =
      String(MIN_FIAT_AMOUNT);

    if (calculation) {
      calculation.innerHTML = `
        <span>Vous recevrez</span>
        <strong id="resultAmount">0 USDT</strong>
        <small id="resultDetail">
          1 USDT = ${BUY_RATE.toLocaleString('fr-FR')} FCFA
        </small>
      `;
    }

  } else {

    if (amountLabel) {
      amountLabel.textContent =
        'Montant à vendre (USDT)';
    }

    amountInput.placeholder =
      'Ex. 10';

    if (rateText) {
      rateText.textContent =
        `Taux de vente : 1 USDT = ${SELL_RATE.toLocaleString('fr-FR')} FCFA`;
    }

    if (minAmountText) {
      minAmountText.textContent =
        `Minimum : ${formatNumber(MIN_SELL_USDT, 6)} USDT (soit ${formatNumber(MIN_FIAT_AMOUNT, 0)} FCFA)`;
    }

    amountInput.min =
      String(MIN_SELL_USDT);

    if (calculation) {
      calculation.innerHTML = `
        <span>Vous recevrez</span>
        <strong id="resultAmount">0 FCFA</strong>
        <small id="resultDetail">
          1 USDT = ${SELL_RATE.toLocaleString('fr-FR')} FCFA
        </small>
      `;
    }
  }

  updateCalculation();
}


// ==========================================
// CALCUL EN TEMPS RÉEL
// ==========================================

function updateCalculation() {

  const amountInput =
    document.getElementById('amount');

  const resultAmount =
    document.getElementById('resultAmount');

  const resultDetail =
    document.getElementById('resultDetail');

  if (!amountInput || !resultAmount) return;

  const value =
    Number(amountInput.value);

  if (!Number.isFinite(value) || value <= 0) {

    resultAmount.textContent =
      type === 'buy'
        ? '0 USDT'
        : '0 FCFA';

    if (resultDetail) {
      resultDetail.textContent =
        type === 'buy'
          ? `1 USDT = ${BUY_RATE.toLocaleString('fr-FR')} FCFA`
          : `1 USDT = ${SELL_RATE.toLocaleString('fr-FR')} FCFA`;
    }

    return;
  }


  if (type === 'buy') {

    const usdt =
      value / BUY_RATE;

    resultAmount.textContent =
      `${formatNumber(usdt, 6)} USDT`;

    if (resultDetail) {
      resultDetail.textContent =
        `${formatNumber(value, 0)} FCFA ÷ ${BUY_RATE} = ${formatNumber(usdt, 6)} USDT`;
    }

  } else {

    const fcfa =
      value * SELL_RATE;

    resultAmount.textContent =
      `${formatNumber(fcfa, 0)} FCFA`;

    if (resultDetail) {
      resultDetail.textContent =
        `${formatNumber(value, 6)} USDT × ${SELL_RATE} = ${formatNumber(fcfa, 0)} FCFA`;
    }
  }
}


// ==========================================
// FORMAT
// ==========================================

function formatNumber(
  value,
  maximumFractionDigits = 2
) {

  return Number(value).toLocaleString(
    'fr-FR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        maximumFractionDigits
    }
  );
}


// ==========================================
// AUTH MODAL
// ==========================================

function showAuthModal() {

  const modal =
    document.getElementById('authModal');

  const loginForm =
    document.getElementById('loginForm');

  const signupForm =
    document.getElementById('signupForm');

  if (!modal) return;

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');

  if (loginForm) loginForm.hidden = false;
  if (signupForm) signupForm.hidden = true;

  const loginMessage =
    document.getElementById('loginMessage');

  const signupMessage =
    document.getElementById('signupMessage');

  if (loginMessage) loginMessage.textContent = '';
  if (signupMessage) signupMessage.textContent = '';
}


function closeAuthModal() {

  const modal =
    document.getElementById('authModal');

  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}// ==========================================
// CONFIGURATION AUTHENTIFICATION
// ==========================================

function setupAuth() {

  const modal =
    document.getElementById('authModal');

  const closeAuth =
    document.getElementById('closeAuth');

  const showSignup =
    document.getElementById('showSignup');

  const showLogin =
    document.getElementById('showLogin');

  const loginSubmit =
    document.getElementById('loginSubmit');

  const signupSubmit =
    document.getElementById('signupSubmit');


  // --------------------------------------
  // FERMER
  // --------------------------------------

  if (closeAuth) {

    closeAuth.addEventListener(
      'click',
      closeAuthModal
    );

  }


  // --------------------------------------
  // CLIQUER À L'EXTÉRIEUR
  // --------------------------------------

  if (modal) {

    modal.addEventListener(
      'click',
      event => {

        if (event.target === modal) {
          closeAuthModal();
        }

      }
    );

  }


  // --------------------------------------
  // INSCRIPTION
  // --------------------------------------

  if (showSignup) {

    showSignup.addEventListener(
      'click',
      () => {

        const loginForm =
          document.getElementById('loginForm');

        const signupForm =
          document.getElementById('signupForm');

        if (loginForm) {
          loginForm.hidden = true;
        }

        if (signupForm) {
          signupForm.hidden = false;
        }

        const loginMessage =
          document.getElementById('loginMessage');

        const signupMessage =
          document.getElementById('signupMessage');

        if (loginMessage) {
          loginMessage.textContent = '';
        }

        if (signupMessage) {
          signupMessage.textContent = '';
        }

      }
    );

  }


  // --------------------------------------
  // CONNEXION
  // --------------------------------------

  if (showLogin) {

    showLogin.addEventListener(
      'click',
      () => {

        const loginForm =
          document.getElementById('loginForm');

        const signupForm =
          document.getElementById('signupForm');

        if (signupForm) {
          signupForm.hidden = true;
        }

        if (loginForm) {
          loginForm.hidden = false;
        }

        const loginMessage =
          document.getElementById('loginMessage');

        const signupMessage =
          document.getElementById('signupMessage');

        if (loginMessage) {
          loginMessage.textContent = '';
        }

        if (signupMessage) {
          signupMessage.textContent = '';
        }

      }
    );

  }


  // --------------------------------------
  // BOUTON CONNEXION
  // --------------------------------------

  if (loginSubmit) {

    loginSubmit.addEventListener(
      'click',
      loginUser
    );

  }


  // --------------------------------------
  // BOUTON INSCRIPTION
  // --------------------------------------

  if (signupSubmit) {

    signupSubmit.addEventListener(
      'click',
      signupUser
    );

  }

}


// ==========================================
// CONNEXION UTILISATEUR
// ==========================================

async function loginUser() {

  const emailInput =
    document.getElementById('loginEmail');

  const passwordInput =
    document.getElementById('loginPassword');

  const message =
    document.getElementById('loginMessage');

  const button =
    document.getElementById('loginSubmit');


  if (
    !emailInput ||
    !passwordInput ||
    !message ||
    !button
  ) {

    console.error(
      'Éléments de connexion manquants.'
    );

    return;
  }


  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  message.textContent = '';


  if (!email || !password) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;
  }


  button.disabled = true;
  button.textContent = 'Connexion...';


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email,
        password

      });


    if (error) {
      throw error;
    }


    console.log(
      'Connexion réussie :',
      data.user
    );


    message.textContent =
      'Connexion réussie.';


    setTimeout(
      closeAuthModal,
      700
    );


  } catch (error) {

    console.error(
      'Erreur connexion :',
      error
    );


    message.textContent =
      'Erreur : ' +
      error.message;


  } finally {

    button.disabled = false;
    button.textContent = 'Se connecter';

  }

}


// ==========================================
// INSCRIPTION
// ==========================================

async function signupUser() {

  const emailInput =
    document.getElementById('signupEmail');

  const passwordInput =
    document.getElementById('signupPassword');

  const confirmInput =
    document.getElementById(
      'signupPasswordConfirm'
    );

  const message =
    document.getElementById('signupMessage');

  const button =
    document.getElementById('signupSubmit');


  if (
    !emailInput ||
    !passwordInput ||
    !confirmInput ||// ==========================================
// MON COMPTE
// ==========================================

async function showAccountModal(user) {

  const oldModal =
    document.getElementById('accountModal');

  if (oldModal) {
    oldModal.remove();
  }


  const modal =
    document.createElement('div');

  modal.id =
    'accountModal';


  modal.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.55);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
    padding:20px;
    overflow-y:auto;
  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:520px;
      max-height:90vh;
      overflow-y:auto;
      background:white;
      color:#101828;
      border-radius:20px;
      padding:28px;
      box-shadow:0 20px 50px rgba(0,0,0,.25);
    ">

      <h2 style="margin-top:0;">
        Mon compte
      </h2>

      <p>
        <strong>Email :</strong><br>
        ${escapeHtml(user.email || '')}
      </p>


      <hr style="
        border:none;
        border-top:1px solid #e5e7eb;
        margin:22px 0;
      ">


      <h3>
        Mes demandes
      </h3>


      <div id="ordersLoading"
        style="
          color:#667085;
          padding:15px 0;
        ">
        Chargement de vos demandes...
      </div>


      <div id="ordersList"></div>


      <button
        id="logoutButton"
        type="button"
        class="primary full"
        style="margin-top:20px;">
        Se déconnecter
      </button>


      <button
        id="closeAccountButton"
        type="button"
        style="
          width:100%;
          margin-top:10px;
          padding:12px;
          border:1px solid #d0d5dd;
          border-radius:10px;
          background:white;
          cursor:pointer;
        ">
        Fermer
      </button>


      <p
        id="accountMessage"
        style="
          line-height:1.5;
          color:#b42318;
        ">
      </p>

    </div>

  `;


  document.body.appendChild(modal);


  // --------------------------------------
  // FERMER
  // --------------------------------------

  const closeButton =
    document.getElementById(
      'closeAccountButton'
    );

  if (closeButton) {

    closeButton.addEventListener(
      'click',
      () => {
        modal.remove();
      }
    );

  }


  // --------------------------------------
  // FERMER EN DEHORS
  // --------------------------------------

  modal.addEventListener(
    'click',
    event => {

      if (
        event.target === modal
      ) {

        modal.remove();

      }

    }
  );


  // --------------------------------------
  // DÉCONNEXION
  // --------------------------------------

  const logoutButton =
    document.getElementById(
      'logoutButton'
    );

  if (logoutButton) {

    logoutButton.addEventListener(
      'click',
      async () => {

        logoutButton.disabled =
          true;

        logoutButton.textContent =
          'Déconnexion...';


        const {
          error
        } =
          await supabaseClient.auth.signOut();


        if (error) {

          console.error(
            'Erreur déconnexion :',
            error
          );


          const accountMessage =
            document.getElementById(
              'accountMessage'
            );


          if (accountMessage) {

            accountMessage.textContent =
              'Erreur
