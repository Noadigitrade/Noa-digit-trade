// ============================================================
// NOA DIGIT TRADE
// APP.JS COMPLET
// SUPABASE AUTH + USERS + ORDERS + HISTORIQUE
// CONFIRMATION + PAIEMENT ORANGE MONEY
// ============================================================


// ============================================================
// CONFIGURATION SUPABASE
// ============================================================

const SUPABASE_URL =
  "https://vowafwsvrjpkhkocptih.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC";

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

    bp20: {
      name: "USDT BP20",
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


// ============================================================
// RACCOURCIS DOM
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// MESSAGE GLOBAL
// ============================================================

function showMessage(message, type = "info") {

  const box = $("appMessage");

  if (!box) return;

  box.textContent = message;

  box.className = "";

  box.id = "appMessage";

  box.classList.add(type);

}


function hideMessage() {

  const box = $("appMessage");

  if (!box) return;

  box.className = "";

  box.id = "appMessage";

}


// ============================================================
// UTILITAIRES
// ============================================================

function formatNumber(value) {

  const number = Number(value) || 0;

  return number.toLocaleString("fr-FR");

}


function formatDate(value) {

  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

}


function normalizePhone(phone) {

  return String(phone || "")
    .replace(/\s+/g, "")
    .trim();

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ============================================================
// NAVIGATION AUTH
// ============================================================

function showAuthPage() {

  $("authPage")?.classList.add("active");

  $("appPage")?.classList.remove("active");

  $("bottomNav")?.classList.add("hidden");

}


function showAppPage() {

  $("authPage")?.classList.remove("active");

  $("appPage")?.classList.add("active");

  $("bottomNav")?.classList.remove("hidden");

}


// ============================================================
// NAVIGATION APPLICATION
// ============================================================

function showSubPage(pageId) {

  const pages = document.querySelectorAll(".sub-page");

  pages.forEach(page => {

    page.classList.add("hidden");

    page.classList.remove("active");

  });


  const target = $(pageId);

  if (target) {

    target.classList.remove("hidden");

    target.classList.add("active");

  }


  const navButtons =
    document.querySelectorAll(".nav-btn");

  navButtons.forEach(button => {

    button.classList.remove("active");

    if (button.dataset.page === pageId) {

      button.classList.add("active");

    }

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (pageId === "ordersPage") {

    loadOrderHistory();

  }


  if (pageId === "supportPage") {

    loadDisputes();

    loadOrdersForDispute();

  }

}


// ============================================================
// AUTH TABS
// ============================================================

function showLoginForm() {

  $("loginTab")?.classList.add("active");

  $("registerTab")?.classList.remove("active");

  $("loginForm")?.classList.add("active");

  $("registerForm")?.classList.remove("active");

}


function showRegisterForm() {

  $("loginTab")?.classList.remove("active");

  $("registerTab")?.classList.add("active");

  $("loginForm")?.classList.remove("active");

  $("registerForm")?.classList.add("active");

}


// ============================================================
// INSCRIPTION
// ============================================================

async function registerUser(event) {

  event.preventDefault();

  hideMessage();


  const name =
    $("registerName")?.value.trim();

  const phone =
    normalizePhone(
      $("registerPhone")?.value
    );

  const country =
    $("registerCountry")?.value.trim();

  const email =
    $("registerEmail")?.value.trim().toLowerCase();

  const password =
    $("registerPassword")?.value;

  const confirmPassword =
    $("registerPasswordConfirm")?.value;


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


  if (!password || password.length < 6) {

    showMessage(
      "Le mot de passe doit contenir au moins 6 caractères.",
      "error"
    );

    return;

  }


  if (password !== confirmPassword) {

    showMessage(
      "Les deux mots de passe ne correspondent pas.",
      "error"
    );

    return;

  }


  if (country !== "Burkina Faso") {

    showMessage(
      "NOA DIGIT TRADE est réservé au Burkina Faso.",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("registerForm")?.querySelector(
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

    // --------------------------------------------------------
    // CREATION COMPTE SUPABASE AUTH
    // --------------------------------------------------------

    const {
      data,
      error
    } = await supabaseClient.auth.signUp({

      email: email,

      password: password,

      options: {

        data: {

          full_name: name,

          phone: phone,

          country: country

        }

      }

    });


    if (error) {

      throw error;

    }


    if (!data?.user) {

      throw new Error(
        "Le compte n'a pas pu être créé."
      );

    }


    currentUser = data.user;


    // --------------------------------------------------------
    // CREATION DU PROFIL DANS Users
    // --------------------------------------------------------

    const profileResult =
      await createUserProfile({

        id: data.user.id,

        auth_id: data.user.id,

        email: email,

        name: name,

        phone: phone,

        country: country

      });


    if (!profileResult.success) {

      console.error(
        "Erreur profil :",
        profileResult.error
      );

      // Le compte Auth existe déjà.
      // On ne prétend donc pas que l'inscription complète
      // est réussie si le profil n'a pas pu être créé.

      showMessage(
        "Compte créé, mais le profil n'a pas pu être enregistré. Vérifiez la table Users dans Supabase.",
        "error"
      );

      return;

    }


    currentProfile =
      profileResult.profile;


    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const session =
      data.session;


    if (session) {

      await initializeApplication();

      showMessage(
        "Compte créé avec succès. Bienvenue sur NOA DIGIT TRADE !",
        "success"
      );

    } else {

      showMessage(
        "Compte créé avec succès. Vérifiez votre adresse email si Supabase demande une confirmation.",
        "success"
      );

      showLoginForm();

    }

  }

  catch (error) {

    console.error(
      "Erreur inscription :",
      error
    );


    let message =
      error?.message ||
      "Impossible de créer le compte.";


    if (
      message.toLowerCase().includes(
        "already registered"
      )
    ) {

      message =
        "Cette adresse email est déjà utilisée.";

    }


    if (
      message.toLowerCase().includes(
        "user already registered"
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
// CREER / RECUPERER PROFIL Users
// ============================================================

async function createUserProfile(profileData) {

  try {

    // IMPORTANT :
    // La table utilisée est Users.
    // On conserve auth_id pour identifier l'utilisateur Auth.

    const {
      data,
      error
    } = await supabaseClient
      .from("Users")
      .select("*")
      .eq("auth_id", profileData.auth_id)
      .maybeSingle();


    if (error) {

      throw error;

    }


    if (data) {

      return {

        success: true,

        profile: data

      };

    }


    // --------------------------------------------------------
    // INSERTION DU PROFIL
    // --------------------------------------------------------

    const insertPayload = {

      auth_id: profileData.auth_id,

      email: profileData.email

    };


    // Les colonnes supplémentaires sont ajoutées seulement
    // si elles existent dans la table.
    //
    // La structure minimale connue reste :
    // id / auth_id / email

    if (profileData.name) {

      insertPayload.name =
        profileData.name;

    }


    if (profileData.phone) {

      insertPayload.phone =
        profileData.phone;

    }


    if (profileData.country) {

      insertPayload.country =
        profileData.country;

    }


    let {
      data: inserted,
      error: insertError
    } = await supabaseClient
      .from("Users")
      .insert(insertPayload)
      .select("*")
      .single();


    // --------------------------------------------------------
    // SI name / phone / country N'EXISTENT PAS DANS Users
    // --------------------------------------------------------

    if (
      insertError &&
      (
        String(insertError.message || "")
          .toLowerCase()
          .includes("column")
      )
    ) {

      const minimalPayload = {

        auth_id: profileData.auth_id,

        email: profileData.email

      };


      const result =
        await supabaseClient
          .from("Users")
          .insert(minimalPayload)
          .select("*")
          .single();


      inserted =
        result.data;

      insertError =
        result.error;

    }


    if (insertError) {

      throw insertError;

    }


    return {

      success: true,

      profile: inserted

    };

  }

  catch (error) {

    return {

      success: false,

      error

    };

  }

}


// ============================================================
// CONNEXION
// ============================================================

async function loginUser(event) {

  event.preventDefault();

  hideMessage();


  const email =
    $("loginEmail")?.value
      .trim()
      .toLowerCase();

  const password =
    $("loginPassword")?.value;


  if (!email || !password) {

    showMessage(
      "Veuillez remplir tous les champs.",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("loginForm")?.querySelector(
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
    } = await supabaseClient.auth.signInWithPassword({

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
      error?.message ||
      "Impossible de se connecter.";


    if (
      message.toLowerCase().includes(
        "invalid login credentials"
      )
    ) {

      message =
        "Email ou mot de passe incorrect.";

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

    await supabaseClient.auth.signOut();

  }

  catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );

  }


  currentUser = null;

  currentProfile = null;

  currentOrder = null;


  showAuthPage();

  showLoginForm();

  showMessage(
    "Vous êtes déconnecté.",
    "info"
  );

}


// ============================================================
// CHARGEMENT DU PROFIL
// ============================================================

async function loadUserProfile() {

  if (!currentUser) {

    return null;

  }


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("Users")
      .select("*")
      .eq("auth_id", currentUser.id)
      .maybeSingle();


    if (error) {

      throw error;

    }


    if (!data) {

      // ------------------------------------------------------
      // Si le profil n'existe pas, on tente de le créer
      // ------------------------------------------------------

      const metadata =
        currentUser.user_metadata ||
        {};


      const result =
        await createUserProfile({

          id: currentUser.id,

          auth_id: currentUser.id,

          email:
            currentUser.email || "",

          name:
            metadata.full_name ||
            metadata.name ||
            "",

          phone:
            metadata.phone ||
            "",

          country:
            metadata.country ||
            "Burkina Faso"

        });


      if (!result.success) {

        throw result.error;

      }


      currentProfile =
        result.profile;

    }

    else {

      currentProfile =
        data;

    }


    updateUserInterface();

    return currentProfile;

  }

  catch (error) {

    console.error(
      "Erreur chargement profil :",
      error
    );


    showMessage(
      "Impossible de charger votre profil : " +
      (error?.message || "erreur inconnue"),
      "error"
    );


    return null;

  }

}


// ============================================================
// INTERFACE UTILISATEUR
// ============================================================

function updateUserInterface() {

  if (!currentUser) return;


  const profile =
    currentProfile || {};


  const metadata =
    currentUser.user_metadata || {};


  const name =
    profile.name ||
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

}


// ============================================================
// INITIALISATION APPLICATION
// ============================================================

async function initializeApplication() {

  showAppPage();


  updateRatesUI();


  await loadUserProfile();


  showSubPage("homePage");


  loadOrderHistory();

}


// ============================================================
// TARIFS
// ============================================================

function updateRatesUI() {

  if ($("homeBuyRate")) {

    $("homeBuyRate").textContent =
      formatNumber(CONFIG.buyRate);

  }


  if ($("homeSellRate")) {

    $("homeSellRate").textContent =
      formatNumber(CONFIG.sellRate);

  }


  if ($("homeMinOrder")) {

    $("homeMinOrder").textContent =
      formatNumber(CONFIG.minOrder);

  }


  if ($("homeMaxOrder")) {

    $("homeMaxOrder").textContent =
      formatNumber(CONFIG.maxOrder);

  }


  if ($("homeTrc20Fee")) {

    $("homeTrc20Fee").textContent =
      CONFIG.networks.trc20.fee;

  }


  if ($("homeBp20Fee")) {

    $("homeBp20Fee").textContent =
      CONFIG.networks.bp20.fee;

  }


  if ($("trc20Fee")) {

    $("trc20Fee").textContent =
      CONFIG.networks.trc20.fee;

  }


  if ($("bp20Fee")) {

    $("bp20Fee").textContent =
      CONFIG.networks.bp20.fee;

  }

}


// ============================================================
// TYPE ACHAT
// ============================================================

function setBuyMode() {

  currentExchangeType =
    "buy";


  $("buyTab")?.classList.add("active");

  $("sellTab")?.classList.remove("active");


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
// TYPE VENTE
// ============================================================

function setSellMode() {

  currentExchangeType =
    "sell";


  $("buyTab")?.classList.remove("active");

  $("sellTab")?.classList.add("active");


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
    ?.classList.toggle(
      "active",
      network === "trc20"
    );


  $("bp20Option")
    ?.classList.toggle(
      "active",
      network === "bp20"
    );


  updateCalculator();

}


// ============================================================
// CALCULATEUR
// ============================================================

function calculateOrder() {

  const amount =
    Number(
      $("amountInput")?.value
    ) || 0;


  const rate =
    currentExchangeType === "buy"
      ? CONFIG.buyRate
      : CONFIG.sellRate;


  const fee =
    CONFIG.networks[currentNetwork].fee;


  let usdt = 0;

  let result = 0;


  if (amount > 0) {

    usdt =
      amount / rate;

  }


  if (currentExchangeType === "buy") {

    result =
      Math.max(
        usdt - fee,
        0
      );

  }

  else {

    result =
      usdt;

  }


  return {

    amount,

    rate,

    fee,

    usdt,

    result

  };

}


// ============================================================
// MISE A JOUR CALCULATEUR
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
      `${calc.usdt.toFixed(6)} USDT`;

  }


  if ($("summaryFee")) {

    $("summaryFee").textContent =
      `${calc.fee} USDT`;

  }


  if ($("summaryResultLabel")) {

    $("summaryResultLabel").textContent =
      currentExchangeType === "buy"
        ? "Vous recevez"
        : "Vous envoyez";

  }


  if ($("summaryResult")) {

    $("summaryResult").textContent =
      `${calc.result.toFixed(6)} USDT`;

  }

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
    calc.amount < CONFIG.minOrder ||
    calc.amount > CONFIG.maxOrder
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


  currentOrder = {

    type:
      currentExchangeType,

    amount_cfa:
      calc.amount,

    rate:
      calc.rate,

    amount_usdt:
      calc.usdt,

    network:
      currentNetwork,

    network_fee:
      calc.fee,

    result_usdt:
      calc.result,

    payment_method:
      "orange_money"

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


  if (!box || !currentOrder) {

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
        ${formatNumber(currentOrder.amount_cfa)} FCFA
      </strong>
    </div>

    <div class="summary-row">
      <span>Taux</span>
      <strong>
        ${formatNumber(currentOrder.rate)} FCFA / USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Montant USDT</span>
      <strong>
        ${currentOrder.amount_usdt.toFixed(6)} USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Réseau</span>
      <strong>
        ${escapeHtml(
          CONFIG.networks[
            currentOrder.network
          ].name
        )}
      </strong>
    </div>

    <div class="summary-row">
      <span>Frais réseau</span>
      <strong>
        ${currentOrder.network_fee} USDT
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
        ${resultLabel}
      </span>

      <strong>
        ${currentOrder.result_usdt.toFixed(6)} USDT
      </strong>
    </div>

  `;

}


// ============================================================
// ANNULER MODIFICATION
// ============================================================

function cancelReview() {

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
    // RECUPERER LE PROFIL
    // --------------------------------------------------------

    if (!currentProfile) {

      await loadUserProfile();

    }


    if (!currentProfile?.id) {

      throw new Error(
        "Impossible de trouver votre profil."
      );

    }


    // --------------------------------------------------------
    // CREATION DE LA COMMANDE
    // --------------------------------------------------------

    const orderPayload = {

      user_id:
        currentProfile.id,

      type:
        currentOrder.type,

      amount_cfa:
        currentOrder.amount_cfa,

      amount_usdt:
        currentOrder.amount_usdt,

      rate:
        currentOrder.rate,

      network:
        currentOrder.network,

      network_fee:
        currentOrder.network_fee,

      payment_method:
        currentOrder.payment_method,

      status:
        "pending"

    };


    const {
      data,
      error
    } = await supabaseClient
      .from("orders")
      .insert(orderPayload)
      .select("*")
      .single();


    if (error) {

      throw error;

    }


    if (!data) {

      throw new Error(
        "La commande n'a pas été créée."
      );

    }


    currentOrder.id =
      data.id;


    currentOrder.created_at =
      data.created_at;


    // --------------------------------------------------------
    // AFFICHER PAIEMENT
    // --------------------------------------------------------

    renderPaymentPage();


    showSubPage(
      "paymentPage"
    );


    showMessage(
      "Votre commande a été enregistrée.",
      "success"
    );


    loadOrderHistory();

  }

  catch (error) {

    console.error(
      "Erreur création commande :",
      error
    );


    showMessage(
      "Impossible d'enregistrer la commande : " +
      (error?.message || "erreur inconnue"),
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

  if (!currentOrder) return;


  const amount =
    Number(
      currentOrder.amount_cfa
    ) || 0;


  if ($("paymentAmount")) {

    $("paymentAmount").textContent =
      `Montant : ${formatNumber(amount)} FCFA`;

  }


  if ($("paymentCode")) {

    $("paymentCode").textContent =
      `*144*10*${CONFIG.payment.number}*${amount}#`;

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
    // RPC SECURISEE
    // --------------------------------------------------------

    const {
      data,
      error
    } = await supabaseClient.rpc(
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
      (error?.message || "erreur inconnue"),
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


  if (!list) return;


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

    if (!currentProfile) {

      await loadUserProfile();

    }


    if (!currentProfile?.id) {

      throw new Error(
        "Profil utilisateur introuvable."
      );

    }


    const {
      data,
      error
    } = await supabaseClient
      .from("orders")
      .select("*")
      .eq(
        "user_id",
        currentProfile.id
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


    if (!data || data.length === 0) {

      list.innerHTML = `
        <div class="small center">
          Vous n'avez encore aucune commande.
        </div>
      `;

      return;

    }


    list.innerHTML =
      data
        .map(renderOrderCard)
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
    getStatusLabel(status);


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
          ${formatNumber(order.amount_cfa)} FCFA
        </strong>
      </div>


      <div class="order-row">
        <span>USDT</span>
        <strong>
          ${Number(order.amount_usdt || 0).toFixed(6)}
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
          ${formatDate(order.created_at)}
        </strong>
      </div>

    </div>

  `;

}


// ============================================================
// STATUT
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
      "Annulée"

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


  if (!select || !currentUser) {

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
    } = await supabaseClient
      .from("orders")
      .select(
        "id,type,amount_cfa,created_at,status"
      )
      .eq(
        "user_id",
        currentProfile.id
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


    (data || []).forEach(order => {

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
        `${type} - ${formatNumber(order.amount_cfa)} FCFA - ${formatDate(order.created_at)}`;


      select.appendChild(option);

    });

  }

  catch (error) {

    console.error(
      "Erreur chargement commandes litige :",
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
    $("disputeOrder")?.value;


  const subject =
    $("disputeSubject")?.value.trim();


  const message =
    $("disputeMessage")?.value.trim();


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
    } = await supabaseClient
      .from("disputes")
      .insert({

        user_id:
          currentProfile.id,

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


    $("disputeForm")?.reset();


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
      (error?.message || "erreur inconnue"),
      "error"
    );

  }

}


// ============================================================
// CHARGEMENT LITIGES
// ============================================================

async function loadDisputes() {

  const list =
    $("disputesList");


  if (!list || !currentUser) {

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
    } = await supabaseClient
      .from("disputes")
      .select("*")
      .eq(
        "user_id",
        currentProfile.id
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


    if (!data || data.length === 0) {

      list.innerHTML = `
        <div class="small center">
          Aucun litige.
        </div>
      `;

      return;

    }


    list.innerHTML =
      data
        .map(dispute => `

          <div class="order-card">

            <div class="order-header">

              <div class="order-type">
                ${escapeHtml(
                  dispute.subject
                )}
              </div>

              <span class="status processing">
                ${escapeHtml(
                  dispute.status || "open"
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

        `)
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
// BOUTONS ACCUEIL
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
  // AUTH TABS
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
  // AUTH FORM
  // ----------------------------------------------------------

  $("loginForm")
    ?.addEventListener(
      "submit",
      loginUser
    );


  $("registerForm")
    ?.addEventListener(
      "submit",
      registerUser
    );


  // ----------------------------------------------------------
  // LOGOUT
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
  // ECHANGE
  // ----------------------------------------------------------

  $("buyTab")
    ?.addEventListener(
      "click",
      setBuyMode
    );


  $("sellTab")
    ?.addEventListener(
      "click",
      setSellMode
    );


  $("trc20Option")
    ?.addEventListener(
      "click",
      () => selectNetwork("trc20")
    );


  $("bp20Option")
    ?.addEventListener(
      "click",
      () => selectNetwork("bp20")
    );


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
      () => showSubPage("homePage")
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
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;

          if (page) {

            showSubPage(page);

          }

        }
      );

    });


  // ----------------------------------------------------------
  // SUPPORT
  // ----------------------------------------------------------

  $("disputeForm")
    ?.addEventListener(
      "submit",
      submitDispute
    );

}


// ============================================================
// SESSION SUPABASE
// ============================================================

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();


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

      showAuthPage();

    }

  }

  catch (error) {

    console.error(
      "Erreur vérification session :",
      error
    );


    showAuthPage();


    showMessage(
      "Impossible de vérifier votre session.",
      "error"
    );

  }

}


// ============================================================
// ECOUTE DES CHANGEMENTS AUTH
// ============================================================

function setupAuthListener() {

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        "Auth event:",
        event
      );


      if (
        event === "SIGNED_OUT"
      ) {

        currentUser = null;

        currentProfile = null;

        currentOrder = null;

        showAuthPage();

        return;

      }


      if (
        event === "SIGNED_IN" &&
        session?.user
      ) {

        currentUser =
          session.user;

        await initializeApplication();

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

    updateCalculator();

    await checkExistingSession();

  }
);
