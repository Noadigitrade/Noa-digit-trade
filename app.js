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

if (!window.supabase) {
  console.error('Supabase JS n’a pas été chargé.');
} else {
  console.log('Supabase JS chargé.');
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

    console.log('Noa Digit Trade démarré.');

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
      'Erreur vérification session :',
      error
    );

    updateLoginButton(null);

  }

}


// ==========================================
// SURVEILLER LES CHANGEMENTS DE SESSION
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


  // Retirer les anciens événements
  // ajoutés par addEventListener dans setupAuth
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
// OUVRIR FENÊTRE AUTH
// ==========================================

function showAuthModal() {

  const modal =
    document.getElementById('authModal');


  const loginForm =
    document.getElementById('loginForm');


  const signupForm =
    document.getElementById('signupForm');


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
// FERMER FENÊTRE AUTH
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
// CONFIGURATION AUTHENTIFICATION
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
  // PASSER À L'INSCRIPTION
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

          loginForm.hidden =
            true;

        }


        if (signupForm) {

          signupForm.hidden =
            false;

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
    );

  }


  // --------------------------------------
  // PASSER À LA CONNEXION
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

          signupForm.hidden =
            true;

        }


        if (loginForm) {

          loginForm.hidden =
            false;

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

    console.error(
      'Éléments de connexion manquants.'
    );

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

        email:
          email,

        password:
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
// CRÉATION DE COMPTE
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

    console.error(
      'Éléments inscription manquants.'
    );

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


  // --------------------------------------
  // VALIDATION
  // --------------------------------------

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

    // ------------------------------------
    // CRÉER LE COMPTE SUPABASE AUTH
    // ------------------------------------

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


    console.log(
      'Compte Auth créé :',
      data
    );


    // ------------------------------------
    // SI SUPABASE DEMANDE UNE CONFIRMATION
    // ------------------------------------

    if (
      data.user &&
      !data.session
    ) {

      message.textContent =
        'Compte créé. Vérifiez votre email pour confirmer votre compte.';

      return;

    }


    // ------------------------------------
    // SI L'UTILISATEUR EST CONNECTÉ
    // ------------------------------------

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


    // ------------------------------------
    // NETTOYAGE
    // ------------------------------------

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
// CRÉER LE PROFIL DANS "Users"
// ==========================================

async function createUserProfile(user) {

  if (!user || !user.id) {

    throw new Error(
      'Utilisateur Supabase invalide.'
    );

  }


  // Vérifier si le profil existe déjà

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

    console.error(
      'Erreur recherche profil :',
      searchError
    );

    throw searchError;

  }


  // Profil déjà existant

  if (
    existingUsers &&
    existingUsers.length > 0
  ) {

    console.log(
      'Profil utilisateur déjà existant.'
    );

    return existingUsers[0];

  }


  // --------------------------------------
  // CRÉER LE PROFIL
  // --------------------------------------

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

    console.error(
      'Erreur création profil :',
      insertError
    );

    throw insertError;

  }


  console.log(
    'Profil créé :',
    newUser
  );


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


  // Fermer

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


  // Fermer en cliquant à l'extérieur

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


  // Déconnexion

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
// CONFIGURATION BOUTON COMMANDE
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
// ENVOYER UNE COMMANDE
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


  message.textContent =
    '';


  // --------------------------------------
  // VALIDATION
  // --------------------------------------

  if (!amount || !wallet) {

    message.textContent =
      'Veuillez remplir le montant et l’adresse du portefeuille.';

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


  // --------------------------------------
  // UTILISATEUR CONNECTÉ
  // --------------------------------------

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


  // --------------------------------------
  // DÉSACTIVER BOUTON
  // --------------------------------------

  submit.disabled =
    true;


  submit.textContent =
    'Envoi en cours...';


  try {

    // ------------------------------------
    // RÉCUPÉRER / CRÉER LE PROFIL
    // ------------------------------------

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

      console.error(
        'Erreur recherche utilisateur :',
        userError
      );

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

      // ----------------------------------
      // CRÉER PROFIL SI ABSENT
      // ----------------------------------

      const newProfile =
        await createUserProfile(
          user
        );


      userId =
        newProfile.id;

    }


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
            numericAmount,

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
      } envoyée avec succès : ${numericAmount} USDT (${network}).`;


    amountInput.value =
      '';


    walletInput.value =
      '';


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
