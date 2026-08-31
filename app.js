// ==========================================
// NOA DIGIT TRADE
// SUPABASE AUTH + ORDERS
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

// Client ACHÈTE des USDT
// 1 USDT = 600 FCFA

const BUY_RATE = 600;


// Client VEND des USDT
// 1 USDT = 570 FCFA

const SELL_RATE = 570;


// ==========================================
// MONTANT MINIMUM
// ==========================================

// Minimum de l'opération : 2 000 FCFA

const MIN_FCFA_AMOUNT = 2000;


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
// VARIABLE TYPE
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

    await checkSession();

  }
);


// ==========================================
// VÉRIFIER SESSION
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
// SURVEILLER SESSION
// ==========================================

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    updateLoginButton(session);

  }
);


// ==========================================
// BOUTON CONNEXION / COMPTE
// ==========================================

function updateLoginButton(session) {

  const login =
    document.getElementById('login');


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
    document.querySelectorAll('.tab');


  tabs.forEach(button => {

    button.addEventListener(
      'click',
      () => {

        tabs.forEach(item => {

          item.classList.remove(
            'active'
          );

        });


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

  });

}


// ==========================================
// BOUTON COMMENCER
// ==========================================

function setupStartButton() {

  const start =
    document.getElementById('start');


  if (!start) {
    return;
  }


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
// CALCUL EN TEMPS RÉEL
// ==========================================

function setupCalculation() {

  const amountInput =
    document.getElementById('amount');


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
// ADAPTER LE FORMULAIRE
// ==========================================

function updateCalculationMode() {

  const amountInput =
    document.getElementById('amount');


  const amountLabel =
    document.getElementById('amountLabel');


  const walletLabel =
    document.getElementById('walletLabel');


  const calculation =
    document.getElementById('calculation');


  const rateText =
    document.getElementById('rateText');


  if (!amountInput) {
    return;
  }


  if (type === 'buy') {

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à payer (FCFA)';

    }


    amountInput.placeholder =
      'Ex. 10000';


    amountInput.inputMode =
      'decimal';


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }


    if (rateText) {

      rateText.textContent =
        `Taux d'achat : 1 USDT = ${formatNumber(BUY_RATE, 0)} FCFA`;

    }


    if (calculation) {

      calculation.innerHTML = `

        <span>
          Vous recevrez
        </span>

        <strong id="resultAmount">
          0 USDT
        </strong>

        <small id="resultDetail">
          Minimum : ${formatNumber(MIN_FCFA_AMOUNT, 0)} FCFA
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


    amountInput.inputMode =
      'decimal';


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }


    if (rateText) {

      rateText.textContent =
        `Taux de vente : 1 USDT = ${formatNumber(SELL_RATE, 0)} FCFA`;

    }


    if (calculation) {

      calculation.innerHTML = `

        <span>
          Vous recevrez
        </span>

        <strong id="resultAmount">
          0 FCFA
        </strong>

        <small id="resultDetail">
          Minimum : ${formatNumber(MIN_FCFA_AMOUNT, 0)} FCFA
        </small>

      `;

    }

  }


  updateCalculation();

}


// ==========================================
// EFFECTUER LE CALCUL
// ==========================================

function updateCalculation() {

  const amountInput =
    document.getElementById('amount');


  const resultAmount =
    document.getElementById('resultAmount');


  const resultDetail =
    document.getElementById('resultDetail');


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
        `Minimum : ${formatNumber(MIN_FCFA_AMOUNT, 0)} FCFA`;

    }


    return;

  }


  if (type === 'buy') {

    // FCFA -> USDT

    const usdt =
      value / BUY_RATE;


    resultAmount.textContent =
      `${formatNumber(usdt, 6)} USDT`;


    if (resultDetail) {

      if (value < MIN_FCFA_AMOUNT) {

        const remaining =
          MIN_FCFA_AMOUNT - value;


        resultDetail.textContent =
          `Minimum ${formatNumber(MIN_FCFA_AMOUNT, 0)} FCFA. Il manque ${formatNumber(remaining, 0)} FCFA.`;

      } else {

        resultDetail.textContent =
          `${formatNumber(value, 0)} FCFA ÷ ${formatNumber(BUY_RATE, 0)} = ${formatNumber(usdt, 6)} USDT`;

      }

    }

  } else {

    // USDT -> FCFA

    const fcfa =
      value * SELL_RATE;


    resultAmount.textContent =
      `${formatNumber(fcfa, 0)} FCFA`;


    if (resultDetail) {

      if (fcfa < MIN_FCFA_AMOUNT) {

        const minimumUsdt =
          MIN_FCFA_AMOUNT / SELL_RATE;


        const remainingUsdt =
          minimumUsdt - value;


        resultDetail.textContent =
          `Minimum ${formatNumber(MIN_FCFA_AMOUNT, 0)} FCFA, soit ${formatNumber(minimumUsdt, 6)} USDT. Il manque ${formatNumber(Math.max(remainingUsdt, 0), 6)} USDT.`;

      } else {

        resultDetail.textContent =
          `${formatNumber(value, 6)} USDT × ${formatNumber(SELL_RATE, 0)} = ${formatNumber(fcfa, 0)} FCFA`;

      }

    }

  }

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
      minimumFractionDigits: 0,
      maximumFractionDigits:
        maximumFractionDigits
    }
  );

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


  message.textContent =
    '';


  if (!email || !password) {

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


    console.log(
      'Connexion réussie :',
      data.user
    );


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


  if (password !== confirmPassword) {

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


    console.log(
      'Compte Auth créé :',
      data
    );


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
// CRÉER PROFIL USERS
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
      .eq('auth_id', user.id)
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
// MON COMPTE
// ==========================================

function showAccountModal(user) {

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
    overflow:auto;
  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:500px;
      background:white;
      color:#101828;
      border-radius:20px;
      padding:28px;
      box-shadow:0 20px 50px rgba(0,0,0,.25);
    ">

      <h2>
        Mon compte
      </h2>

      <p>
        <strong>Email :</strong><br>
        ${escapeHtml(user.email || '')}
      </p>

      <button
        id="logoutButton"
        type="button"
        class="primary full">
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
        style="line-height:1.5;">
      </p>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  document
    .getElementById(
      'closeAccountButton'
    )
    .addEventListener(
      'click',
      () => modal.remove()
    );


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
  // VALIDATION MONTANT
  // ========================================

  if (!amount) {

    message.textContent =
      'Veuillez indiquer un montant.';

    return;

  }


  const numericAmount =
    Number(amount);


  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {

    message.textContent =
      'Le montant doit être supérieur à 0.';

    return;

  }


  // ========================================
  // CALCUL MONTANTS
  // ========================================

  let cryptoAmount;

  let fiatAmount;

  let rate;


  if (type === 'buy') {

    // Achat :
    // client paie FCFA
    // client reçoit USDT

    fiatAmount =
      numericAmount;


    rate =
      BUY_RATE;


    cryptoAmount =
      numericAmount / BUY_RATE;


  } else {

    // Vente :
    // client vend USDT
    // client reçoit FCFA

    cryptoAmount =
      numericAmount;


    rate =
      SELL_RATE;


    fiatAmount =
      numericAmount * SELL_RATE;

  }


  // ========================================
  // VÉRIFICATION MINIMUM
  // ========================================

  if (
    fiatAmount < MIN_FCFA_AMOUNT
  ) {

    if (type === 'buy') {

      message.textContent =
        `Montant minimum d'achat : ${formatNumber(MIN_FCFA_AMOUNT, 0)} FCFA.`;

    } else {

      const minimumUsdt =
        MIN_FCFA_AMOUNT / SELL_RATE;


      message.textContent =
        `Montant minimum de vente : ${formatNumber(MIN_FCFA_AMOUNT, 0)} FCFA, soit au moins ${formatNumber(minimumUsdt, 6)} USDT.`;

    }


    updateCalculation();

    return;

  }


  // ========================================
  // VÉRIFICATION MOYEN DE PAIEMENT
  // ========================================

  if (!paymentMethod) {

    message.textContent =
      'Veuillez choisir un moyen de paiement : Orange Money ou Moov Money.';

    return;

  }


  // ========================================
  // VÉRIFICATION PORTEFEUILLE
  // ========================================

  if (!wallet) {

    message.textContent =
      'Veuillez renseigner l’adresse du portefeuille USDT.';

    return;

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
        .eq('auth_id', user.id)
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
        `Demande d’achat envoyée avec succès : ${formatNumber(cryptoAmount, 6)} USDT pour ${formatNumber(fiatAmount, 0)} FCFA via ${paymentMethod}.`;

    } else {

      message.textContent =
        `Demande de vente envoyée avec succès : ${formatNumber(cryptoAmount, 6)} USDT pour ${formatNumber(fiatAmount, 0)} FCFA via ${paymentMethod}.`;

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
      .forEach(input => {

        input.checked =
          false;

      });


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
