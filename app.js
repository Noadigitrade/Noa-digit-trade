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

// Achat : client achète 1 USDT à 600 FCFA
const BUY_RATE = 600;

// Vente : client vend 1 USDT à 570 FCFA
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
// SESSION
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
// CHANGEMENT AUTH
// ==========================================

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    updateLoginButton(
      session
    );

  }
);


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
            button.dataset.type;


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
// CHANGEMENT RÉSEAU
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
// FRAIS RÉSEAU
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
// MODE DE CALCUL
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
        `Taux d'achat : 1 USDT = ${formatNumber(BUY_RATE, 0)} FCFA`;

    }

  } else {

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

  }


  updateCalculation();

}


// ==========================================
// CALCULER
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
          ? 'Montant minimum : 2 000 FCFA'
          : 'Montant minimum équivalent : 2 000 FCFA';

    }


    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau ${getNetworkName()} : ${formatNumber(fee, 2)} USDT`;

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
// NOM RÉSEAU
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
// FORMATAGE
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
// AUTH MODAL
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
// CONNEXION
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

        email,
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


    if (
      data.user &&
      !data.session
    ) {

      message.textContent =
        'Compte créé. Vérifiez votre email pour confirmer votre compte.';

      return;

    }


    if (data.user) {

      await createUserProfile(
        data.user
      );

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
// PROFIL UTILISATEUR
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
    existingUsers.length
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
// MON COMPTE + HISTORIQUE
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
      border-radius:24px;
      padding:28px;
      box-shadow:0 20px 50px rgba(0,0,0,.25);
    ">

      <h2 style="
        margin-top:0;
        margin-bottom:18px;
      ">
        Mon compte
      </h2>


      <p style="
        line-height:1.6;
        margin-bottom:24px;
      ">

        <strong>Email :</strong><br>

        ${escapeHtml(
          user.email || ''
        )}

      </p>


      <h3 style="
        margin-bottom:14px;
      ">
        Mes demandes
      </h3>


      <div id="orderHistory">

        <p style="
          color:#667085;
        ">
          Chargement de votre historique...
        </p>

      </div>


      <button
        id="logoutButton"
        type="button"
        class="primary full"
        style="
          width:100%;
          margin-top:20px;
          padding:15px;
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
          margin-top:12px;
        ">
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
  // EXTÉRIEUR
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
// CHARGER HISTORIQUE DES COMMANDES
// ==========================================

async function loadOrderHistory(user) {

  const container =
    document.getElementById(
      'orderHistory'
    );


  if (!container) {

    return;

  }


  try {

    // --------------------------------------
    // RÉCUPÉRER LE PROFIL
    // --------------------------------------

    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient
        .from('Users')
        .select('id')
        .eq(
          'auth_id',
          user.id
        )
        .limit(1)
        .maybeSingle();


    if (profileError) {

      throw profileError;

    }


    if (!profile) {

      container.innerHTML = `

        <div style="
          padding:15px;
          border-radius:12px;
          background:#f8f9fb;
          color:#667085;
        ">
          Aucune commande trouvée.
        </div>

      `;

      return;

    }


    // --------------------------------------
    // RÉCUPÉRER LES COMMANDES
    // --------------------------------------

    const {
      data: orders,
      error: ordersError
    } =
      await supabaseClient
        .from('orders')
        .select(`
          id,
          created_at,
          user_id,
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
          profile.id
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


    // --------------------------------------
    // AUCUNE COMMANDE
    // --------------------------------------

    if (
      !orders ||
      orders.length === 0
    ) {

      container.innerHTML = `

        <div style="
          padding:18px;
          border-radius:14px;
          background:#f8f9fb;
          color:#667085;
          text-align:center;
        ">
          Vous n'avez encore aucune demande.
        </div>

      `;

      return;

    }


    // --------------------------------------
    // AFFICHER COMMANDES
    // --------------------------------------

    container.innerHTML =
      orders
        .map(
          order =>
            renderOrderCard(
              order
            )
        )
        .join('');

  } catch (error) {

    console.error(
      'Erreur historique :',
      error
    );


    container.innerHTML = `

      <div style="
        padding:15px;
        border-radius:12px;
        background:#fff4f4;
        color:#b42318;
      ">
        Impossible de charger votre historique.
        <br><br>
        ${escapeHtml(
          error.message || ''
        )}
      </div>

    `;

  }

}


// ==========================================
// AFFICHER UNE COMMANDE
// ==========================================

function renderOrderCard(order) {

  const isBuy =
    order.type === 'buy';


  const typeLabel =
    isBuy
      ? 'Achat USDT'
      : 'Vente USDT';


  const statusLabel =
    getStatusLabel(
      order.status
    );


  const statusColor =
    getStatusColor(
      order.status
    );


  const date =
    formatDate(
      order.created_at
    );


  const fiat =
    formatNumber(
      Number(
        order.fiat_amount || 0
      ),
      0
    );


  const crypto =
    formatNumber(
      Number(
        order.crypto_amount || 0
      ),
      6
    );


  const rate =
    formatNumber(
      Number(
        order.rate || 0
      ),
      2
    );


  const fee =
    formatNumber(
      Number(
        order.fee || 0
      ),
      2
    );


  const network =
    order.network ||
    'Non renseigné';


  const payment =
    order.payment_method ||
    'Non renseigné';


  const wallet =
    order.wallet_address ||
    'Non renseigné';


  return `

    <div style="
      border:1px solid #e4e7ec;
      border-radius:16px;
      padding:18px;
      margin-bottom:15px;
      background:#ffffff;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        margin-bottom:15px;
      ">

        <strong style="
          font-size:18px;
        ">
          ${typeLabel}
        </strong>


        <span style="
          background:${statusColor.background};
          color:${statusColor.color};
          padding:6px 10px;
          border-radius:20px;
          font-size:13px;
          font-weight:600;
        ">
          ${statusLabel}
        </span>

      </div>


      <div style="
        line-height:1.75;
        font-size:14px;
      ">

        <div>
          <strong>Montant USDT :</strong>
          ${crypto} USDT
        </div>


        <div>
          <strong>Montant FCFA :</strong>
          ${fiat} FCFA
        </div>


        <div>
          <strong>Taux :</strong>
          1 USDT = ${rate} FCFA
        </div>


        <div>
          <strong>Frais réseau :</strong>
          ${fee} USDT
        </div>


        <div>
          <strong>Réseau :</strong>
          ${escapeHtml(network)}
        </div>


        <div>
          <strong>Moyen de paiement :</strong>
          ${escapeHtml(payment)}
        </div>


        <div style="
          word-break:break-all;
        ">
          <strong>Portefeuille :</strong>
          ${escapeHtml(wallet)}
        </div>


        <div>
          <strong>Date :</strong>
          ${date}
        </div>

      </div>

    </div>

  `;

}


// ==========================================
// STATUT
// ==========================================

function getStatusLabel(status) {

  switch (
    String(status || '').toLowerCase()
  ) {

    case 'pending':
      return 'En attente';

    case 'processing':
      return 'En traitement';

    case 'completed':
      return 'Terminée';

    case 'approved':
      return 'Approuvée';

    case 'cancelled':
      return 'Annulée';

    case 'rejected':
      return 'Refusée';

    default:
      return status
        ? String(status)
        : 'En attente';

  }

}


// ==========================================
// COULEURS STATUT
// ==========================================

function getStatusColor(status) {

  switch (
    String(status || '').toLowerCase()
  ) {

    case 'completed':
    case 'approved':

      return {

        background:
          '#ecfdf3',

        color:
          '#027a48'

      };


    case 'cancelled':
    case 'rejected':

      return {

        background:
          '#fef3f2',

        color:
          '#b42318'

      };


    case 'processing':

      return {

        background:
          '#eff8ff',

        color:
          '#175cd3'

      };


    default:

      return {

        background:
          '#fffaeb',

        color:
          '#b54708'

      };

  }

}


// ==========================================
// DATE
// ==========================================

function formatDate(value) {

  if (!value) {

    return 'Date inconnue';

  }


  const date =
    new Date(
      value
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

    return;

  }


  submit.addEventListener(
    'click',
    sendOrder
  );

}


// ==========================================
// ENVOYER COMMANDE
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

    return;

  }


  const numericAmount =
    Number(
      amountInput.value
    );


  const wallet =
    walletInput.value.trim();


  const network =
    networkInput.value;


  const paymentMethod =
    paymentInput
      ? paymentInput.value
      : 'Orange Money';


  const networkFee =
    getNetworkFee();


  message.textContent =
    '';


  // ========================================
  // VALIDATION
  // ========================================

  if (
    !wallet ||
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {

    message.textContent =
      'Veuillez saisir un montant valide et votre adresse USDT.';

    return;

  }


  let cryptoAmount;

  let fiatAmount;

  let rate;


  // ========================================
  // ACHAT
  // ========================================

  if (type === 'buy') {

    fiatAmount =
      numericAmount;


    rate =
      BUY_RATE;


    if (
      fiatAmount < MIN_FCFA
    ) {

      message.textContent =
        `Le montant minimum d'achat est de ${formatNumber(MIN_FCFA, 0)} FCFA.`;

      return;

    }


    const grossUSDT =
      fiatAmount / BUY_RATE;


    cryptoAmount =
      grossUSDT - networkFee;


    if (
      cryptoAmount <= 0
    ) {

      message.textContent =
        'Le montant est insuffisant pour couvrir les frais du réseau.';

      return;

    }

  }


  // ========================================
  // VENTE
  // ========================================

  else {

    cryptoAmount =
      numericAmount;


    rate =
      SELL_RATE;


    const grossFCFA =
      cryptoAmount * SELL_RATE;


    if (
      grossFCFA < MIN_FCFA
    ) {

      const minimumUSDT =
        MIN_FCFA / SELL_RATE;


      message.textContent =
        `Le montant minimum de vente est de ${formatNumber(minimumUSDT, 6)} USDT.`;

      return;

    }


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
  // UTILISATEUR
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
      'Erreur utilisateur :',
      error
    );


    message.textContent =
      'Impossible de vérifier votre connexion.';

    return;

  }


  submit.disabled =
    true;


  submit.textContent =
    'Envoi en cours...';


  try {

    // ======================================
    // PROFIL
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

      throw userError;

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
    // CRÉATION COMMANDE
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

          // IMPORTANT :
          // La table orders utilise "fee"
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

      throw orderError;

    }


    console.log(
      'Commande créée :',
      order
    );


    // ======================================
    // SUCCÈS
    // ======================================

    if (type === 'buy') {

      message.textContent =
        `Demande d’achat envoyée : ${formatNumber(cryptoAmount, 6)} USDT nets pour ${formatNumber(fiatAmount, 0)} FCFA.`;

    } else {

      message.textContent =
        `Demande de vente envoyée : ${formatNumber(cryptoAmount, 6)} USDT pour ${formatNumber(fiatAmount, 0)} FCFA nets.`;

    }


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
