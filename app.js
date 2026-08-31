// ============================================================
// NOA DIGIT TRADE
// APP.JS — VERSION PROPRE ET CORRIGÉE
// ============================================================
//
// Fonctionnalités :
// - Authentification Supabase
// - Achat USDT
// - Vente USDT
// - Burkina Faso uniquement
// - Réseaux BEP20 / TRC20 uniquement
// - Taux achat / vente
// - Frais réseau
// - Minimum / maximum
// - Orange Money
// - QR Code USSD
// - Création de commande
// - Déclaration du paiement
// - Historique des commandes
// - Compte utilisateur
//
// IMPORTANT :
// Les contrôles de sécurité définitifs doivent être effectués
// côté Supabase (RLS + fonctions RPC).
// ============================================================


// ============================================================
// CONFIGURATION SUPABASE
// ============================================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ============================================================
// CONFIGURATION PAR DÉFAUT
// ============================================================

const DEFAULT_CONFIG = {

  country:
    'Burkina Faso',

  buyRate:
    600,

  sellRate:
    570,

  minFcfa:
    2000,

  maxFcfa:
    50000,

  networkFees: {

    BEP20:
      0,

    TRC20:
      2

  },

  orangeMoneyNumber:
    '74602553'

};


// ============================================================
// CONFIGURATION ACTIVE
// ============================================================
//
// Les valeurs peuvent plus tard être remplacées par les
// paramètres administrateur récupérés depuis Supabase.
//
// Pour le moment, on utilise les valeurs définies ci-dessus.
// ============================================================

let APP_CONFIG = {

  ...DEFAULT_CONFIG,

  networkFees: {
    ...DEFAULT_CONFIG.networkFees
  }

};


// ============================================================
// SUPABASE
// ============================================================

let supabaseClient = null;


if (
  window.supabase &&
  typeof window.supabase.createClient === 'function'
) {

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {

        auth: {

          persistSession:
            true,

          autoRefreshToken:
            true,

          detectSessionInUrl:
            true

        }

      }
    );

} else {

  console.error(
    'Supabase JS n’est pas chargé.'
  );

}


// ============================================================
// VARIABLES GLOBALES
// ============================================================

let orderType =
  'buy';

let currentSession =
  null;


// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log(
      'NOA DIGIT TRADE — démarrage'
    );

    if (!supabaseClient) {

      showGlobalMessage(
        'Impossible de charger le service. Supabase JS est indisponible.',
        'error'
      );

      return;

    }


    setupTabs();

    setupStartButton();

    setupAuth();

    setupCalculation();

    setupNetwork();

    setupPaymentMethods();

    setupOrderForm();

    removeMoovMoney();

    await loadPublicConfiguration();

    await checkSession();

    updateCalculationMode();

    updateCalculation();

  }
);


// ============================================================
// CHARGER CONFIGURATION PUBLIQUE
// ============================================================
//
// Cette fonction tente de récupérer une configuration depuis
// Supabase si une table "app_settings" existe.
//
// Si elle n’existe pas encore, l’application utilise les valeurs
// par défaut ci-dessus.
//
// Cela permet de continuer à travailler sans bloquer le site.
// ============================================================

async function loadPublicConfiguration() {

  if (!supabaseClient) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from('app_settings')
        .select('*')
        .limit(1)
        .maybeSingle();


    if (error) {

      console.warn(
        'Configuration administrateur non chargée. Utilisation de la configuration locale.',
        error.message
      );

      return;

    }


    if (!data) {
      return;
    }


    // --------------------------------------------------------
    // TAUX
    // --------------------------------------------------------

    const buyRate =
      Number(
        data.buy_rate
      );

    const sellRate =
      Number(
        data.sell_rate
      );


    if (
      Number.isFinite(buyRate) &&
      buyRate > 0
    ) {

      APP_CONFIG.buyRate =
        buyRate;

    }


    if (
      Number.isFinite(sellRate) &&
      sellRate > 0
    ) {

      APP_CONFIG.sellRate =
        sellRate;

    }


    // --------------------------------------------------------
    // LIMITES
    // --------------------------------------------------------

    const minFcfa =
      Number(
        data.min_fcfa
      );

    const maxFcfa =
      Number(
        data.max_fcfa
      );


    if (
      Number.isFinite(minFcfa) &&
      minFcfa > 0
    ) {

      APP_CONFIG.minFcfa =
        minFcfa;

    }


    if (
      Number.isFinite(maxFcfa) &&
      maxFcfa > 0
    ) {

      APP_CONFIG.maxFcfa =
        maxFcfa;

    }


    // --------------------------------------------------------
    // FRAIS BEP20
    // --------------------------------------------------------

    const bep20Fee =
      Number(
        data.bep20_fee
      );


    if (
      Number.isFinite(bep20Fee) &&
      bep20Fee >= 0
    ) {

      APP_CONFIG.networkFees.BEP20 =
        bep20Fee;

    }


    // --------------------------------------------------------
    // FRAIS TRC20
    // --------------------------------------------------------

    const trc20Fee =
      Number(
        data.trc20_fee
      );


    if (
      Number.isFinite(trc20Fee) &&
      trc20Fee >= 0
    ) {

      APP_CONFIG.networkFees.TRC20 =
        trc20Fee;

    }


    // --------------------------------------------------------
    // ORANGE MONEY
    // --------------------------------------------------------

    if (
      data.orange_money_number
    ) {

      APP_CONFIG.orangeMoneyNumber =
        String(
          data.orange_money_number
        );

    }


    console.log(
      'Configuration publique chargée.',
      APP_CONFIG
    );


  } catch (error) {

    console.warn(
      'Configuration distante indisponible.',
      error
    );

  }

}


// ============================================================
// SESSION
// ============================================================

async function checkSession() {

  if (!supabaseClient) {
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

      currentSession =
        null;

      updateLoginButton(
        null
      );

      return;

    }


    currentSession =
      data.session ||
      null;


    updateLoginButton(
      currentSession
    );


  } catch (error) {

    console.error(
      'Erreur vérification session :',
      error
    );

    currentSession =
      null;

    updateLoginButton(
      null
    );

  }

}


// ============================================================
// ÉCOUTER AUTHENTIFICATION
// ============================================================

if (supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    (_event, session) => {

      currentSession =
        session ||
        null;

      updateLoginButton(
        currentSession
      );

    }
  );

}


// ============================================================
// BOUTON CONNEXION / COMPTE
// ============================================================

function updateLoginButton(session) {

  const login =
    document.getElementById(
      'login'
    );


  if (!login) {
    return;
  }


  login.onclick =
    null;


  if (session) {

    login.textContent =
      'Mon compte';


    login.onclick =
      event => {

        event.preventDefault();

        showAccountModal(
          session.user
        );

      };

  } else {

    login.textContent =
      'Se connecter';


    login.onclick =
      event => {

        event.preventDefault();

        showAuthModal();

      };

  }

}


// ============================================================
// ACHAT / VENTE
// ============================================================

function setupTabs() {

  const tabs =
    document.querySelectorAll(
      '.tab'
    );


  tabs.forEach(
    tab => {

      tab.addEventListener(
        'click',
        event => {

          event.preventDefault();


          tabs.forEach(
            item => {

              item.classList.remove(
                'active'
              );

            }
          );


          tab.classList.add(
            'active'
          );


          orderType =
            tab.dataset.type === 'sell'
              ? 'sell'
              : 'buy';


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
    event => {

      event.preventDefault();


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

  const amount =
    document.getElementById(
      'amount'
    );


  if (!amount) {
    return;
  }


  amount.addEventListener(
    'input',
    updateCalculation
  );


  updateCalculationMode();

  updateCalculation();

}


// ============================================================
// RÉSEAU
// ============================================================

function setupNetwork() {

  const network =
    document.getElementById(
      'network'
    );


  if (!network) {
    return;
  }


  // ----------------------------------------------------------
  // Sécurité : seuls BEP20 / TRC20 sont acceptés.
  // ----------------------------------------------------------

  [...network.options].forEach(
    option => {

      const value =
        String(
          option.value
        ).toUpperCase();


      if (
        value !== 'BEP20' &&
        value !== 'TRC20'
      ) {

        option.remove();

      }

    }
  );


  network.addEventListener(
    'change',
    () => {

      normalizeNetwork();

      updateCalculation();

    }
  );


  normalizeNetwork();

}


// ============================================================
// NORMALISER RÉSEAU
// ============================================================

function normalizeNetwork() {

  const network =
    document.getElementById(
      'network'
    );


  if (!network) {
    return;
  }


  const value =
    String(
      network.value || ''
    ).toUpperCase();


  if (
    value !== 'BEP20' &&
    value !== 'TRC20'
  ) {

    network.value =
      'BEP20';

  }

}


// ============================================================
// PAIEMENT
// ============================================================

function setupPaymentMethods() {

  removeMoovMoney();


  const buttons =
    document.querySelectorAll(
      '.payment-option'
    );


  buttons.forEach(
    button => {

      const payment =
        String(
          button.dataset.payment || ''
        );


      if (
        payment.toLowerCase()
          .includes('moov')
      ) {

        button.remove();

        return;

      }


      button.addEventListener(
        'click',
        event => {

          event.preventDefault();


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
              'Orange Money';

          }

        }
      );

    }
  );


  const orange =
    document.querySelector(
      '.payment-option[data-payment="Orange Money"]'
    );


  if (orange) {

    orange.classList.add(
      'active'
    );

  }


  const paymentMethod =
    document.getElementById(
      'paymentMethod'
    );


  if (paymentMethod) {

    paymentMethod.value =
      'Orange Money';

  }

}


// ============================================================
// SUPPRIMER MOOV MONEY
// ============================================================

function removeMoovMoney() {

  document
    .querySelectorAll(
      '.payment-option'
    )
    .forEach(
      button => {

        const value =
          String(
            button.dataset.payment || ''
          ).toLowerCase();


        if (
          value.includes('moov')
        ) {

          button.remove();

        }

      }
    );

}


// ============================================================
// FORMULAIRE COMMANDE
// ============================================================

function setupOrderForm() {

  const submit =
    document.getElementById(
      'submit'
    );


  if (!submit) {
    return;
  }


  const form =
    submit.closest(
      'form'
    );


  if (form) {

    form.addEventListener(
      'submit',
      sendOrder
    );

  } else {

    submit.addEventListener(
      'click',
      sendOrder
    );

  }

}


// ============================================================
// MODE ACHAT / VENTE
// ============================================================

function updateCalculationMode() {

  const amount =
    document.getElementById(
      'amount'
    );

  const label =
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


  if (!amount) {
    return;
  }


  if (
    orderType === 'buy'
  ) {

    if (label) {

      label.textContent =
        'Montant à payer (FCFA)';

    }


    amount.placeholder =
      `Entre ${formatNumber(APP_CONFIG.minFcfa, 0)} et ${formatNumber(APP_CONFIG.maxFcfa, 0)} FCFA`;


    amount.min =
      String(
        APP_CONFIG.minFcfa
      );


    amount.max =
      String(
        APP_CONFIG.maxFcfa
      );


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }


    if (rateText) {

      rateText.textContent =
        `Taux d'achat : 1 USDT = ${formatNumber(APP_CONFIG.buyRate, 0)} FCFA`;

    }

  } else {

    if (label) {

      label.textContent =
        'Montant à vendre (USDT)';

    }


    amount.placeholder =
      'Montant en USDT';


    amount.removeAttribute(
      'min'
    );


    amount.removeAttribute(
      'max'
    );


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }


    if (rateText) {

      rateText.textContent =
        `Taux de vente : 1 USDT = ${formatNumber(APP_CONFIG.sellRate, 0)} FCFA`;

    }

  }


  updateCalculation();

}


// ============================================================
// FRAIS RÉSEAU
// ============================================================

function getNetworkFee() {

  normalizeNetwork();


  const network =
    document.getElementById(
      'network'
    );


  if (!network) {

    return (
      APP_CONFIG.networkFees.BEP20
    );

  }


  const value =
    String(
      network.value
    ).toUpperCase();


  if (
    value === 'TRC20'
  ) {

    return (
      APP_CONFIG.networkFees.TRC20
    );

  }


  return (
    APP_CONFIG.networkFees.BEP20
  );

}


// ============================================================
// NOM RÉSEAU
// ============================================================

function getNetworkName() {

  normalizeNetwork();


  const network =
    document.getElementById(
      'network'
    );


  if (
    network &&
    (
      network.value === 'TRC20' ||
      network.value === 'BEP20'
    )
  ) {

    return network.value;

  }


  return 'BEP20';

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


  const network =
    getNetworkName();


  const fee =
    getNetworkFee();


  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    resultAmount.textContent =
      orderType === 'buy'
        ? '0 USDT'
        : '0 FCFA';


    if (resultDetail) {

      resultDetail.textContent =
        orderType === 'buy'
          ? `Minimum : ${formatNumber(APP_CONFIG.minFcfa, 0)} FCFA`
          : `Minimum : ${formatNumber(APP_CONFIG.minFcfa / APP_CONFIG.sellRate, 6)} USDT`;

    }


    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau ${network} : ${formatNumber(fee, 2)} USDT`;

    }


    if (netDetail) {

      netDetail.textContent =
        orderType === 'buy'
          ? 'Montant net reçu : 0 USDT'
          : 'Montant net reçu : 0 FCFA';

    }


    return;

  }


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (
    orderType === 'buy'
  ) {

    const grossUsdt =
      value /
      APP_CONFIG.buyRate;


    const netUsdt =
      Math.max(
        grossUsdt - fee,
        0
      );


    resultAmount.textContent =
      `${formatNumber(netUsdt, 6)} USDT`;


    if (resultDetail) {

      resultDetail.textContent =
        `${formatNumber(value, 0)} FCFA ÷ ${formatNumber(APP_CONFIG.buyRate, 0)} = ${formatNumber(grossUsdt, 6)} USDT brut`;

    }


    if (feeDetail) {

      feeDetail.textContent =
        `Frais réseau ${network} : ${formatNumber(fee, 2)} USDT`;

    }


    if (netDetail) {

      netDetail.textContent =
        `Montant net reçu : ${formatNumber(netUsdt, 6)} USDT`;

    }


    return;

  }


  // ==========================================================
  // VENTE
  // ==========================================================

  const usdt =
    value;


  const grossFcfa =
    usdt *
    APP_CONFIG.sellRate;


  const feeFcfa =
    fee *
    APP_CONFIG.sellRate;


  const netFcfa =
    Math.max(
      grossFcfa - feeFcfa,
      0
    );


  resultAmount.textContent =
    `${formatNumber(netFcfa, 0)} FCFA`;


  if (resultDetail) {

    resultDetail.textContent =
      `${formatNumber(usdt, 6)} USDT × ${formatNumber(APP_CONFIG.sellRate, 0)} = ${formatNumber(grossFcfa, 0)} FCFA brut`;

  }


  if (feeDetail) {

    feeDetail.textContent =
      `Frais réseau ${network} : ${formatNumber(fee, 2)} USDT (${formatNumber(feeFcfa, 0)} FCFA)`;

  }


  if (netDetail) {

    netDetail.textContent =
      `Montant net reçu : ${formatNumber(netFcfa, 0)} FCFA`;

  }

}


// ============================================================
// VALIDATION DU MONTANT
// ============================================================

function validateOrderAmount(
  value
) {

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    return {
      valid:
        false,

      message:
        'Veuillez saisir un montant valide.'
    };

  }


  // ----------------------------------------------------------
  // ACHAT
  // ----------------------------------------------------------

  if (
    orderType === 'buy'
  ) {

    if (
      value <
      APP_CONFIG.minFcfa
    ) {

      return {

        valid:
          false,

        message:
          `Le montant minimum est de ${formatNumber(APP_CONFIG.minFcfa, 0)} FCFA.`

      };

    }


    if (
      value >
      APP_CONFIG.maxFcfa
    ) {

      return {

        valid:
          false,

        message:
          `Le montant maximum est de ${formatNumber(APP_CONFIG.maxFcfa, 0)} FCFA.`

      };

    }


    return {
      valid:
        true
    };

  }


  // ----------------------------------------------------------
  // VENTE
  // ----------------------------------------------------------

  const grossFcfa =
    value *
    APP_CONFIG.sellRate;


  if (
    grossFcfa <
    APP_CONFIG.minFcfa
  ) {

    const minimumUsdt =
      APP_CONFIG.minFcfa /
      APP_CONFIG.sellRate;


    return {

      valid:
        false,

      message:
        `Le montant minimum de vente est de ${formatNumber(minimumUsdt, 6)} USDT.`

    };

  }


  if (
    grossFcfa >
    APP_CONFIG.maxFcfa
  ) {

    const maximumUsdt =
      APP_CONFIG.maxFcfa /
      APP_CONFIG.sellRate;


    return {

      valid:
        false,

      message:
        `Le montant maximum de vente est de ${formatNumber(maximumUsdt, 6)} USDT.`

    };

  }


  return {
    valid:
      true
  };

}


// ============================================================
// VALIDATION PORTEFEUILLE
// ============================================================

function validateWallet(
  wallet
) {

  const value =
    String(
      wallet || ''
    ).trim();


  if (!value) {

    return {

      valid:
        false,

      message:
        'Veuillez saisir votre adresse de portefeuille USDT.'

    };

  }


  if (
    value.length < 20 ||
    value.length > 150
  ) {

    return {

      valid:
        false,

      message:
        'L’adresse du portefeuille semble invalide.'

    };

  }


  return {
    valid:
      true
  };

}


// ============================================================
// ENVOYER COMMANDE
// ============================================================

async function sendOrder(
  event
) {

  if (event) {
    event.preventDefault();
  }


  if (!supabaseClient) {

    showMessage(
      'msg',
      'Service temporairement indisponible.',
      'error'
    );

    return;

  }


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

  const submit =
    document.getElementById(
      'submit'
    );


  if (
    !amountInput ||
    !walletInput ||
    !networkInput ||
    !submit
  ) {

    console.error(
      'Éléments du formulaire manquants.'
    );

    return;

  }


  const amount =
    Number(
      amountInput.value
    );


  const wallet =
    walletInput.value.trim();


  const network =
    String(
      networkInput.value
    ).toUpperCase();


  // ----------------------------------------------------------
  // PAYS
  // ----------------------------------------------------------

  // L'application est destinée uniquement au Burkina Faso.
  // Le profil doit donc être renseigné avec des informations
  // personnelles réelles du client.
  //
  // Si l'index contient un champ country, on le vérifie.
  // ----------------------------------------------------------

  const countryInput =
    document.getElementById(
      'country'
    );


  if (
    countryInput &&
    countryInput.value &&
    countryInput.value !== 'Burkina Faso'
  ) {

    showMessage(
      'msg',
      'Ce service est réservé aux clients du Burkina Faso.',
      'error'
    );

    return;

  }


  // ----------------------------------------------------------
  // RÉSEAU
  // ----------------------------------------------------------

  if (
    network !== 'BEP20' &&
    network !== 'TRC20'
  ) {

    showMessage(
      'msg',
      'Réseau invalide. Seuls BEP20 et TRC20 sont acceptés.',
      'error'
    );

    return;

  }


  // ----------------------------------------------------------
  // MONTANT
  // ----------------------------------------------------------

  const amountValidation =
    validateOrderAmount(
      amount
    );


  if (
    !amountValidation.valid
  ) {

    showMessage(
      'msg',
      amountValidation.message,
      'error'
    );

    return;

  }


  // ----------------------------------------------------------
  // PORTEFEUILLE
  // ----------------------------------------------------------

  const walletValidation =
    validateWallet(
      wallet
    );


  if (
    !walletValidation.valid
  ) {

    showMessage(
      'msg',
      walletValidation.message,
      'error'
    );

    return;

  }


  // ----------------------------------------------------------
  // UTILISATEUR
  // ----------------------------------------------------------

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

      showMessage(
        'msg',
        'Vous devez vous connecter avant de placer une commande.',
        'error'
      );


      showAuthModal();

      return;

    }


    user =
      data.user;


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      'msg',
      'Impossible de vérifier votre connexion.',
      'error'
    );


    return;

  }


  // ----------------------------------------------------------
  // CALCUL
  // ----------------------------------------------------------

  const fee =
    getNetworkFee();


  let fiatAmount =
    0;

  let cryptoAmount =
    0;

  let rate =
    0;


  if (
    orderType === 'buy'
  ) {

    fiatAmount =
      Math.round(
        amount
      );


    rate =
      APP_CONFIG.buyRate;


    const grossUsdt =
      fiatAmount /
      rate;


    cryptoAmount =
      grossUsdt -
      fee;


    if (
      cryptoAmount <= 0
    ) {

      showMessage(
        'msg',
        'Le montant est insuffisant après déduction des frais réseau.',
        'error'
      );

      return;

    }

  } else {

    cryptoAmount =
      amount;


    rate =
      APP_CONFIG.sellRate;


    const grossFcfa =
      cryptoAmount *
      rate;


    const feeFcfa =
      fee *
      rate;


    fiatAmount =
      Math.max(
        grossFcfa - feeFcfa,
        0
      );


    if (
      fiatAmount <= 0
    ) {

      showMessage(
        'msg',
        'Le montant est insuffisant après déduction des frais réseau.',
        'error'
      );

      return;

    }

  }


  // ----------------------------------------------------------
  // PAIEMENT
  // ----------------------------------------------------------

  const paymentMethod =
    'Orange Money';


  // ----------------------------------------------------------
  // CONFIRMATION
  // ----------------------------------------------------------

  const confirmed =
    await showFinalOrderReview({

      type:
        orderType,

      fiatAmount:
        fiatAmount,

      cryptoAmount:
        cryptoAmount,

      rate:
        rate,

      fee:
        fee,

      network:
        network,

      wallet:
        wallet,

      paymentMethod:
        paymentMethod

    });


  if (!confirmed) {
    return;
  }


  // ----------------------------------------------------------
  // DÉSACTIVER BOUTON
  // ----------------------------------------------------------

  submit.disabled =
    true;

  submit.textContent =
    'Création de la commande...';


  try {

    // ========================================================
    // PROFIL
    // ========================================================

    const profile =
      await getOrCreateUserProfile(
        user
      );


    if (
      !profile ||
      !profile.id
    ) {

      throw new Error(
        'Profil utilisateur introuvable.'
      );

    }


    // ========================================================
    // COMMANDE
    // ========================================================

    const {
      data: order,
      error
    } =
      await supabaseClient
        .from('orders')
        .insert({

          user_id:
            profile.id,

          type:
            orderType,

          fiat_amount:
            fiatAmount,

          crypto_amount:
            cryptoAmount,

          rate:
            rate,

          fee:
            fee,

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


    if (error) {

      console.error(
        'Erreur création commande :',
        error
      );

      throw new Error(
        error.message
      );

    }


    // ========================================================
    // SUCCÈS
    // ========================================================

    showOrderConfirmation(
      order,
      {

        type:
          orderType,

        fiatAmount:
          fiatAmount,

        cryptoAmount:
          cryptoAmount,

        rate:
          rate,

        fee:
          fee,

        network:
          network,

        wallet:
          wallet,

        paymentMethod:
          paymentMethod

      }
    );


    amountInput.value =
      '';


    walletInput.value =
      '';


    updateCalculation();


    showMessage(
      'msg',
      '',
      'success'
    );


  } catch (error) {

    console.error(
      'Erreur commande :',
      error
    );


    showMessage(
      'msg',
      'Erreur : ' +
      (
        error.message ||
        'Impossible de créer la commande.'
      ),
      'error'
    );


  } finally {

    submit.disabled =
      false;

    submit.textContent =
      'Envoyer la demande';

  }

}


// ============================================================
// PROFIL UTILISATEUR
// ============================================================

async function getOrCreateUserProfile(
  user
) {

  if (
    !user ||
    !user.id
  ) {

    throw new Error(
      'Utilisateur invalide.'
    );

  }


  const {
    data: users,
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

    throw new Error(
      searchError.message
    );

  }


  if (
    users &&
    users.length > 0
  ) {

    return users[0];

  }


  const {
    data,
    error
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


  if (error) {

    throw new Error(
      error.message
    );

  }


  return data;

}


// ============================================================
// AUTH MODAL
// ============================================================

function showAuthModal() {

  const modal =
    document.getElementById(
      'authModal'
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
      false;
  }


  if (signupForm) {
    signupForm.hidden =
      true;
  }


  clearElement(
    'loginMessage'
  );

  clearElement(
    'signupMessage'
  );

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

  const close =
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

  const modal =
    document.getElementById(
      'authModal'
    );


  if (close) {

    close.addEventListener(
      'click',
      event => {

        event.preventDefault();

        closeAuthModal();

      }
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
      event => {

        event.preventDefault();

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
      event => {

        event.preventDefault();

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


// ============================================================
// CONNEXION
// ============================================================

async function loginUser(
  event
) {

  event?.preventDefault();


  const email =
    document.getElementById(
      'loginEmail'
    );

  const password =
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
    !email ||
    !password ||
    !message ||
    !button
  ) {

    return;

  }


  const emailValue =
    email.value.trim();


  const passwordValue =
    password.value;


  if (
    !emailValue ||
    !passwordValue
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
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({

          email:
            emailValue,

          password:
            passwordValue

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
      'Email ou mot de passe incorrect.';


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

async function signupUser(
  event
) {

  event?.preventDefault();


  const email =
    document.getElementById(
      'signupEmail'
    );

  const password =
    document.getElementById(
      'signupPassword'
    );

  const confirm =
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
    !email ||
    !password ||
    !confirm ||
    !message ||
    !button
  ) {

    return;

  }


  const emailValue =
    email.value.trim();


  const passwordValue =
    password.value;


  const confirmValue =
    confirm.value;


  if (
    !emailValue ||
    !passwordValue ||
    !confirmValue
  ) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }


  if (
    passwordValue.length < 6
  ) {

    message.textContent =
      'Le mot de passe doit contenir au moins 6 caractères.';

    return;

  }


  if (
    passwordValue !== confirmValue
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
          emailValue,

        password:
          passwordValue,

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
        'Compte créé. Consultez votre boîte email pour confirmer votre adresse.';


      password.value =
        '';

      confirm.value =
        '';


      return;

    }


    if (
      data.user
    ) {

      try {

        await getOrCreateUserProfile(
          data.user
        );

      } catch (profileError) {

        console.error(
          'Erreur profil :',
          profileError
        );

      }


      message.textContent =
        'Compte créé avec succès.';

    }


    password.value =
      '';

    confirm.value =
      '';


  } catch (error) {

    console.error(
      'Erreur inscription :',
      error
    );


    message.textContent =
      'Erreur : ' +
      (
        error.message ||
        'Inscription impossible.'
      );


  } finally {

    button.disabled =
      false;

    button.textContent =
      'Créer mon compte';

  }

}


// ============================================================
// MODAL DE VÉRIFICATION FINALE
// ============================================================

function showFinalOrderReview(
  details
) {

  return new Promise(
    resolve => {

      const old =
        document.getElementById(
          'finalOrderReview'
        );


      if (old) {
        old.remove();
      }


      const modal =
        document.createElement(
          'div'
        );


      modal.id =
        'finalOrderReview';


      modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:10001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        background:rgba(0,0,0,.65);
        box-sizing:border-box;
      `;


      const isBuy =
        details.type === 'buy';


      modal.innerHTML = `

        <div style="
          width:100%;
          max-width:520px;
          max-height:92vh;
          overflow-y:auto;
          background:#fff;
          color:#101828;
          border-radius:24px;
          padding:24px;
          box-sizing:border-box;
          box-shadow:0 25px 70px rgba(0,0,0,.30);
        ">

          <h2 style="
            margin:0 0 10px;
            font-size:25px;
          ">
            Vérifiez votre commande
          </h2>

          <p style="
            margin:0 0 20px;
            color:#667085;
            line-height:1.5;
          ">
            Vérifiez attentivement toutes les informations
            avant de confirmer.
          </p>


          <div style="
            background:#f8f9fc;
            border-radius:16px;
            padding:17px;
            line-height:1.8;
          ">

            <div>
              <strong>Opération :</strong>
              ${isBuy ? 'Achat USDT' : 'Vente USDT'}
            </div>

            <div>
              <strong>Montant FCFA :</strong>
              ${formatNumber(details.fiatAmount, 0)} FCFA
            </div>

            <div>
              <strong>Montant USDT :</strong>
              ${formatNumber(details.cryptoAmount, 6)} USDT
            </div>

            <div>
              <strong>Taux :</strong>
              1 USDT = ${formatNumber(details.rate, 0)} FCFA
            </div>

            <div>
              <strong>Réseau :</strong>
              ${escapeHtml(details.network)}
            </div>

            <div>
              <strong>Frais réseau :</strong>
              ${formatNumber(details.fee, 2)} USDT
            </div>

            <div style="
              word-break:break-all;
            ">
              <strong>Portefeuille :</strong>
              ${escapeHtml(details.wallet)}
            </div>

            <div>
              <strong>Paiement :</strong>
              Orange Money
            </div>

          </div>


          <div style="
            margin-top:16px;
            padding:15px;
            background:#fff8ed;
            border:1px solid #fedf89;
            border-radius:14px;
            color:#7a2e0e;
            line-height:1.5;
          ">

            <strong>Important</strong><br>

            Utilisez uniquement vos informations
            personnelles et vérifiez votre commande
            avant confirmation.

          </div>


          <div style="
            display:flex;
            gap:10px;
            margin-top:20px;
          ">

            <button
              id="cancelReview"
              type="button"
              style="
                flex:1;
                padding:14px;
                border:1px solid #d0d5dd;
                border-radius:12px;
                background:#fff;
                color:#101828;
                font-size:15px;
                cursor:pointer;
              ">
              Modifier
            </button>

            <button
              id="confirmReview"
              type="button"
              style="
                flex:1;
                padding:14px;
                border:0;
                border-radius:12px;
                background:#101828;
                color:#fff;
                font-size:15px;
                font-weight:700;
                cursor:pointer;
              ">
              Confirmer
            </button>

          </div>

        </div>

      `;


      document.body.appendChild(
        modal
      );


      const cancel =
        document.getElementById(
          'cancelReview'
        );


      const confirm =
        document.getElementById(
          'confirmReview'
        );


      cancel.addEventListener(
        'click',
        () => {

          modal.remove();

          resolve(false);

        }
      );


      confirm.addEventListener(
        'click',
        () => {

          modal.remove();

          resolve(true);

        }
      );


      modal.addEventListener(
        'click',
        event => {

          if (
            event.target === modal
          ) {

            modal.remove();

            resolve(false);

          }

        }
      );

    }
  );

}


// ============================================================
// QR ORANGE MONEY
// ============================================================

function createOrangeUSSD(
  amount
) {

  const cleanAmount =
    Math.round(
      Number(amount)
    );


  return (
    `*144*10*${APP_CONFIG.orangeMoneyNumber}*${cleanAmount}#`
  );

}


// ============================================================
// QR CODE
// ============================================================

async function loadQRCodeLibrary() {

  if (
    window.QRCode &&
    typeof window.QRCode.toCanvas === 'function'
  ) {

    return window.QRCode;

  }


  return new Promise(
    (resolve, reject) => {

      const old =
        document.querySelector(
          'script[data-noa-qrcode="true"]'
        );


      if (old) {

        old.addEventListener(
          'load',
          () => {

            if (
              window.QRCode
            ) {

              resolve(
                window.QRCode
              );

            } else {

              reject(
                new Error(
                  'QR Code indisponible.'
                )
              );

            }

          },
          {
            once:
              true
          }
        );


        old.addEventListener(
          'error',
          () => {

            reject(
              new Error(
                'Chargement QR impossible.'
              )
            );

          },
          {
            once:
              true
          }
        );


        return;

      }


      const script =
        document.createElement(
          'script'
        );


      script.src =
        'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';


      script.async =
        true;


      script.dataset.noaQrcode =
        'true';


      script.onload =
        () => {

          if (
            window.QRCode &&
            typeof window.QRCode.toCanvas === 'function'
          ) {

            resolve(
              window.QRCode
            );

          } else {

            reject(
              new Error(
                'API QR Code indisponible.'
              )
            );

          }

        };


      script.onerror =
        () => {

          reject(
            new Error(
              'Impossible de charger QRCode.js.'
            )
          );

        };


      document.head.appendChild(
        script
      );

    }
  );

}


// ============================================================
// AFFICHER QR
// ============================================================

async function renderPaymentQRCode(
  container,
  data
) {

  if (!container) {
    return;
  }


  container.innerHTML =
    '';


  try {

    const QRCode =
      await loadQRCodeLibrary();


    const canvas =
      document.createElement(
        'canvas'
      );


    canvas.style.display =
      'block';

    canvas.style.maxWidth =
      '100%';


    container.appendChild(
      canvas
    );


    await QRCode.toCanvas(
      canvas,
      data,
      {

        width:
          260,

        margin:
          3,

        errorCorrectionLevel:
          'M'

      }
    );


    return;

  } catch (error) {

    console.warn(
      'QR local indisponible.',
      error
    );

  }


  // ----------------------------------------------------------
  // SECOURS
  // ----------------------------------------------------------

  const img =
    document.createElement(
      'img'
    );


  img.alt =
    'QR Code Orange Money';


  img.width =
    260;


  img.height =
    260;


  img.style.maxWidth =
    '100%';


  img.src =
    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=' +
    encodeURIComponent(
      data
    );


  container.appendChild(
    img
  );

}


// ============================================================
// NUMÉRO COMMANDE
// ============================================================

function getOrderNumber(
  order
) {

  if (
    !order ||
    !order.id
  ) {

    return '#NDT';

  }


  const clean =
    String(
      order.id
    )
      .replaceAll(
        '-',
        ''
      )
      .toUpperCase();


  return (
    '#' +
    clean.substring(
      0,
      8
    )
  );

}


// ============================================================
// CONFIRMATION COMMANDE
// ============================================================

function showOrderConfirmation(
  order,
  details
) {

  const old =
    document.getElementById(
      'orderConfirmationModal'
    );


  if (old) {
    old.remove();
  }


  const modal =
    document.createElement(
      'div'
    );


  modal.id =
    'orderConfirmationModal';


  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:10000;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
    background:rgba(0,0,0,.65);
    box-sizing:border-box;
  `;


  const isBuy =
    details.type === 'buy';


  const orderNumber =
    getOrderNumber(
      order
    );


  const ussd =
    createOrangeUSSD(
      details.fiatAmount
    );


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:520px;
      max-height:92vh;
      overflow-y:auto;
      background:#fff;
      color:#101828;
      border-radius:24px;
      padding:24px;
      box-sizing:border-box;
      box-shadow:0 25px 70px rgba(0,0,0,.30);
    ">

      <div style="
        text-align:center;
        margin-bottom:20px;
      ">

        <div style="
          width:62px;
          height:62px;
          margin:auto;
          border-radius:50%;
          background:#ecfdf3;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:30px;
        ">
          ✓
        </div>

        <h2 style="
          margin:13px 0 6px;
          font-size:26px;
        ">
          ${isBuy ? 'Commande créée' : 'Demande de vente créée'}
        </h2>

        <p style="
          margin:0;
          color:#667085;
        ">
          Votre commande est enregistrée.
        </p>

      </div>


      <div style="
        background:#f8f9fc;
        border-radius:16px;
        padding:15px;
        text-align:center;
        margin-bottom:15px;
      ">

        <div style="
          font-size:13px;
          color:#667085;
        ">
          Numéro de commande
        </div>

        <div style="
          margin-top:5px;
          font-size:22px;
          font-weight:800;
        ">
          ${escapeHtml(orderNumber)}
        </div>

      </div>


      <div style="
        border:1px solid #e4e7ec;
        border-radius:17px;
        padding:16px;
        line-height:1.8;
      ">

        <div>
          <strong>Opération :</strong>
          ${isBuy ? 'Achat USDT' : 'Vente USDT'}
        </div>

        <div>
          <strong>Montant USDT :</strong>
          ${formatNumber(details.cryptoAmount, 6)} USDT
        </div>

        <div>
          <strong>Montant FCFA :</strong>
          ${formatNumber(details.fiatAmount, 0)} FCFA
        </div>

        <div>
          <strong>Taux :</strong>
          1 USDT = ${formatNumber(details.rate, 0)} FCFA
        </div>

        <div>
          <strong>Frais :</strong>
          ${formatNumber(details.fee, 2)} USDT
        </div>

        <div>
          <strong>Réseau :</strong>
          ${escapeHtml(details.network)}
        </div>

        <div style="
          word-break:break-all;
        ">
          <strong>Portefeuille :</strong>
          ${escapeHtml(details.wallet)}
        </div>

      </div>


      ${
        isBuy
          ? `

        <div style="
          margin-top:16px;
          background:#fff8ed;
          border:1px solid #fedf89;
          border-radius:17px;
          padding:17px;
        ">

          <h3 style="
            margin:0 0 10px;
            font-size:19px;
          ">
            🟠 Paiement Orange Money
          </h3>

          <p style="
            margin:0 0 12px;
            color:#475467;
            line-height:1.5;
          ">
            Payez exactement le montant indiqué
            ci-dessous.
          </p>

          <div style="
            background:#fff;
            border-radius:13px;
            padding:13px;
            text-align:center;
          ">

            <div style="
              font-size:13px;
              color:#667085;
            ">
              Montant à payer
            </div>

            <div style="
              font-size:27px;
              font-weight:800;
              margin-top:3px;
            ">
              ${formatNumber(details.fiatAmount, 0)} FCFA
            </div>

          </div>


          <div style="
            text-align:center;
            margin-top:15px;
          ">

            <div style="
              font-size:13px;
              color:#667085;
              margin-bottom:9px;
            ">
              QR Code de paiement
            </div>

            <div style="
              display:inline-block;
              padding:9px;
              background:white;
              border:1px solid #e4e7ec;
              border-radius:15px;
            ">

              <div
                id="orangeMoneyQRCode"
                style="
                  width:260px;
                  min-height:260px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                "
              >
                Génération...
              </div>

            </div>

          </div>


          <div style="
            margin-top:14px;
            padding:12px;
            background:#fff;
            border-radius:12px;
            color:#475467;
            font-size:13px;
            line-height:1.5;
          ">

            Après avoir effectué le paiement,
            cliquez sur
            <strong>
              « J'ai effectué le paiement »
            </strong>.

          </div>

        </div>

      `
          : `

        <div style="
          margin-top:16px;
          background:#eff8ff;
          border:1px solid #b2ddff;
          border-radius:16px;
          padding:16px;
          color:#175cd3;
          line-height:1.5;
        ">

          <strong>
            ⏳ Demande en cours de traitement
          </strong>

          <br><br>

          L'équipe NOA DIGIT TRADE va vérifier
          votre demande avant validation.

        </div>

      `
      }


      <div style="
        margin-top:15px;
        background:#fffaeb;
        border:1px solid #fedf89;
        border-radius:13px;
        padding:12px;
        text-align:center;
        color:#b54708;
        font-size:13px;
        line-height:1.5;
      ">

        ⏳ Statut :
        <strong>
          En attente de vérification
        </strong>

      </div>


      ${
        isBuy
          ? `

        <button
          id="paymentDoneButton"
          type="button"
          style="
            width:100%;
            margin-top:15px;
            padding:15px;
            border:0;
            border-radius:13px;
            background:#101828;
            color:#fff;
            font-weight:700;
            font-size:15px;
            cursor:pointer;
          ">
          J'ai effectué le paiement
        </button>

        <p
          id="paymentDoneMessage"
          style="
            text-align:center;
            line-height:1.5;
          ">
        </p>

      `
          : ''
      }


      <button
        id="closeOrderConfirmation"
        type="button"
        style="
          width:100%;
          margin-top:10px;
          padding:14px;
          border:1px solid #d0d5dd;
          border-radius:13px;
          background:#fff;
          color:#101828;
          font-size:15px;
          cursor:pointer;
        ">
        Fermer
      </button>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // ----------------------------------------------------------
  // QR
  // ----------------------------------------------------------

  if (isBuy) {

    const container =
      document.getElementById(
        'orangeMoneyQRCode'
      );


    renderPaymentQRCode(
      container,
      ussd
    );

  }


  // ----------------------------------------------------------
  // FERMER
  // ----------------------------------------------------------

  const close =
    document.getElementById(
      'closeOrderConfirmation'
    );


  if (close) {

    close.addEventListener(
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


  // ----------------------------------------------------------
  // DÉCLARATION PAIEMENT
  // ----------------------------------------------------------

  const paymentButton =
    document.getElementById(
      'paymentDoneButton'
    );


  if (paymentButton) {

    paymentButton.addEventListener(
      'click',
      () => {

        declarePayment(
          order,
          paymentButton
        );

      }
    );

  }

}


// ============================================================
// DÉCLARER PAIEMENT
// ============================================================

async function declarePayment(
  order,
  button
) {

  const message =
    document.getElementById(
      'paymentDoneMessage'
    );


  if (
    !order ||
    !order.id
  ) {

    setMessageElement(
      message,
      'Impossible d’identifier la commande.',
      'error'
    );

    return;

  }


  button.disabled =
    true;

  button.textContent =
    'Enregistrement...';


  try {

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (
      sessionError ||
      !sessionData.session
    ) {

      throw new Error(
        'Votre session a expiré. Veuillez vous reconnecter.'
      );

    }


    // --------------------------------------------------------
    // RPC SÉCURISÉE
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        'declare_order_payment',
        {

          p_order_id:
            order.id

        }
      );


    if (error) {

      throw new Error(
        error.message
      );

    }


    if (
      data !== true
    ) {

      throw new Error(
        'Cette commande ne peut plus être déclarée comme payée.'
      );

    }


    order.status =
      'payment_declared';


    button.textContent =
      'Paiement déclaré ✓';


    button.style.background =
      '#027a48';


    setMessageElement(
      message,
      'Paiement déclaré avec succès. La commande est maintenant en attente de vérification par NOA DIGIT TRADE.',
      'success'
    );


  } catch (error) {

    console.error(
      'Erreur déclaration paiement :',
      error
    );


    button.disabled =
      false;


    button.textContent =
      "J'ai effectué le paiement";


    setMessageElement(
      message,
      'Erreur : ' +
      (
        error.message ||
        'Impossible de déclarer le paiement.'
      ),
      'error'
    );

  }

}


// ============================================================
// COMPTE UTILISATEUR
// ============================================================

async function showAccountModal(
  user
) {

  const old =
    document.getElementById(
      'accountModal'
    );


  if (old) {
    old.remove();
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
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    background:rgba(0,0,0,.60);
    box-sizing:border-box;
  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:520px;
      max-height:90vh;
      overflow-y:auto;
      background:#fff;
      color:#101828;
      border-radius:24px;
      padding:25px;
      box-sizing:border-box;
    ">

      <h2 style="
        margin:0 0 20px;
        font-size:27px;
      ">
        Mon compte
      </h2>


      <div style="
        background:#f8f9fc;
        border-radius:16px;
        padding:16px;
      ">

        <div style="
          color:#667085;
          font-size:13px;
        ">
          Email
        </div>

        <div style="
          margin-top:5px;
          font-weight:700;
          word-break:break-word;
        ">
          ${escapeHtml(user.email || '')}
        </div>

      </div>


      <h3 style="
        margin:24px 0 15px;
      ">
        📋 Mes commandes
      </h3>


      <div id="orderHistory">

        Chargement...

      </div>


      <button
        id="logoutButton"
        type="button"
        style="
          width:100%;
          margin-top:20px;
          padding:14px;
          border:0;
          border-radius:12px;
          background:#101828;
          color:#fff;
          font-weight:700;
          cursor:pointer;
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
          border-radius:12px;
          background:#fff;
          cursor:pointer;
        ">
        Fermer
      </button>


      <p id="accountMessage"></p>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  const close =
    document.getElementById(
      'closeAccountButton'
    );


  close?.addEventListener(
    'click',
    () => {

      modal.remove();

    }
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


  const logout =
    document.getElementById(
      'logoutButton'
    );


  logout?.addEventListener(
    'click',
    async () => {

      logout.disabled =
        true;

      logout.textContent =
        'Déconnexion...';


      try {

        const {
          error
        } =
          await supabaseClient.auth.signOut();


        if (error) {
          throw error;
        }


        modal.remove();


      } catch (error) {

        logout.disabled =
          false;

        logout.textContent =
          'Se déconnecter';


        setMessageElement(
          document.getElementById(
            'accountMessage'
          ),
          error.message,
          'error'
        );

      }

    }
  );


  await loadOrderHistory(
    user
  );

}


// ============================================================
// HISTORIQUE
// ============================================================

async function loadOrderHistory(
  user
) {

  const history =
    document.getElementById(
      'orderHistory'
    );


  if (!history) {
    return;
  }


  try {

    const {
      data: users,
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
      !users ||
      users.length === 0
    ) {

      history.innerHTML =
        emptyHistoryHTML();

      return;

    }


    const userId =
      users[0].id;


    const {
      data: orders,
      error: orderError
    } =
      await supabaseClient
        .from('orders')
        .select(`
          id,
          created_at,
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
          userId
        )
        .order(
          'created_at',
          {
            ascending:
              false
          }
        );


    if (orderError) {
      throw orderError;
    }


    if (
      !orders ||
      orders.length === 0
    ) {

      history.innerHTML =
        emptyHistoryHTML();

      return;

    }


    history.innerHTML =
      orders
        .map(
          createOrderHistoryCard
        )
        .join('');


  } catch (error) {

    console.error(
      'Historique :',
      error
    );


    history.innerHTML = `

      <div style="
        padding:15px;
        border-radius:14px;
        background:#fff4f4;
        color:#b42318;
      ">

        Impossible de charger l'historique.

      </div>

    `;

  }

}


// ============================================================
// CARTE HISTORIQUE
// ============================================================

function createOrderHistoryCard(
  order
) {

  const isBuy =
    order.type === 'buy';


  const statusInfo =
    getStatusInfo(
      order.status
    );


  return `

    <div style="
      border:1px solid #e4e7ec;
      border-radius:17px;
      padding:16px;
      margin-bottom:13px;
      background:#fff;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        gap:10px;
      ">

        <div>

          <strong>
            ${isBuy ? 'Achat USDT' : 'Vente USDT'}
          </strong>

          <div style="
            color:#667085;
            font-size:12px;
            margin-top:4px;
          ">
            ${escapeHtml(formatDate(order.created_at))}
          </div>

        </div>


        <div style="
          padding:6px 9px;
          border-radius:20px;
          background:${statusInfo.background};
          color:${statusInfo.color};
          font-size:11px;
          font-weight:700;
          height:max-content;
        ">
          ${escapeHtml(statusInfo.text)}
        </div>

      </div>


      <div style="
        margin-top:14px;
        line-height:1.8;
        font-size:14px;
      ">

        <div>
          <strong>USDT :</strong>
          ${formatNumber(Number(order.crypto_amount || 0), 6)}
        </div>

        <div>
          <strong>FCFA :</strong>
          ${formatNumber(Number(order.fiat_amount || 0), 0)}
        </div>

        <div>
          <strong>Taux :</strong>
          ${formatNumber(Number(order.rate || 0), 0)} FCFA
        </div>

        <div>
          <strong>Frais :</strong>
          ${formatNumber(Number(order.fee || 0), 2)} USDT
        </div>

        <div>
          <strong>Réseau :</strong>
          ${escapeHtml(order.network || 'BEP20')}
        </div>

        <div>
          <strong>Paiement :</strong>
          ${escapeHtml(order.payment_method || 'Orange Money')}
        </div>

        <div style="
          word-break:break-all;
        ">
          <strong>Portefeuille :</strong>
          ${escapeHtml(order.wallet_address || '')}
        </div>

      </div>

    </div>

  `;

}


// ============================================================
// STATUT
// ============================================================

function getStatusInfo(
  status
) {

  switch (
    String(status || '')
      .toLowerCase()
  ) {

    case 'completed':
    case 'complete':
    case 'success':
    case 'successful':

      return {

        text:
          'Validée',

        background:
          '#ecfdf3',

        color:
          '#027a48'

      };


    case 'cancelled':
    case 'canceled':
    case 'rejected':

      return {

        text:
          'Annulée',

        background:
          '#fef3f2',

        color:
          '#b42318'

      };


    case 'processing':
    case 'in_progress':

      return {

        text:
          'En traitement',

        background:
          '#eff8ff',

        color:
          '#175cd3'

      };


    case 'payment_declared':

      return {

        text:
          'Paiement déclaré',

        background:
          '#eff8ff',

        color:
          '#175cd3'

      };


    case 'pending':
    default:

      return {

        text:
          'En attente',

        background:
          '#fffaeb',

        color:
          '#b54708'

      };

  }

}


// ============================================================
// HISTORIQUE VIDE
// ============================================================

function emptyHistoryHTML() {

  return `

    <div style="
      padding:20px;
      background:#f8f9fc;
      border-radius:15px;
      text-align:center;
      color:#667085;
    ">

      Aucune commande pour le moment.

    </div>

  `;

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
    !Number.isFinite(number)
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
// MESSAGE
// ============================================================

function showMessage(
  id,
  message,
  type = 'info'
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  if (
    type === 'error'
  ) {

    element.style.color =
      '#b42318';

  } else if (
    type === 'success'
  ) {

    element.style.color =
      '#027a48';

  } else {

    element.style.color =
      '#667085';

  }

}


// ============================================================
// MESSAGE ÉLÉMENT
// ============================================================

function setMessageElement(
  element,
  message,
  type = 'info'
) {

  if (!element) {
    return;
  }


  element.textContent =
    message;


  if (
    type === 'error'
  ) {

    element.style.color =
      '#b42318';

  } else if (
    type === 'success'
  ) {

    element.style.color =
      '#027a48';

  } else {

    element.style.color =
      '#667085';

  }

}


// ============================================================
// EFFACER MESSAGE
// ============================================================

function clearElement(
  id
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      '';

  }

}


// ============================================================
// MESSAGE GLOBAL
// ============================================================

function showGlobalMessage(
  message,
  type = 'info'
) {

  console.log(
    `[NOA DIGIT TRADE] ${message}`
  );


  const existing =
    document.getElementById(
      'globalNoaMessage'
    );


  if (existing) {
    existing.remove();
  }


  const element =
    document.createElement(
      'div'
    );


  element.id =
    'globalNoaMessage';


  element.textContent =
    message;


  element.style.cssText = `

    position:fixed;
    left:15px;
    right:15px;
    bottom:20px;
    z-index:99999;
    padding:15px;
    border-radius:13px;
    background:#fff;
    color:#101828;
    box-shadow:0 10px 30px rgba(0,0,0,.15);
    text-align:center;

  `;


  if (
    type === 'error'
  ) {

    element.style.border =
      '1px solid #f1b5b5';

    element.style.color =
      '#b42318';

  }


  document.body.appendChild(
    element
  );


  setTimeout(
    () => {

      element.remove();

    },
    5000
  );

}


// ============================================================
// FIN APP.JS
// ============================================================
