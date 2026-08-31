// ============================================================
// NOA DIGIT TRADE
// ADMIN.JS
//
// ESPACE ADMINISTRATEUR
//
// - Connexion Supabase
// - Vérification role = admin
// - Tableau de bord
// - Toutes les commandes
// - Modification des statuts
// - Litiges
// - Utilisateurs
// - Statistiques
// ============================================================


// ============================================================
// SUPABASE
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
// ETAT
// ============================================================

let currentUser = null;

let currentProfile = null;

let allOrders = [];

let allDisputes = [];

let allUsers = [];

let selectedOrder = null;

let selectedDispute = null;


// ============================================================
// UTILITAIRES
// ============================================================

function $(id) {

  return document.getElementById(id);

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatNumber(value) {

  return (
    Number(value) || 0
  ).toLocaleString("fr-FR");

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


function formatDecimal(value) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {

    return "0";

  }

  return number.toFixed(6);

}


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
// MESSAGE LOGIN
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
    message;

  box.className =
    "message show " + type;

}


function showModalMessage(
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
    message;

  box.className =
    "message show " + type;

}


function clearModalMessage(id) {

  const box =
    $(id);

  if (!box) {

    return;

  }

  box.textContent = "";

  box.className =
    "message";

}


// ============================================================
// AFFICHAGE
// ============================================================

function showLoginPage() {

  $("adminLoginPage")
    ?.classList
    .remove("hidden");

  $("adminPage")
    ?.classList
    .add("hidden");

}


function showAdminPage() {

  $("adminLoginPage")
    ?.classList
    .add("hidden");

  $("adminPage")
    ?.classList
    .remove("hidden");

}


// ============================================================
// CONNEXION
// ============================================================

async function adminLogin(event) {

  event.preventDefault();

  showLoginMessage(
    "",
    "success"
  );


  const email =
    $("adminEmail")
      ?.value
      .trim()
      .toLowerCase();


  const password =
    $("adminPassword")
      ?.value || "";


  if (!email || !password) {

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


    const isAdmin =
      await verifyAdmin();


    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      currentUser =
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
      "Erreur connexion admin :",
      error
    );


    showLoginMessage(
      getErrorMessage(error)
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        oldText ||
        "Se connecter";

    }

  }

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


    if (role !== "admin") {

      return false;

    }


    return true;

  }

  catch (error) {

    console.error(
      "Erreur vérification admin :",
      error
    );

    return false;

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

      showLoginPage();

      return;

    }


    currentUser =
      session.user;


    const isAdmin =
      await verifyAdmin();


    if (!isAdmin) {

      await supabaseClient.auth.signOut();

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
      "Erreur session admin :",
      error
    );

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
    loadOrders(),
    loadDisputes(),
    loadUsers()
  ]);

  updateStatistics();

}


// ============================================================
// HEADER
// ============================================================

function updateAdminHeader() {

  if (!$("adminUserName")) {

    return;

  }


  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "Administrateur";


  $("adminUserName").textContent =
    `${name} — ADMIN`;

}


// ============================================================
// COMMANDES
// ============================================================

async function loadOrders() {

  const body =
    $("ordersTableBody");


  if (body) {

    body.innerHTML = `

      <tr>

        <td
          colspan="8"
          style="text-align:center"
        >
          Chargement des commandes...

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
      "Erreur commandes admin :",
      error
    );


    if (body) {

      body.innerHTML = `

        <tr>

          <td
            colspan="8"
            style="text-align:center"
          >
            Impossible de charger les commandes.

          </td>

        </tr>

      `;

    }

  }

}


// ============================================================
// AFFICHAGE COMMANDES
// ============================================================

function renderOrders() {

  const body =
    $("ordersTableBody");


  if (!body) {

    return;

  }


  const search =
    (
      $("orderSearch")
        ?.value || ""
    )
    .trim()
    .toLowerCase();


  const status =
    $("orderStatusFilter")
      ?.value || "";


  const filtered =
    allOrders.filter(order => {

      const text =
        [
          order.id,
          order.user_id,
          order.type,
          order.network,
          order.status,
          order.wallet_address,
          order.payment_method
        ]
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !search ||
        text.includes(search);


      const matchesStatus =
        !status ||
        order.status === status;


      return (
        matchesSearch &&
        matchesStatus
      );

    });


  if (
    filtered.length === 0
  ) {

    body.innerHTML = `

      <tr>

        <td
          colspan="8"
          style="text-align:center"
        >
          Aucune commande trouvée.

        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    filtered
      .map(order => {

        const type =
          order.type === "buy"
            ? "Achat"
            : "Vente";


        const status =
          order.status ||
          "pending";


        const statusLabel =
          getOrderStatusLabel(
            status
          );


        return `

          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  String(
                    order.id
                  ).slice(0, 8)
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(type)}
            </td>

            <td>
              ${escapeHtml(
                String(
                  order.user_id || ""
                ).slice(0, 8)
              )}
            </td>

            <td>
              <strong>
                ${formatNumber(
                  order.fiat_amount
                )} FCFA
              </strong>
            </td>

            <td>
              ${escapeHtml(
                order.network || "-"
              )}
            </td>

            <td>

              <span
                class="status ${escapeHtml(
                  status
                )}"
              >
                ${escapeHtml(
                  statusLabel
                )}
              </span>

            </td>

            <td>
              ${formatDate(
                order.created_at
              )}
            </td>

            <td>

              <button
                class="action-btn"
                data-view-order="${escapeHtml(
                  order.id
                )}"
              >
                Voir
              </button>

            </td>

          </tr>

        `;

      })
      .join("");

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

    payment_declared:
      "Paiement déclaré",

    paid:
      "Paiement déclaré",

    verified:
      "Paiement vérifié",

    completed:
      "Terminée",

    rejected:
      "Rejetée",

    cancelled:
      "Annulée",

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
// STATISTIQUES
// ============================================================

function updateStatistics() {

  const total =
    allOrders.length;


  const pending =
    allOrders.filter(
      order =>
        order.status === "pending"
    ).length;


  const payments =
    allOrders.filter(
      order =>
        order.status ===
          "payment_declared" ||
        order.status === "paid"
    ).length;


  const completed =
    allOrders.filter(
      order =>
        order.status === "completed"
    ).length;


  if ($("statTotalOrders")) {

    $("statTotalOrders")
      .textContent =
      formatNumber(total);

  }


  if ($("statPending")) {

    $("statPending")
      .textContent =
      formatNumber(pending);

  }


  if ($("statPayments")) {

    $("statPayments")
      .textContent =
      formatNumber(payments);

  }


  if ($("statCompleted")) {

    $("statCompleted")
      .textContent =
      formatNumber(completed);

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
        String(order.id) ===
        String(orderId)
    );


  if (!selectedOrder) {

    return;

  }


  const network =
    selectedOrder.network ||
    "-";


  const status =
    selectedOrder.status ||
    "pending";


  $("orderDetails").innerHTML = `

    <div class="detail-row">

      <span>ID</span>

      <strong>
        ${escapeHtml(
          selectedOrder.id
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>Utilisateur</span>

      <strong>
        ${escapeHtml(
          selectedOrder.user_id || "-"
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>Type</span>

      <strong>
        ${selectedOrder.type === "buy"
          ? "Achat USDT"
          : "Vente USDT"}
      </strong>

    </div>


    <div class="detail-row">

      <span>Montant FCFA</span>

      <strong>
        ${formatNumber(
          selectedOrder.fiat_amount
        )} FCFA
      </strong>

    </div>


    <div class="detail-row">

      <span>Montant USDT</span>

      <strong>
        ${formatDecimal(
          selectedOrder.crypto_amount
        )} USDT
      </strong>

    </div>


    <div class="detail-row">

      <span>Taux</span>

      <strong>
        ${formatNumber(
          selectedOrder.rate
        )} FCFA / USDT
      </strong>

    </div>


    <div class="detail-row">

      <span>Frais</span>

      <strong>
        ${formatDecimal(
          selectedOrder.fee
        )} USDT
      </strong>

    </div>


    <div class="detail-row">

      <span>Réseau</span>

      <strong>
        ${escapeHtml(network)}
      </strong>

    </div>


    <div class="detail-row">

      <span>Wallet</span>

      <strong>
        ${escapeHtml(
          selectedOrder.wallet_address || "-"
        )}
      </strong>

    </div>


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

  `;


  clearModalMessage(
    "orderModalMessage"
  );


  $("orderModal")
    ?.classList
    .add("show");

}


// ============================================================
// MODIFICATION STATUT COMMANDE
// ============================================================

async function updateOrderStatus(
  status
) {

  if (!selectedOrder) {

    return;

  }


  const allowedStatuses = [

    "pending",

    "payment_declared",

    "paid",

    "verified",

    "processing",

    "completed",

    "rejected",

    "cancelled"

  ];


  if (
    !allowedStatuses.includes(
      status
    )
  ) {

    showModalMessage(
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
            status

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
          String(order.id) ===
          String(data.id)
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


    showModalMessage(
      "orderModalMessage",
      "Statut de la commande mis à jour.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur statut commande :",
      error
    );


    showModalMessage(
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

  }

  catch (error) {

    console.error(
      "Erreur litiges admin :",
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
      .map(dispute => {

        const status =
          dispute.status ||
          "open";


        return `

          <tr>

            <td>

              ${escapeHtml(
                String(
                  dispute.id || ""
                ).slice(0, 8)
              )}

            </td>

            <td>

              ${escapeHtml(
                String(
                  dispute.order_id || ""
                ).slice(0, 8)
              )}

            </td>

            <td>

              ${escapeHtml(
                String(
                  dispute.user_id || ""
                ).slice(0, 8)
              )}

            </td>

            <td>

              ${escapeHtml(
                dispute.subject || "-"
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
                data-view-dispute="${escapeHtml(
                  dispute.id
                )}"
              >
                Voir
              </button>

            </td>

          </tr>

        `;

      })
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
        String(dispute.id) ===
        String(disputeId)
    );


  if (!selectedDispute) {

    return;

  }


  $("disputeDetails").innerHTML = `

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
          selectedDispute.order_id || "-"
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>Utilisateur</span>

      <strong>
        ${escapeHtml(
          selectedDispute.user_id || "-"
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>Sujet</span>

      <strong>
        ${escapeHtml(
          selectedDispute.subject || "-"
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>Message</span>

      <strong>
        ${escapeHtml(
          selectedDispute.message || "-"
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


  clearModalMessage(
    "disputeModalMessage"
  );


  $("disputeModal")
    ?.classList
    .add("show");

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
    !allowed.includes(status)
  ) {

    showModalMessage(
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

          status:
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
          String(dispute.id) ===
          String(data.id)
      );


    if (index !== -1) {

      allDisputes[index] =
        data;

    }


    renderDisputes();

    openDisputeModal(
      data.id
    );


    showModalMessage(
      "disputeModalMessage",
      "Statut du litige mis à jour.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur statut litige :",
      error
    );


    showModalMessage(
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

  }

  catch (error) {

    console.error(
      "Erreur utilisateurs admin :",
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
    allUsers.filter(user => {

      const text =
        [
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

    });


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
      .map(user => {

        return `

          <tr>

            <td>
              ${escapeHtml(
                user.full_name || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                user.phone || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                user.country || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                user.role || "user"
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

      })
      .join("");

}


// ============================================================
// DECONNEXION
// ============================================================

async function adminLogout() {

  try {

    await supabaseClient.auth.signOut();

  }

  catch (error) {

    console.error(
      "Erreur déconnexion admin :",
      error
    );

  }


  currentUser =
    null;

  currentProfile =
    null;

  allOrders = [];

  allDisputes = [];

  allUsers = [];

  selectedOrder =
    null;

  selectedDispute =
    null;


  showLoginPage();

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
  // ONGLETS
  // ----------------------------------------------------------

  document
    .querySelectorAll(".tab")
    .forEach(tab => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".tab")
            .forEach(item =>
              item.classList.remove(
                "active"
              )
            );


          document
            .querySelectorAll(
              ".admin-section"
            )
            .forEach(section =>
              section.classList.remove(
                "active"
              )
            );


          tab.classList.add(
            "active"
          );


          const sectionId =
            tab.dataset.section;


          $(sectionId)
            ?.classList
            .add("active");

        }
      );

    });


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


  $("refreshOrdersBtn")
    ?.addEventListener(
      "click",
      loadOrders
    );


  document.addEventListener(
    "click",
    event => {

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
  // MODAL COMMANDE
  // ----------------------------------------------------------

  $("closeOrderModalBtn")
    ?.addEventListener(
      "click",
      () => {

        $("orderModal")
          ?.classList
          .remove("show");

      }
    );


  // ----------------------------------------------------------
  // MODAL LITIGE
  // ----------------------------------------------------------

  $("closeDisputeModalBtn")
    ?.addEventListener(
      "click",
      () => {

        $("disputeModal")
          ?.classList
          .remove("show");

      }
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
  // FERMETURE MODALS EN CLIQUANT DEHORS
  // ----------------------------------------------------------

  $("orderModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("orderModal")
        ) {

          $("orderModal")
            .classList
            .remove("show");

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

          $("disputeModal")
            .classList
            .remove("show");

        }

      }
    );

}


// ============================================================
// AUTH LISTENER
// ============================================================

function setupAuthListener() {

  supabaseClient.auth
    .onAuthStateChange(
      async (
        event,
        session
      ) => {

        console.log(
          "ADMIN AUTH:",
          event
        );


        if (
          event === "SIGNED_OUT"
        ) {

          currentUser =
            null;

          currentProfile =
            null;

          showLoginPage();

          return;

        }


        if (
          (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED"
          ) &&
          session?.user
        ) {

          currentUser =
            session.user;


          const isAdmin =
            await verifyAdmin();


          if (!isAdmin) {

            await supabaseClient
              .auth
              .signOut();

            showLoginPage();

            showLoginMessage(
              "Accès refusé. Ce compte n'est pas administrateur."
            );

            return;

          }


          showAdminPage();

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
      "NOA DIGIT TRADE ADMIN — démarrage..."
    );


    setupEvents();

    setupAuthListener();

    await checkSession();

  }
);
