// ============================================================
// NOA DIGIT TRADE
// SUPABASE AUTH + ORDERS + HISTORIQUE
// CONFIRMATION + ORANGE MONEY + QR CODE
// ============================================================


// ============================================================
// CONFIGURATION SUPABASE
// ============================================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ============================================================
// TAUX DE CHANGE
// ============================================================

// Achat : le client achète 1 USDT à 600 FCFA
const BUY_RATE = 600;

// Vente : le client vend 1 USDT à 570 FCFA
const SELL_RATE = 570;


// ============================================================
// MINIMUM DE TRANSACTION
// ============================================================

const MIN_FCFA = 2000;


// ============================================================
// FRAIS RÉSEAU
// ============================================================

const NETWORK_FEES = {

  BEP20: 0,

  TRC20: 2,

  ERC20: 2.5

};


// ============================================================
// ORANGE MONEY
// ============================================================

// Numéro utilisé uniquement dans le code de paiement.
// Il ne sera jamais affiché directement à l'utilisateur.
const ORANGE_MONEY_NUMBER =
  '74602553';


// ============================================================
// INITIALISATION SUPABASE
// ============================================================

if (!window.supabase) {

  console.error(
    'Supabase JS n’a pas été chargé.'
  );

} else {

  console.log(
    'Supabase JS chargé.'
  );

}


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ============================================================
// VARIABLES GLOBALES
// ============================================================

let type = 'buy';


// ============================================================
// PAGE CHARGÉE
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log(
      'NOA DIGIT TRADE démarré.'
    );

    setupTabs();

    setupStartButton();

    setupAuth();

    setupSubmitButton();

    setupCalculation();

    setupPaymentMethods();

    setupNetworkChange();

    removeMoovMoney();

    await checkSession();

  }
);


// ============================================================
// SESSION
// ============================================================

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) {

      console.error(
        'Erreur session :',
        error
      );

      updateLoginButton(null);

      return;

    }

    updateLoginButton(
      data.session
    );

  } catch (error) {

    console.error(
      'Erreur vérification session :',
      error
    );

    updateLoginButton(null);

  }

}


// ============================================================
// SURVEILLER AUTH
// ============================================================

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    updateLoginButton(
      session
    );

  }
);


// ============================================================
// BOUTON MON COMPTE / CONNEXION
// ============================================================

function updateLoginButton(session) {

  const login =
    document.getElementById(
      'login'
    );

  if (!login) {

    return;

  }

  login.onclick = null;

  if (session) {

    login.textContent =
      'Mon compte';

    login.onclick = () => {

      showAccountModal(
        session.user
      );

    };

  } else {

    login.textContent =
      'Se connecter';

    login.onclick = () => {

      showAuthModal();

    };

  }

}


// ============================================================
// ONGLET ACHAT / VENTE
// ============================================================

function setupTabs() {

  const tabs =
    document.querySelectorAll(
      '.tab'
    );

  tabs.forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          tabs.forEach(
            item => {

              item.classList.remove(
                'active'
              );

            }
          );

          button.classList.add(
            'active'
          );

          type =
            button.dataset.type;

          console.log(
            'Type sélectionné :',
            type
          );

          updateCalculationMode();

        }
      );

    }
  );

}


// ============================================================
// BOUTON COMMENCER
// ============================================================

function setupStartButton() {

  const start =
    document.getElementById(
      'start'
    );

  if (!start) {

    return;

  }

  start.addEventListener(
    'click',
    () => {

      const order =
        document.getElementById(
          'order'
        );

      if (order) {

        order.scrollIntoView({

          behavior:
            'smooth',

          block:
            'start'

        });

      }

    }
  );

}


// ============================================================
// CALCUL
// ============================================================

function setupCalculation() {

  const amountInput =
    document.getElementById(
      'amount'
    );

  if (!amountInput) {

    return;

  }

  amountInput.addEventListener(
    'input',
    updateCalculation
  );

  updateCalculationMode();

  updateCalculation();

}


// ============================================================
// CHANGEMENT DE RÉSEAU
// ============================================================

function setupNetworkChange() {

  const networkInput =
    document.getElementById(
      'network'
    );

  if (!networkInput) {

    return;

  }

  networkInput.addEventListener(
    'change',
    updateCalculation
  );

}


// ============================================================
// MOYENS DE PAIEMENT
// ============================================================

function setupPaymentMethods() {

  removeMoovMoney();

  const buttons =
    document.querySelectorAll(
      '.payment-option'
    );

  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          buttons.forEach(
            item => {

              item.classList.remove(
                'active'
              );

            }
          );

          button.classList.add(
            'active'
          );

          const paymentMethod =
            document.getElementById(
              'paymentMethod'
            );

          if (paymentMethod) {

            paymentMethod.value =
              'Orange Money';

          }

        }
      );

    }
  );


  // ----------------------------------------------------------
  // SÉLECTIONNER ORANGE MONEY PAR DÉFAUT
  // ----------------------------------------------------------

  const orangeButton =
    document.querySelector(
      '.payment-option[data-payment="Orange Money"]'
    );

  if (orangeButton) {

    orangeButton.classList.add(
      'active'
    );

  }

  const paymentMethod =
    document.getElementById(
      'paymentMethod'
    );

  if (paymentMethod) {

    paymentMethod.value =
      'Orange Money';

  }

}


// ============================================================
// SUPPRIMER MOOV MONEY
// ============================================================

function removeMoovMoney() {

  const buttons =
    document.querySelectorAll(
      '.payment-option'
    );

  buttons.forEach(
    button => {

      const payment =
        String(
          button.dataset.payment || ''
        ).toLowerCase();

      if (
        payment.includes('moov')
      ) {

        button.remove();

      }

    }
  );

}


// ============================================================
// FRAIS RÉSEAU
// ============================================================

function getNetworkFee() {

  const networkInput =
    document.getElementById(
      'network'
    );

  if (!networkInput) {

    return 0;

  }

  const network =
    networkInput.value;

  return (
    NETWORK_FEES[network] ?? 0
  );

}


// ============================================================
// NOM RÉSEAU
// ============================================================

function getNetworkName() {

  const networkInput =
    document.getElementById(
      'network'
    );

  if (!networkInput) {

    return 'BEP20';

  }

  return networkInput.value || 'BEP20';

}


// ============================================================
// ADAPTER AFFICHAGE ACHAT / VENTE
// ============================================================

function updateCalculationMode() {

  const amountInput =
    document.getElementById(
      'amount'
    );

  const amountLabel =
    document.getElementById(
      'amountLabel'
    );

  const walletLabel =
    document.getElementById(
      'walletLabel'
    );

  const rateText =
    document.getElementById(
      'rateText'
    );

  if (!amountInput) {

    return;

  }


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (type === 'buy') {

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à payer (FCFA)';

    }

    amountInput.placeholder =
      'Minimum : 2 000 FCFA';

    amountInput.min =
      MIN_FCFA;

    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }

    if (rateText) {

      rateText.textContent =
        `Taux d'achat : 1 USDT = ${formatNumber(BUY_RATE, 0)} FCFA`;

    }

    updateCalculation();

    return;

  }


  // ==========================================================
  // VENTE
  // ==========================================================

  if (amountLabel) {

    amountLabel.textContent =
      'Montant à vendre (USDT)';

  }

  amountInput.placeholder =
    'Montant en USDT';

  amountInput.min =
    '0';

  if (walletLabel) {

    walletLabel.textContent =
      'Adresse du portefeuille USDT';

  }

  if (rateText) {

    rateText.textContent =
      `Taux de vente : 1 USDT = ${formatNumber(SELL_RATE, 0)} FCFA`;

  }

  updateCalculation();

}


// ============================================================
// CALCULER
// ============================================================

function updateCalculation() {

  const amountInput =
    document.getElementById(
      'amount'
    );

  const resultAmount =
    document.getElementById(
      'resultAmount'
    );

  const resultDetail =
    document.getElementById(
      'resultDetail'
    );

  const feeDetail =
    document.getElementById(
      'feeDetail'
    );

  const netDetail =
    document.getElementById(
      'netDetail'
    );

  if (
    !amountInput ||
    !resultAmount
  ) {

    return;

  }

  const value =
    Number(
      amountInput.value
    );

  const fee =
    getNetworkFee();

  const network =
    getNetworkName();


  // ==========================================================
  // AUCUN MONTANT
  // ==========================================================

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    if (type === 'buy') {

      resultAmount.textContent =
        '0 USDT';

    } else {

      resultAmount.textContent =
        '0 FCFA';

    }

    if (resultDetail) {

      resultDetail.textContent =
        type === 'buy'
          ? 'Montant minimum : 2 000 FCFA'
          : `Montant minimum : ${formatNumber(MIN_FCFA / SELL_RATE, 6)} USDT`;

    }

    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau ${network} : ${formatNumber(fee, 2)} USDT`;

    }

    if (netDetail) {

      netDetail.textContent =
        type === 'buy'
          ? 'Montant net reçu : 0 USDT'
          : 'Montant net reçu : 0 FCFA';

    }

    return;

  }


  // ==========================================================
  // ACHAT USDT
  // ==========================================================

  if (type === 'buy') {

    const grossUSDT =
      value / BUY_RATE;

    const netUSDT =
      Math.max(
        grossUSDT - fee,
        0
      );

    resultAmount.textContent =
      `${formatNumber(netUSDT, 6)} USDT`;

    if (resultDetail) {

      resultDetail.textContent =
        `${formatNumber(value, 0)} FCFA ÷ ${formatNumber(BUY_RATE, 0)} = ${formatNumber(grossUSDT, 6)} USDT brut`;

    }

    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau ${network} : ${formatNumber(fee, 2)} USDT`;

    }

    if (netDetail) {

      netDetail.textContent =
        `Montant net reçu : ${formatNumber(netUSDT, 6)} USDT`;

    }

    return;

  }


  // ==========================================================
  // VENTE USDT
  // ==========================================================

  const usdtAmount =
    value;

  const grossFCFA =
    usdtAmount * SELL_RATE;

  const feeFCFA =
    fee * SELL_RATE;

  const netFCFA =
    Math.max(
      grossFCFA - feeFCFA,
      0
    );

  resultAmount.textContent =
    `${formatNumber(netFCFA, 0)} FCFA`;

  if (resultDetail) {

    resultDetail.textContent =
      `${formatNumber(usdtAmount, 6)} USDT × ${formatNumber(SELL_RATE, 0)} = ${formatNumber(grossFCFA, 0)} FCFA brut`;

  }

  if (feeDetail) {

    feeDetail.textContent =
      `Frais réseau ${network} : ${formatNumber(fee, 2)} USDT (${formatNumber(feeFCFA, 0)} FCFA)`;

  }

  if (netDetail) {

    netDetail.textContent =
      `Montant net reçu : ${formatNumber(netFCFA, 0)} FCFA`;

  }

}


// ============================================================
// FORMAT NOMBRE
// ============================================================

function formatNumber(
  value,
  maximumFractionDigits = 2
) {

  return Number(value).toLocaleString(
    'fr-FR',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        maximumFractionDigits

    }
  );

}


// ============================================================
// MODAL AUTH
// ============================================================

function showAuthModal() {

  const modal =
    document.getElementById(
      'authModal'
    );

  const loginForm =
    document.getElementById(
      'loginForm'
    );

  const signupForm =
    document.getElementById(
      'signupForm'
    );

  if (!modal) {

    console.error(
      'authModal introuvable.'
    );

    return;

  }

  modal.style.display =
    'flex';

  modal.setAttribute(
    'aria-hidden',
    'false'
  );

  if (loginForm) {

    loginForm.hidden =
      false;

  }

  if (signupForm) {

    signupForm.hidden =
      true;

  }

  const loginMessage =
    document.getElementById(
      'loginMessage'
    );

  const signupMessage =
    document.getElementById(
      'signupMessage'
    );

  if (loginMessage) {

    loginMessage.textContent =
      '';

  }

  if (signupMessage) {

    signupMessage.textContent =
      '';

  }

}


// ============================================================
// FERMER AUTH
// ============================================================

function closeAuthModal() {

  const modal =
    document.getElementById(
      'authModal'
    );

  if (!modal) {

    return;

  }

  modal.style.display =
    'none';

  modal.setAttribute(
    'aria-hidden',
    'true'
  );

}


// ============================================================
// CONFIGURATION AUTH
// ============================================================

function setupAuth() {

  const modal =
    document.getElementById(
      'authModal'
    );

  const closeAuth =
    document.getElementById(
      'closeAuth'
    );

  const showSignup =
    document.getElementById(
      'showSignup'
    );

  const showLogin =
    document.getElementById(
      'showLogin'
    );

  const loginSubmit =
    document.getElementById(
      'loginSubmit'
    );

  const signupSubmit =
    document.getElementById(
      'signupSubmit'
    );


  // ==========================================================
  // FERMER
  // ==========================================================

  if (closeAuth) {

    closeAuth.addEventListener(
      'click',
      closeAuthModal
    );

  }


  // ==========================================================
  // CLIQUER À L'EXTÉRIEUR
  // ==========================================================

  if (modal) {

    modal.addEventListener(
      'click',
      event => {

        if (
          event.target === modal
        ) {

          closeAuthModal();

        }

      }
    );

  }


  // ==========================================================
  // AFFICHER INSCRIPTION
  // ==========================================================

  if (showSignup) {

    showSignup.addEventListener(
      'click',
      () => {

        const loginForm =
          document.getElementById(
            'loginForm'
          );

        const signupForm =
          document.getElementById(
            'signupForm'
          );

        if (loginForm) {

          loginForm.hidden =
            true;

        }

        if (signupForm) {

          signupForm.hidden =
            false;

        }

      }
    );

  }


  // ==========================================================
  // AFFICHER CONNEXION
  // ==========================================================

  if (showLogin) {

    showLogin.addEventListener(
      'click',
      () => {

        const loginForm =
          document.getElementById(
            'loginForm'
          );

        const signupForm =
          document.getElementById(
            'signupForm'
          );

        if (signupForm) {

          signupForm.hidden =
            true;

        }

        if (loginForm) {

          loginForm.hidden =
            false;

        }

      }
    );

  }


  // ==========================================================
  // CONNEXION
  // ==========================================================

  if (loginSubmit) {

    loginSubmit.addEventListener(
      'click',
      loginUser
    );

  }


  // ==========================================================
  // INSCRIPTION
  // ==========================================================

  if (signupSubmit) {

    signupSubmit.addEventListener(
      'click',
      signupUser
    );

  }

}


// ============================================================
// CONNEXION UTILISATEUR
// ============================================================

async function loginUser() {

  const emailInput =
    document.getElementById(
      'loginEmail'
    );

  const passwordInput =
    document.getElementById(
      'loginPassword'
    );

  const message =
    document.getElementById(
      'loginMessage'
    );

  const button =
    document.getElementById(
      'loginSubmit'
    );

  if (
    !emailInput ||
    !passwordInput ||
    !message ||
    !button
  ) {

    return;

  }

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  message.textContent =
    '';

  if (
    !email ||
    !password
  ) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }

  button.disabled =
    true;

  button.textContent =
    'Connexion...';

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email:
          email,

        password:
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

    button.disabled =
      false;

    button.textContent =
      'Se connecter';

  }

}


// ============================================================
// INSCRIPTION
// ============================================================

async function signupUser() {

  const emailInput =
    document.getElementById(
      'signupEmail'
    );

  const passwordInput =
    document.getElementById(
      'signupPassword'
    );

  const confirmInput =
    document.getElementById(
      'signupPasswordConfirm'
    );

  const message =
    document.getElementById(
      'signupMessage'
    );

  const button =
    document.getElementById(
      'signupSubmit'
    );

  if (
    !emailInput ||
    !passwordInput ||
    !confirmInput ||
    !message ||
    !button
  ) {

    return;

  }

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  const confirmPassword =
    confirmInput.value;

  message.textContent =
    '';

  if (
    !email ||
    !password ||
    !confirmPassword
  ) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }

  if (
    password.length < 6
  ) {

    message.textContent =
      'Le mot de passe doit contenir au moins 6 caractères.';

    return;

  }

  if (
    password !== confirmPassword
  ) {

    message.textContent =
      'Les mots de passe ne correspondent pas.';

    return;

  }

  button.disabled =
    true;

  button.textContent =
    'Création...';

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email:
          email,

        password:
          password,

        options: {

          emailRedirectTo:
            'https://noadigittrade.github.io'

        }

      });

    if (error) {

      throw error;

    }

    console.log(
      'Compte créé :',
      data
    );


    // --------------------------------------------------------
    // EMAIL À CONFIRMER
    // --------------------------------------------------------

    if (
      data.user &&
      !data.session
    ) {

      message.textContent =
        'Compte créé. Vérifiez votre email pour confirmer votre compte.';

      return;

    }


    // --------------------------------------------------------
    // SESSION DIRECTE
    // --------------------------------------------------------

    if (data.user) {

      try {

        await createUserProfile(
          data.user
        );

      } catch (profileError) {

        console.error(
          'Erreur création profil :',
          profileError
        );

        message.textContent =
          'Compte créé, mais le profil utilisateur n’a pas pu être créé.';

        return;

      }

      message.textContent =
        'Compte créé avec succès.';

    }

    passwordInput.value =
      '';

    confirmInput.value =
      '';

  } catch (error) {

    console.error(
      'Erreur inscription :',
      error
    );

    message.textContent =
      'Erreur : ' +
      error.message;

  } finally {

    button.disabled =
      false;

    button.textContent =
      'Créer mon compte';

  }

}


// ============================================================
// CRÉER / RÉCUPÉRER PROFIL USERS
// ============================================================

async function createUserProfile(user) {

  if (
    !user ||
    !user.id
  ) {

    throw new Error(
      'Utilisateur Supabase invalide.'
    );

  }


  // ----------------------------------------------------------
  // RECHERCHER LE PROFIL
  // ----------------------------------------------------------

  const {
    data: existingUsers,
    error: searchError
  } =
    await supabaseClient
      .from('Users')
      .select('id')
      .eq(
        'auth_id',
        user.id
      )
      .limit(1);

  if (searchError) {

    throw searchError;

  }

  if (
    existingUsers &&
    existingUsers.length > 0
  ) {

    return existingUsers[0];

  }


  // ----------------------------------------------------------
  // CRÉER LE PROFIL
  // ----------------------------------------------------------

  const {
    data: newUser,
    error: insertError
  } =
    await supabaseClient
      .from('Users')
      .insert({

        auth_id:
          user.id,

        email:
          user.email || ''

      })
      .select()
      .single();

  if (insertError) {

    throw insertError;

  }

  return newUser;

}


// ============================================================
// MON COMPTE
// ============================================================

async function showAccountModal(user) {

  const oldModal =
    document.getElementById(
      'accountModal'
    );

  if (oldModal) {

    oldModal.remove();

  }


  // ==========================================================
  // CRÉER MODAL
  // ==========================================================

  const modal =
    document.createElement(
      'div'
    );

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
    box-sizing:border-box;
  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:520px;
      max-height:90vh;
      overflow-y:auto;
      background:white;
      color:#101828;
      border-radius:24px;
      padding:28px;
      box-shadow:0 20px 60px rgba(0,0,0,.25);
      box-sizing:border-box;
    ">

      <h2 style="
        margin:0 0 24px;
        font-size:30px;
      ">
        Mon compte
      </h2>

      <div style="
        background:#f8f9fc;
        border-radius:18px;
        padding:18px;
        margin-bottom:25px;
      ">

        <div style="
          font-size:14px;
          color:#667085;
          margin-bottom:8px;
        ">
          Email
        </div>

        <div style="
          font-size:17px;
          font-weight:600;
          word-break:break-word;
        ">
          ${escapeHtml(user.email || '')}
        </div>

      </div>

      <div style="
        height:1px;
        background:#e4e7ec;
        margin:20px 0;
      "></div>

      <h3 style="
        margin:0 0 18px;
        font-size:22px;
      ">
        📋 Historique des commandes
      </h3>

      <div id="orderHistory">

        <div style="
          padding:20px;
          text-align:center;
          color:#667085;
        ">
          Chargement de l’historique...
        </div>

      </div>

      <button
        id="logoutButton"
        type="button"
        style="
          width:100%;
          margin-top:22px;
          padding:15px;
          border:0;
          border-radius:12px;
          background:#101828;
          color:white;
          font-size:16px;
          cursor:pointer;
        ">
        Se déconnecter
      </button>

      <button
        id="closeAccountButton"
        type="button"
        style="
          width:100%;
          margin-top:10px;
          padding:14px;
          border:1px solid #d0d5dd;
          border-radius:12px;
          background:white;
          color:#101828;
          font-size:16px;
          cursor:pointer;
        ">
        Fermer
      </button>

      <p
        id="accountMessage"
        style="
          line-height:1.5;
          margin-top:15px;
        ">
      </p>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // ==========================================================
  // FERMER
  // ==========================================================

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


  // ==========================================================
  // CLIQUER À L'EXTÉRIEUR
  // ==========================================================

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


  // ==========================================================
  // DÉCONNEXION
  // ==========================================================

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
              'Erreur : ' +
              error.message;

          }

          logoutButton.disabled =
            false;

          logoutButton.textContent =
            'Se déconnecter';

          return;

        }

        modal.remove();

      }
    );

  }


  // ==========================================================
  // CHARGER HISTORIQUE
  // ==========================================================

  await loadOrderHistory(
    user
  );

}


// ============================================================
// CHARGER HISTORIQUE DES COMMANDES
// ============================================================

async function loadOrderHistory(user) {

  const history =
    document.getElementById(
      'orderHistory'
    );

  if (!history) {

    return;

  }

  try {

    // --------------------------------------------------------
    // RÉCUPÉRER LE PROFIL USERS
    // --------------------------------------------------------

    const {
      data: users,
      error: userError
    } =
      await supabaseClient
        .from('Users')
        .select('id')
        .eq(
          'auth_id',
          user.id
        )
        .limit(1);

    if (userError) {

      throw userError;

    }


    // --------------------------------------------------------
    // PAS DE PROFIL
    // --------------------------------------------------------

    if (
      !users ||
      users.length === 0
    ) {

      history.innerHTML = `

        <div style="
          padding:20px;
          background:#f8f9fc;
          border-radius:16px;
          text-align:center;
          color:#667085;
        ">
          Aucune commande enregistrée.
        </div>

      `;

      return;

    }


    const userId =
      users[0].id;


    // --------------------------------------------------------
    // RÉCUPÉRER LES COMMANDES
    // --------------------------------------------------------

    const {
      data: orders,
      error: ordersError
    } =
      await supabaseClient
        .from('orders')
        .select(`
          id,
          created_at,
          type,
          fiat_amount,
          crypto_amount,
          rate,
          fee,
          network,
          wallet_address,
          payment_method,
          status
        `)
        .eq(
          'user_id',
          userId
        )
        .order(
          'created_at',
          {
            ascending:false
          }
        );


    if (ordersError) {

      throw ordersError;

    }


    // --------------------------------------------------------
    // AUCUNE COMMANDE
    // --------------------------------------------------------

    if (
      !orders ||
      orders.length === 0
    ) {

      history.innerHTML = `

        <div style="
          padding:20px;
          background:#f8f9fc;
          border-radius:16px;
          text-align:center;
          color:#667085;
        ">
          Aucune commande pour le moment.
        </div>

      `;

      return;

    }


    // --------------------------------------------------------
    // AFFICHER COMMANDES
    // --------------------------------------------------------

    history.innerHTML =
      orders
        .map(
          order =>
            createOrderHistoryCard(
              order
            )
        )
        .join('');


  } catch (error) {

    console.error(
      'Erreur chargement historique :',
      error
    );

    history.innerHTML = `

      <div style="
        padding:18px;
        background:#fff4f4;
        border:1px solid #f1b5b5;
        border-radius:16px;
        color:#b42318;
        line-height:1.6;
      ">

        <strong>
          Impossible de charger l’historique des commandes.
        </strong>

        <br><br>

        ${escapeHtml(
          error.message ||
          'Une erreur est survenue.'
        )}

      </div>

    `;

  }

}


// ============================================================
// CARTE D'UNE COMMANDE
// ============================================================

function createOrderHistoryCard(order) {

  const isBuy =
    order.type === 'buy';

  const typeText =
    isBuy
      ? 'Achat USDT'
      : 'Vente USDT';


  // ----------------------------------------------------------
  // STATUT
  // ----------------------------------------------------------

  const status =
    order.status ||
    'pending';

  const statusInfo =
    getStatusInfo(
      status
    );


  // ----------------------------------------------------------
  // DATE
  // ----------------------------------------------------------

  const dateText =
    formatDate(
      order.created_at
    );


  // ----------------------------------------------------------
  // MONTANTS
  // ----------------------------------------------------------

  const cryptoAmount =
    Number(
      order.crypto_amount || 0
    );

  const fiatAmount =
    Number(
      order.fiat_amount || 0
    );

  const rate =
    Number(
      order.rate || 0
    );

  const fee =
    Number(
      order.fee || 0
    );


  // ----------------------------------------------------------
  // RÉSEAU
  // ----------------------------------------------------------

  const network =
    order.network ||
    'BEP20';


  // ----------------------------------------------------------
  // PAIEMENT
  // ----------------------------------------------------------

  const paymentMethod =
    order.payment_method ||
    'Orange Money';


  // ----------------------------------------------------------
  // PORTEFEUILLE
  // ----------------------------------------------------------

  const wallet =
    order.wallet_address ||
    'Non renseigné';


  return `

    <div style="
      background:#ffffff;
      border:1px solid #e4e7ec;
      border-radius:18px;
      padding:18px;
      margin-bottom:14px;
      box-shadow:0 4px 15px rgba(16,24,40,.05);
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:10px;
        margin-bottom:15px;
      ">

        <div>

          <div style="
            font-size:18px;
            font-weight:700;
            margin-bottom:5px;
          ">
            ${escapeHtml(typeText)}
          </div>

          <div style="
            color:#667085;
            font-size:13px;
          ">
            ${escapeHtml(dateText)}
          </div>

        </div>

        <div style="
          padding:7px 10px;
          border-radius:20px;
          background:${statusInfo.background};
          color:${statusInfo.color};
          font-size:12px;
          font-weight:700;
          white-space:nowrap;
        ">
          ${escapeHtml(statusInfo.text)}
        </div>

      </div>


      <div style="
        display:grid;
        gap:10px;
      ">

        <div>
          <strong>
            Montant USDT :
          </strong>
          ${formatNumber(cryptoAmount, 6)} USDT
        </div>

        <div>
          <strong>
            Montant FCFA :
          </strong>
          ${formatNumber(fiatAmount, 0)} FCFA
        </div>

        <div>
          <strong>
            Taux :
          </strong>
          1 USDT = ${formatNumber(rate, 0)} FCFA
        </div>

        <div>
          <strong>
            Frais réseau :
          </strong>
          ${formatNumber(fee, 2)} USDT
        </div>

        <div>
          <strong>
            Réseau :
          </strong>
          ${escapeHtml(network)}
        </div>

        <div>
          <strong>
            Moyen de paiement :
          </strong>
          ${escapeHtml(paymentMethod)}
        </div>

        <div style="
          word-break:break-all;
        ">
          <strong>
            Portefeuille :
          </strong>
          ${escapeHtml(wallet)}
        </div>

      </div>

    </div>

  `;

}


// ============================================================
// INFORMATIONS STATUT
// ============================================================

function getStatusInfo(status) {

  switch (
    String(status).toLowerCase()
  ) {

    case 'completed':

    case 'complete':

    case 'success':

    case 'successful':

      return {

        text:
          'Terminé',

        background:
          '#ecfdf3',

        color:
          '#027a48'

      };


    case 'cancelled':

    case 'canceled':

    case 'rejected':

      return {

        text:
          'Annulée',

        background:
          '#fef3f2',

        color:
          '#b42318'

      };


    case 'processing':

    case 'in_progress':

      return {

        text:
          'En traitement',

        background:
          '#eff8ff',

        color:
          '#175cd3'

      };


    case 'pending':

    default:

      return {

        text:
          'En attente',

        background:
          '#fffaeb',

        color:
          '#b54708'

      };

  }

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

  if (!value) {

    return 'Date inconnue';

  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return 'Date inconnue';

  }

  return date.toLocaleString(
    'fr-FR',
    {
      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit'

    }
  );

}


// ============================================================
// PROTECTION HTML
// ============================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      '&',
      '&amp;'
    )

    .replaceAll(
      '<',
      '&lt;'
    )

    .replaceAll(
      '>',
      '&gt;'
    )

    .replaceAll(
      '"',
      '&quot;'
    )

    .replaceAll(
      "'",
      '&#039;'
    );

}


// ============================================================
// BOUTON ENVOYER
// ============================================================

function setupSubmitButton() {

  const submit =
    document.getElementById(
      'submit'
    );

  if (!submit) {

    console.error(
      'Bouton submit introuvable.'
    );

    return;

  }

  submit.addEventListener(
    'click',
    sendOrder
  );

}


// ============================================================
// ENVOYER LA COMMANDE
// ============================================================

async function sendOrder() {

  const amountInput =
    document.getElementById(
      'amount'
    );

  const walletInput =
    document.getElementById(
      'wallet'
    );

  const networkInput =
    document.getElementById(
      'network'
    );

  const paymentInput =
    document.getElementById(
      'paymentMethod'
    );

  const message =
    document.getElementById(
      'msg'
    );

  const submit =
    document.getElementById(
      'submit'
    );


  if (
    !amountInput ||
    !walletInput ||
    !networkInput ||
    !message ||
    !submit
  ) {

    console.error(
      'Éléments de commande manquants.'
    );

    return;

  }


  const amount =
    amountInput.value.trim();

  const wallet =
    walletInput.value.trim();

  const network =
    networkInput.value;

  // ----------------------------------------------------------
  // ORANGE MONEY UNIQUEMENT
  // ----------------------------------------------------------

  const paymentMethod =
    'Orange Money';


  message.textContent =
    '';


  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (
    !amount ||
    !wallet
  ) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }


  const numericAmount =
    Number(amount);


  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {

    message.textContent =
      'Le montant doit être supérieur à 0.';

    return;

  }


  // ==========================================================
  // CALCUL
  // ==========================================================

  let cryptoAmount;

  let fiatAmount;

  let rate;

  let networkFee;


  networkFee =
    getNetworkFee();


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (type === 'buy') {

    fiatAmount =
      numericAmount;

    rate =
      BUY_RATE;


    const grossUSDT =
      numericAmount / BUY_RATE;


    cryptoAmount =
      Math.max(
        grossUSDT - networkFee,
        0
      );


    // --------------------------------------------------------
    // MINIMUM
    // --------------------------------------------------------

    if (
      fiatAmount < MIN_FCFA
    ) {

      message.textContent =
        `Le montant minimum d'achat est de ${formatNumber(MIN_FCFA, 0)} FCFA.`;

      return;

    }


    // --------------------------------------------------------
    // FRAIS
    // --------------------------------------------------------

    if (
      cryptoAmount <= 0
    ) {

      message.textContent =
        'Le montant est insuffisant pour couvrir les frais du réseau sélectionné.';

      return;

    }

  }


  // ==========================================================
  // VENTE
  // ==========================================================

  else {

    cryptoAmount =
      numericAmount;

    rate =
      SELL_RATE;


    const grossFiat =
      numericAmount * SELL_RATE;


    const feeFiat =
      networkFee * SELL_RATE;


    fiatAmount =
      Math.max(
        grossFiat - feeFiat,
        0
      );


    // --------------------------------------------------------
    // MINIMUM
    // --------------------------------------------------------

    if (
      grossFiat < MIN_FCFA
    ) {

      const minimumUSDT =
        MIN_FCFA / SELL_RATE;


      message.textContent =
        `Le montant minimum de vente est de ${formatNumber(minimumUSDT, 6)} USDT, soit au moins ${formatNumber(MIN_FCFA, 0)} FCFA.`;

      return;

    }


    if (
      fiatAmount <= 0
    ) {

      message.textContent =
        'Le montant est insuffisant après déduction des frais réseau.';

      return;

    }

  }


  // ==========================================================
  // VÉRIFIER UTILISATEUR CONNECTÉ
  // ==========================================================

  let user;

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getUser();


    if (
      error ||
      !data.user
    ) {

      message.textContent =
        'Veuillez vous connecter avant d’envoyer une demande.';

      showAuthModal();

      return;

    }

    user =
      data.user;

  } catch (error) {

    console.error(
      'Erreur récupération utilisateur :',
      error
    );

    message.textContent =
      'Impossible de vérifier votre connexion.';

    return;

  }


  // ==========================================================
  // DÉSACTIVER BOUTON
  // ==========================================================

  submit.disabled =
    true;

  submit.textContent =
    'Envoi en cours...';


  try {

    // ========================================================
    // RÉCUPÉRER PROFIL
    // ========================================================

    let userId;


    const {
      data: users,
      error: userError
    } =
      await supabaseClient
        .from('Users')
        .select('id')
        .eq(
          'auth_id',
          user.id
        )
        .limit(1);


    if (userError) {

      throw new Error(
        userError.message
      );

    }


    if (
      users &&
      users.length > 0
    ) {

      userId =
        users[0].id;

    } else {

      const newProfile =
        await createUserProfile(
          user
        );

      userId =
        newProfile.id;

    }


    // ========================================================
    // CRÉER COMMANDE
    // ========================================================

    const {
      data: order,
      error: orderError
    } =
      await supabaseClient
        .from('orders')
        .insert({

          user_id:
            userId,

          type:
            type,

          fiat_amount:
            fiatAmount,

          crypto_amount:
            cryptoAmount,

          rate:
            rate,

          fee:
            networkFee,

          network:
            network,

          wallet_address:
            wallet,

          payment_method:
            paymentMethod,

          status:
            'pending'

        })
        .select()
        .single();


    if (orderError) {

      console.error(
        'Erreur création commande :',
        orderError
      );

      throw new Error(
        orderError.message
      );

    }


    console.log(
      'Commande créée :',
      order
    );


    // ========================================================
    // MESSAGE SUCCÈS
    // ========================================================

    message.textContent =
      '';


    // --------------------------------------------------------
    // ACHAT
    // --------------------------------------------------------

    if (type === 'buy') {

      showOrderConfirmation(
        order,
        {
          type:
            type,

          fiatAmount:
            fiatAmount,

          cryptoAmount:
            cryptoAmount,

          rate:
            rate,

          fee:
            networkFee,

          network:
            network,

          paymentMethod:
            paymentMethod,

          wallet:
            wallet

        }
      );

    }


    // --------------------------------------------------------
    // VENTE
    // --------------------------------------------------------

    else {

      showOrderConfirmation(
        order,
        {
          type:
            type,

          fiatAmount:
            fiatAmount,

          cryptoAmount:
            cryptoAmount,

          rate:
            rate,

          fee:
            networkFee,

          network:
            network,

          paymentMethod:
            paymentMethod,

          wallet:
            wallet

        }
      );

    }


    // ========================================================
    // NETTOYER
    // ========================================================

    amountInput.value =
      '';

    walletInput.value =
      '';

    updateCalculation();


  } catch (error) {

    console.error(
      'Erreur commande :',
      error
    );

    message.textContent =
      'Erreur : ' +
      error.message;


  } finally {

    submit.disabled =
      false;

    submit.textContent =
      'Envoyer la demande';

  }

}


// ============================================================
// CRÉER LE CODE USSD ORANGE MONEY
// ============================================================

function createOrangeUSSD(amount) {

  const cleanAmount =
    Math.round(
      Number(amount)
    );

  return (
    `*144*10*${ORANGE_MONEY_NUMBER}*${cleanAmount}#`
  );

}


// ============================================================
// URL QR CODE
// ============================================================
//
// Le numéro Orange Money n'est pas affiché.
// Il est uniquement contenu dans les données du QR Code.
// ============================================================

function createQRCodeURL(data) {

  return (
    'https://api.qrserver.com/v1/create-qr-code/' +
    '?size=260x260' +
    '&margin=10' +
    '&data=' +
    encodeURIComponent(data)
  );

}


// ============================================================
// NUMÉRO DE COMMANDE
// ============================================================

function getOrderNumber(order) {

  if (
    !order ||
    !order.id
  ) {

    return '#NDT';

  }


  const id =
    String(order.id);


  // ----------------------------------------------------------
  // Si UUID
  // ----------------------------------------------------------

  if (
    id.length > 8
  ) {

    return (
      '#' +
      id
        .replaceAll('-', '')
        .substring(0, 8)
        .toUpperCase()
    );

  }


  return (
    '#' +
    id.toUpperCase()
  );

}


// ============================================================
// CONFIRMATION DE COMMANDE
// ============================================================

function showOrderConfirmation(
  order,
  details
) {

  const oldModal =
    document.getElementById(
      'orderConfirmationModal'
    );

  if (oldModal) {

    oldModal.remove();

  }


  const modal =
    document.createElement(
      'div'
    );

  modal.id =
    'orderConfirmationModal';


  modal.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.62);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:10000;
    padding:18px;
    box-sizing:border-box;
  `;


  const isBuy =
    details.type === 'buy';


  const title =
    isBuy
      ? 'Commande créée'
      : 'Demande de vente créée';


  const orderNumber =
    getOrderNumber(order);


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (isBuy) {

    const ussd =
      createOrangeUSSD(
        details.fiatAmount
      );


    const qrURL =
      createQRCodeURL(
        ussd
      );


    modal.innerHTML = `

      <div style="
        width:100%;
        max-width:520px;
        max-height:92vh;
        overflow-y:auto;
        background:#ffffff;
        color:#101828;
        border-radius:24px;
        padding:24px;
        box-sizing:border-box;
        box-shadow:0 25px 70px rgba(0,0,0,.3);
      ">

        <div style="
          text-align:center;
          margin-bottom:22px;
        ">

          <div style="
            width:64px;
            height:64px;
            margin:0 auto 14px;
            border-radius:50%;
            background:#ecfdf3;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:32px;
          ">
            ✓
          </div>

          <h2 style="
            margin:0;
            font-size:27px;
          ">
            ${title}
          </h2>

          <p style="
            margin:8px 0 0;
            color:#667085;
          ">
            Votre demande a bien été enregistrée.
          </p>

        </div>


        <!-- ================================================= -->
        <!-- NUMÉRO COMMANDE -->
        <!-- ================================================= -->

        <div style="
          background:#f8f9fc;
          border-radius:16px;
          padding:15px;
          margin-bottom:14px;
          text-align:center;
        ">

          <div style="
            color:#667085;
            font-size:13px;
            margin-bottom:5px;
          ">
            N° de commande
          </div>

          <div style="
            font-size:22px;
            font-weight:800;
            letter-spacing:1px;
          ">
            ${escapeHtml(orderNumber)}
          </div>

        </div>


        <!-- ================================================= -->
        <!-- RÉCAPITULATIF -->
        <!-- ================================================= -->

        <div style="
          border:1px solid #e4e7ec;
          border-radius:18px;
          padding:18px;
          margin-bottom:18px;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              USDT reçu
            </span>

            <strong>
              ${formatNumber(details.cryptoAmount, 6)} USDT
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Montant à payer
            </span>

            <strong>
              ${formatNumber(details.fiatAmount, 0)} FCFA
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Réseau
            </span>

            <strong>
              ${escapeHtml(details.network)}
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Frais réseau
            </span>

            <strong>
              ${formatNumber(details.fee, 2)} USDT
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Paiement
            </span>

            <strong>
              Orange Money
            </strong>
          </div>

        </div>


        <!-- ================================================= -->
        <!-- INSTRUCTIONS ORANGE MONEY -->
        <!-- ================================================= -->

        <div style="
          background:#fff8ed;
          border:1px solid #fedf89;
          border-radius:18px;
          padding:18px;
          margin-bottom:18px;
        ">

          <h3 style="
            margin:0 0 10px;
            font-size:19px;
          ">
            🟠 Paiement Orange Money
          </h3>

          <p style="
            margin:0 0 12px;
            line-height:1.6;
            color:#475467;
          ">
            Effectuez le paiement du montant exact
            indiqué ci-dessous.
          </p>

          <div style="
            background:#ffffff;
            border-radius:14px;
            padding:14px;
            text-align:center;
            margin-bottom:14px;
          ">

            <div style="
              color:#667085;
              font-size:13px;
              margin-bottom:5px;
            ">
              Montant à payer
            </div>

            <div style="
              font-size:28px;
              font-weight:800;
            ">
              ${formatNumber(details.fiatAmount, 0)} FCFA
            </div>

          </div>


          <div style="
            text-align:center;
            margin:10px 0 15px;
          ">

            <div style="
              color:#667085;
              font-size:13px;
              margin-bottom:10px;
            ">
              Scannez le QR Code pour préparer le paiement
            </div>

            <div style="
              display:inline-block;
              padding:10px;
              background:white;
              border-radius:16px;
              border:1px solid #e4e7ec;
            ">

              <img
                src="${qrURL}"
                alt="QR Code de paiement Orange Money"
                width="220"
                height="220"
                style="
                  display:block;
                  max-width:220px;
                  width:100%;
                  height:auto;
                "
              >

            </div>

          </div>


          <div style="
            background:#ffffff;
            border-radius:12px;
            padding:12px;
            font-size:13px;
            line-height:1.5;
            color:#667085;
          ">

            <strong style="color:#101828;">
              Important :
            </strong>

            Après le paiement, revenez ici et
            cliquez sur
            <strong style="color:#101828;">
              « J’ai effectué le paiement »
            </strong>.

          </div>

        </div>


        <!-- ================================================= -->
        <!-- STATUT -->
        <!-- ================================================= -->

        <div style="
          background:#fffaeb;
          border:1px solid #fedf89;
          border-radius:14px;
          padding:13px;
          text-align:center;
          color:#b54708;
          font-size:14px;
          line-height:1.5;
          margin-bottom:18px;
        ">

          ⏳ Commande en attente de vérification du paiement.

        </div>


        <button
          id="paymentDoneButton"
          type="button"
          style="
            width:100%;
            padding:16px;
            border:0;
            border-radius:13px;
            background:#101828;
            color:#ffffff;
            font-size:16px;
            font-weight:700;
            cursor:pointer;
          ">
          J’ai effectué le paiement
        </button>


        <button
          id="closeOrderConfirmation"
          type="button"
          style="
            width:100%;
            margin-top:10px;
            padding:14px;
            border:1px solid #d0d5dd;
            border-radius:13px;
            background:#ffffff;
            color:#101828;
            font-size:16px;
            cursor:pointer;
          ">
          Fermer
        </button>


        <p
          id="paymentDoneMessage"
          style="
            margin:14px 0 0;
            text-align:center;
            line-height:1.5;
            color:#027a48;
          ">
        </p>

      </div>

    `;

  }


  // ==========================================================
  // VENTE
  // ==========================================================

  else {

    modal.innerHTML = `

      <div style="
        width:100%;
        max-width:520px;
        max-height:92vh;
        overflow-y:auto;
        background:#ffffff;
        color:#101828;
        border-radius:24px;
        padding:24px;
        box-sizing:border-box;
        box-shadow:0 25px 70px rgba(0,0,0,.3);
      ">

        <div style="
          text-align:center;
          margin-bottom:22px;
        ">

          <div style="
            width:64px;
            height:64px;
            margin:0 auto 14px;
            border-radius:50%;
            background:#ecfdf3;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:32px;
          ">
            ✓
          </div>

          <h2 style="
            margin:0;
            font-size:27px;
          ">
            ${title}
          </h2>

          <p style="
            margin:8px 0 0;
            color:#667085;
          ">
            Votre demande a bien été enregistrée.
          </p>

        </div>


        <div style="
          background:#f8f9fc;
          border-radius:16px;
          padding:15px;
          margin-bottom:14px;
          text-align:center;
        ">

          <div style="
            color:#667085;
            font-size:13px;
            margin-bottom:5px;
          ">
            N° de commande
          </div>

          <div style="
            font-size:22px;
            font-weight:800;
            letter-spacing:1px;
          ">
            ${escapeHtml(orderNumber)}
          </div>

        </div>


        <div style="
          border:1px solid #e4e7ec;
          border-radius:18px;
          padding:18px;
          margin-bottom:18px;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              USDT vendu
            </span>

            <strong>
              ${formatNumber(details.cryptoAmount, 6)} USDT
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Montant à recevoir
            </span>

            <strong>
              ${formatNumber(details.fiatAmount, 0)} FCFA
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Taux
            </span>

            <strong>
              1 USDT = ${formatNumber(details.rate, 0)} FCFA
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Réseau
            </span>

            <strong>
              ${escapeHtml(details.network)}
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Frais réseau
            </span>

            <strong>
              ${formatNumber(details.fee, 2)} USDT
            </strong>
          </div>


          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:7px 0;
          ">
            <span style="color:#667085;">
              Paiement
            </span>

            <strong>
              Orange Money
            </strong>
          </div>

        </div>


        <div style="
          background:#eff8ff;
          border:1px solid #b2ddff;
          border-radius:16px;
          padding:16px;
          line-height:1.6;
          color:#175cd3;
          margin-bottom:18px;
        ">

          <strong>
            ⏳ Demande en cours de traitement
          </strong>

          <br><br>

          Nous allons vérifier votre demande et
          effectuer le paiement du montant indiqué
          selon les informations fournies.

        </div>


        <div style="
          background:#fffaeb;
          border:1px solid #fedf89;
          border-radius:14px;
          padding:13px;
          text-align:center;
          color:#b54708;
          font-size:14px;
          line-height:1.5;
          margin-bottom:18px;
        ">

          ⏳ Commande en attente de traitement.

        </div>


        <button
          id="closeOrderConfirmation"
          type="button"
          style="
            width:100%;
            padding:15px;
            border:0;
            border-radius:13px;
            background:#101828;
            color:#ffffff;
            font-size:16px;
            font-weight:700;
            cursor:pointer;
          ">
          Fermer
        </button>

      </div>

    `;

  }


  document.body.appendChild(
    modal
  );


  // ==========================================================
  // FERMER
  // ==========================================================

  const closeButton =
    document.getElementById(
      'closeOrderConfirmation'
    );

  if (closeButton) {

    closeButton.addEventListener(
      'click',
      () => {

        modal.remove();

      }
    );

  }


  // ==========================================================
  // CLIC EXTÉRIEUR
  // ==========================================================

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


  // ==========================================================
  // J'AI EFFECTUÉ LE PAIEMENT
  // ==========================================================

  const paymentDoneButton =
    document.getElementById(
      'paymentDoneButton'
    );

  if (paymentDoneButton) {

    paymentDoneButton.addEventListener(
      'click',
      () => {

        paymentDoneButton.disabled =
          true;

        paymentDoneButton.textContent =
          'Paiement déclaré ✓';

        const paymentDoneMessage =
          document.getElementById(
            'paymentDoneMessage'
          );

        if (paymentDoneMessage) {

          paymentDoneMessage.textContent =
            'Votre déclaration a été prise en compte. Votre commande reste en attente de vérification par NOA DIGIT TRADE.';

        }

      }
    );

  }

}


// ============================================================
// FIN APP.JS
// ============================================================
