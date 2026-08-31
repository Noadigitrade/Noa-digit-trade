// ============================================================
// NOA DIGIT TRADE
// APPLICATION COMPLÈTE
// SUPABASE AUTH + USERS + ORDERS + DISPUTES
// ACHAT / VENTE USDT
// CONFIRMATION + ORANGE MONEY
// ============================================================


// ============================================================
// CONFIGURATION SUPABASE
// ============================================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ============================================================
// CONFIGURATION COMMERCIALE
// ============================================================

const BUY_RATE = 600;
const SELL_RATE = 570;

const MIN_FIAT_AMOUNT = 2000;
const MAX_FIAT_AMOUNT = 50000;

const MIN_SELL_USDT =
  MIN_FIAT_AMOUNT / SELL_RATE;

const MAX_SELL_USDT =
  MAX_FIAT_AMOUNT / SELL_RATE;


// ============================================================
// FRAIS RÉSEAU
// ============================================================

const NETWORK_FEES = {
  trc20: 2,
  bp20: 0
};


// ============================================================
// INFORMATIONS PAIEMENT
// ============================================================

const PAYMENT_METHOD = 'orange_money';

const ORANGE_MONEY_NUMBER =
  '74 60 25 53';


// ============================================================
// CLIENT SUPABASE
// ============================================================

let supabaseClient = null;

if (window.supabase) {

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

} else {

  console.error(
    'Supabase JS n’a pas été chargé.'
  );

}


// ============================================================
// VARIABLES GLOBALES
// ============================================================

let currentUser = null;

let currentProfile = null;

let currentOrder = null;

let currentOrderDraft = null;

let orderType = 'buy';

let selectedNetwork = 'trc20';


// ============================================================
// DÉMARRAGE
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  async function () {

    console.log(
      'NOA DIGIT TRADE - démarrage'
    );

    setupAuth();

    setupNavigation();

    setupExchange();

    setupPayment();

    setupSupport();

    updateRatesDisplay();

    resetExchange();

    await initializeSession();

  }
);


// ============================================================
// INITIALISATION SESSION
// ============================================================

async function initializeSession() {

  if (!supabaseClient) {

    showMessage(
      'Impossible de charger le service Supabase.',
      'error'
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {
      throw error;
    }


    if (data && data.session) {

      await handleUserSession(
        data.session.user
      );

    } else {

      showAuthPage();

    }


  } catch (error) {

    console.error(
      'Erreur initialisation session :',
      error
    );

    showAuthPage();

  }


  supabaseClient.auth.onAuthStateChange(
    async function (
      event,
      session
    ) {

      console.log(
        'Auth event :',
        event
      );


      if (session && session.user) {

        await handleUserSession(
          session.user
        );

      } else {

        currentUser = null;
        currentProfile = null;

        showAuthPage();

      }

    }
  );

}


// ============================================================
// GESTION SESSION UTILISATEUR
// ============================================================

async function handleUserSession(user) {

  if (!user) {

    showAuthPage();

    return;

  }


  currentUser = user;


  try {

    currentProfile =
      await getOrCreateUserProfile(
        user
      );


    updateUserInterface();

    showAppPage();

    await loadOrders();

    await loadDisputes();

  } catch (error) {

    console.error(
      'Erreur profil utilisateur :',
      error
    );


    showMessage(
      'Impossible de charger votre profil : ' +
      getErrorMessage(error),
      'error'
    );


    showAppPage();

  }

}


// ============================================================
// AUTHENTIFICATION
// ============================================================

function setupAuth() {

  const loginTab =
    document.getElementById(
      'loginTab'
    );

  const registerTab =
    document.getElementById(
      'registerTab'
    );

  const loginForm =
    document.getElementById(
      'loginForm'
    );

  const registerForm =
    document.getElementById(
      'registerForm'
    );


  if (loginTab) {

    loginTab.addEventListener(
      'click',
      function () {

        activateAuthTab(
          'login'
        );

      }
    );

  }


  if (registerTab) {

    registerTab.addEventListener(
      'click',
      function () {

        activateAuthTab(
          'register'
        );

      }
    );

  }


  if (loginForm) {

    loginForm.addEventListener(
      'submit',
      async function (event) {

        event.preventDefault();

        await loginUser();

      }
    );

  }


  if (registerForm) {

    registerForm.addEventListener(
      'submit',
      async function (event) {

        event.preventDefault();

        await registerUser();

      }
    );

  }


  const logoutBtn =
    document.getElementById(
      'logoutBtn'
    );


  if (logoutBtn) {

    logoutBtn.addEventListener(
      'click',
      async function () {

        await logoutUser();

      }
    );

  }

}


// ============================================================
// ONGLET CONNEXION / INSCRIPTION
// ============================================================

function activateAuthTab(mode) {

  const loginTab =
    document.getElementById(
      'loginTab'
    );

  const registerTab =
    document.getElementById(
      'registerTab'
    );

  const loginForm =
    document.getElementById(
      'loginForm'
    );

  const registerForm =
    document.getElementById(
      'registerForm'
    );


  if (mode === 'login') {

    if (loginTab) {
      loginTab.classList.add(
        'active'
      );
    }

    if (registerTab) {
      registerTab.classList.remove(
        'active'
      );
    }

    if (loginForm) {
      loginForm.classList.add(
        'active'
      );
    }

    if (registerForm) {
      registerForm.classList.remove(
        'active'
      );
    }

  } else {

    if (registerTab) {
      registerTab.classList.add(
        'active'
      );
    }

    if (loginTab) {
      loginTab.classList.remove(
        'active'
      );
    }

    if (registerForm) {
      registerForm.classList.add(
        'active'
      );
    }

    if (loginForm) {
      loginForm.classList.remove(
        'active'
      );
    }

  }


  clearMessage();

}


// ============================================================
// CONNEXION
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


  if (
    !emailInput ||
    !passwordInput
  ) {

    showMessage(
      'Formulaire de connexion introuvable.',
      'error'
    );

    return;

  }


  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;


  if (!email || !password) {

    showMessage(
      'Veuillez remplir tous les champs.',
      'error'
    );

    return;

  }


  if (!supabaseClient) {

    showMessage(
      'Service de connexion indisponible.',
      'error'
    );

    return;

  }


  const button =
    document.querySelector(
      '#loginForm button[type="submit"]'
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      'Connexion...';

  }


  clearMessage();


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

      });


    if (error) {

      throw error;

    }


    if (
      !data ||
      !data.user
    ) {

      throw new Error(
        'Connexion impossible.'
      );

    }


    currentUser =
      data.user;


    try {

      currentProfile =
        await getOrCreateUserProfile(
          data.user
        );

    } catch (profileError) {

      console.error(
        'Erreur profil après connexion :',
        profileError
      );

    }


    showMessage(
      'Connexion réussie.',
      'success'
    );


    emailInput.value = '';

    passwordInput.value = '';


    updateUserInterface();


    setTimeout(
      async function () {

        showAppPage();

        await loadOrders();

        await loadDisputes();

      },
      500
    );


  } catch (error) {

    console.error(
      'Erreur connexion :',
      error
    );


    showMessage(
      translateAuthError(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Se connecter';

    }

  }

}


// ============================================================
// INSCRIPTION
// ============================================================

async function registerUser() {

  // ----------------------------------------------------------
  // NOUVEAUX IDs DE TON INDEX.HTML
  // ----------------------------------------------------------

  const nameInput =
    document.getElementById(
      'registerName'
    );

  const phoneInput =
    document.getElementById(
      'registerPhone'
    );

  const countryInput =
    document.getElementById(
      'registerCountry'
    );

  const emailInput =
    document.getElementById(
      'registerEmail'
    );

  const passwordInput =
    document.getElementById(
      'registerPassword'
    );

  const confirmInput =
    document.getElementById(
      'registerPasswordConfirm'
    );


  if (
    !nameInput ||
    !phoneInput ||
    !countryInput ||
    !emailInput ||
    !passwordInput ||
    !confirmInput
  ) {

    console.error(
      'Un ou plusieurs champs d’inscription sont introuvables.'
    );


    showMessage(
      'Erreur du formulaire d’inscription. Rechargez la page.',
      'error'
    );


    return;

  }


  const name =
    nameInput.value.trim();

  const phone =
    phoneInput.value.trim();

  const country =
    countryInput.value.trim();

  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;

  const confirmPassword =
    confirmInput.value;


  clearMessage();


  // ----------------------------------------------------------
  // VALIDATIONS
  // ----------------------------------------------------------

  if (
    !name ||
    !phone ||
    !country ||
    !email ||
    !password ||
    !confirmPassword
  ) {

    showMessage(
      'Veuillez remplir tous les champs.',
      'error'
    );

    return;

  }


  if (
    country !==
    'Burkina Faso'
  ) {

    showMessage(
      'NOA DIGIT TRADE est réservé au Burkina Faso.',
      'error'
    );

    return;

  }


  if (password.length < 6) {

    showMessage(
      'Le mot de passe doit contenir au moins 6 caractères.',
      'error'
    );

    return;

  }


  if (
    password !==
    confirmPassword
  ) {

    showMessage(
      'Les mots de passe ne correspondent pas.',
      'error'
    );

    return;

  }


  if (!isValidEmail(email)) {

    showMessage(
      'Veuillez saisir une adresse email valide.',
      'error'
    );

    return;

  }


  if (!supabaseClient) {

    showMessage(
      'Service d’inscription indisponible.',
      'error'
    );

    return;

  }


  const button =
    document.querySelector(
      '#registerForm button[type="submit"]'
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      'Création...';

  }


  try {

    // --------------------------------------------------------
    // CRÉATION DU COMPTE SUPABASE AUTH
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email: email,

        password: password,

        options: {

          data: {

            full_name: name,

            name: name,

            phone: phone,

            country: country

          },

          emailRedirectTo:
            window.location.origin +
            window.location.pathname

        }

      });


    if (error) {

      throw error;

    }


    if (
      !data ||
      !data.user
    ) {

      throw new Error(
        'Supabase n’a pas retourné l’utilisateur créé.'
      );

    }


    console.log(
      'Compte Auth créé :',
      data.user
    );


    // --------------------------------------------------------
    // CAS 1 : CONFIRMATION EMAIL ACTIVÉE
    // --------------------------------------------------------

    if (!data.session) {

      showMessage(
        'Compte créé avec succès. Vérifiez votre adresse email pour confirmer votre compte avant de vous connecter.',
        'success'
      );


      passwordInput.value = '';

      confirmInput.value = '';


      return;

    }


    // --------------------------------------------------------
    // CAS 2 : CONNEXION AUTOMATIQUE
    // --------------------------------------------------------

    currentUser =
      data.user;


    try {

      currentProfile =
        await getOrCreateUserProfile(
          data.user,
          {
            name: name,
            phone: phone,
            country: country
          }
        );

    } catch (profileError) {

      console.error(
        'Erreur création profil :',
        profileError
      );


      /*
       * Le compte Auth existe déjà.
       * On ne détruit jamais le compte.
       */

      showMessage(
        'Votre compte a été créé, mais votre profil n’a pas encore pu être enregistré. Reconnectez-vous pour terminer la configuration.',
        'error'
      );


      return;

    }


    showMessage(
      'Compte créé avec succès.',
      'success'
    );


    // Nettoyage

    nameInput.value = '';

    phoneInput.value = '';

    emailInput.value = '';

    passwordInput.value = '';

    confirmInput.value = '';


    updateUserInterface();


    setTimeout(
      async function () {

        showAppPage();

        await loadOrders();

        await loadDisputes();

      },
      700
    );


  } catch (error) {

    console.error(
      'Erreur inscription :',
      error
    );


    showMessage(
      translateAuthError(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Créer mon compte';

    }

  }

}


// ============================================================
// CRÉATION / RÉCUPÉRATION DU PROFIL USERS
// ============================================================

async function getOrCreateUserProfile(
  user,
  registrationData = {}
) {

  if (
    !user ||
    !user.id
  ) {

    throw new Error(
      'Utilisateur Supabase invalide.'
    );

  }


  // ----------------------------------------------------------
  // RECHERCHE DU PROFIL EXISTANT
  // ----------------------------------------------------------

  const {
    data: existingUsers,
    error: searchError
  } =
    await supabaseClient
      .from('Users')
      .select('*')
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
  // RÉCUPÉRATION DES MÉTADONNÉES
  // ----------------------------------------------------------

  const metadata =
    user.user_metadata || {};


  const name =
    registrationData.name ||
    metadata.full_name ||
    metadata.name ||
    'Utilisateur';


  const phone =
    registrationData.phone ||
    metadata.phone ||
    '';


  const country =
    registrationData.country ||
    metadata.country ||
    'Burkina Faso';


  // ----------------------------------------------------------
  // INSERTION PROFIL
  // ----------------------------------------------------------

  /*
   * On utilise les colonnes principales déjà utilisées
   * par la structure actuelle : auth_id + email.
   *
   * Les informations supplémentaires sont tentées ensuite.
   */

  let profileData = {

    auth_id:
      user.id,

    email:
      user.email || ''

  };


  /*
   * Nous essayons d'enregistrer les informations personnelles
   * uniquement si les colonnes correspondantes existent.
   */

  let result =
    await supabaseClient
      .from('Users')
      .insert({

        auth_id:
          user.id,

        email:
          user.email || '',

        name:
          name,

        phone:
          phone,

        country:
          country

      })
      .select()
      .single();


  // ----------------------------------------------------------
  // SI LES COLONNES name/phone/country N'EXISTENT PAS
  // ----------------------------------------------------------

  if (
    result.error
  ) {

    console.warn(
      'Insertion complète Users impossible. Nouvelle tentative avec auth_id/email.',
      result.error
    );


    result =
      await supabaseClient
        .from('Users')
        .insert(
          profileData
        )
        .select()
        .single();

  }


  if (result.error) {

    throw result.error;

  }


  return result.data;

}


// ============================================================
// INTERFACE UTILISATEUR
// ============================================================

function updateUserInterface() {

  if (!currentUser) {

    return;

  }


  const metadata =
    currentUser.user_metadata || {};


  const profile =
    currentProfile || {};


  const name =
    profile.name ||
    profile.full_name ||
    metadata.full_name ||
    metadata.name ||
    'Utilisateur';


  const phone =
    profile.phone ||
    metadata.phone ||
    '';


  const country =
    profile.country ||
    metadata.country ||
    'Burkina Faso';


  const userName =
    document.getElementById(
      'userName'
    );


  const userCountry =
    document.getElementById(
      'userCountry'
    );


  if (userName) {

    userName.textContent =
      name;

  }


  if (userCountry) {

    userCountry.textContent =
      '🇧🇫 ' +
      country;

  }


  const profileName =
    document.getElementById(
      'profileName'
    );


  const profilePhone =
    document.getElementById(
      'profilePhone'
    );


  const profileCountry =
    document.getElementById(
      'profileCountry'
    );


  if (profileName) {

    profileName.value =
      name;

  }


  if (profilePhone) {

    profilePhone.value =
      phone;

  }


  if (profileCountry) {

    profileCountry.value =
      country;

  }

}


// ============================================================
// NAVIGATION PRINCIPALE
// ============================================================

function setupNavigation() {

  const navButtons =
    document.querySelectorAll(
      '.nav-btn'
    );


  navButtons.forEach(
    function (button) {

      button.addEventListener(
        'click',
        function () {

          const pageId =
            button.dataset.page;

          if (!pageId) {

            return;

          }


          showSubPage(
            pageId
          );


          navButtons.forEach(
            function (item) {

              item.classList.remove(
                'active'
              );

            }
          );


          button.classList.add(
            'active'
          );

        }
      );

    }
  );


  const goBuyBtn =
    document.getElementById(
      'goBuyBtn'
    );


  const goSellBtn =
    document.getElementById(
      'goSellBtn'
    );


  if (goBuyBtn) {

    goBuyBtn.addEventListener(
      'click',
      function () {

        setOrderType(
          'buy'
        );

        showSubPage(
          'exchangePage'
        );

      }
    );

  }


  if (goSellBtn) {

    goSellBtn.addEventListener(
      'click',
      function () {

        setOrderType(
          'sell'
        );

        showSubPage(
          'exchangePage'
        );

      }
    );

  }


  const backHomeBtn =
    document.getElementById(
      'backHomeBtn'
    );


  if (backHomeBtn) {

    backHomeBtn.addEventListener(
      'click',
      function () {

        showSubPage(
          'homePage'
        );

      }
    );

  }


  const cancelReviewBtn =
    document.getElementById(
      'cancelReviewBtn'
    );


  if (cancelReviewBtn) {

    cancelReviewBtn.addEventListener(
      'click',
      function () {

        showSubPage(
          'exchangePage'
        );

      }
    );

  }


  const viewOrderBtn =
    document.getElementById(
      'viewOrderBtn'
    );


  if (viewOrderBtn) {

    viewOrderBtn.addEventListener(
      'click',
      async function () {

        showSubPage(
          'ordersPage'
        );

        await loadOrders();

      }
    );

  }

}


// ============================================================
// AFFICHAGE PAGE AUTH
// ============================================================

function showAuthPage() {

  const authPage =
    document.getElementById(
      'authPage'
    );

  const appPage =
    document.getElementById(
      'appPage'
    );

  const bottomNav =
    document.getElementById(
      'bottomNav'
    );


  if (authPage) {

    authPage.classList.add(
      'active'
    );

  }


  if (appPage) {

    appPage.classList.remove(
      'active'
    );

  }


  if (bottomNav) {

    bottomNav.classList.add(
      'hidden'
    );

  }

}


// ============================================================
// AFFICHAGE APPLICATION
// ============================================================

function showAppPage() {

  const authPage =
    document.getElementById(
      'authPage'
    );

  const appPage =
    document.getElementById(
      'appPage'
    );

  const bottomNav =
    document.getElementById(
      'bottomNav'
    );


  if (authPage) {

    authPage.classList.remove(
      'active'
    );

  }


  if (appPage) {

    appPage.classList.add(
      'active'
    );

  }


  if (bottomNav) {

    bottomNav.classList.remove(
      'hidden'
    );

  }


  showSubPage(
    'homePage'
  );


  setActiveNav(
    'homePage'
  );

}


// ============================================================
// AFFICHAGE SOUS-PAGE
// ============================================================

function showSubPage(pageId) {

  const pages =
    document.querySelectorAll(
      '.sub-page'
    );


  pages.forEach(
    function (page) {

      page.classList.add(
        'hidden'
      );

    }
  );


  const target =
    document.getElementById(
      pageId
    );


  if (target) {

    target.classList.remove(
      'hidden'
    );

  }


  if (pageId === 'ordersPage') {

    loadOrders();

  }


  if (pageId === 'supportPage') {

    loadDisputes();

    populateDisputeOrders();

  }


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


// ============================================================
// NAVIGATION ACTIVE
// ============================================================

function setActiveNav(pageId) {

  const buttons =
    document.querySelectorAll(
      '.nav-btn'
    );


  buttons.forEach(
    function (button) {

      button.classList.toggle(
        'active',
        button.dataset.page ===
        pageId
      );

    }
  );

}


// ============================================================
// ACHAT / VENTE
// ============================================================

function setupExchange() {

  const buyTab =
    document.getElementById(
      'buyTab'
    );

  const sellTab =
    document.getElementById(
      'sellTab'
    );


  if (buyTab) {

    buyTab.addEventListener(
      'click',
      function () {

        setOrderType(
          'buy'
        );

      }
    );

  }


  if (sellTab) {

    sellTab.addEventListener(
      'click',
      function () {

        setOrderType(
          'sell'
        );

      }
    );

  }


  const trc20Option =
    document.getElementById(
      'trc20Option'
    );


  const bp20Option =
    document.getElementById(
      'bp20Option'
    );


  if (trc20Option) {

    trc20Option.addEventListener(
      'click',
      function () {

        setNetwork(
          'trc20'
        );

      }
    );

  }


  if (bp20Option) {

    bp20Option.addEventListener(
      'click',
      function () {

        setNetwork(
          'bp20'
        );

      }
    );

  }


  const amountInput =
    document.getElementById(
      'amountInput'
    );


  if (amountInput) {

    amountInput.addEventListener(
      'input',
      function () {

        updateCalculation();

      }
    );

    amountInput.addEventListener(
      'change',
      function () {

        updateCalculation();

      }
    );

  }


  const reviewOrderBtn =
    document.getElementById(
      'reviewOrderBtn'
    );


  if (reviewOrderBtn) {

    reviewOrderBtn.addEventListener(
      'click',
      function () {

        reviewOrder();

      }
    );

  }

}


// ============================================================
// TYPE ACHAT / VENTE
// ============================================================

function setOrderType(type) {

  if (
    type !== 'buy' &&
    type !== 'sell'
  ) {

    type = 'buy';

  }


  orderType =
    type;


  const buyTab =
    document.getElementById(
      'buyTab'
    );


  const sellTab =
    document.getElementById(
      'sellTab'
    );


  if (buyTab) {

    buyTab.classList.toggle(
      'active',
      type === 'buy'
    );

  }


  if (sellTab) {

    sellTab.classList.toggle(
      'active',
      type === 'sell'
    );

  }


  const amountLabel =
    document.getElementById(
      'amountLabel'
    );


  const amountInput =
    document.getElementById(
      'amountInput'
    );


  const amountUnit =
    document.getElementById(
      'amountUnit'
    );


  if (type === 'buy') {

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à payer';

    }


    if (amountUnit) {

      amountUnit.textContent =
        'FCFA';

    }


    if (amountInput) {

      amountInput.min =
        MIN_FIAT_AMOUNT;

      amountInput.max =
        MAX_FIAT_AMOUNT;

    }

  } else {

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à vendre';

    }


    if (amountUnit) {

      amountUnit.textContent =
        'USDT';

    }


    if (amountInput) {

      amountInput.min =
        MIN_SELL_USDT;

      amountInput.max =
        MAX_SELL_USDT;

    }

  }


  updateCalculation();

}


// ============================================================
// RÉSEAU
// ============================================================

function setNetwork(network) {

  if (
    network !== 'trc20' &&
    network !== 'bp20'
  ) {

    network = 'trc20';

  }


  selectedNetwork =
    network;


  const trc20Option =
    document.getElementById(
      'trc20Option'
    );


  const bp20Option =
    document.getElementById(
      'bp20Option'
    );


  if (trc20Option) {

    trc20Option.classList.toggle(
      'active',
      network === 'trc20'
    );

  }


  if (bp20Option) {

    bp20Option.classList.toggle(
      'active',
      network === 'bp20'
    );

  }


  updateCalculation();

}


// ============================================================
// CALCUL
// ============================================================

function calculateOrder() {

  const amountInput =
    document.getElementById(
      'amountInput'
    );


  const numericAmount =
    amountInput
      ? Number(amountInput.value)
      : 0;


  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {

    return {

      amount: 0,

      fiatAmount: 0,

      cryptoAmount: 0,

      rate:
        orderType === 'buy'
          ? BUY_RATE
          : SELL_RATE,

      fee:
        NETWORK_FEES[
          selectedNetwork
        ] || 0

    };

  }


  if (orderType === 'buy') {

    const fiatAmount =
      numericAmount;

    const cryptoAmount =
      fiatAmount /
      BUY_RATE;


    return {

      amount:
        numericAmount,

      fiatAmount:
        fiatAmount,

      cryptoAmount:
        cryptoAmount,

      rate:
        BUY_RATE,

      fee:
        NETWORK_FEES[
          selectedNetwork
        ] || 0

    };

  }


  const cryptoAmount =
    numericAmount;

  const fiatAmount =
    cryptoAmount *
    SELL_RATE;


  return {

    amount:
      numericAmount,

    fiatAmount:
      fiatAmount,

    cryptoAmount:
      cryptoAmount,

    rate:
      SELL_RATE,

    fee:
      NETWORK_FEES[
        selectedNetwork
      ] || 0

  };

}


// ============================================================
// MISE À JOUR CALCUL
// ============================================================

function updateCalculation() {

  const calculation =
    calculateOrder();


  const summaryRate =
    document.getElementById(
      'summaryRate'
    );


  const summaryCfa =
    document.getElementById(
      'summaryCfa'
    );


  const summaryUsdt =
    document.getElementById(
      'summaryUsdt'
    );


  const summaryFee =
    document.getElementById(
      'summaryFee'
    );


  const summaryResult =
    document.getElementById(
      'summaryResult'
    );


  const summaryResultLabel =
    document.getElementById(
      'summaryResultLabel'
    );


  if (summaryRate) {

    summaryRate.textContent =
      formatNumber(
        calculation.rate,
        0
      ) +
      ' FCFA / USDT';

  }


  if (summaryCfa) {

    summaryCfa.textContent =
      formatNumber(
        calculation.fiatAmount,
        0
      ) +
      ' FCFA';

  }


  if (summaryUsdt) {

    summaryUsdt.textContent =
      formatNumber(
        calculation.cryptoAmount,
        6
      ) +
      ' USDT';

  }


  if (summaryFee) {

    summaryFee.textContent =
      formatNumber(
        calculation.fee,
        2
      ) +
      ' USDT';

  }


  if (summaryResultLabel) {

    if (orderType === 'buy') {

      summaryResultLabel.textContent =
        'Vous recevez';

    } else {

      summaryResultLabel.textContent =
        'Vous recevez';

    }

  }


  if (summaryResult) {

    let result;


    if (orderType === 'buy') {

      /*
       * Pour un achat, les frais réseau sont retirés
       * du montant USDT reçu.
       */

      result =
        Math.max(
          0,
          calculation.cryptoAmount -
          calculation.fee
        );

    } else {

      /*
       * Pour une vente, le client vend son USDT
       * et reçoit le montant FCFA.
       */

      result =
        calculation.fiatAmount;

    }


    if (orderType === 'buy') {

      summaryResult.textContent =
        formatNumber(
          result,
          6
        ) +
        ' USDT';

    } else {

      summaryResult.textContent =
        formatNumber(
          result,
          0
        ) +
        ' FCFA';

    }

  }

}


// ============================================================
// RESET ÉCHANGE
// ============================================================

function resetExchange() {

  const amountInput =
    document.getElementById(
      'amountInput'
    );


  if (amountInput) {

    amountInput.value = '';

  }


  setOrderType(
    'buy'
  );


  setNetwork(
    'trc20'
  );


  updateCalculation();

}


// ============================================================
// VÉRIFICATION COMMANDE
// ============================================================

function reviewOrder() {

  clearMessage();


  if (!currentUser) {

    showMessage(
      'Veuillez vous connecter avant de passer une commande.',
      'error'
    );

    activateAuthTab(
      'login'
    );

    showAuthPage();

    return;

  }


  const calculation =
    calculateOrder();


  if (
    !calculation.amount ||
    calculation.amount <= 0
  ) {

    showMessage(
      'Veuillez saisir un montant.',
      'error'
    );

    return;

  }


  // ----------------------------------------------------------
  // VALIDATION ACHAT
  // ----------------------------------------------------------

  if (orderType === 'buy') {

    if (
      calculation.fiatAmount <
      MIN_FIAT_AMOUNT
    ) {

      showMessage(
        'Le montant minimum est de ' +
        formatNumber(
          MIN_FIAT_AMOUNT,
          0
        ) +
        ' FCFA.',
        'error'
      );

      return;

    }


    if (
      calculation.fiatAmount >
      MAX_FIAT_AMOUNT
    ) {

      showMessage(
        'Le montant maximum est de ' +
        formatNumber(
          MAX_FIAT_AMOUNT,
          0
        ) +
        ' FCFA.',
        'error'
      );

      return;

    }

  }


  // ----------------------------------------------------------
  // VALIDATION VENTE
  // ----------------------------------------------------------

  if (orderType === 'sell') {

    if (
      calculation.cryptoAmount <
      MIN_SELL_USDT
    ) {

      showMessage(
        'Le montant minimum pour une vente est de ' +
        formatNumber(
          MIN_SELL_USDT,
          6
        ) +
        ' USDT.',
        'error'
      );

      return;

    }


    if (
      calculation.cryptoAmount >
      MAX_SELL_USDT
    ) {

      showMessage(
        'Le montant maximum pour une vente est de ' +
        formatNumber(
          MAX_SELL_USDT,
          6
        ) +
        ' USDT.',
        'error'
      );

      return;

    }

  }


  currentOrderDraft = {

    type:
      orderType,

    network:
      selectedNetwork,

    paymentMethod:
      PAYMENT_METHOD,

    cryptoAmount:
      calculation.cryptoAmount,

    fiatAmount:
      calculation.fiatAmount,

    rate:
      calculation.rate,

    fee:
      calculation.fee

  };


  renderConfirmation(
    currentOrderDraft
  );


  showSubPage(
    'confirmationPage'
  );

}


// ============================================================
// CONFIRMATION
// ============================================================

function renderConfirmation(order) {

  const container =
    document.getElementById(
      'confirmationSummary'
    );


  if (!container) {

    return;

  }


  const typeLabel =
    order.type === 'buy'
      ? 'Achat USDT'
      : 'Vente USDT';


  const networkLabel =
    order.network === 'trc20'
      ? 'USDT TRC20'
      : 'USDT BP20';


  let resultHtml;


  if (order.type === 'buy') {

    const received =
      Math.max(
        0,
        order.cryptoAmount -
        order.fee
      );


    resultHtml = `
      <div class="summary-row">
        <span>Vous recevez</span>
        <strong>
          ${formatNumber(received, 6)} USDT
        </strong>
      </div>
    `;

  } else {

    resultHtml = `
      <div class="summary-row">
        <span>Vous recevez</span>
        <strong>
          ${formatNumber(order.fiatAmount, 0)} FCFA
        </strong>
      </div>
    `;

  }


  container.innerHTML = `

    <div class="summary-row">
      <span>Opération</span>
      <strong>
        ${escapeHtml(typeLabel)}
      </strong>
    </div>

    <div class="summary-row">
      <span>Réseau</span>
      <strong>
        ${escapeHtml(networkLabel)}
      </strong>
    </div>

    <div class="summary-row">
      <span>Taux</span>
      <strong>
        ${formatNumber(order.rate, 0)}
        FCFA / USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Montant FCFA</span>
      <strong>
        ${formatNumber(order.fiatAmount, 0)}
        FCFA
      </strong>
    </div>

    <div class="summary-row">
      <span>Montant USDT</span>
      <strong>
        ${formatNumber(order.cryptoAmount, 6)}
        USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Frais réseau</span>
      <strong>
        ${formatNumber(order.fee, 2)}
        USDT
      </strong>
    </div>

    ${resultHtml}

    <div class="summary-row">
      <span>Moyen de paiement</span>
      <strong>
        Orange Money
      </strong>
    </div>

  `;

}


// ============================================================
// PLACER LA COMMANDE
// ============================================================

function setupPayment() {

  const placeOrderBtn =
    document.getElementById(
      'placeOrderBtn'
    );


  if (placeOrderBtn) {

    placeOrderBtn.addEventListener(
      'click',
      async function () {

        await placeOrder();

      }
    );

  }


  const paymentDoneBtn =
    document.getElementById(
      'paymentDoneBtn'
    );


  if (paymentDoneBtn) {

    paymentDoneBtn.addEventListener(
      'click',
      async function () {

        await markPaymentDone();

      }
    );

  }

}


// ============================================================
// CRÉATION COMMANDE SUPABASE
// ============================================================

async function placeOrder() {

  if (!currentUser) {

    showMessage(
      'Votre session a expiré. Veuillez vous reconnecter.',
      'error'
    );

    showAuthPage();

    return;

  }


  if (!currentOrderDraft) {

    showMessage(
      'Aucune commande à confirmer.',
      'error'
    );

    return;

  }


  const button =
    document.getElementById(
      'placeOrderBtn'
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      'Enregistrement...';

  }


  try {

    const profile =
      await getOrCreateUserProfile(
        currentUser
      );


    currentProfile =
      profile;


    const order =
      currentOrderDraft;


    const insertData = {

      user_id:
        profile.id,

      type:
        order.type,

      crypto_amount:
        order.cryptoAmount,

      fiat_amount:
        order.fiatAmount,

      rate:
        order.rate,

      network:
        order.network,

      wallet_address:
        null,

      payment_method:
        PAYMENT_METHOD,

      status:
        'pending'

    };


    const {
      data,
      error
    } =
      await supabaseClient
        .from('orders')
        .insert(
          insertData
        )
        .select()
        .single();


    if (error) {

      throw error;

    }


    if (!data) {

      throw new Error(
        'La commande n’a pas été retournée par Supabase.'
      );

    }


    currentOrder =
      data;


    console.log(
      'Commande créée :',
      data
    );


    renderPaymentPage(
      data
    );


    showMessage(
      'Commande enregistrée avec succès.',
      'success'
    );


    showSubPage(
      'paymentPage'
    );


    await loadOrders();


  } catch (error) {

    console.error(
      'Erreur création commande :',
      error
    );


    showMessage(
      'Impossible d’enregistrer la commande : ' +
      getErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Placer la commande';

    }

  }

}


// ============================================================
// PAGE PAIEMENT
// ============================================================

function renderPaymentPage(
  order
) {

  const paymentAmount =
    document.getElementById(
      'paymentAmount'
    );


  const paymentCode =
    document.getElementById(
      'paymentCode'
    );


  if (!order) {

    return;

  }


  const amount =
    Number(
      order.fiat_amount
    ) || 0;


  if (paymentAmount) {

    paymentAmount.textContent =
      'Montant : ' +
      formatNumber(
        amount,
        0
      ) +
      ' FCFA';

  }


  if (paymentCode) {

    paymentCode.textContent =
      '*144*10*74602553*' +
      Math.round(amount) +
      '#';

  }

}


// ============================================================
// PAIEMENT EFFECTUÉ
// ============================================================

async function markPaymentDone() {

  if (!currentOrder) {

    showMessage(
      'Aucune commande active.',
      'error'
    );

    return;

  }


  const button =
    document.getElementById(
      'paymentDoneBtn'
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      'Confirmation...';

  }


  try {

    /*
     * Nous ne validons pas le paiement automatiquement.
     * La commande reste en attente pour vérification
     * par l'administrateur.
     */

    const {
      data,
      error
    } =
      await supabaseClient
        .from('orders')
        .update({

          status:
            'processing'

        })
        .eq(
          'id',
          currentOrder.id
        )
        .select()
        .single();


    if (error) {

      /*
       * Si la policy RLS empêche la modification du statut,
       * on conserve la commande en pending et on informe
       * l'utilisateur.
       */

      console.warn(
        'Impossible de changer le statut :',
        error
      );


      showMessage(
        'Votre commande est enregistrée. Le paiement sera vérifié par le service client.',
        'success'
      );

    } else {

      currentOrder =
        data || currentOrder;


      showMessage(
        'Paiement signalé. Votre commande est maintenant en cours de vérification.',
        'success'
      );

    }


    await loadOrders();


    setTimeout(
      function () {

        showSubPage(
          'ordersPage'
        );

      },
      700
    );


  } catch (error) {

    console.error(
      'Erreur signalement paiement :',
      error
    );


    showMessage(
      'Votre commande est enregistrée. Le paiement sera vérifié par le service client.',
      'success'
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "J'ai effectué le paiement";

    }

  }

}


// ============================================================
// CHARGER LES COMMANDES
// ============================================================

async function loadOrders() {

  const container =
    document.getElementById(
      'ordersList'
    );


  if (!container) {

    return;

  }


  if (!currentUser) {

    container.innerHTML = `
      <div class="small center">
        Connectez-vous pour consulter vos commandes.
      </div>
    `;

    return;

  }


  container.innerHTML = `
    <div class="small center">
      Chargement des commandes...
    </div>
  `;


  try {

    const profile =
      await getOrCreateUserProfile(
        currentUser
      );


    currentProfile =
      profile;


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
          wallet_address,
          payment_method,
          status,
          created_at
        `)
        .eq(
          'user_id',
          profile.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    if (
      !orders ||
      orders.length === 0
    ) {

      container.innerHTML = `
        <div class="small center">
          Vous n'avez encore aucune commande.
        </div>
      `;

      populateDisputeOrders([]);

      return;

    }


    container.innerHTML =
      orders
        .map(
          createOrderCard
        )
        .join('');


    populateDisputeOrders(
      orders
    );


  } catch (error) {

    console.error(
      'Erreur chargement commandes :',
      error
    );


    container.innerHTML = `
      <div class="small center">
        Impossible de charger vos commandes.
        <br><br>
        ${escapeHtml(
          getErrorMessage(error)
        )}
      </div>
    `;

  }

}


// ============================================================
// CARTE COMMANDE
// ============================================================

function createOrderCard(
  order
) {

  const isBuy =
    order.type === 'buy';


  const typeLabel =
    isBuy
      ? 'Achat USDT'
      : 'Vente USDT';


  const networkLabel =
    String(
      order.network || ''
    ).toLowerCase() ===
    'trc20'
      ? 'USDT TRC20'
      : 'USDT BP20';


  const statusText =
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
    'Orange Money';


  const date =
    formatDate(
      order.created_at
    );


  return `

    <div class="order-card">

      <div class="order-header">

        <div class="order-type">
          ${escapeHtml(typeLabel)}
        </div>

        <span class="status ${statusClass}">
          ${escapeHtml(statusText)}
        </span>

      </div>


      <div class="order-row">
        <span>Montant USDT</span>
        <strong>
          ${cryptoAmount} USDT
        </strong>
      </div>


      <div class="order-row">
        <span>Montant FCFA</span>
        <strong>
          ${fiatAmount} FCFA
        </strong>
      </div>


      <div class="order-row">
        <span>Taux</span>
        <strong>
          ${rate} FCFA / USDT
        </strong>
      </div>


      <div class="order-row">
        <span>Réseau</span>
        <strong>
          ${escapeHtml(networkLabel)}
        </strong>
      </div>


      <div class="order-row">
        <span>Paiement</span>
        <strong>
          ${escapeHtml(paymentMethod)}
        </strong>
      </div>


      <div class="order-row">
        <span>Date</span>
        <strong>
          ${escapeHtml(date)}
        </strong>
      </div>

    </div>

  `;

}


// ============================================================
// STATUT COMMANDE
// ============================================================

function formatStatus(
  status
) {

  const value =
    String(
      status || ''
    )
      .toLowerCase();


  if (value === 'pending') {

    return 'En attente';

  }


  if (
    value === 'processing'
  ) {

    return 'En cours';

  }


  if (
    value === 'completed' ||
    value === 'approved' ||
    value === 'validated'
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


// ============================================================
// CLASSE STATUT
// ============================================================

function getStatusClass(
  status
) {

  const value =
    String(
      status || ''
    )
      .toLowerCase();


  if (
    value === 'processing'
  ) {

    return 'processing';

  }


  if (
    value === 'completed' ||
    value === 'approved' ||
    value === 'validated'
  ) {

    return 'completed';

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


// ============================================================
// SUPPORT / LITIGES
// ============================================================

function setupSupport() {

  const disputeForm =
    document.getElementById(
      'disputeForm'
    );


  if (disputeForm) {

    disputeForm.addEventListener(
      'submit',
      async function (event) {

        event.preventDefault();

        await createDispute();

      }
    );

  }

}


// ============================================================
// LISTE COMMANDES POUR LITIGE
// ============================================================

function populateDisputeOrders(
  orders = null
) {

  const select =
    document.getElementById(
      'disputeOrder'
    );


  if (!select) {

    return;

  }


  if (orders === null) {

    /*
     * Les commandes seront chargées
     * par loadOrders().
     */

    return;

  }


  select.innerHTML = `
    <option value="">
      Sélectionner une commande
    </option>
  `;


  orders.forEach(
    function (order) {

      const option =
        document.createElement(
          'option'
        );


      option.value =
        order.id;


      const label =
        (
          order.type === 'buy'
            ? 'Achat'
            : 'Vente'
        ) +
        ' - ' +
        formatNumber(
          order.fiat_amount,
          0
        ) +
        ' FCFA - ' +
        formatDate(
          order.created_at
        );


      option.textContent =
        label;


      select.appendChild(
        option
      );

    }
  );

}


// ============================================================
// CRÉER UN LITIGE
// ============================================================

async function createDispute() {

  if (!currentUser) {

    showMessage(
      'Veuillez vous connecter.',
      'error'
    );

    return;

  }


  const orderSelect =
    document.getElementById(
      'disputeOrder'
    );

  const subjectInput =
    document.getElementById(
      'disputeSubject'
    );

  const messageInput =
    document.getElementById(
      'disputeMessage'
    );


  if (
    !orderSelect ||
    !subjectInput ||
    !messageInput
  ) {

    showMessage(
      'Formulaire de support introuvable.',
      'error'
    );

    return;

  }


  const orderId =
    orderSelect.value;

  const subject =
    subjectInput.value.trim();

  const message =
    messageInput.value.trim();


  if (
    !orderId ||
    !subject ||
    !message
  ) {

    showMessage(
      'Veuillez remplir tous les champs du litige.',
      'error'
    );

    return;

  }


  const button =
    document.querySelector(
      '#disputeForm button[type="submit"]'
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      'Envoi...';

  }


  try {

    const profile =
      await getOrCreateUserProfile(
        currentUser
      );


    /*
     * Structure standard prévue :
     *
     * user_id
     * order_id
     * subject
     * message
     * status
     */

    const {
      data,
      error
    } =
      await supabaseClient
        .from('disputes')
        .insert({

          user_id:
            profile.id,

          order_id:
            orderId,

          subject:
            subject,

          message:
            message,

          status:
            'open'

        })
        .select()
        .single();


    if (error) {

      throw error;

    }


    console.log(
      'Litige créé :',
      data
    );


    subjectInput.value = '';

    messageInput.value = '';

    orderSelect.value = '';


    showMessage(
      'Votre litige a été envoyé au service client.',
      'success'
    );


    await loadDisputes();


  } catch (error) {

    console.error(
      'Erreur création litige :',
      error
    );


    showMessage(
      'Impossible d’envoyer le litige : ' +
      getErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Envoyer au service client';

    }

  }

}


// ============================================================
// CHARGER LITIGES
// ============================================================

async function loadDisputes() {

  const container =
    document.getElementById(
      'disputesList'
    );


  if (!container) {

    return;

  }


  if (!currentUser) {

    container.innerHTML = `
      <div class="small center">
        Connectez-vous pour consulter vos litiges.
      </div>
    `;

    return;

  }


  container.innerHTML = `
    <div class="small center">
      Chargement...
    </div>
  `;


  try {

    const profile =
      await getOrCreateUserProfile(
        currentUser
      );


    const {
      data: disputes,
      error
    } =
      await supabaseClient
        .from('disputes')
        .select(`
          id,
          order_id,
          subject,
          message,
          status,
          created_at
        `)
        .eq(
          'user_id',
          profile.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    if (
      !disputes ||
      disputes.length === 0
    ) {

      container.innerHTML = `
        <div class="small center">
          Aucun litige pour le moment.
        </div>
      `;

      return;

    }


    container.innerHTML =
      disputes
        .map(
          createDisputeCard
        )
        .join('');


  } catch (error) {

    console.error(
      'Erreur chargement litiges :',
      error
    );


    container.innerHTML = `
      <div class="small center">
        Impossible de charger vos litiges.
      </div>
    `;

  }

}


// ============================================================
// CARTE LITIGE
// ============================================================

function createDisputeCard(
  dispute
) {

  const status =
    formatDisputeStatus(
      dispute.status
    );


  return `

    <div class="order-card">

      <div class="order-header">

        <div class="order-type">
          ${escapeHtml(
            dispute.subject ||
            'Litige'
          )}
        </div>

        <span class="status processing">
          ${escapeHtml(status)}
        </span>

      </div>


      <div class="order-row">
        <span>Commande</span>
        <strong>
          ${escapeHtml(
            dispute.order_id || ''
          )}
        </strong>
      </div>


      <div class="order-row">
        <span>Date</span>
        <strong>
          ${escapeHtml(
            formatDate(
              dispute.created_at
            )
          )}
        </strong>
      </div>


      <div class="small mt">
        ${escapeHtml(
          dispute.message || ''
        )}
      </div>

    </div>

  `;

}


// ============================================================
// STATUT LITIGE
// ============================================================

function formatDisputeStatus(
  status
) {

  const value =
    String(
      status || ''
    )
      .toLowerCase();


  if (
    value === 'open'
  ) {

    return 'Ouvert';

  }


  if (
    value === 'processing'
  ) {

    return 'En cours';

  }


  if (
    value === 'resolved' ||
    value === 'closed'
  ) {

    return 'Résolu';

  }


  return status ||
    'Ouvert';

}


// ============================================================
// TARIFS AFFICHÉS
// ============================================================

function updateRatesDisplay() {

  setText(
    'homeBuyRate',
    formatNumber(
      BUY_RATE,
      0
    )
  );


  setText(
    'homeSellRate',
    formatNumber(
      SELL_RATE,
      0
    )
  );


  setText(
    'homeMinOrder',
    formatNumber(
      MIN_FIAT_AMOUNT,
      0
    )
  );


  setText(
    'homeMaxOrder',
    formatNumber(
      MAX_FIAT_AMOUNT,
      0
    )
  );


  setText(
    'homeTrc20Fee',
    formatNumber(
      NETWORK_FEES.trc20,
      0
    )
  );


  setText(
    'homeBp20Fee',
    formatNumber(
      NETWORK_FEES.bp20,
      0
    )
  );


  setText(
    'trc20Fee',
    formatNumber(
      NETWORK_FEES.trc20,
      0
    )
  );


  setText(
    'bp20Fee',
    formatNumber(
      NETWORK_FEES.bp20,
      0
    )
  );

}


// ============================================================
// DÉCONNEXION
// ============================================================

async function logoutUser() {

  if (!supabaseClient) {

    return;

  }


  const button =
    document.getElementById(
      'logoutBtn'
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      'Déconnexion...';

  }


  try {

    const {
      error
    } =
      await supabaseClient.auth.signOut();


    if (error) {

      throw error;

    }


    currentUser = null;

    currentProfile = null;

    currentOrder = null;

    currentOrderDraft = null;


    showAuthPage();

    activateAuthTab(
      'login'
    );


    showMessage(
      'Vous avez été déconnecté.',
      'success'
    );


  } catch (error) {

    console.error(
      'Erreur déconnexion :',
      error
    );


    showMessage(
      'Erreur de déconnexion : ' +
      getErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Déconnexion';

    }

  }

}


// ============================================================
// MESSAGES
// ============================================================

function showMessage(
  message,
  type = 'info'
) {

  const element =
    document.getElementById(
      'appMessage'
    );


  if (!element) {

    console.log(
      message
    );

    return;

  }


  element.className = '';

  element.id =
    'appMessage';

  element.classList.add(
    type
  );


  element.textContent =
    message;


  element.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });

}


// ============================================================
// EFFACER MESSAGE
// ============================================================

function clearMessage() {

  const element =
    document.getElementById(
      'appMessage'
    );


  if (!element) {

    return;

  }


  element.textContent = '';

  element.className = '';

  element.id =
    'appMessage';

}


// ============================================================
// TEXTE HTML
// ============================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


// ============================================================
// FORMAT NOMBRE
// ============================================================

function formatNumber(
  value,
  decimals = 2
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {

    return '0';

  }


  return number.toLocaleString(
    'fr-FR',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        decimals
    }
  );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
  value
) {

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

    return String(value);

  }


  return date.toLocaleString(
    'fr-FR',
    {
      dateStyle:
        'short',

      timeStyle:
        'short'
    }
  );

}


// ============================================================
// EMAIL
// ============================================================

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


// ============================================================
// TRADUCTION ERREURS AUTH
// ============================================================

function translateAuthError(
  error
) {

  const message =
    getErrorMessage(
      error
    );


  const lower =
    message.toLowerCase();


  if (
    lower.includes(
      'user already registered'
    ) ||
    lower.includes(
      'already registered'
    ) ||
    lower.includes(
      'already been registered'
    )
  ) {

    return (
      'Cette adresse email est déjà utilisée. Essayez de vous connecter.'
    );

  }


  if (
    lower.includes(
      'invalid login credentials'
    )
  ) {

    return (
      'Email ou mot de passe incorrect.'
    );

  }


  if (
    lower.includes(
      'email not confirmed'
    )
  ) {

    return (
      'Votre email n’est pas encore confirmé. Vérifiez votre boîte email.'
    );

  }


  if (
    lower.includes(
      'password should be at least'
    )
  ) {

    return (
      'Le mot de passe doit contenir au moins 6 caractères.'
    );

  }


  if (
    lower.includes(
      'rate limit'
    )
  ) {

    return (
      'Trop de tentatives. Veuillez patienter quelques instants.'
    );

  }


  return (
    'Erreur : ' +
    message
  );

}


// ============================================================
// EXTRACTION MESSAGE ERREUR
// ============================================================

function getErrorMessage(
  error
) {

  if (!error) {

    return 'Erreur inconnue.';

  }


  if (
    typeof error ===
    'string'
  ) {

    return error;

  }


  return (
    error.message ||
    error.error_description ||
    error.details ||
    'Erreur inconnue.'
  );

}


// ============================================================
// PROTECTION HTML
// ============================================================

function escapeHtml(
  value
) {

  return String(
    value ?? ''
  )
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
// EXPORT GLOBAL POUR DEBUG
// ============================================================

window.NoaDigitTrade = {

  supabase:
    supabaseClient,

  login:
    loginUser,

  register:
    registerUser,

  logout:
    logoutUser,

  loadOrders:
    loadOrders,

  loadDisputes:
    loadDisputes,

  updateCalculation:
    updateCalculation

};


console.log(
  'NOA DIGIT TRADE - app.js chargé correctement.'
);
