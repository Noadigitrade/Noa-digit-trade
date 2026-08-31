// ==========================================
// NOA DIGIT TRADE
// SUPABASE AUTH + ORDERS + HISTORIQUE
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

// Achat : le client achète 1 USDT à 600 FCFA
const BUY_RATE = 600;

// Vente : le client vend 1 USDT à 570 FCFA
const SELL_RATE = 570;


// ==========================================
// MINIMUM
// ==========================================

const MIN_FCFA = 2000;


// ==========================================
// FRAIS RÉSEAU
// ==========================================

const NETWORK_FEES = {

  BEP20: 0,

  TRC20: 2,

  ERC20: 2.5

};


// ==========================================
// INITIALISATION SUPABASE
// ==========================================

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

    console.log(
      'Noa Digit Trade démarré.'
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


// ==========================================
// VÉRIFIER LA SESSION
// ==========================================

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


// ==========================================
// SURVEILLER LES CHANGEMENTS
// ==========================================

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    updateLoginButton(
      session
    );

  }
);


// ==========================================
// BOUTON CONNEXION / MON COMPTE
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
// ONGLET ACHETER / VENDRE
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
// CALCUL
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

  updateCalculation();

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
              button.dataset.payment;

          }

        }
      );

    }
  );

}


// ==========================================
// RÉCUPÉRER LES FRAIS
// ==========================================

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


// ==========================================
// ADAPTER L'AFFICHAGE
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
        `Taux d'achat : 1 USDT = ${BUY_RATE.toLocaleString('fr-FR')} FCFA`;

    }


    updateCalculation();

    return;

  }


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
      `Taux de vente : 1 USDT = ${SELL_RATE.toLocaleString('fr-FR')} FCFA`;

  }


  updateCalculation();

}


// ==========================================
// CALCULER LE MONTANT
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


  const fee =
    getNetworkFee();


  // ========================================
  // AUCUN MONTANT
  // ========================================

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
          : 'Montant minimum équivalent : 2 000 FCFA';

    }


    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau : ${formatNumber(fee, 2)} USDT`;

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
        grossUSDT - fee,
        0
      );


    resultAmount.textContent =
      `${formatNumber(netUSDT, 6)} USDT`;


    if (resultDetail) {

      resultDetail.textContent =
        `${formatNumber(value, 0)} FCFA ÷ ${BUY_RATE} = ${formatNumber(grossUSDT, 6)} USDT brut`;

    }


    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau ${getNetworkName()} : ${formatNumber(fee, 2)} USDT`;

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
      `${formatNumber(usdtAmount, 6)} USDT × ${SELL_RATE} = ${formatNumber(grossFCFA, 0)} FCFA brut`;

  }


  if (feeDetail) {

    feeDetail.textContent =
      `Frais réseau ${getNetworkName()} : ${formatNumber(fee, 2)} USDT (${formatNumber(feeFCFA, 0)} FCFA)`;

  }


  if (netDetail) {

    netDetail.textContent =
      `Montant net reçu : ${formatNumber(netFCFA, 0)} FCFA`;

  }

}


// ==========================================
// NOM DU RÉSEAU
// ==========================================

function getNetworkName() {

  const networkInput =
    document.getElementById(
      'network'
    );


  if (!networkInput) {

    return 'BEP20';

  }


  return networkInput.value;

}


// ==========================================
// FORMAT NOMBRE
// ==========================================

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


// ==========================================
// FORMAT DATE
// ==========================================

function formatOrderDate(dateValue) {

  if (!dateValue) {

    return 'Date inconnue';

  }


  const date =
    new Date(
      dateValue
    );


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
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit'

    }
  );

}


// ==========================================
// TEXTE DU STATUT
// ==========================================

function getStatusLabel(status) {

  const statuses = {

    pending:
      'En attente',

    processing:
      'En cours',

    completed:
      'Terminée',

    cancelled:
      'Annulée',

    canceled:
      'Annulée',

    rejected:
      'Refusée'

  };


  return (
    statuses[status] ||
    status ||
    'En attente'
  );

}


// ==========================================
// CLASSE DU STATUT
// ==========================================

function getStatusClass(status) {

  const value =
    String(
      status || 'pending'
    ).toLowerCase();


  if (
    value === 'completed'
  ) {

    return 'completed';

  }


  if (
    value === 'processing'
  ) {

    return 'processing';

  }


  if (
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'rejected'
  ) {

    return 'cancelled';

  }


  return 'pending';

}


// ==========================================
// OUVRIR AUTH
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

    console.error(
      'Fenêtre authModal introuvable.'
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


// ==========================================
// FERMER AUTH
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


  if (closeAuth) {

    closeAuth.addEventListener(
      'click',
      closeAuthModal
    );

  }


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


  if (loginSubmit) {

    loginSubmit.addEventListener(
      'click',
      loginUser
    );

  }


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


    if (
      data.user &&
      !data.session
    ) {

      message.textContent =
        'Compte créé. Vérifiez votre email pour confirmer votre compte.';

      return;

    }


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
// CRÉER LE PROFIL USERS
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


// ==========================================
// RÉCUPÉRER L'ID DU PROFIL
// ==========================================

async function getCurrentProfileId(user) {

  if (
    !user ||
    !user.id
  ) {

    throw new Error(
      'Utilisateur invalide.'
    );

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from('Users')
      .select('id')
      .eq(
        'auth_id',
        user.id
      )
      .limit(1);


  if (error) {

    throw error;

  }


  if (
    data &&
    data.length > 0
  ) {

    return data[0].id;

  }


  const profile =
    await createUserProfile(
      user
    );


  return profile.id;

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
      max-width:520px;
      max-height:90vh;
      overflow-y:auto;
      background:white;
      color:#101828;
      border-radius:22px;
      padding:28px;
      box-shadow:0 20px 50px rgba(0,0,0,.25);
    ">

      <h2 style="
        margin-top:0;
        margin-bottom:20px;
        font-size:30px;
      ">
        Mon compte
      </h2>

      <div style="
        padding:16px;
        background:#f8fafc;
        border-radius:14px;
        margin-bottom:24px;
      ">

        <strong>Email</strong>

        <div style="
          margin-top:6px;
          word-break:break-word;
        ">
          ${escapeHtml(user.email || '')}
        </div>

      </div>


      <!-- HISTORIQUE -->

      <div style="
        border-top:1px solid #e5e7eb;
        padding-top:22px;
      ">

        <h3 style="
          margin:0 0 15px;
          font-size:23px;
        ">
          📋 Historique des commandes
        </h3>


        <div id="orderHistory">

          <div style="
            text-align:center;
            padding:20px;
            color:#667085;
          ">
            Chargement de vos commandes...
          </div>

        </div>

      </div>


      <button
        id="logoutButton"
        type="button"
        class="primary full"
        style="margin-top:24px;">

        Se déconnecter

      </button>


      <button
        id="closeAccountButton"
        type="button"
        style="
          width:100%;
          margin-top:10px;
          padding:13px;
          border:1px solid #d0d5dd;
          border-radius:10px;
          background:white;
          cursor:pointer;
        ">

        Fermer

      </button>


      <p
        id="accountMessage"
        style="line-height:1.5;">
      </p>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // ========================================
  // FERMER
  // ========================================

  document
    .getElementById(
      'closeAccountButton'
    )
    .addEventListener(
      'click',
      () => {

        modal.remove();

      }
    );


  // ========================================
  // CLIQUER EXTÉRIEUR
  // ========================================

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


  // ========================================
  // DÉCONNEXION
  // ========================================

  document
    .getElementById(
      'logoutButton'
    )
    .addEventListener(
      'click',
      async () => {

        const button =
          document.getElementById(
            'logoutButton'
          );


        button.disabled =
          true;


        button.textContent =
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


          button.disabled =
            false;


          button.textContent =
            'Se déconnecter';


          return;

        }


        modal.remove();

      }
    );


  // ========================================
  // CHARGER HISTORIQUE
  // ========================================

  await loadOrderHistory(
    user
  );

}


// ==========================================
// HISTORIQUE DES COMMANDES
// ==========================================

async function loadOrderHistory(user) {

  const history =
    document.getElementById(
      'orderHistory'
    );


  if (!history) {

    return;

  }


  history.innerHTML = `

    <div style="
      text-align:center;
      padding:20px;
      color:#667085;
    ">
      Chargement...
    </div>

  `;


  try {

    // --------------------------------------
    // RÉCUPÉRER LE PROFIL
    // --------------------------------------

    const userId =
      await getCurrentProfileId(
        user
      );


    // --------------------------------------
    // RÉCUPÉRER LES COMMANDES
    // --------------------------------------

    const {
      data: orders,
      error
    } =
      await supabaseClient
        .from('orders')
        .select(`
          id,
          type,
          crypto_amount,
          fiat_amount,
          rate,
          network,
          network_fee,
          payment_method,
          wallet_address,
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


    if (error) {

      throw error;

    }


    // --------------------------------------
    // AUCUNE COMMANDE
    // --------------------------------------

    if (
      !orders ||
      orders.length === 0
    ) {

      history.innerHTML = `

        <div style="
          padding:22px;
          background:#f8fafc;
          border-radius:16px;
          text-align:center;
          color:#667085;
          line-height:1.6;
        ">

          Vous n'avez encore aucune commande.

        </div>

      `;

      return;

    }


    // --------------------------------------
    // AFFICHER COMMANDES
    // --------------------------------------

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
      'Erreur historique :',
      error
    );


    history.innerHTML = `

      <div style="
        padding:18px;
        background:#fff4f4;
        border:1px solid #f3b5b5;
        border-radius:16px;
        color:#b42318;
        line-height:1.6;
      ">

        Impossible de charger
        l'historique des commandes.

        <br><br>

        ${escapeHtml(error.message || '')}

      </div>

    `;

  }

}


// ==========================================
// CARTE D'UNE COMMANDE
// ==========================================

function createOrderHistoryCard(order) {

  const isBuy =
    order.type === 'buy';


  const typeText =
    isBuy
      ? 'ACHAT'
      : 'VENTE';


  const typeIcon =
    isBuy
      ? '🟢'
      : '🔵';


  const status =
    order.status ||
    'pending';


  const statusText =
    getStatusLabel(
      status
    );


  const statusClass =
    getStatusClass(
      status
    );


  const cryptoAmount =
    Number(
      order.crypto_amount || 0
    );


  const fiatAmount =
    Number(
      order.fiat_amount || 0
    );


  const networkFee =
    Number(
      order.network_fee || 0
    );


  const network =
    order.network ||
    'BEP20';


  const payment =
    order.payment_method ||
    'Non indiqué';


  const rate =
    Number(
      order.rate || 0
    );


  const date =
    formatOrderDate(
      order.created_at
    );


  let mainAmount;


  if (isBuy) {

    mainAmount =
      `${formatNumber(fiatAmount, 0)} FCFA → ${formatNumber(cryptoAmount, 6)} USDT`;

  } else {

    mainAmount =
      `${formatNumber(cryptoAmount, 6)} USDT → ${formatNumber(fiatAmount, 0)} FCFA`;

  }


  return `

    <div style="
      background:white;
      border:1px solid #e5e7eb;
      border-radius:18px;
      padding:18px;
      margin-bottom:14px;
      box-shadow:0 4px 12px rgba(16,24,40,.05);
    ">


      <!-- TYPE + STATUT -->

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        flex-wrap:wrap;
        margin-bottom:13px;
      ">

        <strong style="
          font-size:17px;
        ">

          ${typeIcon}
          ${typeText}

        </strong>


        <span style="
          display:inline-block;
          padding:6px 10px;
          border-radius:20px;
          font-size:13px;
          font-weight:600;
          ${getStatusStyle(statusClass)}
        ">

          ${escapeHtml(statusText)}

        </span>

      </div>


      <!-- MONTANT -->

      <div style="
        font-size:19px;
        font-weight:600;
        margin-bottom:14px;
      ">

        ${mainAmount}

      </div>


      <!-- DÉTAILS -->

      <div style="
        color:#667085;
        font-size:14px;
        line-height:1.8;
      ">

        <div>
          🌐 Réseau :
          <strong>${escapeHtml(network)}</strong>
        </div>

        <div>
          💸 Frais réseau :
          <strong>${formatNumber(networkFee, 2)} USDT</strong>
        </div>

        <div>
          📱 Paiement :
          <strong>${escapeHtml(payment)}</strong>
        </div>

        <div>
          💱 Taux :
          <strong>${formatNumber(rate, 2)} FCFA</strong>
        </div>

        <div>
          📅 ${escapeHtml(date)}
        </div>

      </div>


      <!-- ID -->

      <div style="
        margin-top:13px;
        padding-top:12px;
        border-top:1px solid #f0f1f3;
        color:#98a2b3;
        font-size:12px;
        word-break:break-all;
      ">

        Commande :
        ${escapeHtml(String(order.id))}

      </div>

    </div>

  `;

}


// ==========================================
// STYLE STATUT
// ==========================================

function getStatusStyle(statusClass) {

  if (
    statusClass === 'completed'
  ) {

    return `
      background:#ecfdf3;
      color:#027a48;
    `;

  }


  if (
    statusClass === 'processing'
  ) {

    return `
      background:#eff8ff;
      color:#175cd3;
    `;

  }


  if (
    statusClass === 'cancelled'
  ) {

    return `
      background:#fef3f2;
      color:#b42318;
    `;

  }


  return `
    background:#fffaeb;
    color:#b54708;
  `;

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


  const paymentMethod =
    paymentInput
      ? paymentInput.value
      : 'Orange Money';


  message.textContent =
    '';


  // ========================================
  // VALIDATION
  // ========================================

  if (!amount || !wallet) {

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


  // ========================================
  // CALCUL
  // ========================================

  let cryptoAmount;

  let fiatAmount;

  let rate;

  let networkFee;


  networkFee =
    getNetworkFee();


  if (type === 'buy') {

    fiatAmount =
      numericAmount;


    rate =
      BUY_RATE;


    cryptoAmount =
      numericAmount / BUY_RATE;


    // Frais réseau déduits
    cryptoAmount =
      Math.max(
        cryptoAmount - networkFee,
        0
      );


    // Minimum 2 000 FCFA
    if (
      fiatAmount < MIN_FCFA
    ) {

      message.textContent =
        `Le montant minimum d'achat est de ${formatNumber(MIN_FCFA, 0)} FCFA.`;

      return;

    }


    if (
      cryptoAmount <= 0
    ) {

      message.textContent =
        'Le montant est insuffisant pour couvrir les frais du réseau sélectionné.';

      return;

    }

  } else {

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


    // Minimum de 2 000 FCFA
    if (
      grossFiat < MIN_FCFA
    ) {

      const minimumUSDT =
        MIN_FCFA / SELL_RATE;


      message.textContent =
        `Le montant minimum de vente est de ${formatNumber(minimumUSDT, 6)} USDT (soit au moins ${formatNumber(MIN_FCFA, 0)} FCFA).`;

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
  // DÉSACTIVER
  // ========================================

  submit.disabled =
    true;


  submit.textContent =
    'Envoi en cours...';


  try {

    // ======================================
    // PROFIL
    // ======================================

    const userId =
      await getCurrentProfileId(
        user
      );


    // ======================================
    // CRÉER LA COMMANDE
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

          crypto_amount:
            cryptoAmount,

          fiat_amount:
            fiatAmount,

          rate:
            rate,

          network:
            network,

          network_fee:
            networkFee,

          payment_method:
            paymentMethod,

          wallet_address:
            wallet,

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
    // MESSAGE
    // ======================================

    if (type === 'buy') {

      message.textContent =
        `Demande d’achat envoyée : ${formatNumber(cryptoAmount, 6)} USDT nets pour ${formatNumber(fiatAmount, 0)} FCFA. Réseau : ${network}. Frais : ${formatNumber(networkFee, 2)} USDT. Paiement : ${paymentMethod}.`;

    } else {

      message.textContent =
        `Demande de vente envoyée : ${formatNumber(cryptoAmount, 6)} USDT pour ${formatNumber(fiatAmount, 0)} FCFA nets. Réseau : ${network}. Frais : ${formatNumber(networkFee, 2)} USDT. Paiement : ${paymentMethod}.`;

    }


    // ======================================
    // NETTOYAGE
    // ======================================

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
