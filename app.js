// ==========================================
// NOA DIGIT TRADE
// SUPABASE AUTH + ORDERS
// ACHAT / VENTE + PAIEMENT MOBILE
// FRAIS RÉSEAU + MINIMUM 2 000 FCFA
// ==========================================


// ==========================================
// CONFIGURATION SUPABASE
// ==========================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ==========================================
// TAUX
// ==========================================

// Achat : 1 USDT = 600 FCFA
const BUY_RATE = 600;

// Vente : 1 USDT = 570 FCFA
const SELL_RATE = 570;


// ==========================================
// MONTANTS MINIMUMS
// ==========================================

// Minimum pour chaque opération
const MIN_FIAT_AMOUNT = 2000;

// Minimum USDT pour une vente
const MIN_SELL_USDT =
  MIN_FIAT_AMOUNT / SELL_RATE;


// ==========================================
// FRAIS RÉSEAU
// ==========================================

// Frais fixes en USDT
const NETWORK_FEES = {

  BEP20: 0,

  TRC20: 2,

  ERC20: 2.5

};


// ==========================================
// RÉSEAUX AUTORISÉS
// ==========================================

const ALLOWED_NETWORKS = [
  'BEP20',
  'TRC20',
  'ERC20'
];


// ==========================================
// MOYENS DE PAIEMENT AUTORISÉS
// ==========================================

const ALLOWED_PAYMENT_METHODS = [
  'Orange Money',
  'Moov Money'
];


// ==========================================
// INITIALISATION SUPABASE
// ==========================================

let supabaseClient = null;


if (
  window.supabase &&
  typeof window.supabase.createClient === 'function'
) {

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

  console.log(
    'Supabase JS chargé correctement.'
  );

} else {

  console.error(
    'Supabase JS n’a pas été chargé.'
  );

}


// ==========================================
// VARIABLES GLOBALES
// ==========================================

let type = 'buy';


// ==========================================
// PAGE CHARGÉE
// ==========================================

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log(
      'Noa Digit Trade démarré.'
    );


    setupTabs();

    setupStartButton();

    setupAuth();

    setupSubmitButton();

    setupCalculation();

    setupNetworkChange();

    setupPaymentMethods();

    setupPasswordButtons();

    if (supabaseClient) {

      await checkSession();

    }

  }
);


// ==========================================
// VÉRIFICATION SESSION
// ==========================================

async function checkSession() {

  if (!supabaseClient) {

    updateLoginButton(null);

    return;

  }


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


// ==========================================
// SURVEILLER AUTHENTIFICATION
// ==========================================

if (supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    (_event, session) => {

      updateLoginButton(
        session
      );

    }
  );

}


// ==========================================
// BOUTON MON COMPTE
// ==========================================

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


// ==========================================
// ONGLET ACHAT / VENTE
// ==========================================

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
            button.dataset.type === 'sell'
              ? 'sell'
              : 'buy';


          updateCalculationMode();

        }
      );

    }
  );

}


// ==========================================
// BOUTON COMMENCER
// ==========================================

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


// ==========================================
// CALCUL INITIAL
// ==========================================

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

}


// ==========================================
// CHANGEMENT DE RÉSEAU
// ==========================================

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


// ==========================================
// MOYENS DE PAIEMENT
// ==========================================

function setupPaymentMethods() {

  const inputs =
    document.querySelectorAll(
      'input[name="payment_method"]'
    );


  inputs.forEach(
    input => {

      input.addEventListener(
        'change',
        () => {

          document
            .querySelectorAll(
              '.payment-option'
            )
            .forEach(
              option => {

                option.classList.remove(
                  'active'
                );

              }
            );


          const parent =
            input.closest(
              '.payment-option'
            );


          if (parent) {

            parent.classList.add(
              'active'
            );

          }

        }
      );

    }
  );

}


// ==========================================
// BOUTONS AFFICHER / MASQUER MOT DE PASSE
// ==========================================

function setupPasswordButtons() {

  const buttons =
    document.querySelectorAll(
      '.show-password'
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          const target =
            button.dataset.target;


          const input =
            document.getElementById(
              target
            );


          if (!input) {

            return;

          }


          if (
            input.type === 'password'
          ) {

            input.type =
              'text';

            button.textContent =
              'Masquer';

          } else {

            input.type =
              'password';

            button.textContent =
              'Afficher';

          }

        }
      );

    }
  );

}


// ==========================================
// RÉCUPÉRER LE RÉSEAU
// ==========================================

function getNetwork() {

  const input =
    document.getElementById(
      'network'
    );


  if (!input) {

    return 'BEP20';

  }


  return input.value;

}


// ==========================================
// RÉCUPÉRER LES FRAIS RÉSEAU
// ==========================================

function getNetworkFee() {

  const network =
    getNetwork();


  return (
    NETWORK_FEES[network] ?? 0
  );

}


// ==========================================
// NOM RÉSEAU
// ==========================================

function getNetworkName() {

  return getNetwork();

}


// ==========================================
// ADAPTER L'AFFICHAGE ACHAT / VENTE
// ==========================================

function updateCalculationMode() {

  const amountInput =
    document.getElementById(
      'amount'
    );


  const amountLabel =
    document.getElementById(
      'amountLabel'
    );


  const calculation =
    document.getElementById(
      'calculation'
    );


  const rateText =
    document.getElementById(
      'rateText'
    );


  const minAmountText =
    document.getElementById(
      'minAmountText'
    );


  if (!amountInput) {

    return;

  }


  if (type === 'buy') {

    // ======================================
    // ACHAT
    // ======================================

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à payer (FCFA)';

    }


    amountInput.placeholder =
      'Ex. 10000';


    amountInput.min =
      String(
        MIN_FIAT_AMOUNT
      );


    if (rateText) {

      rateText.textContent =
        `Taux d'achat : 1 USDT = ${formatNumber(BUY_RATE, 0)} FCFA`;

    }


    if (minAmountText) {

      minAmountText.textContent =
        `Montant minimum : ${formatNumber(MIN_FIAT_AMOUNT, 0)} FCFA`;

    }


    if (calculation) {

      calculation.innerHTML = `

        <span>Vous recevrez</span>

        <strong id="resultAmount">
          0 USDT
        </strong>

        <small id="resultDetail">
          1 USDT = ${formatNumber(BUY_RATE, 0)} FCFA
        </small>

        <small
          id="feeDetail"
          style="display:block;margin-top:8px;">
          Frais réseau : 0 USDT
        </small>

        <small
          id="netDetail"
          style="display:block;margin-top:4px;">
          Montant net reçu : 0 USDT
        </small>

      `;

    }

  } else {

    // ======================================
    // VENTE
    // ======================================

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à vendre (USDT)';

    }


    amountInput.placeholder =
      'Ex. 10';


    amountInput.min =
      String(
        MIN_SELL_USDT
      );


    if (rateText) {

      rateText.textContent =
        `Taux de vente : 1 USDT = ${formatNumber(SELL_RATE, 0)} FCFA`;

    }


    if (minAmountText) {

      minAmountText.textContent =
        `Minimum : ${formatNumber(MIN_SELL_USDT, 6)} USDT (soit ${formatNumber(MIN_FIAT_AMOUNT, 0)} FCFA)`;

    }


    if (calculation) {

      calculation.innerHTML = `

        <span>Vous recevrez</span>

        <strong id="resultAmount">
          0 FCFA
        </strong>

        <small id="resultDetail">
          1 USDT = ${formatNumber(SELL_RATE, 0)} FCFA
        </small>

        <small
          id="feeDetail"
          style="display:block;margin-top:8px;">
          Frais réseau : 0 USDT
        </small>

        <small
          id="netDetail"
          style="display:block;margin-top:4px;">
          Montant net : 0 FCFA
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


  const networkFee =
    getNetworkFee();


  // ========================================
  // MONTANT VIDE
  // ========================================

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    resultAmount.textContent =
      type === 'buy'
        ? '0 USDT'
        : '0 FCFA';


    if (resultDetail) {

      resultDetail.textContent =
        type === 'buy'
          ? `1 USDT = ${formatNumber(BUY_RATE, 0)} FCFA`
          : `1 USDT = ${formatNumber(SELL_RATE, 0)} FCFA`;

    }


    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau ${getNetworkName()} : ${formatNumber(networkFee, 2)} USDT`;

    }


    if (netDetail) {

      netDetail.textContent =
        type === 'buy'
          ? 'Montant net reçu : 0 USDT'
          : 'Montant net : 0 FCFA';

    }


    return;

  }


  // ========================================
  // ACHAT
  // ========================================

  if (type === 'buy') {

    const grossUSDT =
      value / BUY_RATE;


    const netUSDT =
      Math.max(
        grossUSDT - networkFee,
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
        `Frais réseau ${getNetworkName()} : ${formatNumber(networkFee, 2)} USDT`;

    }


    if (netDetail) {

      netDetail.textContent =
        `Montant net reçu : ${formatNumber(netUSDT, 6)} USDT`;

    }


    return;

  }


  // ========================================
  // VENTE
  // ========================================

  const usdtAmount =
    value;


  const grossFCFA =
    usdtAmount * SELL_RATE;


  const feeFCFA =
    networkFee * SELL_RATE;


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
      `Frais réseau ${getNetworkName()} : ${formatNumber(networkFee, 2)} USDT (${formatNumber(feeFCFA, 0)} FCFA)`;

  }


  if (netDetail) {

    netDetail.textContent =
      `Montant net reçu : ${formatNumber(netFCFA, 0)} FCFA`;

  }

}


// ==========================================
// FORMATAGE NOMBRE
// ==========================================

function formatNumber(
  value,
  maximumFractionDigits = 2
) {

  return Number(
    value
  ).toLocaleString(
    'fr-FR',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        maximumFractionDigits
    }
  );

}


// ==========================================
// OUVRIR AUTHENTIFICATION
// ==========================================

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


// ==========================================
// FERMER AUTHENTIFICATION
// ==========================================

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


// ==========================================
// CONFIGURATION AUTH
// ==========================================

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


  // ----------------------------------------
  // FERMER
  // ----------------------------------------

  if (closeAuth) {

    closeAuth.addEventListener(
      'click',
      closeAuthModal
    );

  }


  // ----------------------------------------
  // EXTÉRIEUR
  // ----------------------------------------

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


  // ----------------------------------------
  // INSCRIPTION
  // ----------------------------------------

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


  // ----------------------------------------
  // CONNEXION
  // ----------------------------------------

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


  // ----------------------------------------
  // CONNEXION
  // ----------------------------------------

  if (loginSubmit) {

    loginSubmit.addEventListener(
      'click',
      loginUser
    );

  }


  // ----------------------------------------
  // INSCRIPTION
  // ----------------------------------------

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


  if (!supabaseClient) {

    message.textContent =
      'Service de connexion indisponible.';

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

    button.disabled =
      false;


    button.textContent =
      'Se connecter';

  }

}


// ==========================================
// INSCRIPTION
// ==========================================

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


  if (password.length < 6) {

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


  if (!supabaseClient) {

    message.textContent =
      'Service d’inscription indisponible.';

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

        email,

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
      'Compte Auth créé :',
      data
    );


    // --------------------------------------
    // EMAIL À CONFIRMER
    // --------------------------------------

    if (
      data.user &&
      !data.session
    ) {

      message.textContent =
        'Compte créé. Vérifiez votre email pour confirmer votre compte.';

      passwordInput.value =
        '';

      confirmInput.value =
        '';

      return;

    }


    // --------------------------------------
    // SESSION IMMÉDIATE
    // --------------------------------------

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


// ==========================================
// CRÉER / RÉCUPÉRER PROFIL USERS
// ==========================================

async function createUserProfile(user) {

  if (
    !user ||
    !user.id
  ) {

    throw new Error(
      'Utilisateur Supabase invalide.'
    );

  }


  if (!supabaseClient) {

    throw new Error(
      'Supabase indisponible.'
    );

  }


  // ----------------------------------------
  // RECHERCHE PROFIL
  // ----------------------------------------

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


  // ----------------------------------------
  // CRÉATION PROFIL
  // ----------------------------------------

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
      .select('id')
      .single();


  if (insertError) {

    throw insertError;

  }


  return newUser;

}


// ==========================================
// MON COMPTE
// ==========================================

async function showAccountModal(user) {

  const oldModal =
    document.getElementById(
      'accountModal'
    );


  if (oldModal) {

    oldModal.remove();

  }


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
    overflow-y:auto;

  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:560px;
      max-height:92vh;
      overflow-y:auto;
      background:white;
      color:#101828;
      border-radius:24px;
      padding:28px;
      box-shadow:0 20px 50px rgba(0,0,0,.25);
    ">

      <h2 style="
        margin-top:0;
        font-size:32px;
      ">
        Mon compte
      </h2>

      <p>
        <strong>Email :</strong><br>
        ${escapeHtml(user.email || '')}
      </p>

      <div class="account-divider"></div>

      <h3 class="orders-title">
        Mes demandes
      </h3>

      <div id="ordersContainer">

        <p class="orders-empty">
          Chargement de vos demandes...
        </p>

      </div>

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
        class="close-btn">
        Fermer
      </button>

      <p id="accountMessage"></p>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // ----------------------------------------
  // FERMER
  // ----------------------------------------

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


  // ----------------------------------------
  // EXTÉRIEUR
  // ----------------------------------------

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


  // ----------------------------------------
  // DÉCONNEXION
  // ----------------------------------------

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


        if (!supabaseClient) {

          return;

        }


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


  await loadUserOrders(
    user
  );

}


// ==========================================
// CHARGER LES COMMANDES
// ==========================================

async function loadUserOrders(user) {

  const container =
    document.getElementById(
      'ordersContainer'
    );


  if (!container) {

    return;

  }


  if (!supabaseClient) {

    container.innerHTML = `

      <p class="orders-empty">
        Service indisponible.
      </p>

    `;

    return;

  }


  try {

    // --------------------------------------
    // PROFIL
    // --------------------------------------

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


    if (
      !users ||
      users.length === 0
    ) {

      container.innerHTML = `

        <p class="orders-empty">
          Aucune demande pour le moment.
        </p>

      `;

      return;

    }


    const userId =
      users[0].id;


    // --------------------------------------
    // COMMANDES
    // --------------------------------------

    const {
      data: orders,
      error: ordersError
    } =
      await supabaseClient
        .from('orders')
        .select(`
          id,
          type,
          crypto_amount,
          fiat_amount,
          rate,
          fee,
          network,
          wallet_address,
          payment_method,
          status,
          created_at
        `)
        .eq(
          'user_id',
          userId
        )
        .order(
          'created_at',
          {
            ascending:
              false
          }
        );


    if (ordersError) {

      throw ordersError;

    }


    if (
      !orders ||
      orders.length === 0
    ) {

      container.innerHTML = `

        <p class="orders-empty">
          Aucune demande pour le moment.
        </p>

      `;

      return;

    }


    container.innerHTML =
      orders
        .map(
          createOrderCard
        )
        .join('');


  } catch (error) {

    console.error(
      'Erreur chargement commandes :',
      error
    );


    container.innerHTML = `

      <p class="orders-empty">
        Impossible de charger vos demandes.
      </p>

    `;

  }

}


// ==========================================
// CARTE COMMANDE
// ==========================================

function createOrderCard(order) {

  const isBuy =
    order.type === 'buy';


  const typeLabel =
    isBuy
      ? 'Achat USDT'
      : 'Vente USDT';


  const status =
    formatStatus(
      order.status
    );


  const statusClass =
    getStatusClass(
      order.status
    );


  const cryptoAmount =
    formatNumber(
      order.crypto_amount,
      6
    );


  const fiatAmount =
    formatNumber(
      order.fiat_amount,
      0
    );


  const rate =
    formatNumber(
      order.rate,
      0
    );


  const fee =
    formatNumber(
      order.fee || 0,
      2
    );


  const paymentMethod =
    order.payment_method ||
    'Non renseigné';


  const network =
    order.network ||
    'Non renseigné';


  const wallet =
    order.wallet_address ||
    'Non renseignée';


  const date =
    formatDate(
      order.created_at
    );


  return `

    <div class="order-card">

      <div class="order-card-head">

        <div class="order-type">

          <span class="order-dot ${
            isBuy
              ? 'buy-dot'
              : 'sell-dot'
          }"></span>

          <strong>
            ${typeLabel}
          </strong>

        </div>

        <span class="status ${statusClass}">
          ${escapeHtml(status)}
        </span>

      </div>


      <div class="amount-grid">

        <div class="amount-box">

          <span>
            Montant USDT
          </span>

          <strong>
            ${cryptoAmount} USDT
          </strong>

        </div>


        <div class="amount-box">

          <span>
            Montant FCFA
          </span>

          <strong>
            ${fiatAmount} FCFA
          </strong>

        </div>

      </div>


      <div class="order-meta">

        <strong>
          Taux :
        </strong>

        1 USDT = ${rate} FCFA

      </div>


      <div class="order-meta">

        <strong>
          Frais réseau :
        </strong>

        ${fee} USDT

      </div>


      <div class="order-meta">

        <strong>
          Moyen de paiement :
        </strong>

        ${escapeHtml(
          paymentMethod
        )}

      </div>


      <div class="order-meta">

        <strong>
          Réseau :
        </strong>

        ${escapeHtml(
          network
        )}

      </div>


      <div class="order-meta">

        <strong>
          Portefeuille :
        </strong>

        ${escapeHtml(
          wallet
        )}

      </div>


      <div class="order-meta">

        <strong>
          Date :
        </strong>

        ${escapeHtml(
          date
        )}

      </div>

    </div>

  `;

}


// ==========================================
// STATUT
// ==========================================

function formatStatus(status) {

  const value =
    String(
      status || ''
    ).toLowerCase();


  if (
    value === 'pending'
  ) {

    return 'En attente';

  }


  if (
    value === 'approved' ||
    value === 'validated' ||
    value === 'completed'
  ) {

    return 'Validée';

  }


  if (
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'rejected'
  ) {

    return 'Annulée';

  }


  return status ||
    'En attente';

}


// ==========================================
// CLASSE STATUT
// ==========================================

function getStatusClass(status) {

  const value =
    String(
      status || ''
    ).toLowerCase();


  if (
    value === 'approved' ||
    value === 'validated' ||
    value === 'completed'
  ) {

    return 'approved';

  }


  if (
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'rejected'
  ) {

    return 'cancelled';

  }


  return '';

}


// ==========================================
// DATE
// ==========================================

function formatDate(value) {

  if (!value) {

    return 'Non renseignée';

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleString(
    'fr-FR',
    {
      dateStyle:
        'long',

      timeStyle:
        'short'
    }
  );

}


// ==========================================
// BOUTON ENVOI
// ==========================================

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


// ==========================================
// ENVOYER LA COMMANDE
// ==========================================

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


  // ========================================
  // EMPÊCHER DOUBLE ENVOI
  // ========================================

  if (submit.disabled) {

    return;

  }


  const amount =
    amountInput.value.trim();


  const wallet =
    walletInput.value.trim();


  const network =
    networkInput.value;


  const paymentInput =
    document.querySelector(
      'input[name="payment_method"]:checked'
    );


  const paymentMethod =
    paymentInput
      ? paymentInput.value
      : '';


  message.textContent =
    '';


  // ========================================
  // VÉRIFICATION SUPABASE
  // ========================================

  if (!supabaseClient) {

    message.textContent =
      'Le service est momentanément indisponible.';

    return;

  }


  // ========================================
  // CHAMPS OBLIGATOIRES
  // ========================================

  if (!amount) {

    message.textContent =
      'Veuillez indiquer un montant.';

    amountInput.focus();

    return;

  }


  if (!wallet) {

    message.textContent =
      'Veuillez indiquer votre adresse de portefeuille USDT.';

    walletInput.focus();

    return;

  }


  if (!paymentMethod) {

    message.textContent =
      'Veuillez choisir Orange Money ou Moov Money.';

    return;

  }


  // ========================================
  // VALIDATION RÉSEAU
  // ========================================

  if (
    !ALLOWED_NETWORKS.includes(
      network
    )
  ) {

    message.textContent =
      'Le réseau sélectionné n’est pas valide.';

    return;

  }


  // ========================================
  // VALIDATION PAIEMENT
  // ========================================

  if (
    !ALLOWED_PAYMENT_METHODS.includes(
      paymentMethod
    )
  ) {

    message.textContent =
      'Le moyen de paiement sélectionné n’est pas valide.';

    return;

  }


  // ========================================
  // VALIDATION MONTANT
  // ========================================

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


  // ========================================
  // CALCUL
  // ========================================

  let cryptoAmount;

  let fiatAmount;

  let rate;

  const networkFee =
    getNetworkFee();


  if (type === 'buy') {

    // ======================================
    // ACHAT
    // ======================================

    if (
      numericAmount < MIN_FIAT_AMOUNT
    ) {

      message.textContent =
        `Le montant minimum pour un achat est de ${formatNumber(MIN_FIAT_AMOUNT, 0)} FCFA.`;

      return;

    }


    fiatAmount =
      numericAmount;


    rate =
      BUY_RATE;


    const grossUSDT =
      numericAmount / BUY_RATE;


    cryptoAmount =
      grossUSDT - networkFee;


    if (
      cryptoAmount <= 0
    ) {

      message.textContent =
        'Le montant est insuffisant pour couvrir les frais du réseau sélectionné.';

      return;

    }

  } else {

    // ======================================
    // VENTE
    // ======================================

    if (
      numericAmount < MIN_SELL_USDT
    ) {

      message.textContent =
        `Le montant minimum pour une vente est de ${formatNumber(MIN_SELL_USDT, 6)} USDT, soit ${formatNumber(MIN_FIAT_AMOUNT, 0)} FCFA.`;

      return;

    }


    cryptoAmount =
      numericAmount;


    rate =
      SELL_RATE;


    const grossFCFA =
      numericAmount * SELL_RATE;


    const feeFCFA =
      networkFee * SELL_RATE;


    fiatAmount =
      Math.max(
        grossFCFA - feeFCFA,
        0
      );


    if (
      fiatAmount <= 0
    ) {

      message.textContent =
        'Le montant est insuffisant après déduction des frais réseau.';

      return;

    }

  }


  // ========================================
  // UTILISATEUR CONNECTÉ
  // ========================================

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


  // ========================================
  // DÉSACTIVER BOUTON
  // ========================================

  submit.disabled =
    true;


  submit.textContent =
    'Envoi en cours...';


  try {

    // ======================================
    // RÉCUPÉRER PROFIL
    // ======================================

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


    // ======================================
    // CRÉER COMMANDE
    // ======================================

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


    // ======================================
    // MESSAGE SUCCÈS
    // ======================================

    if (type === 'buy') {

      message.textContent =
        `Demande d’achat envoyée avec succès : ${formatNumber(cryptoAmount, 6)} USDT nets pour ${formatNumber(fiatAmount, 0)} FCFA. Réseau : ${network}. Frais : ${formatNumber(networkFee, 2)} USDT. Paiement : ${paymentMethod}.`;

    } else {

      message.textContent =
        `Demande de vente envoyée avec succès : ${formatNumber(cryptoAmount, 6)} USDT pour ${formatNumber(fiatAmount, 0)} FCFA nets. Réseau : ${network}. Frais : ${formatNumber(networkFee, 2)} USDT. Paiement : ${paymentMethod}.`;

    }


    // ======================================
    // NETTOYAGE
    // ======================================

    amountInput.value =
      '';

    walletInput.value =
      '';


    document
      .querySelectorAll(
        'input[name="payment_method"]'
      )
      .forEach(
        input => {

          input.checked =
            false;

        }
      );


    document
      .querySelectorAll(
        '.payment-option'
      )
      .forEach(
        option => {

          option.classList.remove(
            'active'
          );

        }
      );


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


// ==========================================
// PROTECTION HTML
// ==========================================

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
