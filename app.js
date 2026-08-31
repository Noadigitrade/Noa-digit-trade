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
// INITIALISATION SUPABASE
// ==========================================

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

    setupTabs();

    setupStartButton();

    setupAuth();

    setupSubmitButton();

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
      'Erreur :',
      error
    );

    updateLoginButton(null);

  }

}


// ==========================================
// SURVEILLER LA CONNEXION
// ==========================================

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    updateLoginButton(session);

  }
);


// ==========================================
// BOUTON SE CONNECTER / MON COMPTE
// ==========================================

function updateLoginButton(session) {

  const login =
    document.getElementById('login');


  if (!login) {
    return;
  }


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
// FENÊTRE AUTHENTIFICATION
// ==========================================

function showAuthModal() {

  const modal =
    document.getElementById('authModal');


  const loginForm =
    document.getElementById('loginForm');


  const signupForm =
    document.getElementById('signupForm');


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
    loginForm.hidden = false;
  }


  if (signupForm) {
    signupForm.hidden = true;
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
    loginMessage.textContent = '';
  }


  if (signupMessage) {
    signupMessage.textContent = '';
  }

}


// ==========================================
// FERMER AUTH
// ==========================================

function closeAuthModal() {

  const modal =
    document.getElementById('authModal');


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
    document.getElementById('authModal');


  const closeAuth =
    document.getElementById('closeAuth');


  const showSignup =
    document.getElementById('showSignup');


  const showLogin =
    document.getElementById('showLogin');


  const loginSubmit =
    document.getElementById('loginSubmit');


  const signupSubmit =
    document.getElementById('signupSubmit');


  // --------------------------------------
  // FERMER
  // --------------------------------------

  if (closeAuth) {

    closeAuth.addEventListener(
      'click',
      closeAuthModal
    );

  }


  // --------------------------------------
  // CLIQUER À L'EXTÉRIEUR
  // --------------------------------------

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


  // --------------------------------------
  // AFFICHER INSCRIPTION
  // --------------------------------------

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
          loginForm.hidden = true;
        }


        if (signupForm) {
          signupForm.hidden = false;
        }


        document.getElementById(
          'loginMessage'
        ).textContent = '';

      }
    );

  }


  // --------------------------------------
  // AFFICHER CONNEXION
  // --------------------------------------

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
          signupForm.hidden = true;
        }


        if (loginForm) {
          loginForm.hidden = false;
        }


        document.getElementById(
          'signupMessage'
        ).textContent = '';

      }
    );

  }


  // --------------------------------------
  // CONNEXION
  // --------------------------------------

  if (loginSubmit) {

    loginSubmit.addEventListener(
      'click',
      loginUser
    );

  }


  // --------------------------------------
  // INSCRIPTION
  // --------------------------------------

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

  const email =
    document.getElementById(
      'loginEmail'
    ).value.trim();


  const password =
    document.getElementById(
      'loginPassword'
    ).value;


  const message =
    document.getElementById(
      'loginMessage'
    );


  const button =
    document.getElementById(
      'loginSubmit'
    );


  message.textContent = '';


  if (!email || !password) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }


  button.disabled = true;

  button.textContent =
    'Connexion...';


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

    button.disabled = false;

    button.textContent =
      'Se connecter';

  }

}


// ==========================================
// CRÉATION DE COMPTE
// ==========================================

async function signupUser() {

  const email =
    document.getElementById(
      'signupEmail'
    ).value.trim();


  const password =
    document.getElementById(
      'signupPassword'
    ).value;


  const confirmPassword =
    document.getElementById(
      'signupPasswordConfirm'
    ).value;


  const message =
    document.getElementById(
      'signupMessage'
    );


  const button =
    document.getElementById(
      'signupSubmit'
    );


  message.textContent = '';


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


  button.disabled = true;

  button.textContent =
    'Création...';


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email: email,

        password: password

      });


    if (error) {

      throw error;

    }


    console.log(
      'Compte créé :',
      data
    );


    message.textContent =
      'Compte créé avec succès. Vérifiez votre email pour confirmer votre compte.';


    document.getElementById(
      'signupPassword'
    ).value = '';


    document.getElementById(
      'signupPasswordConfirm'
    ).value = '';


  } catch (error) {

    console.error(
      'Erreur inscription :',
      error
    );


    message.textContent =
      'Erreur : ' +
      error.message;

  } finally {

    button.disabled = false;

    button.textContent =
      'Créer mon compte';

  }

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
    document.createElement('div');


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
  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:420px;
      background:white;
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
        ">
        Fermer
      </button>

      <p id="accountMessage"></p>

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
      () => {

        modal.remove();

      }
    );


  document
    .getElementById(
      'logoutButton'
    )
    .addEventListener(
      'click',
      async () => {

        const {
          error
        } =
          await supabaseClient.auth.signOut();


        if (error) {

          document.getElementById(
            'accountMessage'
          ).textContent =
            'Erreur : ' +
            error.message;

          return;

        }


        modal.remove();

      }
    );

}


// ==========================================
// PROTECTION AFFICHAGE EMAIL
// ==========================================

function escapeHtml(value) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


// ==========================================
// ENVOYER UNE COMMANDE
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
// ENVOI COMMANDE
// ==========================================

async function sendOrder() {

  const amount =
    document.getElementById(
      'amount'
    ).value.trim();


  const wallet =
    document.getElementById(
      'wallet'
    ).value.trim();


  const network =
    document.getElementById(
      'network'
    ).value;


  const message =
    document.getElementById(
      'msg'
    );


  const submit =
    document.getElementById(
      'submit'
    );


  message.textContent = '';


  // --------------------------------------
  // VALIDATION
  // --------------------------------------

  if (!amount || !wallet) {

    message.textContent =
      'Veuillez remplir le montant et l’adresse du portefeuille.';

    return;

  }


  if (Number(amount) <= 0) {

    message.textContent =
      'Le montant doit être supérieur à 0.';

    return;

  }


  // --------------------------------------
  // UTILISATEUR CONNECTÉ
  // --------------------------------------

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


  const user =
    data.user;


  submit.disabled = true;

  submit.textContent =
    'Envoi en cours...';


  try {

    // ------------------------------------
    // CHERCHER L'UTILISATEUR DANS
    // LA TABLE "Users"
    // ------------------------------------

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

      console.error(
        'Erreur recherche utilisateur :',
        userError
      );


      throw new Error(
        'Impossible de retrouver votre profil utilisateur.'
      );

    }


    if (
      !users ||
      users.length === 0
    ) {

      throw new Error(
        'Votre profil utilisateur n’existe pas encore.'
      );

    }


    const userId =
      users[0].id;


    // ------------------------------------
    // CRÉER LA COMMANDE
    // ------------------------------------

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
            Number(amount),

          network:
            network,

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


    // ------------------------------------
    // SUCCÈS
    // ------------------------------------

    message.textContent =
      `Demande ${
        type === 'buy'
          ? 'd’achat'
          : 'de vente'
      } envoyée avec succès : ${amount} USDT (${network}).`;


    document.getElementById(
      'amount'
    ).value = '';


    document.getElementById(
      'wallet'
    ).value = '';


  } catch (error) {

    console.error(
      'Erreur commande :',
      error
    );


    message.textContent =
      'Erreur : ' +
      error.message;

  } finally {

    submit.disabled = false;

    submit.textContent =
      'Envoyer la demande';

  }

}
