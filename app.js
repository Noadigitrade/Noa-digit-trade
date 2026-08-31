// ============================================================
// NOA DIGIT TRADE
// APP.JS COMPLET - VERSION CORRIGÉE
//
// SUPABASE AUTH
// PROFILES
// ORDERS
// HISTORIQUE
// CONFIRMATION COMMANDE
// ORANGE MONEY
// PAIEMENTS
// LITIGES
// RLS
// ADMIN / ROLE
// ============================================================


// ============================================================
// CONFIGURATION SUPABASE
// ============================================================

const SUPABASE_URL =
  "https://vowafwsvrjpkhkocptih.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC";


if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {
  console.error(
    "Supabase JS n'est pas chargé."
  );
}


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ============================================================
// CONFIGURATION APPLICATION
// ============================================================

const CONFIG = {

  buyRate: 600,

  sellRate: 570,

  minOrder: 2000,

  maxOrder: 50000,


  networks: {

    trc20: {

      name: "USDT TRC20",

      fee: 2

    },


    // Clé interne utilisée par la base
    // pour représenter le réseau BEP20.
    bp20: {

      name: "USDT BEP20",

      fee: 0

    }

  },


  payment: {

    method: "orange_money",

    number: "74602553",

    displayNumber: "74 60 25 53"

  }

};


// ============================================================
// ETAT GLOBAL
// ============================================================

let currentUser = null;

let currentProfile = null;

let currentOrder = null;

let currentExchangeType = "buy";

let currentNetwork = "trc20";

let applicationInitializing = false;

let authListenerReady = false;

let initializationPromise = null;


// ============================================================
// RACCOURCI DOM
// ============================================================

function $(id) {

  return document.getElementById(id);

}


// ============================================================
// MESSAGE GLOBAL
// ============================================================

function showMessage(
  message,
  type = "info"
) {

  const box =
    $("appMessage");

  if (!box) {

    console.log(
      `[${type}]`,
      message
    );

    return;

  }


  box.textContent =
    String(message || "");


  box.className =
    "app-message " + type;

}


function hideMessage() {

  const box =
    $("appMessage");

  if (!box) return;


  box.textContent = "";

  box.className =
    "app-message";

}


// ============================================================
// UTILITAIRES
// ============================================================

function formatNumber(value) {

  const number =
    Number(value) || 0;


  return number.toLocaleString(
    "fr-FR"
  );

}


function formatDecimal(
  value,
  decimals = 6
) {

  const number =
    Number(value) || 0;


  return number.toFixed(
    decimals
  );

}


function formatDate(value) {

  if (!value) {

    return "-";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date.toLocaleString(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function normalizePhone(phone) {

  return String(phone || "")
    .replace(/\s+/g, "")
    .trim();

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function getSupabaseErrorMessage(error) {

  if (!error) {

    return "Erreur inconnue.";

  }


  return (
    error.message ||
    error.error_description ||
    error.details ||
    error.hint ||
    "Erreur inconnue."
  );

}


function isValidUUID(value) {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      String(value || "")
    );

}


// ============================================================
// NAVIGATION AUTH
// ============================================================

function showAuthPage() {

  $("authPage")
    ?.classList
    .add("active");


  $("appPage")
    ?.classList
    .remove("active");


  $("bottomNav")
    ?.classList
    .add("hidden");

}


function showAppPage() {

  $("authPage")
    ?.classList
    .remove("active");


  $("appPage")
    ?.classList
    .add("active");


  $("bottomNav")
    ?.classList
    .remove("hidden");

}


// ============================================================
// NAVIGATION APPLICATION
// ============================================================

function showSubPage(pageId) {

  const pages =
    document.querySelectorAll(
      ".sub-page"
    );


  pages.forEach(page => {

    page.classList.add(
      "hidden"
    );

    page.classList.remove(
      "active"
    );

  });


  const target =
    $(pageId);


  if (target) {

    target.classList.remove(
      "hidden"
    );

    target.classList.add(
      "active"
    );

  }


  const navButtons =
    document.querySelectorAll(
      ".nav-btn"
    );


  navButtons.forEach(button => {

    button.classList.remove(
      "active"
    );


    if (
      button.dataset.page ===
      pageId
    ) {

      button.classList.add(
        "active"
      );

    }

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (
    pageId === "ordersPage"
  ) {

    loadOrderHistory();

  }


  if (
    pageId === "supportPage"
  ) {

    loadDisputes();

    loadOrdersForDispute();

  }

}


// ============================================================
// FORMULAIRES AUTH
// ============================================================

function showLoginForm() {

  $("loginTab")
    ?.classList
    .add("active");


  $("registerTab")
    ?.classList
    .remove("active");


  $("loginForm")
    ?.classList
    .add("active");


  $("registerForm")
    ?.classList
    .remove("active");

}


function showRegisterForm() {

  $("loginTab")
    ?.classList
    .remove("active");


  $("registerTab")
    ?.classList
    .add("active");


  $("loginForm")
    ?.classList
    .remove("active");


  $("registerForm")
    ?.classList
    .add("active");

}


// ============================================================
// INSCRIPTION
// ============================================================

async function registerUser(event) {

  event.preventDefault();

  hideMessage();


  const name =
    $("registerName")
      ?.value
      .trim();


  const phone =
    normalizePhone(
      $("registerPhone")
        ?.value
    );


  const country =
    $("registerCountry")
      ?.value
      .trim();


  const email =
    $("registerEmail")
      ?.value
      .trim()
      .toLowerCase();


  const password =
    $("registerPassword")
      ?.value || "";


  const confirmPassword =
    $("registerPasswordConfirm")
      ?.value || "";


  if (!name) {

    showMessage(
      "Veuillez saisir votre nom et prénom.",
      "error"
    );

    return;

  }


  if (!phone) {

    showMessage(
      "Veuillez saisir votre numéro de téléphone.",
      "error"
    );

    return;

  }


  if (!email) {

    showMessage(
      "Veuillez saisir votre adresse email.",
      "error"
    );

    return;

  }


  if (!password) {

    showMessage(
      "Veuillez saisir un mot de passe.",
      "error"
    );

    return;

  }


  if (password.length < 6) {

    showMessage(
      "Le mot de passe doit contenir au moins 6 caractères.",
      "error"
    );

    return;

  }


  if (
    password !==
    confirmPassword
  ) {

    showMessage(
      "Les deux mots de passe ne correspondent pas.",
      "error"
    );

    return;

  }


  if (
    country !==
    "Burkina Faso"
  ) {

    showMessage(
      "NOA DIGIT TRADE est réservé au Burkina Faso.",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("registerForm")
      ?.querySelector(
        'button[type="submit"]'
      );


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled = true;

    button.textContent =
      "Création du compte...";

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email,

        password,

        options: {

          data: {

            full_name:
              name,

            phone:
              phone,

            country:
              country

          }

        }

      });


    if (error) {

      throw error;

    }


    if (!data?.user) {

      throw new Error(
        "Le compte Auth n'a pas pu être créé."
      );

    }


    currentUser =
      data.user;


    // --------------------------------------------------------
    // SESSION DISPONIBLE
    // --------------------------------------------------------

    if (data.session) {

      const profile =
        await loadUserProfile();


      if (!profile) {

        throw new Error(
          "Le profil utilisateur n'a pas pu être chargé."
        );

      }


      await initializeApplication();


      showMessage(
        "Compte créé avec succès. Bienvenue sur NOA DIGIT TRADE !",
        "success"
      );


      return;

    }


    // --------------------------------------------------------
    // CONFIRMATION EMAIL
    // --------------------------------------------------------

    currentProfile =
      null;


    showMessage(
      "Compte créé avec succès. Vérifiez votre adresse email puis connectez-vous.",
      "success"
    );


    showLoginForm();


    if ($("loginEmail")) {

      $("loginEmail").value =
        email;

    }

  }

  catch (error) {

    console.error(
      "Erreur inscription :",
      error
    );


    let message =
      getSupabaseErrorMessage(
        error
      );


    const lower =
      message.toLowerCase();


    if (
      lower.includes(
        "already registered"
      ) ||
      lower.includes(
        "user already registered"
      ) ||
      lower.includes(
        "already exists"
      )
    ) {

      message =
        "Cette adresse email est déjà utilisée.";

    }


    showMessage(
      message,
      "error"
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "Créer mon compte";

    }

  }

}


// ============================================================
// PROFIL
// ============================================================

async function loadUserProfile() {

  if (!currentUser) {

    return null;

  }


  try {

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {

      throw sessionError;

    }


    const session =
      sessionData?.session;


    if (!session?.user) {

      currentUser = null;

      currentProfile = null;

      return null;

    }


    currentUser =
      session.user;


    // --------------------------------------------------------
    // LECTURE PROFIL
    // --------------------------------------------------------

    const {
      data: profile,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,full_name,phone,country,role"
        )
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();


    if (error) {

      throw error;

    }


    if (profile) {

      currentProfile =
        profile;

      updateUserInterface();

      return currentProfile;

    }


    // --------------------------------------------------------
    // PROFIL ABSENT
    //
    // On tente de le créer.
    // Le trigger SQL peut également l'avoir
    // créé automatiquement.
    // --------------------------------------------------------

    const metadata =
      currentUser.user_metadata ||
      {};


    const profilePayload = {

      id:
        currentUser.id,

      full_name:
        metadata.full_name ||
        metadata.name ||
        "",

      phone:
        metadata.phone ||
        "",

      country:
        metadata.country ||
        "Burkina Faso"

    };


    const {
      data: insertedProfile,
      error: insertError
    } =
      await supabaseClient
        .from("profiles")
        .insert(
          profilePayload
        )
        .select(
          "id,full_name,phone,country,role"
        )
        .single();


    if (!insertError) {

      currentProfile =
        insertedProfile;

      updateUserInterface();

      return currentProfile;

    }


    // --------------------------------------------------------
    // PROFIL DÉJÀ CRÉÉ ENTRE-TEMPS
    // --------------------------------------------------------

    if (
      insertError.code ===
      "23505"
    ) {

      const {
        data: existingProfile,
        error: reloadError
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id,full_name,phone,country,role"
          )
          .eq(
            "id",
            currentUser.id
          )
          .maybeSingle();


      if (reloadError) {

        throw reloadError;

      }


      if (existingProfile) {

        currentProfile =
          existingProfile;

        updateUserInterface();

        return currentProfile;

      }

    }


    throw insertError;

  }

  catch (error) {

    console.error(
      "Erreur chargement profil :",
      error
    );


    currentProfile =
      null;


    showMessage(
      "Impossible de charger votre profil : " +
      getSupabaseErrorMessage(error),
      "error"
    );


    return null;

  }

}


// ============================================================
// INTERFACE PROFIL
// ============================================================

function updateUserInterface() {

  if (!currentUser) {

    return;

  }


  const profile =
    currentProfile || {};


  const metadata =
    currentUser.user_metadata ||
    {};


  const name =
    profile.full_name ||
    metadata.full_name ||
    metadata.name ||
    "Utilisateur";


  const phone =
    profile.phone ||
    metadata.phone ||
    "";


  const country =
    profile.country ||
    metadata.country ||
    "Burkina Faso";


  if ($("userName")) {

    $("userName").textContent =
      name;

  }


  if ($("userCountry")) {

    $("userCountry").textContent =
      "🇧🇫 " + country;

  }


  if ($("profileName")) {

    $("profileName").value =
      name;

  }


  if ($("profilePhone")) {

    $("profilePhone").value =
      phone;

  }


  if ($("profileCountry")) {

    $("profileCountry").value =
      country;

  }


  // ----------------------------------------------------------
  // ROLE ADMIN
  // ----------------------------------------------------------

  if (
    $("adminBadge")
  ) {

    const isAdmin =
      profile.role ===
      "admin";

    $("adminBadge")
      .classList
      .toggle(
        "hidden",
        !isAdmin
      );

  }

}


// ============================================================
// INITIALISATION APPLICATION
// ============================================================

async function initializeApplication() {

  if (applicationInitializing) {

    return initializationPromise;

  }


  applicationInitializing =
    true;


  initializationPromise =
    (async () => {

      try {

        showAppPage();

        updateRatesUI();


        // ----------------------------------------------------
        // SESSION
        // ----------------------------------------------------

        if (!currentUser) {

          const {
            data,
            error
          } =
            await supabaseClient.auth
              .getUser();


          if (error) {

            throw error;

          }


          if (data?.user) {

            currentUser =
              data.user;

          }

        }


        if (!currentUser) {

          throw new Error(
            "Aucun utilisateur connecté."
          );

        }


        // ----------------------------------------------------
        // PROFIL
        // ----------------------------------------------------

        const profile =
          await loadUserProfile();


        if (!profile) {

          throw new Error(
            "Impossible de charger votre profil."
          );

        }


        updateUserInterface();

        updateCalculator();


        showSubPage(
          "homePage"
        );


        await loadOrderHistory();

      }

      catch (error) {

        console.error(
          "Erreur initialisation :",
          error
        );


        showAuthPage();


        showMessage(
          "Impossible d'initialiser l'application : " +
          getSupabaseErrorMessage(error),
          "error"
        );

      }

      finally {

        applicationInitializing =
          false;

        initializationPromise =
          null;

      }

    })();


  return initializationPromise;

}


// ============================================================
// CONNEXION
// ============================================================

async function loginUser(event) {

  event.preventDefault();

  hideMessage();


  const email =
    $("loginEmail")
      ?.value
      .trim()
      .toLowerCase();


  const password =
    $("loginPassword")
      ?.value || "";


  if (!email || !password) {

    showMessage(
      "Veuillez remplir tous les champs.",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("loginForm")
      ?.querySelector(
        'button[type="submit"]'
      );


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled = true;

    button.textContent =
      "Connexion...";

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({

          email,

          password

        });


    if (error) {

      throw error;

    }


    if (!data?.user) {

      throw new Error(
        "Connexion impossible."
      );

    }


    currentUser =
      data.user;


    const profile =
      await loadUserProfile();


    if (!profile) {

      throw new Error(
        "Impossible de charger votre profil."
      );

    }


    await initializeApplication();


    showMessage(
      "Connexion réussie.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur connexion :",
      error
    );


    let message =
      getSupabaseErrorMessage(
        error
      );


    const lower =
      message.toLowerCase();


    if (
      lower.includes(
        "invalid login credentials"
      )
    ) {

      message =
        "Email ou mot de passe incorrect.";

    }


    if (
      lower.includes(
        "email not confirmed"
      )
    ) {

      message =
        "Votre adresse email n'est pas encore confirmée. Vérifiez votre boîte email.";

    }


    showMessage(
      message,
      "error"
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "Se connecter";

    }

  }

}


// ============================================================
// DECONNEXION
// ============================================================

async function logoutUser() {

  try {

    const {
      error
    } =
      await supabaseClient.auth
        .signOut();


    if (error) {

      console.error(
        "Erreur Supabase déconnexion :",
        error
      );

    }

  }

  catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );

  }


  currentUser =
    null;

  currentProfile =
    null;

  currentOrder =
    null;


  showAuthPage();

  showLoginForm();


  showMessage(
    "Vous êtes déconnecté.",
    "info"
  );

}


// ============================================================
// TARIFS
// ============================================================

function updateRatesUI() {

  if ($("homeBuyRate")) {

    $("homeBuyRate").textContent =
      formatNumber(
        CONFIG.buyRate
      );

  }


  if ($("homeSellRate")) {

    $("homeSellRate").textContent =
      formatNumber(
        CONFIG.sellRate
      );

  }


  if ($("homeMinOrder")) {

    $("homeMinOrder").textContent =
      formatNumber(
        CONFIG.minOrder
      );

  }


  if ($("homeMaxOrder")) {

    $("homeMaxOrder").textContent =
      formatNumber(
        CONFIG.maxOrder
      );

  }


  if ($("homeTrc20Fee")) {

    $("homeTrc20Fee").textContent =
      CONFIG.networks
        .trc20
        .fee;

  }


  if ($("homeBp20Fee")) {

    $("homeBp20Fee").textContent =
      CONFIG.networks
        .bp20
        .fee;

  }


  if ($("trc20Fee")) {

    $("trc20Fee").textContent =
      CONFIG.networks
        .trc20
        .fee;

  }


  if ($("bp20Fee")) {

    $("bp20Fee").textContent =
      CONFIG.networks
        .bp20
        .fee;

  }

}


// ============================================================
// ACHAT
// ============================================================

function setBuyMode() {

  currentExchangeType =
    "buy";


  $("buyTab")
    ?.classList
    .add("active");


  $("sellTab")
    ?.classList
    .remove("active");


  if ($("amountLabel")) {

    $("amountLabel").textContent =
      "Montant à payer";

  }


  if ($("amountUnit")) {

    $("amountUnit").textContent =
      "FCFA";

  }


  updateCalculator();

}


// ============================================================
// VENTE
// ============================================================

function setSellMode() {

  currentExchangeType =
    "sell";


  $("buyTab")
    ?.classList
    .remove("active");


  $("sellTab")
    ?.classList
    .add("active");


  if ($("amountLabel")) {

    $("amountLabel").textContent =
      "Montant à recevoir";

  }


  if ($("amountUnit")) {

    $("amountUnit").textContent =
      "FCFA";

  }


  updateCalculator();

}


// ============================================================
// RESEAU
// ============================================================

function selectNetwork(network) {

  if (
    !CONFIG.networks[network]
  ) {

    return;

  }


  currentNetwork =
    network;


  $("trc20Option")
    ?.classList
    .toggle(
      "active",
      network === "trc20"
    );


  $("bp20Option")
    ?.classList
    .toggle(
      "active",
      network === "bp20"
    );


  updateCalculator();

}


// ============================================================
// CALCUL COMMANDE
// ============================================================

function calculateOrder() {

  const amount =
    Number(
      $("amountInput")
        ?.value
    ) || 0;


  const rate =
    currentExchangeType === "buy"
      ? CONFIG.buyRate
      : CONFIG.sellRate;


  const fee =
    Number(
      CONFIG.networks[
        currentNetwork
      ]?.fee
    ) || 0;


  let cryptoAmount = 0;

  let result = 0;


  if (amount > 0) {

    cryptoAmount =
      amount / rate;

  }


  // ----------------------------------------------------------
  // ACHAT
  //
  // Le client paie des FCFA.
  // Il reçoit les USDT après frais.
  // ----------------------------------------------------------

  if (
    currentExchangeType === "buy"
  ) {

    result =
      Math.max(
        cryptoAmount - fee,
        0
      );

  }


  // ----------------------------------------------------------
  // VENTE
  //
  // Le client indique combien de FCFA
  // il veut recevoir.
  // Il doit envoyer l'équivalent en USDT.
  // ----------------------------------------------------------

  else {

    result =
      cryptoAmount;

  }


  return {

    amount,

    rate,

    fee,

    usdt:
      cryptoAmount,

    result

  };

}


// ============================================================
// CALCULATEUR
// ============================================================

function updateCalculator() {

  const calc =
    calculateOrder();


  if ($("summaryRate")) {

    $("summaryRate").textContent =
      `${formatNumber(calc.rate)} FCFA / USDT`;

  }


  if ($("summaryCfa")) {

    $("summaryCfa").textContent =
      `${formatNumber(calc.amount)} FCFA`;

  }


  if ($("summaryUsdt")) {

    $("summaryUsdt").textContent =
      `${formatDecimal(calc.usdt)} USDT`;

  }


  if ($("summaryFee")) {

    $("summaryFee").textContent =
      `${formatDecimal(calc.fee, 2)} USDT`;

  }


  if ($("summaryResultLabel")) {

    $("summaryResultLabel").textContent =
      currentExchangeType === "buy"
        ? "Vous recevez"
        : "Vous envoyez";

  }


  if ($("summaryResult")) {

    $("summaryResult").textContent =
      `${formatDecimal(calc.result)} USDT`;

  }

}


// ============================================================
// RECUPERATION ADRESSE WALLET
// ============================================================

function getWalletAddress() {

  const possibleIds = [

    "walletAddress",

    "wallet",

    "walletInput",

    "userWallet",

    "wallet_address"

  ];


  for (
    const id of possibleIds
  ) {

    const element =
      $(id);


    if (
      element &&
      typeof element.value ===
        "string" &&
      element.value.trim()
    ) {

      return element.value.trim();

    }

  }


  return "";

}


// ============================================================
// VERIFICATION COMMANDE
// ============================================================

function reviewOrder() {

  hideMessage();


  if (!currentUser) {

    showMessage(
      "Vous devez être connecté pour passer une commande.",
      "error"
    );


    showAuthPage();

    showLoginForm();

    return;

  }


  const calc =
    calculateOrder();


  if (!calc.amount) {

    showMessage(
      "Veuillez saisir un montant.",
      "error"
    );

    return;

  }


  if (
    calc.amount <
      CONFIG.minOrder ||
    calc.amount >
      CONFIG.maxOrder
  ) {

    showMessage(
      `Le montant doit être compris entre ${formatNumber(CONFIG.minOrder)} et ${formatNumber(CONFIG.maxOrder)} FCFA.`,
      "error"
    );

    return;

  }


  if (
    currentExchangeType === "buy" &&
    calc.result <= 0
  ) {

    showMessage(
      "Le montant USDT après frais est insuffisant.",
      "error"
    );

    return;

  }


  const walletAddress =
    getWalletAddress();


  if (!walletAddress) {

    showMessage(
      "Veuillez saisir votre adresse de portefeuille USDT.",
      "error"
    );

    return;

  }


  // ----------------------------------------------------------
  // COMMANDE EN MÉMOIRE
  //
  // crypto_amount = montant réellement échangé.
  // Pour un achat : montant après frais.
  // Pour une vente : montant USDT envoyé.
  // ----------------------------------------------------------

  currentOrder = {

    type:
      currentExchangeType,

    fiat_amount:
      calc.amount,

    crypto_amount:
      calc.result,

    gross_crypto_amount:
      calc.usdt,

    rate:
      calc.rate,

    network:
      currentNetwork,

    fee:
      calc.fee,

    wallet_address:
      walletAddress,

    payment_method:
      CONFIG.payment.method,

    result_usdt:
      calc.result,

    status:
      "pending"

  };


  renderConfirmation();


  showSubPage(
    "confirmationPage"
  );

}


// ============================================================
// CONFIRMATION
// ============================================================

function renderConfirmation() {

  const box =
    $("confirmationSummary");


  if (
    !box ||
    !currentOrder
  ) {

    return;

  }


  const typeLabel =
    currentOrder.type === "buy"
      ? "Achat USDT"
      : "Vente USDT";


  const resultLabel =
    currentOrder.type === "buy"
      ? "Vous recevez"
      : "Vous envoyez";


  const networkName =
    CONFIG.networks[
      currentOrder.network
    ]?.name ||
    currentOrder.network ||
    "-";


  box.innerHTML = `

    <div class="summary-row">

      <span>Type</span>

      <strong>
        ${escapeHtml(typeLabel)}
      </strong>

    </div>


    <div class="summary-row">

      <span>Montant FCFA</span>

      <strong>
        ${formatNumber(
          currentOrder.fiat_amount
        )} FCFA
      </strong>

    </div>


    <div class="summary-row">

      <span>Taux</span>

      <strong>
        ${formatNumber(
          currentOrder.rate
        )} FCFA / USDT
      </strong>

    </div>


    <div class="summary-row">

      <span>Montant USDT</span>

      <strong>
        ${formatDecimal(
          currentOrder.crypto_amount
        )} USDT
      </strong>

    </div>


    <div class="summary-row">

      <span>Réseau</span>

      <strong>
        ${escapeHtml(networkName)}
      </strong>

    </div>


    <div class="summary-row">

      <span>Frais réseau</span>

      <strong>
        ${formatDecimal(
          currentOrder.fee,
          2
        )} USDT
      </strong>

    </div>


    <div class="summary-row">

      <span>Portefeuille</span>

      <strong>
        ${escapeHtml(
          currentOrder.wallet_address
        )}
      </strong>

    </div>


    <div class="summary-row">

      <span>Moyen de paiement</span>

      <strong>
        Orange Money
      </strong>

    </div>


    <div class="summary-row summary-total">

      <span>
        ${escapeHtml(resultLabel)}
      </span>

      <strong>
        ${formatDecimal(
          currentOrder.result_usdt
        )} USDT
      </strong>

    </div>

  `;

}


// ============================================================
// ANNULER CONFIRMATION
// ============================================================

function cancelReview() {

  currentOrder =
    null;


  showSubPage(
    "exchangePage"
  );

}


// ============================================================
// CREATION COMMANDE
// ============================================================

async function placeOrder() {

  hideMessage();


  if (!currentUser) {

    showMessage(
      "Votre session a expiré. Veuillez vous reconnecter.",
      "error"
    );


    showAuthPage();

    showLoginForm();

    return;

  }


  if (!currentOrder) {

    showMessage(
      "Aucune commande à enregistrer.",
      "error"
    );

    return;

  }


  const button =
    $("placeOrderBtn");


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled = true;

    button.textContent =
      "Enregistrement...";

  }


  try {

    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();


    if (sessionError) {

      throw sessionError;

    }


    const session =
      sessionData?.session;


    if (!session?.user) {

      currentUser =
        null;

      currentProfile =
        null;


      throw new Error(
        "Votre session n'est plus active."
      );

    }


    currentUser =
      session.user;


    // --------------------------------------------------------
    // PROFIL
    // --------------------------------------------------------

    if (!currentProfile) {

      await loadUserProfile();

    }


    if (!currentProfile?.id) {

      throw new Error(
        "Impossible de trouver votre profil."
      );

    }


    if (
      currentProfile.id !==
      currentUser.id
    ) {

      throw new Error(
        "Le profil utilisateur ne correspond pas à la session."
      );

    }


    // --------------------------------------------------------
    // VALIDATIONS
    // --------------------------------------------------------

    if (
      !CONFIG.networks[
        currentOrder.network
      ]
    ) {

      throw new Error(
        "Réseau USDT invalide."
      );

    }


    if (
      currentOrder.type !== "buy" &&
      currentOrder.type !== "sell"
    ) {

      throw new Error(
        "Type de commande invalide."
      );

    }


    const fiatAmount =
      Number(
        currentOrder.fiat_amount
      );


    const cryptoAmount =
      Number(
        currentOrder.crypto_amount
      );


    const rate =
      Number(
        currentOrder.rate
      );


    const fee =
      Number(
        currentOrder.fee
      );


    if (
      !Number.isFinite(
        fiatAmount
      ) ||
      fiatAmount <
        CONFIG.minOrder ||
      fiatAmount >
        CONFIG.maxOrder
    ) {

      throw new Error(
        "Le montant de la commande est invalide."
      );

    }


    if (
      !Number.isFinite(
        cryptoAmount
      ) ||
      cryptoAmount <= 0
    ) {

      throw new Error(
        "Le montant USDT est invalide."
      );

    }


    if (
      !Number.isFinite(rate) ||
      rate <= 0
    ) {

      throw new Error(
        "Le taux de change est invalide."
      );

    }


    if (
      !currentOrder.wallet_address
    ) {

      throw new Error(
        "L'adresse du portefeuille est obligatoire."
      );

    }


    // --------------------------------------------------------
    // PAYLOAD ORDERS
    // --------------------------------------------------------

    const orderPayload = {

      user_id:
        currentUser.id,

      type:
        currentOrder.type,

      fiat_amount:
        fiatAmount,

      crypto_amount:
        cryptoAmount,

      rate:
        rate,

      fee:
        fee,

      network:
        currentOrder.network,

      wallet_address:
        currentOrder.wallet_address,

      payment_method:
        currentOrder.payment_method ||
        CONFIG.payment.method,

      status:
        "pending"

    };


    console.log(
      "INSERT orders :",
      orderPayload
    );


    // --------------------------------------------------------
    // INSERT COMMANDE
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .insert(
          orderPayload
        )
        .select("*")
        .single();


    if (error) {

      throw error;

    }


    if (!data?.id) {

      throw new Error(
        "La commande n'a pas été créée."
      );

    }


    currentOrder.id =
      data.id;


    currentOrder.created_at =
      data.created_at;


    currentOrder.status =
      data.status ||
      "pending";


    // --------------------------------------------------------
    // PAGE PAIEMENT
    // --------------------------------------------------------

    renderPaymentPage();


    showSubPage(
      "paymentPage"
    );


    showMessage(
      "Votre commande a été enregistrée. Effectuez maintenant le paiement Orange Money.",
      "success"
    );


    await loadOrderHistory();

  }

  catch (error) {

    console.error(
      "Erreur création commande :",
      error
    );


    showMessage(
      "Impossible d'enregistrer la commande : " +
      getSupabaseErrorMessage(error),
      "error"
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "Placer la commande";

    }

  }

}


// ============================================================
// PAGE PAIEMENT
// ============================================================

function renderPaymentPage() {

  if (!currentOrder) {

    return;

  }


  const amount =
    Number(
      currentOrder.fiat_amount
    ) || 0;


  if ($("paymentAmount")) {

    $("paymentAmount").textContent =
      `Montant : ${formatNumber(amount)} FCFA`;

  }


  if ($("paymentCode")) {

    $("paymentCode").textContent =
      `*144*10*${CONFIG.payment.number}*${amount}#`;

  }


  if ($("paymentNumber")) {

    $("paymentNumber").textContent =
      CONFIG.payment.displayNumber;

  }


  if ($("paymentMethod")) {

    $("paymentMethod").textContent =
      "Orange Money";

  }

}


// ============================================================
// DECLARER PAIEMENT
// ============================================================

async function declarePayment() {

  hideMessage();


  if (!currentOrder?.id) {

    showMessage(
      "Commande introuvable.",
      "error"
    );

    return;

  }


  if (
    !isValidUUID(
      currentOrder.id
    )
  ) {

    showMessage(
      "Identifiant de commande invalide.",
      "error"
    );

    return;

  }


  const button =
    $("paymentDoneBtn");


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled = true;

    button.textContent =
      "Confirmation...";

  }


  try {

    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();


    if (sessionError) {

      throw sessionError;

    }


    const session =
      sessionData?.session;


    if (!session?.user) {

      throw new Error(
        "Votre session a expiré."
      );

    }


    currentUser =
      session.user;


    // --------------------------------------------------------
    // RPC SUPABASE
    //
    // La fonction SQL vérifie que la commande
    // appartient bien à l'utilisateur connecté.
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "declare_order_payment",
        {
          p_order_id:
            currentOrder.id
        }
      );


    if (error) {

      throw error;

    }


    console.log(
      "Paiement déclaré :",
      data
    );


    // --------------------------------------------------------
    // RECUPERATION DU NOUVEAU STATUT
    // --------------------------------------------------------

    if (
      data &&
      typeof data === "object" &&
      data.status
    ) {

      currentOrder.status =
        data.status;

    }

    else {

      currentOrder.status =
        "payment_declared";

    }


    showMessage(
      "Paiement déclaré. Votre commande est maintenant en attente de vérification.",
      "success"
    );


    await loadOrderHistory();

  }

  catch (error) {

    console.error(
      "Erreur déclaration paiement :",
      error
    );


    showMessage(
      "Impossible de confirmer le paiement : " +
      getSupabaseErrorMessage(error),
      "error"
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "J'ai effectué le paiement";

    }

  }

}


// ============================================================
// VOIR COMMANDE
// ============================================================

function viewCurrentOrder() {

  showSubPage(
    "ordersPage"
  );

}


// ============================================================
// HISTORIQUE COMMANDES
// ============================================================

async function loadOrderHistory() {

  const list =
    $("ordersList");


  if (!list) {

    return;

  }


  if (!currentUser) {

    list.innerHTML = `

      <div class="small center">
        Connectez-vous pour voir vos commandes.
      </div>

    `;

    return;

  }


  list.innerHTML = `

    <div class="small center">
      Chargement des commandes...
    </div>

  `;


  try {

    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();


    if (sessionError) {

      throw sessionError;

    }


    const session =
      sessionData?.session;


    if (!session?.user) {

      currentUser = null;

      currentProfile = null;


      throw new Error(
        "Votre session a expiré."
      );

    }


    currentUser =
      session.user;


    // --------------------------------------------------------
    // PROFIL
    // --------------------------------------------------------

    if (!currentProfile) {

      await loadUserProfile();

    }


    if (!currentProfile?.id) {

      throw new Error(
        "Profil utilisateur introuvable."
      );

    }


    // --------------------------------------------------------
    // COMMANDES
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    if (
      !data ||
      data.length === 0
    ) {

      list.innerHTML = `

        <div class="small center">
          Vous n'avez encore aucune commande.
        </div>

      `;

      return;

    }


    list.innerHTML =
      data
        .map(
          renderOrderCard
        )
        .join("");

  }

  catch (error) {

    console.error(
      "Erreur historique :",
      error
    );


    list.innerHTML = `

      <div class="small center">
        Impossible de charger vos commandes.
      </div>

    `;

  }

}


// ============================================================
// CARTE COMMANDE
// ============================================================

function renderOrderCard(order) {

  const type =
    order.type === "buy"
      ? "Achat USDT"
      : "Vente USDT";


  const status =
    order.status ||
    "pending";


  const statusLabel =
    getStatusLabel(
      status
    );


  const networkName =
    CONFIG.networks[
      order.network
    ]?.name ||
    order.network ||
    "-";


  return `

    <div class="order-card">

      <div class="order-header">

        <div class="order-type">
          ${escapeHtml(type)}
        </div>

        <span class="status ${escapeHtml(status)}">
          ${escapeHtml(statusLabel)}
        </span>

      </div>


      <div class="order-row">

        <span>Montant</span>

        <strong>
          ${formatNumber(
            order.fiat_amount
          )} FCFA
        </strong>

      </div>


      <div class="order-row">

        <span>USDT</span>

        <strong>
          ${formatDecimal(
            order.crypto_amount
          )}
        </strong>

      </div>


      <div class="order-row">

        <span>Réseau</span>

        <strong>
          ${escapeHtml(networkName)}
        </strong>

      </div>


      <div class="order-row">

        <span>Paiement</span>

        <strong>
          Orange Money
        </strong>

      </div>


      <div class="order-row">

        <span>Date</span>

        <strong>
          ${formatDate(
            order.created_at
          )}
        </strong>

      </div>

    </div>

  `;

}


// ============================================================
// STATUT COMMANDE
// ============================================================

function getStatusLabel(status) {

  const labels = {

    pending:
      "En attente",

    processing:
      "En traitement",

    completed:
      "Terminée",

    cancelled:
      "Annulée",

    paid:
      "Paiement déclaré",

    payment_declared:
      "Paiement déclaré",

    verified:
      "Paiement vérifié",

    rejected:
      "Rejetée",

    failed:
      "Échec"

  };


  return (
    labels[status] ||
    status ||
    "En attente"
  );

}


// ============================================================
// COMMANDES POUR LITIGE
// ============================================================

async function loadOrdersForDispute() {

  const select =
    $("disputeOrder");


  if (
    !select ||
    !currentUser
  ) {

    return;

  }


  try {

    if (!currentProfile) {

      await loadUserProfile();

    }


    if (!currentProfile?.id) {

      return;

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .select(
          "id,type,fiat_amount,created_at,status"
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    select.innerHTML = `

      <option value="">
        Sélectionner une commande
      </option>

    `;


    (data || [])
      .forEach(order => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          order.id;


        const type =
          order.type === "buy"
            ? "Achat"
            : "Vente";


        option.textContent =
          `${type} - ${formatNumber(
            order.fiat_amount
          )} FCFA - ${formatDate(
            order.created_at
          )}`;


        select.appendChild(
          option
        );

      });

  }

  catch (error) {

    console.error(
      "Erreur commandes litige :",
      error
    );

  }

}


// ============================================================
// CREATION LITIGE
// ============================================================

async function submitDispute(event) {

  event.preventDefault();

  hideMessage();


  if (!currentUser) {

    showMessage(
      "Vous devez être connecté.",
      "error"
    );

    return;

  }


  const orderId =
    $("disputeOrder")
      ?.value;


  const subject =
    $("disputeSubject")
      ?.value
      .trim();


  const message =
    $("disputeMessage")
      ?.value
      .trim();


  if (!orderId) {

    showMessage(
      "Veuillez sélectionner une commande.",
      "error"
    );

    return;

  }


  if (!subject || !message) {

    showMessage(
      "Veuillez remplir tous les champs du litige.",
      "error"
    );

    return;

  }


  if (
    !isValidUUID(orderId)
  ) {

    showMessage(
      "Identifiant de commande invalide.",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("disputeForm")
      ?.querySelector(
        'button[type="submit"]'
      );


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled = true;

    button.textContent =
      "Envoi...";

  }


  try {

    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();


    if (sessionError) {

      throw sessionError;

    }


    if (!sessionData?.session?.user) {

      throw new Error(
        "Votre session a expiré."
      );

    }


    currentUser =
      sessionData.session.user;


    // --------------------------------------------------------
    // PROFIL
    // --------------------------------------------------------

    if (!currentProfile) {

      await loadUserProfile();

    }


    if (!currentProfile?.id) {

      throw new Error(
        "Profil introuvable."
      );

    }


    // --------------------------------------------------------
    // VERIFICATION COMMANDE
    // --------------------------------------------------------

    const {
      data: order,
      error: orderError
    } =
      await supabaseClient
        .from("orders")
        .select("id")
        .eq(
          "id",
          orderId
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .maybeSingle();


    if (orderError) {

      throw orderError;

    }


    if (!order) {

      throw new Error(
        "Cette commande ne vous appartient pas."
      );

    }


    // --------------------------------------------------------
    // CREATION LITIGE
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from("disputes")
        .insert({

          user_id:
            currentUser.id,

          order_id:
            orderId,

          subject:
            subject,

          message:
            message,

          status:
            "open"

        })
        .select("*")
        .single();


    if (error) {

      throw error;

    }


    console.log(
      "Litige créé :",
      data
    );


    $("disputeForm")
      ?.reset();


    showMessage(
      "Votre litige a été envoyé au service client.",
      "success"
    );


    await loadDisputes();

  }

  catch (error) {

    console.error(
      "Erreur création litige :",
      error
    );


    showMessage(
      "Impossible d'envoyer le litige : " +
      getSupabaseErrorMessage(error),
      "error"
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "Envoyer le litige";

    }

  }

}


// ============================================================
// CHARGEMENT LITIGES
// ============================================================

async function loadDisputes() {

  const list =
    $("disputesList");


  if (
    !list ||
    !currentUser
  ) {

    return;

  }


  list.innerHTML = `

    <div class="small center">
      Chargement...
    </div>

  `;


  try {

    if (!currentProfile) {

      await loadUserProfile();

    }


    if (!currentProfile?.id) {

      throw new Error(
        "Profil introuvable."
      );

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("disputes")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    if (
      !data ||
      data.length === 0
    ) {

      list.innerHTML = `

        <div class="small center">
          Aucun litige.
        </div>

      `;

      return;

    }


    list.innerHTML =
      data
        .map(
          dispute => {

            const disputeStatus =
              dispute.status ||
              "open";


            const statusLabel =
              getDisputeStatusLabel(
                disputeStatus
              );


            return `

              <div class="order-card">

                <div class="order-header">

                  <div class="order-type">
                    ${escapeHtml(
                      dispute.subject
                    )}
                  </div>

                  <span class="status processing">
                    ${escapeHtml(
                      statusLabel
                    )}
                  </span>

                </div>


                <div class="small">

                  ${escapeHtml(
                    dispute.message
                  )}

                </div>


                <div class="small mt">

                  ${formatDate(
                    dispute.created_at
                  )}

                </div>

              </div>

            `;

          }
        )
        .join("");

  }

  catch (error) {

    console.error(
      "Erreur chargement litiges :",
      error
    );


    list.innerHTML = `

      <div class="small center">
        Impossible de charger les litiges.
      </div>

    `;

  }

}


// ============================================================
// STATUT LITIGE
// ============================================================

function getDisputeStatusLabel(status) {

  const labels = {

    open:
      "Ouvert",

    processing:
      "En traitement",

    resolved:
      "Résolu",

    closed:
      "Fermé",

    cancelled:
      "Annulé"

  };


  return (
    labels[status] ||
    status ||
    "Ouvert"
  );

}


// ============================================================
// ACCUEIL
// ============================================================

function goToBuy() {

  setBuyMode();

  showSubPage(
    "exchangePage"
  );

}


function goToSell() {

  setSellMode();

  showSubPage(
    "exchangePage"
  );

}


// ============================================================
// EVENEMENTS
// ============================================================

function setupEvents() {

  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  $("loginTab")
    ?.addEventListener(
      "click",
      showLoginForm
    );


  $("registerTab")
    ?.addEventListener(
      "click",
      showRegisterForm
    );


  // ----------------------------------------------------------
  // CONNEXION
  // ----------------------------------------------------------

  $("loginForm")
    ?.addEventListener(
      "submit",
      loginUser
    );


  // ----------------------------------------------------------
  // INSCRIPTION
  // ----------------------------------------------------------

  $("registerForm")
    ?.addEventListener(
      "submit",
      registerUser
    );


  // ----------------------------------------------------------
  // DECONNEXION
  // ----------------------------------------------------------

  $("logoutBtn")
    ?.addEventListener(
      "click",
      logoutUser
    );


  // ----------------------------------------------------------
  // ACCUEIL
  // ----------------------------------------------------------

  $("goBuyBtn")
    ?.addEventListener(
      "click",
      goToBuy
    );


  $("goSellBtn")
    ?.addEventListener(
      "click",
      goToSell
    );


  // ----------------------------------------------------------
  // ACHAT
  // ----------------------------------------------------------

  $("buyTab")
    ?.addEventListener(
      "click",
      setBuyMode
    );


  // ----------------------------------------------------------
  // VENTE
  // ----------------------------------------------------------

  $("sellTab")
    ?.addEventListener(
      "click",
      setSellMode
    );


  // ----------------------------------------------------------
  // RESEAUX
  // ----------------------------------------------------------

  $("trc20Option")
    ?.addEventListener(
      "click",
      () =>
        selectNetwork(
          "trc20"
        )
    );


  $("bp20Option")
    ?.addEventListener(
      "click",
      () =>
        selectNetwork(
          "bp20"
        )
    );


  // ----------------------------------------------------------
  // CALCULATEUR
  // ----------------------------------------------------------

  $("amountInput")
    ?.addEventListener(
      "input",
      updateCalculator
    );


  $("reviewOrderBtn")
    ?.addEventListener(
      "click",
      reviewOrder
    );


  $("backHomeBtn")
    ?.addEventListener(
      "click",
      () =>
        showSubPage(
          "homePage"
        )
    );


  // ----------------------------------------------------------
  // CONFIRMATION
  // ----------------------------------------------------------

  $("placeOrderBtn")
    ?.addEventListener(
      "click",
      placeOrder
    );


  $("cancelReviewBtn")
    ?.addEventListener(
      "click",
      cancelReview
    );


  // ----------------------------------------------------------
  // PAIEMENT
  // ----------------------------------------------------------

  $("paymentDoneBtn")
    ?.addEventListener(
      "click",
      declarePayment
    );


  $("viewOrderBtn")
    ?.addEventListener(
      "click",
      viewCurrentOrder
    );


  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      ".nav-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;


          if (page) {

            showSubPage(
              page
            );

          }

        }
      );

    });


  // ----------------------------------------------------------
  // LITIGES
  // ----------------------------------------------------------

  $("disputeForm")
    ?.addEventListener(
      "submit",
      submitDispute
    );

}


// ============================================================
// SESSION EXISTANTE
// ============================================================

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {

      throw error;

    }


    const session =
      data?.session;


    if (session?.user) {

      currentUser =
        session.user;


      await initializeApplication();

    }

    else {

      currentUser =
        null;

      currentProfile =
        null;


      showAuthPage();

      showLoginForm();

    }

  }

  catch (error) {

    console.error(
      "Erreur vérification session :",
      error
    );


    currentUser =
      null;

    currentProfile =
      null;


    showAuthPage();

    showLoginForm();


    showMessage(
      "Impossible de vérifier votre session.",
      "error"
    );

  }

}


// ============================================================
// AUTH LISTENER
// ============================================================

function setupAuthListener() {

  if (authListenerReady) {

    return;

  }


  authListenerReady =
    true;


  supabaseClient.auth
    .onAuthStateChange(
      (event, session) => {

        console.log(
          "Auth event:",
          event
        );


        // ----------------------------------------------------
        // DECONNEXION
        // ----------------------------------------------------

        if (
          event ===
          "SIGNED_OUT"
        ) {

          currentUser =
            null;

          currentProfile =
            null;

          currentOrder =
            null;


          showAuthPage();

          showLoginForm();


          return;

        }


        // ----------------------------------------------------
        // CONNEXION
        // ----------------------------------------------------

        if (
          event ===
            "SIGNED_IN" &&
          session?.user
        ) {

          currentUser =
            session.user;


          setTimeout(
            () => {

              initializeApplication();

            },
            0
          );


          return;

        }


        // ----------------------------------------------------
        // TOKEN REFRESH
        // ----------------------------------------------------

        if (
          event ===
            "TOKEN_REFRESHED" &&
          session?.user
        ) {

          currentUser =
            session.user;

          return;

        }


        // ----------------------------------------------------
        // USER UPDATED
        // ----------------------------------------------------

        if (
          event ===
            "USER_UPDATED" &&
          session?.user
        ) {

          currentUser =
            session.user;

          return;

        }

      }
    );

}


// ============================================================
// DEMARRAGE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "NOA DIGIT TRADE - démarrage..."
    );


    setupEvents();


    setupAuthListener();


    updateRatesUI();


    setBuyMode();


    selectNetwork(
      "trc20"
    );


    await checkExistingSession();

  }
);
