const API_URL = "/api/v1/applications/";

let applications = [];
let filteredApplications = [];

// ==========================================
// AUTHENTICATION
// ==========================================

function getAccessToken() {
    return localStorage.getItem("access_token");
}


// ==========================================
// LOAD APPLICATIONS
// ==========================================

async function loadApplications() {

    const accessToken = getAccessToken();

    console.log("Access token exists:", !!accessToken);
    console.log(
        "Access token:",
        accessToken ? accessToken : null
    );

    if (!accessToken) {
        showError("No access token found. Please log in again.");
        return;
    }

    try {

        const response = await fetch("/api/v1/applications/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Applications API status:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.log("API error:", errorData);
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("Applications data:", data);

        applications = Array.isArray(data)
            ? data
            : (data.results || []);

        filteredApplications = [...applications];

        updateStats();
        applySorting();
        renderApplications();

    } catch (error) {
        console.error("Applications API error:", error);
        showError("Unable to load applications.");
    }
}
// ==========================================
// ERROR
// ==========================================

function showError(message) {

    const loadingState =
        document.getElementById("loadingState");

    const errorState =
        document.getElementById("errorState");

    const errorMessage =
        document.getElementById("errorMessage");

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    if (errorState) {
        errorState.style.display = "block";
    }
}


// ==========================================
// STATS
// ==========================================

function updateStats() {

    const totalApplications =
        document.getElementById("totalApplications");

    const interviews =
        document.getElementById("interviews");

    const offers =
        document.getElementById("offers");

    const rejected =
        document.getElementById("rejected");


    if (totalApplications) {
        totalApplications.textContent =
            applications.length;
    }


    if (interviews) {

        interviews.textContent =
            applications.filter(application =>
                [
                    "interview",
                    "technical_interview",
                    "hr_interview"
                ].includes(application.status)
            ).length;
    }


    if (offers) {

        offers.textContent =
            applications.filter(application =>
                [
                    "offer",
                    "accepted"
                ].includes(application.status)
            ).length;
    }


    if (rejected) {

        rejected.textContent =
            applications.filter(
                application =>
                    application.status === "rejected"
            ).length;
    }
}


// ==========================================
// RENDER
// ==========================================

function renderApplications() {

    const applicationsList =
        document.getElementById("applicationsList");

    const emptyState =
        document.getElementById("emptyState");


    if (!applicationsList) {
        return;
    }


    applicationsList.innerHTML = "";


    if (filteredApplications.length === 0) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        return;
    }


    if (emptyState) {
        emptyState.style.display = "none";
    }


    filteredApplications.forEach(application => {

        const card =
            createApplicationCard(application);

        applicationsList.appendChild(card);
    });
}


// ==========================================
// APPLICATION CARD
// ==========================================

function createApplicationCard(application) {

    const internship =
        application.internship_applied || {};


    const card =
        document.createElement("article");

    card.className = "application-card";


    const title =
        escapeHTML(
            internship.job_title ||
            "Untitled Internship"
        );


    const company =
        escapeHTML(
            internship.company_name ||
            "Unknown Company"
        );


    const location =
        escapeHTML(
            internship.location ||
            "Location not specified"
        );


    const status =
        escapeHTML(
            application.status ||
            "applied"
        );


    const appliedDate =
        formatDate(application.applied_on);


    card.innerHTML = `

        <div class="application-card-header">

            <div>

                <h3>
                    ${title}
                </h3>

                <p class="company-name">
                    ${company}
                </p>

            </div>


            <span class="status-badge status-${status}">
                ${formatStatus(status)}
            </span>

        </div>


        <div class="application-details">

            <span>
                📍 ${location}
            </span>

            <span>
                Applied ${appliedDate}
            </span>

        </div>


        <div class="application-actions">

            <button
                class="view-details-btn"
                data-id="${application.id}">
                View Details
            </button>


            ${
                internship.apply_link
                ? `
                    <a
                        href="${escapeAttribute(
                            internship.apply_link
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="apply-btn">
                        Job Page
                    </a>
                `
                : ""
            }

        </div>
    `;


    const viewButton =
        card.querySelector(".view-details-btn");


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            () => openApplicationModal(application)
        );
    }


    return card;
}


// ==========================================
// SEARCH + FILTER
// ==========================================

function filterApplications() {

    const searchInput =
        document.getElementById("searchInput");

    const statusFilter =
        document.getElementById("statusFilter");


    const searchValue =
        (searchInput?.value || "")
        .trim()
        .toLowerCase();


    const selectedStatus =
        statusFilter?.value || "";


    filteredApplications =
        applications.filter(application => {

            const internship =
                application.internship_applied || {};


            const title =
                String(
                    internship.job_title || ""
                ).toLowerCase();


            const company =
                String(
                    internship.company_name || ""
                ).toLowerCase();


            const location =
                String(
                    internship.location || ""
                ).toLowerCase();


            const matchesSearch =
                !searchValue ||
                title.includes(searchValue) ||
                company.includes(searchValue) ||
                location.includes(searchValue);


            const matchesStatus =
                !selectedStatus ||
                application.status === selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );
        });


    applySorting();
    renderApplications();
}


// ==========================================
// SORT
// ==========================================

function applySorting() {

    const sortBy =
        document.getElementById("sortBy");


    const value =
        sortBy?.value || "recent";


    if (value === "recent") {

        filteredApplications.sort(
            (a, b) =>
                new Date(b.applied_on) -
                new Date(a.applied_on)
        );
    }


    if (value === "oldest") {

        filteredApplications.sort(
            (a, b) =>
                new Date(a.applied_on) -
                new Date(b.applied_on)
        );
    }


    if (value === "company") {

        filteredApplications.sort((a, b) => {

            const companyA =
                a.internship_applied?.company_name ||
                "";

            const companyB =
                b.internship_applied?.company_name ||
                "";


            return companyA.localeCompare(companyB);
        });
    }
}


// ==========================================
// MODAL
// ==========================================

function openApplicationModal(application) {

    const modal =
        document.getElementById("applicationModal");


    if (!modal) {
        return;
    }


    const internship =
        application.internship_applied || {};


    const modalTitle =
        document.getElementById("modalTitle");

    const modalCompany =
        document.getElementById("modalCompany");

    const modalStatus =
        document.getElementById("modalStatus");

    const modalLocation =
        document.getElementById("modalLocation");

    const modalAppliedOn =
        document.getElementById("modalAppliedOn");

    const modalInterviewDate =
        document.getElementById("modalInterviewDate");

    const modalNotes =
        document.getElementById("modalNotes");

    const modalDescription =
        document.getElementById("modalDescription");


    if (modalTitle) {
        modalTitle.textContent =
            internship.job_title ||
            "Application Details";
    }


    if (modalCompany) {
        modalCompany.textContent =
            internship.company_name ||
            "Unknown Company";
    }


    if (modalStatus) {
        modalStatus.textContent =
            formatStatus(application.status);
    }


    if (modalLocation) {
        modalLocation.textContent =
            internship.location ||
            "Not specified";
    }


    if (modalAppliedOn) {
        modalAppliedOn.textContent =
            formatDate(application.applied_on);
    }


    if (modalInterviewDate) {
        modalInterviewDate.textContent =
            application.interview_date
            ? formatDate(application.interview_date)
            : "Not scheduled";
    }


    if (modalNotes) {
        modalNotes.textContent =
            application.notes ||
            "No notes added.";
    }


    if (modalDescription) {
        modalDescription.textContent =
            internship.description ||
            "No description available.";
    }


    modal.classList.add("active");
}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeApplicationModal() {

    const modal =
        document.getElementById("applicationModal");


    if (modal) {
        modal.classList.remove("active");
    }
}


// ==========================================
// HELPERS
// ==========================================

function formatStatus(status) {

    return String(status || "applied")
        .replaceAll("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}


function formatDate(dateString) {

    if (!dateString) {
        return "Unknown";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}


// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadApplications();


        const searchInput =
            document.getElementById("searchInput");

        const statusFilter =
            document.getElementById("statusFilter");

        const sortBy =
            document.getElementById("sortBy");

        const clearFilters =
            document.getElementById("clearFilters");

        const retryButton =
            document.getElementById("retryButton");

        const modalClose =
            document.getElementById("modalClose");


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterApplications
            );
        }


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                filterApplications
            );
        }


        if (sortBy) {

            sortBy.addEventListener(
                "change",
                () => {

                    applySorting();
                    renderApplications();
                }
            );
        }


        if (clearFilters) {

            clearFilters.addEventListener(
                "click",
                () => {

                    if (searchInput) {
                        searchInput.value = "";
                    }

                    if (statusFilter) {
                        statusFilter.value = "";
                    }

                    if (sortBy) {
                        sortBy.value = "recent";
                    }

                    filteredApplications =
                        [...applications];

                    applySorting();
                    renderApplications();
                }
            );
        }


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadApplications
            );
        }


        if (modalClose) {

            modalClose.addEventListener(
                "click",
                closeApplicationModal
            );
        }


        const modal =
            document.getElementById("applicationModal");


        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (event.target === modal) {
                        closeApplicationModal();
                    }
                }
            );
        }
    }
);