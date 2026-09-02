// ============================================================
// NOA DIGIT TRADE
// ADMIN.JS — VERSION COMPLETE
//
// ESPACE ADMINISTRATEUR
//
// - Connexion Supabase
// - Vérification role = admin
// - Tableau de bord
// - Paramètres de l'application
// - Taux achat / vente
// - Minimum / maximum commande
// - Frais TRC20 / BEP20
// - Numéro Orange Money
// - Toutes les commandes
// - ACHATS USDT / VENTES USDT
// - Wallet client + bouton copier
// - Réseau TRC20 / BEP20 clairement affiché
// - Numéro Orange Money client + bouton copier
// - Modification des statuts
// - Litiges
// - Modification des statuts de litiges
// - Utilisateurs
// - Statistiques
// - Déconnexion
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
  "https://vowafwsvrjpkhkocptih.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC";


if (!window.supabase) {
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
// ETAT GLOBAL
// ============================================================

let currentUser = null;

let currentProfile = null;

let currentSettings = null;

let allOrders = [];

let allDisputes = [];

let allUsers = [];

let selectedOrder = null;

let selectedDispute = null;

let authListenerReady = false;


// ============================================================
// CONFIGURATION PAR DEFAUT
// ============================================================

const DEFAULT_SETTINGS = {

  id: 1,

  country: "Burkina Faso",

  currency: "XOF",

  buy_rate: 600,

  sell_rate: 570,

  min_order_cfa: 2000,

  max_order_cfa: 50000,

  trc20_fee_usdt: 2,

  bp20_fee_usdt: 0,

  orange_money_number: "74602553",

  payment_method: "Orange Money"

};


// ============================================================
// UTILITAIRE DOM
// ============================================================

function extractWalletAddress(order) {

  // Nouvelle colonne dédiée
  if (order?.wallet_address) {

    return String(
      order.wallet_address
    ).trim();

  }


  // Compatibilité anciennes commandes
  const note =
    String(
      order?.customer_note || ""
    );


  // Achat : adresse du portefeuille client
  const buyMatch =
    note.match(
      /Adresse de r[ée]ception USDT\s*:\s*([^\n|]+)/i
    );


  if (buyMatch) {

    return buyMatch[1].trim();

  }


  // Vente : adresse de dépôt utilisée
  const sellMatch =
    note.match(
      /Adresse de d[ée]p[oô]t NOA\s*:\s*([^\n|]+)/i
    );


  if (sellMatch) {

    return sellMatch[1].trim();

  }


  return "";

}


// ============================================================
// NUMERO ORANGE MONEY CLIENT
// ============================================================

function extractPayoutPhone(order) {

  // Nouvelle colonne dédiée
  if (order?.payout_phone) {

    return String(
      order.payout_phone
    ).trim();

  }


  // Compatibilité anciennes commandes
  const note =
    String(
      order?.customer_note || ""
    );


  const match =
    note.match(
      /Num[ée]ro Orange Money\s*:\s*([^\n|]+)/i
    );


  return match
    ? match[1].trim()
    : "";

}


// ============================================================
// FORMAT RESEAU
// ============================================================

function formatNetwork(network) {

  const value =
    String(
      network || ""
    )
    .trim()
    .toLowerCase();


  if (value === "trc20") {

    return "TRC20";

  }


  if (
    value === "bp20" ||
    value === "bep20"
  ) {

    return "BEP20";

  }


  return network
    ? String(network).toUpperCase()
    : "-";

}


// ============================================================
// CLASSE RESEAU
// ============================================================

function getNetworkClass(network) {

  const value =
    String(
      network || ""
    )
    .trim()
    .toLowerCase();


  if (value === "trc20") {

    return "trc20";

  }


  if (
    value === "bp20" ||
    value === "bep20"
  ) {

    return "bep20";

  }


  return "";

}


// ============================================================
// COPIER
// ============================================================

async function copyToClipboard(
  text,
  button
) {

  if (!text) {

    return;

  }


  try {

    if (
      navigator.clipboard?.writeText
    ) {

      await navigator.clipboard.writeText(
        text
      );

    }

    else {

      const temp =
        document.createElement(
          "textarea"
        );


      temp.value =
        text;


      temp.style.position =
        "fixed";


      temp.style.opacity =
        "0";


      document.body.appendChild(
        temp
      );


      temp.select();


      document.execCommand(
        "copy"
      );


      document.body.removeChild(
        temp
      );

    }


    if (button) {

      const original =
        button.textContent;


      button.textContent =
        "✓ Copié";


      button.classList.add(
        "copied"
      );


      setTimeout(
        () => {

          button.textContent =
            original;


          button.classList.remove(
            "copied"
          );

        },
        1500
      );

    }

  }

  catch (error) {

    console.error(
      "Erreur copie presse-papier :",
      error
    );

  }

}


// ============================================================
// DOM
// ============================================================

function $(id) {

  return document.getElementById(
    id
  );

}


// ============================================================
// ECHAPPEMENT HTML
// ============================================================

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


// ============================================================
// FORMAT NOMBRE
// ============================================================

function formatNumber(
  value,
  maximumFractionDigits = 0
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return "0";

  }


  return number.toLocaleString(
    "fr-FR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits
    }
  );

}


// ============================================================
// FORMAT DECIMAL
// ============================================================

function formatDecimal(value) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return "0";

  }


  return number.toFixed(
    6
  );

}


// ============================================================
// FORMAT DATE
// ============================================================

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


// ============================================================
// MESSAGE ERREUR
// ============================================================

function getErrorMessage(error) {

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


// ============================================================
// MESSAGES
// ============================================================

function showLoginMessage(
  message,
  type = "error"
) {

  const box =
    $("loginMessage");


  if (!box) {

    return;

  }


  box.textContent =
    String(
      message || ""
    );


  box.className =
    "message show " +
    type;

}


function clearLoginMessage() {

  const box =
    $("loginMessage");


  if (!box) {

    return;

  }


  box.textContent =
    "";


  box.className =
    "message";

}


function showMessage(
  id,
  message,
  type = "error"
) {

  const box =
    $(id);


  if (!box) {

    return;

  }


  box.textContent =
    String(
      message || ""
    );


  box.className =
    "message show " +
    type;

}


function clearMessage(id) {

  const box =
    $(id);


  if (!box) {

    return;

  }


  box.textContent =
    "";


  box.className =
    "message";

}


// ============================================================
// AFFICHAGE LOGIN / ADMIN
// ============================================================

function showLoginPage() {

  $("adminLoginPage")
    ?.classList
    .remove(
      "hidden"
    );


  $("adminPage")
    ?.classList
    .add(
      "hidden"
    );

}


function showAdminPage() {

  $("adminLoginPage")
    ?.classList
    .add(
      "hidden"
    );


  $("adminPage")
    ?.classList
    .remove(
      "hidden"
    );

}


// ============================================================
// VERIFICATION ADMIN
// ============================================================

async function verifyAdmin() {

  if (!currentUser) {

    return false;

  }


  try {

    const {
      data,
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


    if (!data) {

      return false;

    }


    currentProfile =
      data;


    const role =
      String(
        data.role || ""
      )
      .trim()
      .toLowerCase();


    return role === "admin";

  }

  catch (error) {

    console.error(
      "Erreur vérification admin:",
      error
    );


    return false;

  }

}


// ============================================================
// CONNEXION ADMIN
// ============================================================

async function adminLogin(event) {

  event.preventDefault();


  clearLoginMessage();


  const email =
    $("adminEmail")
      ?.value
      .trim()
      .toLowerCase();


  const password =
    $("adminPassword")
      ?.value || "";


  if (
    !email ||
    !password
  ) {

    showLoginMessage(
      "Veuillez remplir tous les champs."
    );


    return;

  }


  const button =
    $("adminLoginBtn");


  const oldText =
    button?.textContent;


  if (button) {

    button.disabled =
      true;


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


    const isAdmin =
      await verifyAdmin();


    if (!isAdmin) {

      await supabaseClient
        .auth
        .signOut();


      currentUser =
        null;


      currentProfile =
        null;


      throw new Error(
        "Accès refusé. Ce compte n'est pas administrateur."
      );

    }


    showAdminPage();


    await loadDashboard();

  }

  catch (error) {

    console.error(
      "Erreur connexion admin:",
      error
    );


    showLoginMessage(
      getErrorMessage(error)
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        oldText ||
        "Se connecter";

    }

  }

}


// ============================================================
// SESSION EXISTANTE
// ============================================================

async function checkSession() {

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


    if (!session?.user) {

      currentUser =
        null;


      currentProfile =
        null;


      showLoginPage();


      return;

    }


    currentUser =
      session.user;


    const isAdmin =
      await verifyAdmin();


    if (!isAdmin) {

      await supabaseClient
        .auth
        .signOut();


      currentUser =
        null;


      currentProfile =
        null;


      showLoginPage();


      showLoginMessage(
        "Accès refusé. Vous devez être administrateur."
      );


      return;

    }


    showAdminPage();


    await loadDashboard();

  }

  catch (error) {

    console.error(
      "Erreur session admin:",
      error
    );


    currentUser =
      null;


    currentProfile =
      null;


    showLoginPage();


    showLoginMessage(
      "Impossible de vérifier votre session."
    );

  }

}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

  updateAdminHeader();


  await Promise.all([

    loadSettings(),

    loadOrders(),

    loadDisputes(),

    loadUsers()

  ]);


  updateStatistics();

}


// ============================================================
// HEADER ADMIN
// ============================================================

function updateAdminHeader() {

  const element =
    $("adminUserName");


  if (!element) {

    return;

  }


  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "Administrateur";


  element.textContent =
    `${name} — ADMIN`;

}


// ============================================================
// PARAMETRES
// ============================================================

function getSettingsField(
  names
) {

  for (
    const name of names
  ) {

    const element =
      $(name);


    if (element) {

      return element;

    }

  }


  return null;

}


// ============================================================
// REMPLIR UN CHAMP
// ============================================================

function setFieldValue(
  names,
  value
) {

  const field =
    getSettingsField(
      names
    );


  if (!field) {

    return;

  }


  field.value =
    value ?? "";

}


// ============================================================
// RECUPERER UNE VALEUR
// ============================================================

function getFieldValue(
  names
) {

  const field =
    getSettingsField(
      names
    );


  if (!field) {

    return "";

  }


  return String(
    field.value ?? ""
  ).trim();

}


// ============================================================
// CHARGER PARAMETRES
// ============================================================

async function loadSettings() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("app_settings")
        .select("*")
        .eq(
          "id",
          1
        )
        .maybeSingle();


    if (error) {

      throw error;

    }


    currentSettings =
      data || {
        ...DEFAULT_SETTINGS
      };


    fillSettingsForm();

  }

  catch (error) {

    console.error(
      "Erreur chargement paramètres:",
      error
    );


    currentSettings = {
      ...DEFAULT_SETTINGS
    };


    fillSettingsForm();


    showMessage(
      "settingsMessage",
      "Impossible de charger les paramètres : " +
      getErrorMessage(error),
      "error"
    );

  }

}


// ============================================================
// REMPLIR FORMULAIRE PARAMETRES
// ============================================================

function fillSettingsForm() {

  const settings = {

    ...DEFAULT_SETTINGS,

    ...(currentSettings || {})

  };


  setFieldValue(
    [
      "buyRate",
      "adminBuyRate",
      "settingsBuyRate"
    ],
    settings.buy_rate
  );


  setFieldValue(
    [
      "sellRate",
      "adminSellRate",
      "settingsSellRate"
    ],
    settings.sell_rate
  );


  setFieldValue(
    [
      "minOrderCfa",
      "minOrder",
      "adminMinOrder",
      "settingsMinOrder"
    ],
    settings.min_order_cfa
  );


  setFieldValue(
    [
      "maxOrderCfa",
      "maxOrder",
      "adminMaxOrder",
      "settingsMaxOrder"
    ],
    settings.max_order_cfa
  );


  setFieldValue(
    [
      "trc20Fee",
      "trc20FeeUsdt",
      "adminTrc20Fee",
      "settingsTrc20Fee"
    ],
    settings.trc20_fee_usdt
  );


  setFieldValue(
    [
      "bp20Fee",
      "bep20Fee",
      "bp20FeeUsdt",
      "bep20FeeUsdt",
      "adminBp20Fee",
      "adminBep20Fee",
      "settingsBp20Fee"
    ],
    settings.bp20_fee_usdt
  );


  setFieldValue(
    [
      "orangeMoneyNumber",
      "orangeMoney",
      "orangeMoneyPhone",
      "adminOrangeMoneyNumber",
      "settingsOrangeMoneyNumber"
    ],
    settings.orange_money_number
  );


  setFieldValue(
    [
      "paymentMethod",
      "adminPaymentMethod",
      "settingsPaymentMethod"
    ],
    settings.payment_method
  );


  setFieldValue(
    [
      "country",
      "settingsCountry"
    ],
    settings.country
  );


  setFieldValue(
    [
      "currency",
      "settingsCurrency"
    ],
    settings.currency
  );


  updateSettingsPreview();

}


// ============================================================
// APERCU PARAMETRES
// ============================================================

function updateSettingsPreview() {

  const settings = {

    ...DEFAULT_SETTINGS,

    ...(currentSettings || {})

  };


  const buyRate =
    Number(
      getFieldValue([
        "buyRate",
        "adminBuyRate",
        "settingsBuyRate"
      ])
    );


  const sellRate =
    Number(
      getFieldValue([
        "sellRate",
        "adminSellRate",
        "settingsSellRate"
      ])
    );


  const minOrder =
    Number(
      getFieldValue([
        "minOrderCfa",
        "minOrder",
        "adminMinOrder",
        "settingsMinOrder"
      ])
    );


  const maxOrder =
    Number(
      getFieldValue([
        "maxOrderCfa",
        "maxOrder",
        "adminMaxOrder",
        "settingsMaxOrder"
      ])
    );


  const trc20Fee =
    Number(
      getFieldValue([
        "trc20Fee",
        "trc20FeeUsdt",
        "adminTrc20Fee",
        "settingsTrc20Fee"
      ])
    );


  const bp20Fee =
    Number(
      getFieldValue([
        "bp20Fee",
        "bep20Fee",
        "bp20FeeUsdt",
        "bep20FeeUsdt",
        "adminBp20Fee",
        "adminBep20Fee",
        "settingsBp20Fee"
      ])
    );


  const orange =
    getFieldValue([
      "orangeMoneyNumber",
      "orangeMoney",
      "orangeMoneyPhone",
      "adminOrangeMoneyNumber",
      "settingsOrangeMoneyNumber"
    ]);


  const previewBuy =
    $("previewBuyRate");


  if (previewBuy) {

    previewBuy.textContent =
      `${formatNumber(
        Number.isFinite(buyRate)
          ? buyRate
          : settings.buy_rate
      )} FCFA`;

  }


  const previewSell =
    $("previewSellRate");


  if (previewSell) {

    previewSell.textContent =
      `${formatNumber(
        Number.isFinite(sellRate)
          ? sellRate
          : settings.sell_rate
      )} FCFA`;

  }


  const previewMin =
    $("previewMinOrder");


  if (previewMin) {

    previewMin.textContent =
      `${formatNumber(
        Number.isFinite(minOrder)
          ? minOrder
          : settings.min_order_cfa
      )} FCFA`;

  }


  const previewMax =
    $("previewMaxOrder");


  if (previewMax) {

    previewMax.textContent =
      `${formatNumber(
        Number.isFinite(maxOrder)
          ? maxOrder
          : settings.max_order_cfa
      )} FCFA`;

  }


  const previewTrc =
    $("previewTrc20Fee");


  if (previewTrc) {

    previewTrc.textContent =
      `${Number.isFinite(trc20Fee)
        ? trc20Fee
        : settings.trc20_fee_usdt} USDT`;

  }


  const previewBep =
    $("previewBp20Fee") ||
    $("previewBep20Fee");


  if (previewBep) {

    previewBep.textContent =
      `${Number.isFinite(bp20Fee)
        ? bp20Fee
        : settings.bp20_fee_usdt} USDT`;

  }


  const previewOrange =
    $("previewOrangeMoney");


  if (previewOrange) {

    previewOrange.textContent =
      orange ||
      settings.orange_money_number;

  }

}


// ============================================================
// SAUVEGARDER PARAMETRES
// ============================================================

async function saveSettings(event) {

  if (event) {

    event.preventDefault();

  }


  clearMessage(
    "settingsMessage"
  );


  const buyRate =
    Number(
      getFieldValue([
        "buyRate",
        "adminBuyRate",
        "settingsBuyRate"
      ])
    );


  const sellRate =
    Number(
      getFieldValue([
        "sellRate",
        "adminSellRate",
        "settingsSellRate"
      ])
    );


  const minOrder =
    Number(
      getFieldValue([
        "minOrderCfa",
        "minOrder",
        "adminMinOrder",
        "settingsMinOrder"
      ])
    );


  const maxOrder =
    Number(
      getFieldValue([
        "maxOrderCfa",
        "maxOrder",
        "adminMaxOrder",
        "settingsMaxOrder"
      ])
    );


  const trc20Fee =
    Number(
      getFieldValue([
        "trc20Fee",
        "trc20FeeUsdt",
        "adminTrc20Fee",
        "settingsTrc20Fee"
      ])
    );


  const bp20Fee =
    Number(
      getFieldValue([
        "bp20Fee",
        "bep20Fee",
        "bp20FeeUsdt",
        "bep20FeeUsdt",
        "adminBp20Fee",
        "adminBep20Fee",
        "settingsBp20Fee"
      ])
    );


  const orangeMoney =
    getFieldValue([
      "orangeMoneyNumber",
      "orangeMoney",
      "orangeMoneyPhone",
      "adminOrangeMoneyNumber",
      "settingsOrangeMoneyNumber"
    ]);


  let paymentMethod =
    getFieldValue([
      "paymentMethod",
      "adminPaymentMethod",
      "settingsPaymentMethod"
    ]);


  let country =
    getFieldValue([
      "country",
      "settingsCountry"
    ]);


  let currency =
    getFieldValue([
      "currency",
      "settingsCurrency"
    ]);


  if (!paymentMethod) {

    paymentMethod =
      "Orange Money";

  }


  if (!country) {

    country =
      "Burkina Faso";

  }


  if (!currency) {

    currency =
      "XOF";

  }


  if (
    !Number.isFinite(buyRate) ||
    buyRate <= 0
  ) {

    showMessage(
      "settingsMessage",
      "Le taux d'achat doit être supérieur à 0."
    );


    return;

  }


  if (
    !Number.isFinite(sellRate) ||
    sellRate <= 0
  ) {

    showMessage(
      "settingsMessage",
      "Le taux de vente doit être supérieur à 0."
    );


    return;

  }


  if (
    !Number.isFinite(minOrder) ||
    minOrder <= 0
  ) {

    showMessage(
      "settingsMessage",
      "Le montant minimum doit être supérieur à 0."
    );


    return;

  }


  if (
    !Number.isFinite(maxOrder) ||
    maxOrder <= 0
  ) {

    showMessage(
      "settingsMessage",
      "Le montant maximum doit être supérieur à 0."
    );


    return;

  }


  if (
    minOrder >= maxOrder
  ) {

    showMessage(
      "settingsMessage",
      "Le minimum doit être inférieur au maximum."
    );


    return;

  }


  if (
    !Number.isFinite(trc20Fee) ||
    trc20Fee < 0
  ) {

    showMessage(
      "settingsMessage",
      "Le frais TRC20 doit être supérieur ou égal à 0."
    );


    return;

  }


  if (
    !Number.isFinite(bp20Fee) ||
    bp20Fee < 0
  ) {

    showMessage(
      "settingsMessage",
      "Le frais BEP20 doit être supérieur ou égal à 0."
    );


    return;

  }


  if (!orangeMoney) {

    showMessage(
      "settingsMessage",
      "Veuillez saisir le numéro Orange Money."
    );


    return;

  }


  const button =
    $("saveSettingsBtn") ||
    $("saveSettingsButton") ||
    $("settingsSaveBtn");


  const oldText =
    button?.textContent;


  if (button) {

    button.disabled =
      true;


    button.textContent =
      "Enregistrement...";

  }


  const payload = {

    country,

    currency,

    buy_rate:
      buyRate,

    sell_rate:
      sellRate,

    min_order_cfa:
      minOrder,

    max_order_cfa:
      maxOrder,

    trc20_fee_usdt:
      trc20Fee,

    bp20_fee_usdt:
      bp20Fee,

    orange_money_number:
      orangeMoney,

    payment_method:
      paymentMethod

  };


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("app_settings")
        .update(payload)
        .eq(
          "id",
          1
        )
        .select("*")
        .single();


    if (error) {

      throw error;

    }


    currentSettings =
      data;


    fillSettingsForm();


    showMessage(
      "settingsMessage",
      "Les paramètres ont été enregistrés avec succès.",
      "success"
    );


    console.log(
      "Paramètres enregistrés:",
      data
    );

  }

  catch (error) {

    console.error(
      "Erreur sauvegarde paramètres:",
      error
    );


    showMessage(
      "settingsMessage",
      "Impossible d'enregistrer les paramètres : " +
      getErrorMessage(error)
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        oldText ||
        "Enregistrer les paramètres";

    }

  }

}


// ============================================================
// COMMANDES
// ============================================================

async function loadOrders() {

  const container =
    $("ordersList");


  if (container) {

    container.innerHTML =
      '<div class="empty">Chargement des commandes...</div>';

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    allOrders =
      data || [];


    renderOrders();

    updateStatistics();

  }

  catch (error) {

    console.error(
      "Erreur commandes admin:",
      error
    );


    if (container) {

      container.innerHTML =
        '<div class="empty">Impossible de charger les commandes.</div>';

    }

  }

}


// ============================================================
// AFFICHAGE COMMANDES
// ============================================================

function renderOrders() {

  const container =
    $("ordersList");


  if (!container) {

    return;

  }


  const search =
    (
      $("orderSearch")
        ?.value || ""
    )
    .trim()
    .toLowerCase();


  const statusFilter =
    $("orderStatusFilter")
      ?.value || "";


  const typeFilter =
    $("orderTypeFilter")
      ?.value || "";


  const filtered =
    allOrders.filter(
      order => {

        const wallet =
          extractWalletAddress(
            order
          );


        const payoutPhone =
          extractPayoutPhone(
            order
          );


        const text = [

          order.id,

          order.user_id,

          order.side,

          order.network,

          order.status,

          wallet,

          payoutPhone,

          order.payment_method,

          order.customer_note

        ]
        .join(" ")
        .toLowerCase();


        const matchesSearch =
          !search ||
          text.includes(search);


        const matchesStatus =
          !statusFilter ||
          String(
            order.status || ""
          ) ===
          statusFilter;


        const matchesType =
          !typeFilter ||
          String(
            order.side || ""
          )
          .toLowerCase() ===
          typeFilter;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        );

      }
    );


  if (
    filtered.length === 0
  ) {

    container.innerHTML =
      '<div class="empty">Aucune commande trouvée.</div>';

    return;

  }


  const purchases =
    filtered.filter(
      order =>
        String(
          order.side || ""
        ).toLowerCase() ===
        "buy"
    );


  const sales =
    filtered.filter(
      order =>
        String(
          order.side || ""
        ).toLowerCase() ===
        "sell"
    );


  let html = "";


  // ==========================================================
  // ACHATS USDT
  // ==========================================================

  if (purchases.length > 0) {

    html += `

      <div class="orders-group">

        <div
          class="orders-group-title"
          style="
            padding:14px;
            margin-bottom:12px;
            border-radius:10px;
            background:#e8f5e9;
            color:#1b5e20;
            font-weight:800;
            font-size:18px;
          "
        >

          🟢 ACHATS USDT

          <span style="font-size:13px;font-weight:500;">
            — ${purchases.length} commande(s)
          </span>

        </div>

        <div class="orders-group-list">

          ${
            purchases
              .map(
                order =>
                  renderOrderCard(
                    order,
                    true
                  )
              )
              .join("")
          }

        </div>

      </div>

    `;

  }


  // ==========================================================
  // VENTES USDT
  // ==========================================================

  if (sales.length > 0) {

    html += `

      <div
        class="orders-group"
        style="margin-top:25px;"
      >

        <div
          class="orders-group-title"
          style="
            padding:14px;
            margin-bottom:12px;
            border-radius:10px;
            background:#e3f2fd;
            color:#0d47a1;
            font-weight:800;
            font-size:18px;
          "
        >

          🔵 VENTES USDT

          <span style="font-size:13px;font-weight:500;">
            — ${sales.length} commande(s)
          </span>

        </div>

        <div class="orders-group-list">

          ${
            sales
              .map(
                order =>
                  renderOrderCard(
                    order,
                    false
                  )
              )
              .join("")
          }

        </div>

      </div>

    `;

  }


  container.innerHTML =
    html;

}


// ============================================================
// CARTE COMMANDE
// ============================================================

function renderOrderCard(
  order,
  isBuy
) {

  const status =
    order.status ||
    "pending";


  const statusLabel =
    getOrderStatusLabel(
      status
    );


  const wallet =
    extractWalletAddress(
      order
    );


  const payoutPhone =
    extractPayoutPhone(
      order
    );


  const network =
    formatNetwork(
      order.network
    );


  const networkClass =
    getNetworkClass(
      order.network
    );


  const shortId =
    String(
      order.id || ""
    ).slice(
      0,
      8
    );


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (isBuy) {

    return `

      <div
        class="order-card purchase-order"
        style="
          border-left:4px solid #2e7d32;
        "
      >

        <div class="order-card-top">

          <div>

            <span
              class="order-type-badge buy"
            >
              🟢 Achat USDT
            </span>

            <div class="order-card-id">

              Commande #${escapeHtml(
                shortId
              )}

            </div>

          </div>

          <span
            class="status ${escapeHtml(
              status
            )}"
          >

            ${escapeHtml(
              statusLabel
            )}

          </span>

        </div>


        <div class="order-card-row">

          <span>Client ID</span>

          <strong
            style="
              font-size:12px;
              word-break:break-all;
            "
          >

            ${escapeHtml(
              String(
                order.user_id || "-"
              )
            )}

          </strong>

        </div>


        <div class="order-card-row">

          <span>Montant payé</span>

          <strong>

            ${formatNumber(
              order.amount_cfa
            )}
            FCFA

          </strong>

        </div>


        <div class="order-card-row">

          <span>USDT à envoyer</span>

          <strong>

            ${formatDecimal(
              order.net_usdt
            )}
            USDT

          </strong>

        </div>


        <div
          class="network-row"
          style="
            margin:12px 0;
            padding:12px;
            border-radius:8px;
            background:#fff8e1;
            border:2px solid #ffb300;
          "
        >

          <div
            style="
              font-size:12px;
              font-weight:700;
              color:#795548;
              margin-bottom:4px;
            "
          >
            ⚠️ RÉSEAU À UTILISER
          </div>

          <strong
            style="
              font-size:20px;
              color:#e65100;
            "
          >

            ${escapeHtml(
              network
            )}

          </strong>

        </div>


        ${
          wallet
            ? `

              <div
                class="wallet-box"
                style="
                  border:2px solid #2e7d32;
                  padding:12px;
                  border-radius:10px;
                  background:#f1f8e9;
                "
              >

                <div
                  class="wallet-box-label"
                  style="
                    font-weight:800;
                    margin-bottom:8px;
                    color:#1b5e20;
                  "
                >

                  📥 WALLET DU CLIENT
                  <br>

                  <small>
                    Envoyer les USDT à cette adresse
                  </small>

                </div>


                <div
                  class="wallet-box-row"
                  style="
                    display:flex;
                    gap:8px;
                    align-items:center;
                  "
                >

                  <span
                    class="wallet-box-value"
                    style="
                      word-break:break-all;
                      flex:1;
                      font-size:12px;
                    "
                  >

                    ${escapeHtml(
                      wallet
                    )}

                  </span>


                  <button
                    type="button"
                    class="copy-btn"
                    data-copy-wallet="${escapeHtml(
                      wallet
                    )}"
                  >

                    Copier

                  </button>

                </div>

              </div>

            `
            : `

              <div
                class="wallet-box"
                style="
                  padding:12px;
                  border-radius:10px;
                  background:#ffebee;
                  border:2px solid #c62828;
                "
              >

                <div
                  style="
                    color:#c62828;
                    font-weight:800;
                  "
                >

                  ❌ WALLET NON TROUVÉ

                </div>

                <div
                  style="
                    margin-top:5px;
                    font-size:13px;
                  "
                >

                  L'adresse du portefeuille client
                  n'est pas enregistrée dans cette commande.

                </div>

              </div>

            `
        }


        <div class="order-card-row">

          <span>Frais</span>

          <strong>

            ${formatDecimal(
              order.fee_usdt
            )}
            USDT

          </strong>

        </div>


        <div class="order-card-row">

          <span>Date</span>

          <strong>

            ${formatDate(
              order.created_at
            )}

          </strong>

        </div>


        <div class="order-card-actions">

          <button
            type="button"
            class="btn btn-secondary btn-small"
            data-view-order="${escapeHtml(
              order.id
            )}"
          >

            Voir / Modifier le statut

          </button>

        </div>

      </div>

    `;

  }


  // ==========================================================
  // VENTE
  // ==========================================================

  return `

    <div
      class="order-card sale-order"
      style="
        border-left:4px solid #1565c0;
      "
    >

      <div class="order-card-top">

        <div>

          <span
            class="order-type-badge sell"
          >
            🔵 Vente USDT
          </span>

          <div class="order-card-id">

            Commande #${escapeHtml(
              shortId
            )}

          </div>

        </div>


        <span
          class="status ${escapeHtml(
            status
          )}"
        >

          ${escapeHtml(
            statusLabel
          )}

        </span>

      </div>


      <div class="order-card-row">

        <span>Client ID</span>

        <strong
          style="
            font-size:12px;
            word-break:break-all;
          "
        >

          ${escapeHtml(
            String(
              order.user_id || "-"
            )
          )}

        </strong>

      </div>


      <div class="order-card-row">

        <span>USDT reçu</span>

        <strong>

          ${formatDecimal(
            order.usdt_amount
          )}
          USDT

        </strong>

      </div>


      <div class="order-card-row">

        <span>FCFA à payer au client</span>

        <strong>

          ${formatNumber(
            order.receive_cfa
          )}
          FCFA

        </strong>

      </div>


      <div
        class="network-row"
        style="
          margin:12px 0;
          padding:12px;
          border-radius:8px;
          background:#e3f2fd;
          border:2px solid #1976d2;
        "
      >

        <div
          style="
            font-size:12px;
            font-weight:700;
            color:#0d47a1;
            margin-bottom:4px;
          "
        >
          🌐 RÉSEAU DE LA TRANSACTION
        </div>

        <strong
          style="
            font-size:20px;
            color:#1565c0;
          "
        >

          ${escapeHtml(
            network
          )}

        </strong>

      </div>


      ${
        payoutPhone
          ? `

            <div
              class="wallet-box"
              style="
                border:2px solid #1565c0;
                padding:12px;
                border-radius:10px;
                background:#e3f2fd;
              "
            >

              <div
                class="wallet-box-label"
                style="
                  font-weight:800;
                  margin-bottom:8px;
                  color:#0d47a1;
                "
              >

                📱 NUMÉRO ORANGE MONEY CLIENT

              </div>


              <div
                class="wallet-box-row"
                style="
                  display:flex;
                  gap:8px;
                  align-items:center;
                "
              >

                <span
                  class="wallet-box-value"
                  style="
                    font-size:18px;
                    font-weight:800;
                    flex:1;
                  "
                >

                  ${escapeHtml(
                    payoutPhone
                  )}

                </span>


                <button
                  type="button"
                  class="copy-btn"
                  data-copy-wallet="${escapeHtml(
                    payoutPhone
                  )}"
                >

                  Copier

                </button>

              </div>

            </div>

          `
          : `

            <div
              class="wallet-box"
              style="
                padding:12px;
                border-radius:10px;
                background:#ffebee;
                border:2px solid #c62828;
              "
            >

              <div
                style="
                  color:#c62828;
                  font-weight:800;
                "
              >

                ❌ NUMÉRO ORANGE MONEY NON TROUVÉ

              </div>

              <div
                style="
                  margin-top:5px;
                  font-size:13px;
                "
              >

                Le numéro Orange Money du client
                n'est pas enregistré dans cette commande.

              </div>

            </div>

          `
      }


      ${
        wallet
          ? `

            <div
              class="wallet-box"
              style="
                margin-top:10px;
                padding:10px;
                border-radius:8px;
                background:#f5f5f5;
              "
            >

              <div
                class="wallet-box-label"
                style="
                  font-weight:700;
                  margin-bottom:5px;
                "
              >

                Adresse de dépôt NOA

              </div>

              <div
                style="
                  word-break:break-all;
                  font-size:12px;
                "
              >

                ${escapeHtml(
                  wallet
                )}

              </div>

            </div>

          `
          : ""
      }


      <div class="order-card-row">

        <span>Frais</span>

        <strong>

          ${formatDecimal(
            order.fee_usdt
          )}
          USDT

        </strong>

      </div>


      <div class="order-card-row">

        <span>Date</span>

        <strong>

          ${formatDate(
            order.created_at
          )}

        </strong>

      </div>


      <div class="order-card-actions">

        <button
          type="button"
          class="btn btn-secondary btn-small"
          data-view-order="${escapeHtml(
            order.id
          )}"
        >

          Voir / Modifier le statut

        </button>

      </div>

    </div>

  `;

}


// ============================================================
// STATUT COMMANDE
// ============================================================

function getOrderStatusLabel(
  status
) {

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
// STATISTIQUES
// ============================================================

function updateStatistics() {

  const total =
    allOrders.length;


  const pending =
    allOrders.filter(
      order =>
        order.status ===
        "pending"
    ).length;


  const payments =
    allOrders.filter(
      order =>
        order.status ===
        "processing"
    ).length;


  const completed =
    allOrders.filter(
      order =>
        order.status ===
        "completed"
    ).length;


  const disputes =
    allDisputes.filter(
      dispute =>
        dispute.status ===
          "open" ||
        dispute.status ===
          "processing"
    ).length;


  if ($("statTotalOrders")) {

    $("statTotalOrders")
      .textContent =
      formatNumber(
        total
      );

  }


  if ($("statPending")) {

    $("statPending")
      .textContent =
      formatNumber(
        pending
      );

  }


  if ($("statPayments")) {

    $("statPayments")
      .textContent =
      formatNumber(
        payments
      );

  }


  if ($("statCompleted")) {

    $("statCompleted")
      .textContent =
      formatNumber(
        completed
      );

  }


  if ($("statDisputes")) {

    $("statDisputes")
      .textContent =
      formatNumber(
        disputes
      );

  }


  if ($("statUsers")) {

    $("statUsers")
      .textContent =
      formatNumber(
        allUsers.length
      );

  }

}


// ============================================================
// DETAIL COMMANDE
// ============================================================

function openOrderModal(
  orderId
) {

  selectedOrder =
    allOrders.find(
      order =>
        String(
          order.id
        ) ===
        String(
          orderId
        )
    );


  if (!selectedOrder) {

    return;

  }


  const status =
    selectedOrder.status ||
    "pending";


  const network =
    formatNetwork(
      selectedOrder.network
    );


  const isBuy =
    String(
      selectedOrder.side || ""
    )
    .toLowerCase() ===
    "buy";


  const wallet =
    extractWalletAddress(
      selectedOrder
    );


  const payoutPhone =
    extractPayoutPhone(
      selectedOrder
    );


  const details =
    $("orderDetails");


  if (!details) {

    return;

  }


  details.innerHTML = `

    <div class="detail-row">

      <span>ID commande</span>

      <strong>

        ${escapeHtml(
          selectedOrder.id
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>ID client</span>

      <strong
        style="
          word-break:break-all;
          font-size:12px;
        "
      >

        ${escapeHtml(
          selectedOrder.user_id || "-"
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Type</span>

      <strong>

        ${
          isBuy
            ? "🟢 Achat USDT"
            : "🔵 Vente USDT"
        }

      </strong>

    </div>


    <div class="detail-row">

      <span>Montant FCFA</span>

      <strong>

        ${formatNumber(
          selectedOrder.amount_cfa
        )}
        FCFA

      </strong>

    </div>


    <div class="detail-row">

      <span>Montant USDT</span>

      <strong>

        ${formatDecimal(
          selectedOrder.usdt_amount
        )}
        USDT

      </strong>

    </div>


    <div class="detail-row">

      <span>USDT net</span>

      <strong>

        ${formatDecimal(
          selectedOrder.net_usdt
        )}
        USDT

      </strong>

    </div>


    <div class="detail-row">

      <span>Frais</span>

      <strong>

        ${formatDecimal(
          selectedOrder.fee_usdt
        )}
        USDT

      </strong>

    </div>


    <div
      class="detail-row"
      style="
        padding:12px;
        margin:10px 0;
        border-radius:8px;
        background:#fff8e1;
        border:2px solid #ffb300;
      "
    >

      <span
        style="
          font-weight:800;
        "
      >
        🌐 RÉSEAU
      </span>

      <strong
        style="
          font-size:18px;
          color:#e65100;
        "
      >

        ${escapeHtml(
          network
        )}

      </strong>

    </div>


    ${
      isBuy
        ? `

          <div
            class="wallet-box"
            style="
              margin-top:12px;
              padding:12px;
              border-radius:10px;
              background:#f1f8e9;
              border:2px solid #2e7d32;
            "
          >

            <div
              class="wallet-box-label"
              style="
                font-weight:800;
                color:#1b5e20;
                margin-bottom:8px;
              "
            >

              📥 WALLET DU CLIENT

            </div>


            ${
              wallet
                ? `

                  <div
                    class="wallet-box-row"
                    style="
                      display:flex;
                      gap:8px;
                      align-items:center;
                    "
                  >

                    <span
                      class="wallet-box-value"
                      style="
                        word-break:break-all;
                        flex:1;
                        font-size:12px;
                      "
                    >

                      ${escapeHtml(
                        wallet
                      )}

                    </span>


                    <button
                      type="button"
                      class="copy-btn"
                      data-copy-wallet="${escapeHtml(
                        wallet
                      )}"
                    >

                      Copier

                    </button>

                  </div>

                `
                : `

                  <div
                    style="
                      color:#c62828;
                      font-weight:800;
                    "
                  >

                    ❌ Adresse wallet non trouvée.

                  </div>

                `
            }

          </div>

        `
        : `

          <div
            class="wallet-box"
            style="
              margin-top:12px;
              padding:12px;
              border-radius:10px;
              background:#e3f2fd;
              border:2px solid #1565c0;
            "
          >

            <div
              class="wallet-box-label"
              style="
                font-weight:800;
                color:#0d47a1;
                margin-bottom:8px;
              "
            >

              📱 ORANGE MONEY CLIENT

            </div>


            ${
              payoutPhone
                ? `

                  <div
                    class="wallet-box-row"
                    style="
                      display:flex;
                      gap:8px;
                      align-items:center;
                    "
                  >

                    <strong
                      style="
                        font-size:18px;
                        flex:1;
                      "
                    >

                      ${escapeHtml(
                        payoutPhone
                      )}

                    </strong>


                    <button
                      type="button"
                      class="copy-btn"
                      data-copy-wallet="${escapeHtml(
                        payoutPhone
                      )}"
                    >

                      Copier

                    </button>

                  </div>

                `
                : `

                  <div
                    style="
                      color:#c62828;
                      font-weight:800;
                    "
                  >

                    ❌ Numéro Orange Money non trouvé.

                  </div>

                `
            }

          </div>

        `
    }


    ${
      !isBuy && wallet
        ? `

          <div class="detail-row">

            <span>Adresse de dépôt NOA</span>

            <strong
              style="
                word-break:break-all;
                font-size:12px;
              "
            >

              ${escapeHtml(
                wallet
              )}

            </strong>

          </div>

        `
        : ""
    }


    <div class="detail-row">

      <span>Paiement</span>

      <strong>

        ${escapeHtml(
          selectedOrder.payment_method ||
          "Orange Money"
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Statut</span>

      <strong>

        ${escapeHtml(
          getOrderStatusLabel(
            status
          )
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Date</span>

      <strong>

        ${formatDate(
          selectedOrder.created_at
        )}

      </strong>

    </div>


    ${
      selectedOrder.customer_note
        ? `

          <div class="detail-row">

            <span>Note client</span>

            <strong
              style="
                white-space:pre-wrap;
                word-break:break-word;
              "
            >

              ${escapeHtml(
                selectedOrder.customer_note
              )}

            </strong>

          </div>

        `
        : ""
    }


    ${
      selectedOrder.admin_note
        ? `

          <div class="detail-row">

            <span>Note admin</span>

            <strong
              style="
                white-space:pre-wrap;
                word-break:break-word;
              "
            >

              ${escapeHtml(
                selectedOrder.admin_note
              )}

            </strong>

          </div>

        `
        : ""
    }

  `;


  const statusSelect =
    $("orderStatusSelect");


  if (statusSelect) {

    statusSelect.value =
      status;

  }


  clearMessage(
    "orderModalMessage"
  );


  $("orderModal")
    ?.classList
    .add(
      "show"
    );

}


// ============================================================
// MODIFIER STATUT COMMANDE
// ============================================================

async function updateOrderStatus(
  status
) {

  if (!selectedOrder) {

    return;

  }


  // IMPORTANT :
  // Ces statuts correspondent à la contrainte
  // actuelle de la table public.orders.

  const allowedStatuses = [

    "pending",

    "processing",

    "completed",

    "cancelled"

  ];


  if (
    !allowedStatuses.includes(
      status
    )
  ) {

    showMessage(
      "orderModalMessage",
      "Statut invalide."
    );


    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .update({

          status:

            status,

          updated_at:

            new Date().toISOString()

        })
        .eq(
          "id",
          selectedOrder.id
        )
        .select("*")
        .single();


    if (error) {

      throw error;

    }


    selectedOrder =
      data;


    const index =
      allOrders.findIndex(
        order =>
          String(
            order.id
          ) ===
          String(
            data.id
          )
      );


    if (index !== -1) {

      allOrders[index] =
        data;

    }


    renderOrders();

    updateStatistics();


    openOrderModal(
      data.id
    );


    showMessage(
      "orderModalMessage",
      "Statut de la commande mis à jour.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur statut commande:",
      error
    );


    showMessage(
      "orderModalMessage",
      "Impossible de modifier la commande : " +
      getErrorMessage(error)
    );

  }

}


// ============================================================
// LITIGES
// ============================================================

async function loadDisputes() {

  const body =
    $("disputesTableBody");


  if (body) {

    body.innerHTML = `

      <tr>

        <td
          colspan="7"
          style="text-align:center"
        >

          Chargement des litiges...

        </td>

      </tr>

    `;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("disputes")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    allDisputes =
      data || [];


    renderDisputes();

    updateStatistics();

  }

  catch (error) {

    console.error(
      "Erreur litiges admin:",
      error
    );


    if (body) {

      body.innerHTML = `

        <tr>

          <td
            colspan="7"
            style="text-align:center"
          >

            Impossible de charger les litiges.

          </td>

        </tr>

      `;

    }

  }

}


// ============================================================
// AFFICHAGE LITIGES
// ============================================================

function renderDisputes() {

  const body =
    $("disputesTableBody");


  if (!body) {

    return;

  }


  if (
    allDisputes.length === 0
  ) {

    body.innerHTML = `

      <tr>

        <td
          colspan="7"
          style="text-align:center"
        >

          Aucun litige.

        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    allDisputes
      .map(
        dispute => {

          const status =
            dispute.status ||
            "open";


          return `

            <tr>

              <td>

                ${escapeHtml(
                  String(
                    dispute.id || ""
                  ).slice(
                    0,
                    8
                  )
                )}

              </td>


              <td>

                ${escapeHtml(
                  String(
                    dispute.order_id || ""
                  ).slice(
                    0,
                    8
                  )
                )}

              </td>


              <td>

                ${escapeHtml(
                  String(
                    dispute.user_id || ""
                  ).slice(
                    0,
                    8
                  )
                )}

              </td>


              <td>

                ${escapeHtml(
                  dispute.subject ||
                  "-"
                )}

              </td>


              <td>

                <span class="status">

                  ${escapeHtml(
                    getDisputeStatusLabel(
                      status
                    )
                  )}

                </span>

              </td>


              <td>

                ${formatDate(
                  dispute.created_at
                )}

              </td>


              <td>

                <button
                  class="action-btn"
                  type="button"
                  data-view-dispute="${escapeHtml(
                    dispute.id
                  )}"
                >

                  Voir

                </button>

              </td>

            </tr>

          `;

        }
      )
      .join("");

}


// ============================================================
// STATUT LITIGE
// ============================================================

function getDisputeStatusLabel(
  status
) {

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
// DETAIL LITIGE
// ============================================================

function openDisputeModal(
  disputeId
) {

  selectedDispute =
    allDisputes.find(
      dispute =>
        String(
          dispute.id
        ) ===
        String(
          disputeId
        )
    );


  if (!selectedDispute) {

    return;

  }


  const details =
    $("disputeDetails");


  if (!details) {

    return;

  }


  details.innerHTML = `

    <div class="detail-row">

      <span>ID</span>

      <strong>

        ${escapeHtml(
          selectedDispute.id
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Commande</span>

      <strong>

        ${escapeHtml(
          selectedDispute.order_id ||
          "-"
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Utilisateur</span>

      <strong>

        ${escapeHtml(
          selectedDispute.user_id ||
          "-"
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Sujet</span>

      <strong>

        ${escapeHtml(
          selectedDispute.subject ||
          "-"
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Message</span>

      <strong>

        ${escapeHtml(
          selectedDispute.message ||
          "-"
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Statut</span>

      <strong>

        ${escapeHtml(
          getDisputeStatusLabel(
            selectedDispute.status
          )
        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>Date</span>

      <strong>

        ${formatDate(
          selectedDispute.created_at
        )}

      </strong>

    </div>

  `;


  const statusSelect =
    $("disputeStatusSelect");


  if (statusSelect) {

    statusSelect.value =
      selectedDispute.status ||
      "open";

  }


  clearMessage(
    "disputeModalMessage"
  );


  $("disputeModal")
    ?.classList
    .add(
      "show"
    );

}


// ============================================================
// MODIFICATION LITIGE
// ============================================================

async function updateDisputeStatus(
  status
) {

  if (!selectedDispute) {

    return;

  }


  const allowed = [

    "open",

    "processing",

    "resolved",

    "closed",

    "cancelled"

  ];


  if (
    !allowed.includes(
      status
    )
  ) {

    showMessage(
      "disputeModalMessage",
      "Statut de litige invalide."
    );


    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("disputes")
        .update({

          status

        })
        .eq(
          "id",
          selectedDispute.id
        )
        .select("*")
        .single();


    if (error) {

      throw error;

    }


    selectedDispute =
      data;


    const index =
      allDisputes.findIndex(
        dispute =>
          String(
            dispute.id
          ) ===
          String(
            data.id
          )
      );


    if (index !== -1) {

      allDisputes[index] =
        data;

    }


    renderDisputes();

    updateStatistics();


    openDisputeModal(
      data.id
    );


    showMessage(
      "disputeModalMessage",
      "Statut du litige mis à jour.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur statut litige:",
      error
    );


    showMessage(
      "disputeModalMessage",
      "Impossible de modifier le litige : " +
      getErrorMessage(error)
    );

  }

}


// ============================================================
// UTILISATEURS
// ============================================================

async function loadUsers() {

  const body =
    $("usersTableBody");


  if (body) {

    body.innerHTML = `

      <tr>

        <td
          colspan="5"
          style="text-align:center"
        >

          Chargement des utilisateurs...

        </td>

      </tr>

    `;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,full_name,phone,country,role"
        )
        .order(
          "full_name",
          {
            ascending: true
          }
        );


    if (error) {

      throw error;

    }


    allUsers =
      data || [];


    renderUsers();

    updateStatistics();

  }

  catch (error) {

    console.error(
      "Erreur utilisateurs admin:",
      error
    );


    if (body) {

      body.innerHTML = `

        <tr>

          <td
            colspan="5"
            style="text-align:center"
          >

            Impossible de charger les utilisateurs.

          </td>

        </tr>

      `;

    }

  }

}


// ============================================================
// AFFICHAGE UTILISATEURS
// ============================================================

function renderUsers() {

  const body =
    $("usersTableBody");


  if (!body) {

    return;

  }


  const search =
    (
      $("userSearch")
        ?.value || ""
    )
    .trim()
    .toLowerCase();


  const filtered =
    allUsers.filter(
      user => {

        const text = [

          user.id,

          user.full_name,

          user.phone,

          user.country,

          user.role

        ]
        .join(" ")
        .toLowerCase();


        return (
          !search ||
          text.includes(search)
        );

      }
    );


  if (
    filtered.length === 0
  ) {

    body.innerHTML = `

      <tr>

        <td
          colspan="5"
          style="text-align:center"
        >

          Aucun utilisateur trouvé.

        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    filtered
      .map(
        user => {

          return `

            <tr>

              <td>

                ${escapeHtml(
                  user.full_name ||
                  "-"
                )}

              </td>


              <td>

                ${escapeHtml(
                  user.phone ||
                  "-"
                )}

              </td>


              <td>

                ${escapeHtml(
                  user.country ||
                  "-"
                )}

              </td>


              <td>

                ${escapeHtml(
                  user.role ||
                  "user"
                )}

              </td>


              <td>

                <small>

                  ${escapeHtml(
                    user.id
                  )}

                </small>

              </td>

            </tr>

          `;

        }
      )
      .join("");

}


// ============================================================
// DECONNEXION
// ============================================================

async function adminLogout() {

  try {

    await supabaseClient
      .auth
      .signOut();

  }

  catch (error) {

    console.error(
      "Erreur déconnexion admin:",
      error
    );

  }


  currentUser =
    null;


  currentProfile =
    null;


  currentSettings =
    null;


  allOrders =
    [];


  allDisputes =
    [];


  allUsers =
    [];


  selectedOrder =
    null;


  selectedDispute =
    null;


  showLoginPage();

}


// ============================================================
// FERMER MODAL
// ============================================================

function closeOrderModal() {

  $("orderModal")
    ?.classList
    .remove(
      "show"
    );


  selectedOrder =
    null;

}


function closeDisputeModal() {

  $("disputeModal")
    ?.classList
    .remove(
      "show"
    );


  selectedDispute =
    null;

}


// ============================================================
// EVENEMENTS
// ============================================================

function setupEvents() {

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  $("adminLoginForm")
    ?.addEventListener(
      "submit",
      adminLogin
    );


  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  $("adminLogoutBtn")
    ?.addEventListener(
      "click",
      adminLogout
    );


  // ----------------------------------------------------------
  // PARAMETRES
  // ----------------------------------------------------------

  const settingsForm =
    $("settingsForm") ||
    $("adminSettingsForm");


  settingsForm
    ?.addEventListener(
      "submit",
      saveSettings
    );


  $("saveSettingsBtn")
    ?.addEventListener(
      "click",
      saveSettings
    );


  $("saveSettingsButton")
    ?.addEventListener(
      "click",
      saveSettings
    );


  $("settingsSaveBtn")
    ?.addEventListener(
      "click",
      saveSettings
    );


  // ----------------------------------------------------------
  // APERCU EN TEMPS REEL
  // ----------------------------------------------------------

  [

    "buyRate",

    "adminBuyRate",

    "settingsBuyRate",

    "sellRate",

    "adminSellRate",

    "settingsSellRate",

    "minOrderCfa",

    "minOrder",

    "adminMinOrder",

    "settingsMinOrder",

    "maxOrderCfa",

    "maxOrder",

    "adminMaxOrder",

    "settingsMaxOrder",

    "trc20Fee",

    "trc20FeeUsdt",

    "adminTrc20Fee",

    "settingsTrc20Fee",

    "bp20Fee",

    "bep20Fee",

    "bp20FeeUsdt",

    "bep20FeeUsdt",

    "adminBp20Fee",

    "adminBep20Fee",

    "settingsBp20Fee",

    "orangeMoneyNumber",

    "orangeMoney",

    "orangeMoneyPhone",

    "adminOrangeMoneyNumber",

    "settingsOrangeMoneyNumber"

  ]
  .forEach(
    id => {

      $(id)
        ?.addEventListener(
          "input",
          updateSettingsPreview
        );

    }
  );


  // ----------------------------------------------------------
  // ONGLETS
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      ".tab"
    )
    .forEach(
      tab => {

        tab.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".tab"
              )
              .forEach(
                item =>
                  item.classList.remove(
                    "active"
                  )
              );


            document
              .querySelectorAll(
                ".admin-section"
              )
              .forEach(
                section =>
                  section.classList.remove(
                    "active"
                  )
              );


            tab.classList.add(
              "active"
            );


            const sectionId =
              tab.dataset.section;


            if (sectionId) {

              $(sectionId)
                ?.classList
                .add(
                  "active"
                );

            }

          }
        );

      }
    );


  // ----------------------------------------------------------
  // COMMANDES
  // ----------------------------------------------------------

  $("orderSearch")
    ?.addEventListener(
      "input",
      renderOrders
    );


  $("orderStatusFilter")
    ?.addEventListener(
      "change",
      renderOrders
    );


  $("orderTypeFilter")
    ?.addEventListener(
      "change",
      renderOrders
    );


  $("refreshOrdersBtn")
    ?.addEventListener(
      "click",
      loadOrders
    );


  // ----------------------------------------------------------
  // SELECT STATUT COMMANDE
  // ----------------------------------------------------------

  $("orderStatusSelect")
    ?.addEventListener(
      "change",
      event => {

        updateOrderStatus(
          event.target.value
        );

      }
    );


  // ----------------------------------------------------------
  // SELECT STATUT LITIGE
  // ----------------------------------------------------------

  $("disputeStatusSelect")
    ?.addEventListener(
      "change",
      event => {

        updateDisputeStatus(
          event.target.value
        );

      }
    );


  // ----------------------------------------------------------
  // ACTIONS TABLEAUX
  // ----------------------------------------------------------

  document.addEventListener(
    "click",
    event => {

      // ------------------------------------------------------
      // VOIR COMMANDE
      // ------------------------------------------------------

      const orderButton =
        event.target.closest(
          "[data-view-order]"
        );


      if (orderButton) {

        openOrderModal(
          orderButton.dataset.viewOrder
        );


        return;

      }


      // ------------------------------------------------------
      // COPIER WALLET / TELEPHONE
      // ------------------------------------------------------

      const copyButton =
        event.target.closest(
          "[data-copy-wallet]"
        );


      if (copyButton) {

        copyToClipboard(
          copyButton.dataset.copyWallet,
          copyButton
        );


        return;

      }


      // ------------------------------------------------------
      // STATUT COMMANDE
      // ------------------------------------------------------

      const orderStatusButton =
        event.target.closest(
          "[data-order-status]"
        );


      if (orderStatusButton) {

        updateOrderStatus(
          orderStatusButton
            .dataset
            .orderStatus
        );


        return;

      }


      // ------------------------------------------------------
      // VOIR LITIGE
      // ------------------------------------------------------

      const disputeButton =
        event.target.closest(
          "[data-view-dispute]"
        );


      if (disputeButton) {

        openDisputeModal(
          disputeButton.dataset.viewDispute
        );


        return;

      }


      // ------------------------------------------------------
      // STATUT LITIGE
      // ------------------------------------------------------

      const disputeStatusButton =
        event.target.closest(
          "[data-dispute-status]"
        );


      if (disputeStatusButton) {

        updateDisputeStatus(
          disputeStatusButton
            .dataset
            .disputeStatus
        );

      }

    }
  );


  // ----------------------------------------------------------
  // FERMETURE COMMANDE
  // ----------------------------------------------------------

  $("closeOrderModalBtn")
    ?.addEventListener(
      "click",
      closeOrderModal
    );


  $("closeOrderModal")
    ?.addEventListener(
      "click",
      closeOrderModal
    );


  // ----------------------------------------------------------
  // FERMETURE LITIGE
  // ----------------------------------------------------------

  $("closeDisputeModalBtn")
    ?.addEventListener(
      "click",
      closeDisputeModal
    );


  $("closeDisputeModal")
    ?.addEventListener(
      "click",
      closeDisputeModal
    );


  // ----------------------------------------------------------
  // ACTUALISATION LITIGES
  // ----------------------------------------------------------

  $("refreshDisputesBtn")
    ?.addEventListener(
      "click",
      loadDisputes
    );


  // ----------------------------------------------------------
  // UTILISATEURS
  // ----------------------------------------------------------

  $("userSearch")
    ?.addEventListener(
      "input",
      renderUsers
    );


  $("refreshUsersBtn")
    ?.addEventListener(
      "click",
      loadUsers
    );


  // ----------------------------------------------------------
  // FERMETURE MODALS EN DEHORS
  // ----------------------------------------------------------

  $("orderModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("orderModal")
        ) {

          closeOrderModal();

        }

      }
    );


  $("disputeModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("disputeModal")
        ) {

          closeDisputeModal();

        }

      }
    );


  // ----------------------------------------------------------
  // TOUCHE ECHAP
  // ----------------------------------------------------------

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeOrderModal();

        closeDisputeModal();

      }

    }
  );

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
      (
        event,
        session
      ) => {

        console.log(
          "ADMIN AUTH:",
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


          currentSettings =
            null;


          showLoginPage();


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
            async () => {

              const isAdmin =
                await verifyAdmin();


              if (!isAdmin) {

                await supabaseClient
                  .auth
                  .signOut();


                currentUser =
                  null;


                currentProfile =
                  null;


                showLoginPage();


                showLoginMessage(
                  "Accès refusé. Ce compte n'est pas administrateur."
                );


                return;

              }


              showAdminPage();


              await loadDashboard();

            },
            0
          );

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
      "================================================"
    );


    console.log(
      "NOA DIGIT TRADE ADMIN"
    );


    console.log(
      "Démarrage espace administrateur..."
    );


    console.log(
      "================================================"
    );


    setupEvents();


    setupAuthListener();


    await checkSession();

  }
);
