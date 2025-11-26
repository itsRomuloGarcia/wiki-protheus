// Configuração da API
const API_BASE = "";

// Elementos DOM
let currentTopic = "";
let currentVideoIframe = null;

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  loadInitialContent();
});

function initializeEventListeners() {
  // Cards de categoria
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", function () {
      const topic = this.dataset.topic;
      selectTopic(topic);
    });
  });

  // Botões voltar
  const backButton = document.getElementById("back-button");
  const videosBackButton = document.getElementById("videos-back-button");

  if (backButton) {
    backButton.addEventListener("click", function () {
      stopCurrentVideo();
      goHome();
    });
  }

  if (videosBackButton) {
    videosBackButton.addEventListener("click", function () {
      stopCurrentVideo();
      goHome();
    });
  }

  // Tabs do admin
  const tabButtons = document.querySelectorAll(".tab-button");
  if (tabButtons.length > 0) {
    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const tabId = this.dataset.tab;
        switchAdminTab(tabId);
      });
    });
  }
}

function loadInitialContent() {
  // Mostra conteúdo inicial
  showHomeContent();
}

function showHomeContent() {
  const homeContent = document.getElementById("home-content");
  const videosContainer = document.getElementById("videos-container");
  const videoPlayer = document.getElementById("video-player");

  if (homeContent) homeContent.style.display = "block";
  if (videosContainer) videosContainer.style.display = "none";
  if (videoPlayer) videoPlayer.style.display = "none";
}

function goHome() {
  stopCurrentVideo();
  currentTopic = "";
  showHomeContent();
}

function selectTopic(topic) {
  currentTopic = topic;

  // Mostra container de vídeos
  const homeContent = document.getElementById("home-content");
  const videosContainer = document.getElementById("videos-container");
  const videoPlayer = document.getElementById("video-player");

  if (homeContent) homeContent.style.display = "none";
  if (videosContainer) videosContainer.style.display = "block";
  if (videoPlayer) videoPlayer.style.display = "none";

  // Carrega vídeos da área selecionada
  loadVideosByTopic(topic);
}

async function loadVideosByTopic(topic) {
  try {
    showLoadingState();
    const response = await fetch(`${API_BASE}/api/videos?topic=${topic}`);
    const videos = await response.json();

    displayVideos(videos, topic);
  } catch (error) {
    console.error("Erro ao carregar vídeos:", error);
    displayVideos([], topic);
  }
}

function showLoadingState() {
  const videosGrid = document.getElementById("videos-grid");
  if (videosGrid) {
    videosGrid.innerHTML = `
            <div class="no-videos">
                <div class="no-videos-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h3 class="no-videos-title">Carregando vídeos...</h3>
            </div>
        `;
  }
}

function displayVideos(videos, topic) {
  const videosGrid = document.getElementById("videos-grid");
  const videosSectionTitle = document.getElementById("videos-section-title");
  const videosSectionSubtitle = document.getElementById(
    "videos-section-subtitle"
  );

  if (!videosGrid || !videosSectionTitle) return;

  // Atualiza título da seção
  const areaName = getAreaName(topic);
  videosSectionTitle.textContent = areaName;
  if (videosSectionSubtitle) {
    videosSectionSubtitle.textContent = `${videos.length} vídeo(s) disponível(is)`;
  }

  if (videos.length === 0) {
    videosGrid.innerHTML = `
            <div class="no-videos">
                <div class="no-videos-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h3 class="no-videos-title">Nenhum vídeo encontrado</h3>
                <p class="no-videos-description">Não há vídeos disponíveis para esta área no momento.</p>
            </div>
        `;
    return;
  }

  // Renderiza os vídeos com SVGs
  videosGrid.innerHTML = videos
    .map(
      (video) => `
        <div class="video-card" onclick="playVideo(${video.id})">
            <div class="video-thumbnail">
                ${getVideoSVG()}
                <div class="play-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
            <div class="video-card-content">
                <h3 class="video-card-title">${video.title}</h3>
                <div class="video-card-meta">
                    ${formatDate(video.created_at)}
                </div>
                ${
                  video.description
                    ? `<p class="video-card-description">${video.description}</p>`
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");
}

function getAreaName(topicId) {
  // Usar areasData do escopo global definido no template
  if (typeof areasData === "undefined" || !Array.isArray(areasData)) {
    console.warn("areasData não está disponível");
    return topicId;
  }
  const area = areasData.find((a) => a.id === topicId);
  return area ? area.name : topicId;
}

function getVideoSVG() {
  return `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
    `;
}

async function playVideo(videoId) {
  try {
    const response = await fetch(`${API_BASE}/api/videos`);
    const videos = await response.json();
    const video = videos.find((v) => v.id === videoId);

    if (video) {
      displayVideoPlayer(video);
    }
  } catch (error) {
    console.error("Erro ao carregar vídeo:", error);
    showNotification("Erro ao carregar vídeo.", "error");
  }
}

function displayVideoPlayer(video) {
  const homeContent = document.getElementById("home-content");
  const videosContainer = document.getElementById("videos-container");
  const videoPlayer = document.getElementById("video-player");
  const videoIframe = document.getElementById("video-iframe");
  const videoTitle = document.getElementById("video-title");
  const videoDate = document.getElementById("video-date");
  const videoDescription = document.getElementById("video-description");
  const videoSectionTitle = document.getElementById("video-section-title");

  if (!videoPlayer || !videoIframe || !videoTitle) return;

  // Para o vídeo atual se houver
  stopCurrentVideo();

  // Configura o player
  videoIframe.src = video.drive_url;
  currentVideoIframe = videoIframe;
  videoTitle.textContent = video.title;
  if (videoDate)
    videoDate.textContent = `Publicado em ${formatDate(video.created_at)}`;
  if (videoDescription)
    videoDescription.textContent =
      video.description || "Sem descrição disponível.";
  if (videoSectionTitle) videoSectionTitle.textContent = video.title;

  // Mostra o player e esconde outros conteúdos
  if (homeContent) homeContent.style.display = "none";
  if (videosContainer) videosContainer.style.display = "none";
  videoPlayer.style.display = "block";

  // Scroll para o topo
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function stopCurrentVideo() {
  if (currentVideoIframe) {
    // Para completamente o vídeo
    currentVideoIframe.src = "";
    currentVideoIframe = null;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Admin functionality
if (document.getElementById("add-video-form")) {
  initializeAdmin();
}

function initializeAdmin() {
  // Formulário de adição de vídeo
  document
    .getElementById("add-video-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = {
        title: document.getElementById("video-title").value,
        description: document.getElementById("video-description").value,
        drive_url: document.getElementById("video-url").value,
        topic: document.getElementById("video-topic").value,
      };

      try {
        const response = await fetch(`${API_BASE}/api/videos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok) {
          showNotification("Vídeo adicionado com sucesso!", "success");
          this.reset();
          location.reload();
        } else {
          showNotification(
            "Erro ao adicionar vídeo: " + (result.error || "Erro desconhecido"),
            "error"
          );
        }
      } catch (error) {
        console.error("Erro:", error);
        showNotification("Erro ao adicionar vídeo.", "error");
      }
    });

  // Formulário de adição de área
  const addAreaForm = document.getElementById("add-area-form");
  if (addAreaForm) {
    addAreaForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const areaId = document
        .getElementById("area-id")
        .value.trim()
        .toLowerCase();
      const name = document.getElementById("area-name").value.trim();

      // Validação básica do ID
      if (!/^[a-z0-9-]+$/.test(areaId)) {
        showNotification(
          "O ID da área deve conter apenas letras minúsculas, números e hífens.",
          "error"
        );
        return;
      }

      const formData = {
        id: areaId,
        name: name,
      };

      try {
        const response = await fetch(`${API_BASE}/api/areas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok) {
          showNotification("Área adicionada com sucesso!", "success");
          this.reset();
          location.reload();
        } else {
          showNotification(
            "Erro ao adicionar área: " + (result.error || "Erro desconhecido"),
            "error"
          );
        }
      } catch (error) {
        console.error("Erro:", error);
        showNotification("Erro ao adicionar área.", "error");
      }
    });
  }

  // Botões de editar e excluir vídeos
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", function () {
      const videoId = this.dataset.id;
      openEditVideoModal(videoId);
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      const videoId = this.dataset.id;
      deleteVideo(videoId);
    });
  });

  // Botões de editar áreas
  document.querySelectorAll(".btn-edit-area").forEach((btn) => {
    btn.addEventListener("click", function () {
      const areaId = this.dataset.id;
      openEditAreaModal(areaId);
    });
  });

  // Botões de excluir áreas
  document.querySelectorAll(".btn-delete-area").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (!this.disabled) {
        const areaId = this.dataset.id;
        deleteArea(areaId);
      }
    });
  });

  // Modais
  const modals = document.querySelectorAll(".modal");
  const closeButtons = document.querySelectorAll(".close");

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modals.forEach((modal) => {
        modal.style.display = "none";
      });
    });
  });

  window.addEventListener("click", (e) => {
    modals.forEach((modal) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  // Formulário de edição de vídeo
  const editVideoForm = document.getElementById("edit-video-form");
  if (editVideoForm) {
    editVideoForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const videoId = document.getElementById("edit-video-id").value;
      const formData = {
        title: document.getElementById("edit-video-title").value,
        description: document.getElementById("edit-video-description").value,
        drive_url: document.getElementById("edit-video-url").value,
        topic: document.getElementById("edit-video-topic").value,
      };

      try {
        const response = await fetch(`${API_BASE}/api/videos/${videoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok) {
          showNotification("Vídeo atualizado com sucesso!", "success");
          document.getElementById("edit-video-modal").style.display = "none";
          location.reload();
        } else {
          showNotification(
            "Erro ao atualizar vídeo: " + (result.error || "Erro desconhecido"),
            "error"
          );
        }
      } catch (error) {
        console.error("Erro:", error);
        showNotification("Erro ao atualizar vídeo.", "error");
      }
    });
  }

  // Formulário de edição de área
  const editAreaForm = document.getElementById("edit-area-form");
  if (editAreaForm) {
    editAreaForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const oldAreaId = document.getElementById("edit-area-old-id").value;
      const newAreaId = document
        .getElementById("edit-area-id")
        .value.trim()
        .toLowerCase();
      const name = document.getElementById("edit-area-name").value.trim();

      // Validação básica do ID
      if (!/^[a-z0-9-]+$/.test(newAreaId)) {
        showNotification(
          "O ID da área deve conter apenas letras minúsculas, números e hífens.",
          "error"
        );
        return;
      }

      const formData = {
        id: newAreaId,
        name: name,
      };

      try {
        const response = await fetch(`${API_BASE}/api/areas/${oldAreaId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok) {
          showNotification("Área atualizada com sucesso!", "success");
          document.getElementById("edit-area-modal").style.display = "none";
          location.reload();
        } else {
          showNotification(
            "Erro ao atualizar área: " + (result.error || "Erro desconhecido"),
            "error"
          );
        }
      } catch (error) {
        console.error("Erro:", error);
        showNotification("Erro ao atualizar área.", "error");
      }
    });
  }
}

function switchAdminTab(tabId) {
  // Atualiza botões das tabs
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
    if (button.dataset.tab === tabId) {
      button.classList.add("active");
    }
  });

  // Atualiza conteúdo das tabs
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
    if (content.id === `${tabId}-tab`) {
      content.classList.add("active");
    }
  });
}

async function openEditVideoModal(videoId) {
  try {
    const response = await fetch(`${API_BASE}/api/videos`);
    const videos = await response.json();
    const video = videos.find((v) => v.id === parseInt(videoId));

    if (video) {
      document.getElementById("edit-video-id").value = video.id;
      document.getElementById("edit-video-title").value = video.title;
      document.getElementById("edit-video-description").value =
        video.description || "";
      document.getElementById("edit-video-url").value = video.drive_url;
      document.getElementById("edit-video-topic").value = video.topic;

      document.getElementById("edit-video-modal").style.display = "flex";
    }
  } catch (error) {
    console.error("Erro ao carregar vídeo:", error);
    showNotification("Erro ao carregar dados do vídeo.", "error");
  }
}

async function openEditAreaModal(areaId) {
  try {
    // CORREÇÃO: Verificar se areasData existe e é um array
    if (typeof areasData === "undefined" || !Array.isArray(areasData)) {
      console.error("areasData não está disponível ou não é um array");
      showNotification("Erro: Dados das áreas não disponíveis.", "error");
      return;
    }

    const area = areasData.find((a) => a.id === areaId);

    if (area) {
      document.getElementById("edit-area-old-id").value = area.id;
      document.getElementById("edit-area-id").value = area.id;
      document.getElementById("edit-area-name").value = area.name;

      document.getElementById("edit-area-modal").style.display = "flex";
    } else {
      showNotification("Área não encontrada.", "error");
    }
  } catch (error) {
    console.error("Erro ao carregar área:", error);
    showNotification("Erro ao carregar dados da área.", "error");
  }
}

async function deleteVideo(videoId) {
  if (
    !confirm(
      "Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/videos/${videoId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (response.ok) {
      showNotification("Vídeo excluído com sucesso!", "success");
      location.reload();
    } else {
      showNotification(
        "Erro ao excluir vídeo: " + (result.error || "Erro desconhecido"),
        "error"
      );
    }
  } catch (error) {
    console.error("Erro:", error);
    showNotification("Erro ao excluir vídeo.", "error");
  }
}

async function deleteArea(areaId) {
  if (
    !confirm(
      "Tem certeza que deseja excluir esta área? Esta ação não pode ser desfeita."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/areas/${areaId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (response.ok) {
      showNotification("Área excluída com sucesso!", "success");
      location.reload();
    } else {
      showNotification(
        "Erro ao excluir área: " + (result.error || "Erro desconhecido"),
        "error"
      );
    }
  } catch (error) {
    console.error("Erro:", error);
    showNotification("Erro ao excluir área.", "error");
  }
}

// Sistema de notificações
function showNotification(message, type = "info") {
  // Remove notificação existente
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

  document.body.appendChild(notification);

  // Animação de entrada
  setTimeout(() => {
    notification.classList.add("notification-show");
  }, 100);

  // Fechar notificação
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    hideNotification(notification);
  });

  // Auto-fechar após 5 segundos
  setTimeout(() => {
    hideNotification(notification);
  }, 5000);
}

function hideNotification(notification) {
  notification.classList.remove("notification-show");
  notification.classList.add("notification-hide");

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Adicionar estilos para notificações
const notificationStyles = `
    .notification {
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.75rem;
        padding: 1rem 1.5rem;
        color: white;
        z-index: 10000;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 400px;
    }
    
    .notification-show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification-hide {
        transform: translateX(400px);
        opacity: 0;
    }
    
    .notification-success {
        border-left: 4px solid #4caf50;
    }
    
    .notification-error {
        border-left: 4px solid #f44336;
    }
    
    .notification-info {
        border-left: 4px solid #2196f3;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-message {
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.25rem;
        transition: background-color 0.3s ease;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

// Inject notification styles
const styleSheet = document.createElement("style");
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
