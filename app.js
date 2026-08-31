// ============================================================
// NOA DIGIT TRADE
// SUPABASE AUTH + ORDERS + HISTORIQUE
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
              button.dataset.payment || '';

          }

        }
      );

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
    !
