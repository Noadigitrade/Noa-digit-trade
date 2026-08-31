// ==========================================
// NOA DIGIT TRADE
// APPLICATION PRINCIPALE
// ==========================================


// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


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
// TAUX
// ==========================================

const BUY_RATE = 600;

const SELL_RATE = 570;


// ==========================================
// MINIMUM
// ==========================================

// Minimum réel demandé par le site
// pour ACHAT et VENTE : 2 000 FCFA.

const MIN_FIAT_AMOUNT = 2000;


// Pour la vente, le minimum USDT
// est calculé automatiquement selon
// le taux de vente.

const MIN_SELL_USDT =
  MIN_FIAT_AMOUNT / SELL_RATE;


// ==========================================
// VARIABLE OPÉRATION
// ==========================================

let type = 'buy';


// ==========================================
// PAGE CHARGÉE
// ==========================================

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log(
      'NOA DIGIT TRADE démarré.'
    );

    setupTabs();

    setupCalculation();

    setupSubmitButton();

    setupAuth();

    setupNavigation();

    setupPaymentSelection();

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
      await supabaseClient
        .auth
        .getSession();


    if (error) {

      console.error(
        'Erreur session :',
        error
      );

      updateLoginButton(null);

      showOrdersPreview(null);

      return;

    }


    updateLoginButton(
      data.session
    );


    if (data.session) {

      await showOrdersPreview(
        data.session.user
      );

    } else {

      showOrdersPreview(null);

    }


  } catch (error) {

    console.error(
      'Erreur vérification session :',
      error
    );

    updateLoginButton(null);

    showOrdersPreview(null);

  }

}


// ==========================================
// ÉCOUTE SESSION
// ==========================================

supabaseClient
  .auth
  .onAuthStateChange(
    (_event, session) => {

      updateLoginButton(session);

      if (session) {

        showOrdersPreview(
          session.user
        );

      } else {

        showOrdersPreview(null);

      }

    }
  );


// ==========================================
// BOUTON COMPTE
// ==========================================

function updateLoginButton(session) {

  const login =
    document.getElementById('login');


  if (!login) return;


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


        updateCalculationMode();


        const message =
          document.getElementById(
            'msg'
          );


        if (message) {

          message.textContent =
            '';

        }

      }
    );

  });

}


// ==========================================
// MODE ACHAT / VENTE
// ==========================================

function updateCalculationMode() {

  const amountInput =
    document.getElementById(
      'amount'
    );

  const amountInfo =
    document.getElementById(
      'amountInfo'
    );

  const rateText =
    document.getElementById(
      'rateText'
    );

  const minAmountText =
    document.getElementById(
      'minAmountText'
    );

  const inputCurrency =
    document.getElementById(
      'inputCurrency'
    );

  const outputCurrency =
    document.getElementById(
      'outputCurrency'
    );

  const walletLabel =
    document.getElementById(
      'walletLabel'
    );

  const resultDetail =
    document.getElementById(
      'resultDetail'
    );


  if (!amountInput) return;


  if (type === 'buy') {

    // ==============================
    // ACHAT
    // ==============================

    amountInput.placeholder =
      '0';

    amountInput.min =
      String(MIN_FIAT_AMOUNT);


    if (inputCurrency) {

      inputCurrency.textContent =
        'FCFA';

    }


    if (outputCurrency) {

      outputCurrency.textContent =
        'USDT';

    }


    if (amountInfo) {

      amountInfo.textContent =
        `Minimum : ${formatNumber(
          MIN_FIAT_AMOUNT,
          0
        )} FCFA`;

    }


    if (rateText) {

      rateText.textContent =
        `Taux d'achat : 1 USDT = ${formatNumber(
          BUY_RATE,
          0
        )} FCFA`;

    }


    if (minAmountText) {

      minAmountText.textContent =
        `Minimum : ${formatNumber(
          MIN_FIAT_AMOUNT,
          0
        )} FCFA`;

    }


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }


    if (resultDetail) {

      resultDetail.textContent =
        `1 USDT = ${formatNumber(
          BUY_RATE,
          0
        )} FCFA`;

    }


  } else {

    // ==============================
    // VENTE
    // ==============================

    amountInput.placeholder =
      '0';


    amountInput.min =
      String(MIN_SELL_USDT);


    if (inputCurrency) {

      inputCurrency.textContent =
        'USDT';

    }


    if (outputCurrency) {

      outputCurrency.textContent =
        'FCFA';

    }


    if (amountInfo) {

      amountInfo.textContent =
        `Minimum : ${formatNumber(
          MIN_SELL_USDT,
          6
        )} USDT`;

    }


    if (rateText) {

      rateText.textContent =
        `Taux de vente : 1 USDT = ${formatNumber(
          SELL_RATE,
          0
        )} FCFA`;

    }


    if (minAmountText) {

      minAmountText.textContent =
        `Minimum : ${formatNumber(
          MIN_FIAT_AMOUNT,
          0
        )} FCFA, soit ${formatNumber(
          MIN_SELL_USDT,
          6
        )} USDT`;

    }


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT à débiter';

    }


    if (resultDetail) {

      resultDetail.textContent =
        `1 USDT = ${formatNumber(
          SELL_RATE,
          0
        )} FCFA`;

    }

  }


  updateCalculation();

}


// ==========================================
// CALCUL
// ==========================================

function setupCalculation() {

  const amountInput =
    document.getElementById(
      'amount'
    );


  if (!amountInput) return;


  amountInput.addEventListener(
    'input',
    updateCalculation
  );


  updateCalculationMode();


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


  // Aucun montant

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
          ? `1 USDT = ${formatNumber(
              BUY_RATE,
              0
            )} FCFA`
          : `1 USDT = ${formatNumber(
              SELL_RATE,
              0
            )} FCFA`;

    }


    return;

  }


  // ==============================
  // ACHAT
  // ==============================

  if (type === 'buy') {

    const usdt =
      value / BUY_RATE;


    resultAmount.textContent =
      `${formatNumber(
        usdt,
        6
      )} USDT`;


    if (resultDetail) {

      resultDetail.textContent =
        `${formatNumber(
          value,
          0
        )} FCFA ÷ ${formatNumber(
          BUY_RATE,
          0
        )} = ${formatNumber(
          usdt,
          6
        )} USDT`;

    }


  } else {

    // ==============================
    // VENTE
    // ==============================

    const fcfa =
      value * SELL_RATE;


    resultAmount.textContent =
      `${formatNumber(
        fcfa,
        0
      )} FCFA`;


    if (resultDetail) {

      resultDetail.textContent =
        `${formatNumber(
          value,
          6
        )} USDT × ${formatNumber(
          SELL_RATE,
          0
        )} = ${formatNumber(
          fcfa,
          0
        )} FCFA`;

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

  return Number(value)
    .toLocaleString(
      'fr-FR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits
      }
    );

}


// ==========================================
// PAIEMENT MOBILE
// ==========================================

function setupPaymentSelection() {

  const inputs =
    document.querySelectorAll(
      'input[name="payment_method"]'
    );


  inputs.forEach(input => {

    input.addEventListener(
      'change',
      () => {

        document
          .querySelectorAll(
            '.payment-option'
          )
          .forEach(option => {

            option.classList.remove(
              'selected'
            );

          });


        const parent =
          input.closest(
            '.payment-option'
          );


        if (parent) {

          parent.classList.add(
            'selected'
          );

        }

      }
    );

  });

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


  if (!modal) return;


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


  if (!modal) return;


  modal.style.display =
    'none';


  modal.setAttribute(
    'aria-hidden',
    'true'
  );

}


// ==========================================
// CONFIG AUTH
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
      await supabaseClient
        .auth
        .signInWithPassword({
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
      () => {

        closeAuthModal();

      },
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
      await supabaseClient
        .auth
        .signUp({

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
      'Compte créé :',
      data
    );


    // ==============================
    // EMAIL DE CONFIRMATION
    // ==============================

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


    // ==============================
    // CRÉATION PROFIL
    // ==============================

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
// PROFIL USERS
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
// ENVOYER DEMANDE
// ==========================================

function setupSubmitButton() {

  const submit =
    document.getElementById(
      'submit'
    );


  if (!submit) return;


  submit.addEventListener(
    'click',
    sendOrder
  );

}


// ==========================================
// SEND ORDER
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
  // VÉRIFICATION MONTANT
  // ========================================

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {

    message.textContent =
      'Veuillez entrer un montant valide.';

    return;

  }


  // ========================================
  // MINIMUM ACHAT
  // ========================================

  if (
    type === 'buy' &&
    numericAmount < MIN_FIAT_AMOUNT
  ) {

    message.textContent =
      `Le montant minimum d'achat est de ${formatNumber(
        MIN_FIAT_AMOUNT,
        0
      )} FCFA.`;

    return;

  }


  // ========================================
  // MINIMUM VENTE
  // ========================================

  if (
    type === 'sell' &&
    numericAmount < MIN_SELL_USDT
  ) {

    message.textContent =
      `Le montant minimum de vente est de ${formatNumber(
        MIN_SELL_USDT,
        6
      )} USDT, soit ${formatNumber(
        MIN_FIAT_AMOUNT,
        0
      )} FCFA.`;

    return;

  }


  // ========================================
  // MOYEN DE PAIEMENT
  // ========================================

  if (!paymentMethod) {

    message.textContent =
      'Veuillez choisir Orange Money ou Moov Money.';

    return;

  }


  // ========================================
  // PORTEFEUILLE
  // ========================================

  if (!wallet) {

    message.textContent =
      'Veuillez renseigner votre adresse de portefeuille USDT.';

    return;

  }


  // ========================================
  // CALCUL
  // ========================================

  let cryptoAmount;

  let fiatAmount;

  let rate;


  if (type === 'buy') {

    // FCFA -> USDT

    fiatAmount =
      numericAmount;

    rate =
      BUY_RATE;

    cryptoAmount =
      numericAmount /
      BUY_RATE;


  } else {

    // USDT -> FCFA

    cryptoAmount =
      numericAmount;

    rate =
      SELL_RATE;

    fiatAmount =
      numericAmount *
      SELL_RATE;

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
      await supabaseClient
        .auth
        .getUser();


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

      throw orderError;

    }


    console.log(
      'Demande créée :',
      order
    );


    // ======================================
    // SUCCÈS
    // ======================================

    message.textContent =
      type === 'buy'

        ? `Demande d’achat envoyée : ${formatNumber(
            cryptoAmount,
            6
          )} USDT pour ${formatNumber(
            fiatAmount,
            0
          )} FCFA via ${paymentMethod}.`

        : `Demande de vente envoyée : ${formatNumber(
            cryptoAmount,
            6
          )} USDT pour ${formatNumber(
            fiatAmount,
            0
          )} FCFA via ${paymentMethod}.`;


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


    document
      .querySelectorAll(
        '.payment-option'
      )
      .forEach(option => {

        option.classList.remove(
          'selected'
        );

      });


    updateCalculation();


    // Actualiser les demandes

    await showOrdersPreview(
      user
    );


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
// APERÇU DEMANDES
// ==========================================

async function showOrdersPreview(user) {

  const container =
    document.getElementById(
      'ordersPreview'
    );


  if (!container) return;


  if (!user) {

    container.innerHTML = `

      <p class="orders-empty">
        Connectez-vous pour voir vos demandes.
      </p>

    `;

    return;

  }


  try {

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
            ascending: false
          }
        )
        .limit(3);


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
        .map(createOrderCard)
        .join('');


  } catch (error) {

    console.error(
      'Erreur chargement demandes :',
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
// MODAL MON COMPTE
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
    z-index:9999;
    background:rgba(0,0,0,.58);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
    overflow-y:auto;
  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:560px;
      max-height:92vh;
      overflow-y:auto;
      background:white;
      color:#111827;
      border-radius:25px;
      padding:25px;
      box-shadow:0 20px 60px rgba(0,0,0,.25);
    ">

      <h2 style="
        margin-top:0;
        font-size:31px;
      ">
        Mon compte
      </h2>

      <p>
        <strong>Email :</strong><br>
        ${escapeHtml(
          user.email || ''
        )}
      </p>

      <div style="
        height:1px;
        background:#e5e7eb;
        margin:20px 0;
      "></div>

      <h3>
        Mes demandes
      </h3>

      <div id="ordersContainer">

        <p style="
          color:#667085;
        ">
          Chargement...
        </p>

      </div>

      <button
        id="logoutButton"
        type="button"
        style="
          width:100%;
          margin-top:20px;
          padding:16px;
          border:none;
          border-radius:15px;
          background:#111827;
          color:white;
          font-weight:600;
          font-size:16px;
        "
      >
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
          border-radius:15px;
          background:white;
        "
      >
        Fermer
      </button>

      <p
        id="accountMessage"
        style="
          min-height:24px;
          line-height:1.5;
        "
      ></p>

    </div>

  `;


  document.body.appendChild(
    modal
  );


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
          await supabaseClient
            .auth
            .signOut();


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
// CHARGER TOUTES LES DEMANDES
// ==========================================

async function loadUserOrders(user) {

  const container =
    document.getElementById(
      'ordersContainer'
    );


  if (!container) return;


  try {

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

        <p style="
          color:#667085;
        ">
          Aucune demande pour le moment.
        </p>

      `;

      return;

    }


    const userId =
      users[0].id;


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
            ascending: false
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

        <p style="
          color:#667085;
        ">
          Aucune demande pour le moment.
        </p>

      `;

      return;

    }


    container.innerHTML =
      orders
        .map(createOrderCard)
        .join('');


  } catch (error) {

    console.error(
      'Erreur chargement commandes :',
      error
    );


    container.innerHTML = `

      <p style="
        color:#b42318;
      ">
        Impossible de charger vos demandes.
      </p>

    `;

  }

}


// ==========================================
// CARTE DEMANDE
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

          <span class="
            order-dot
            ${isBuy
              ? 'buy-dot'
              : 'sell-dot'}
          "></span>

          <strong>
            ${typeLabel}
          </strong>

        </div>

        <span class="
          status
          ${statusClass}
        ">
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

        1 USDT =
        ${rate} FCFA

      </div>


      <div class="order-meta">

        <strong>
          Paiement :
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
    )
      .toLowerCase();


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
    )
      .toLowerCase();


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
      dateStyle: 'long',
      timeStyle: 'short'
    }
  );

}


// ==========================================
// NAVIGATION
// ==========================================

function setupNavigation() {

  const order =
    document.getElementById(
      'order'
    );

  const activeOrders =
    document.getElementById(
      'activeOrders'
    );


  const historyBtn =
    document.getElementById(
      'historyBtn'
    );

  const historyNav =
    document.getElementById(
      'historyNav'
    );

  const exchangeNav =
    document.getElementById(
      'exchangeNav'
    );

  const homeNav =
    document.getElementById(
      'homeNav'
    );

  const profileNav =
    document.getElementById(
      'profileNav'
    );


  if (historyBtn) {

    historyBtn.addEventListener(
      'click',
      () => {

        if (activeOrders) {

          activeOrders.scrollIntoView({
            behavior: 'smooth'
          });

        }

      }
    );

  }


  if (historyNav) {

    historyNav.addEventListener(
      'click',
      () => {

        if (activeOrders) {

          activeOrders.scrollIntoView({
            behavior: 'smooth'
          });

        }

      }
    );

  }


  if (exchangeNav) {

    exchangeNav.addEventListener(
      'click',
      () => {

        if (order) {

          order.scrollIntoView({
            behavior: 'smooth'
          });

        }

      }
    );

  }


  if (homeNav) {

    homeNav.addEventListener(
      'click',
      () => {

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

      }
    );

  }


  if (profileNav) {

    profileNav.addEventListener(
      'click',
      async () => {

        const {
          data
        } =
          await supabaseClient
            .auth
            .getSession();


        if (
          data.session
        ) {

          showAccountModal(
            data.session.user
          );

        } else {

          showAuthModal();

        }

      }
    );

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
