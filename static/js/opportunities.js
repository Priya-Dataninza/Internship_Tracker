const cards = document.querySelector("#cards");
const search = document.querySelector("#search");
const locationFilter = document.querySelector("#location");
const companyFilter = document.querySelector("#company");
const count = document.querySelector("#resultCount");
const empty = document.querySelector("#emptyState");
const clearButton = document.querySelector("#clearButton");
const searchButton = document.querySelector("#searchButton");
const menuButton = document.querySelector("#menuButton");
const nav = document.querySelector("#nav");

const API_URL = "/api/v1/internships/";

let internships = [];
let filteredInternships = [];


/* =====================================================
   FETCH INTERNSHIPS
===================================================== */

async function fetchInternships() {

    try {

        showLoading();

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                `API request failed: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Fetched internships:", data);

        /*
         * Support both:
         *
         * [...]
         *
         * and:
         *
         * {
         *     results: [...]
         * }
         */

        if (Array.isArray(data)) {

            internships = data;

        } else if (Array.isArray(data.results)) {

            internships = data.results;

        } else {

            internships = [];

        }


        /*
         * Only active internships.
         */

        internships = internships.filter(
            internship => internship.is_active !== false
        );


        populateCompanies();

        populateLocations();

        filteredInternships = [...internships];

        displayInternships(filteredInternships);


    } catch (error) {

        console.error("Internship API Error:", error);

        count.textContent = "0";

        empty.hidden = true;

        cards.innerHTML = `

            <div class="error-message">

                <div class="error-icon">!</div>

                <h3>Unable to load internships</h3>

                <p>
                    We couldn't load internship opportunities
                    right now.
                </p>

                <button
                    class="primary-button"
                    id="retryButton">

                    Try Again

                </button>

            </div>

        `;


        const retryButton =
            document.querySelector("#retryButton");

        if (retryButton) {

            retryButton.addEventListener(
                "click",
                fetchInternships
            );

        }

    }
}


/* =====================================================
   LOADING STATE
===================================================== */

function showLoading() {

    count.textContent = "...";

    empty.hidden = true;

    cards.innerHTML = `

        <article class="internship-card loading-card">

            <div class="loading-logo"></div>

            <div class="loading-content">

                <div class="skeleton skeleton-title"></div>

                <div class="skeleton skeleton-company"></div>

                <div class="skeleton skeleton-location"></div>

                <div class="skeleton skeleton-description"></div>

            </div>

        </article>


        <article class="internship-card loading-card">

            <div class="loading-logo"></div>

            <div class="loading-content">

                <div class="skeleton skeleton-title"></div>

                <div class="skeleton skeleton-company"></div>

                <div class="skeleton skeleton-location"></div>

                <div class="skeleton skeleton-description"></div>

            </div>

        </article>


        <article class="internship-card loading-card">

            <div class="loading-logo"></div>

            <div class="loading-content">

                <div class="skeleton skeleton-title"></div>

                <div class="skeleton skeleton-company"></div>

                <div class="skeleton skeleton-location"></div>

                <div class="skeleton skeleton-description"></div>

            </div>

        </article>

    `;
}


/* =====================================================
   COMPANY FILTER
===================================================== */

function populateCompanies() {

    const companies = [
        ...new Set(
            internships
                .map(internship => internship.company_name)
                .filter(Boolean)
        )
    ].sort();


    companyFilter.innerHTML = `
        <option value="">All companies</option>
    `;


    companies.forEach(companyName => {

        const option =
            document.createElement("option");

        option.value = companyName;

        option.textContent = companyName;

        companyFilter.appendChild(option);

    });
}


/* =====================================================
   LOCATION FILTER
===================================================== */

function getShortLocation(location) {
    const value = String(location || "").trim();

    // Keep common locations short
    const parts = value.split(",");

    if (parts.length >= 2) {
        return parts[0].trim();
    }

    if (value.length > 18) {
        return value.slice(0, 18).trimEnd() + "...";
    }

    return value;
}

function populateLocations() {
    const locations = [
        ...new Set(
            internships
                .map(internship => internship.location)
                .filter(Boolean)
        )
    ].sort();

    locationFilter.innerHTML = `<option value="">Location</option>`;

    locations.forEach(location => {
        const option = document.createElement("option");

        // IMPORTANT:
        // Keep the original location for filtering
        option.value = location;

        // Only shorten what the user sees
        option.textContent = getShortLocation(location);

        locationFilter.appendChild(option);
    });
}
/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   CLEAN DESCRIPTION
===================================================== */

function cleanDescription(description) {

    if (!description) {
        return "";
    }


    /*
     * Greenhouse descriptions can still contain HTML
     * such as:
     *
     * <h3>About the role</h3>
     * <p>We are looking...</p>
     *
     * Convert that HTML into plain text.
     */

    const parser =
        new DOMParser();

    const documentObject =
        parser.parseFromString(
            String(description),
            "text/html"
        );


    /*
     * textContent removes:
     *
     * <h3>
     * <p>
     * <ul>
     * etc.
     */

    return documentObject.body.textContent
        .replace(/\s+/g, " ")
        .trim();
}


/* =====================================================
   SHORT DESCRIPTION
===================================================== */

function getShortDescription(description) {

    const cleaned =
        cleanDescription(description);


    if (!cleaned) {

        return "No description available.";

    }


    const maxLength = 190;


    if (cleaned.length <= maxLength) {

        return cleaned;

    }


    return (
        cleaned
            .slice(0, maxLength)
            .trim() +
        "..."
    );
}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(dateString) {

    if (!dateString) {
        return "Recently posted";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {

        return "Recently posted";

    }


    const now =
        new Date();


    const difference =
        now - date;


    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (days <= 0) {

        return "Posted today";

    }


    if (days === 1) {

        return "Posted 1 day ago";

    }


    if (days < 30) {

        return `Posted ${days} days ago`;

    }


    return `Posted on ${date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    )}`;
}


/* =====================================================
   COMPANY LOGOS
===================================================== */

function getCompanyLogo(companyName) {

    const logos = {

        "Drivetrain":
            "/static/images/company_logos/drivetrain.png",

        "DriveTrain":
            "/static/images/company_logos/drivetrain.png",

        "MongoDB":
            "/static/images/company_logos/mongodb.png",

        "GitLab":
            "/static/images/company_logos/gitlab.png",

        "Cloudflare":
            "/static/images/company_logos/cloudflare.png",

        "Datadog":
            "/static/images/company_logos/datadog.png",

        "Paytm":
            "/static/images/company_logos/paytm.png",

        "Hevo Data":
            "/static/images/company_logos/hevo.png",

        "100ms":
            "/static/images/company_logos/100ms.png"
    };


    return logos[companyName] || null;
}


/* =====================================================
   COMPANY INITIAL
===================================================== */

function getCompanyInitial(companyName) {

    if (!companyName) {
        return "?";
    }


    return companyName
        .trim()
        .charAt(0)
        .toUpperCase();
}


/* =====================================================
   SOURCE BADGE
===================================================== */

function getSourceClass(source) {

    if (!source) {
        return "";
    }


    return source
        .toLowerCase()
        .replace(/\s+/g, "-");
}


function capitalize(value) {

    if (!value) {
        return "";
    }


    return value.charAt(0).toUpperCase() +
        value.slice(1);
}


/* =====================================================
   DISPLAY INTERNSHIPS
===================================================== */

function displayInternships(data) {

    cards.innerHTML = "";

    count.textContent = data.length;


    if (data.length === 0) {

        empty.hidden = false;

        return;

    }


    empty.hidden = true;


    data.forEach(internship => {

        const card =
            document.createElement("article");


        card.className =
            "internship-card";


        const companyName =
            internship.company_name ||
            "Unknown Company";


        const jobTitle =
            internship.job_title ||
            "Untitled Internship";


        const location =
            internship.location ||
            "Location not specified";


        const source =
            internship.source ||
            "Unknown";


        const description =
            getShortDescription(
                internship.description
            );


        const posted =
            formatDate(
                internship.posted_at
            );


        const logo =
            getCompanyLogo(
                companyName
            );


        /*
         * Company logo.
         */

        const logoHTML = logo

            ? `

                <img
                    src="${escapeHTML(logo)}"
                    alt="${escapeHTML(companyName)}"
                    class="company-logo"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="company-logo fallback-logo"
                    style="display:none;">
                    ${escapeHTML(
                        getCompanyInitial(companyName)
                    )}
                </div>

            `

            : `

                <div class="company-logo fallback-logo">

                    ${escapeHTML(
                        getCompanyInitial(companyName)
                    )}

                </div>

            `;


        /*
         * Card HTML.
         */

        card.innerHTML = `

            <div class="card-header">

                <div class="company-logo-wrapper">

                    ${logoHTML}

                </div>


                <div class="company-info">

                    <h3>
                        ${escapeHTML(jobTitle)}
                    </h3>

                    <p class="card-company">

                        ${escapeHTML(companyName)}

                    </p>

                </div>


                <span
                    class="source source-${getSourceClass(source)}">

                    ${escapeHTML(
                        capitalize(source)
                    )}

                </span>

            </div>


            <div class="card-details">

                <span class="location-item">

                    <span class="detail-icon">⌖</span>

                    ${escapeHTML(location)}

                </span>

            </div>


            <p class="card-description">

                ${escapeHTML(description)}

            </p>


            <div class="card-footer">

                <span class="posted">

                    ${escapeHTML(posted)}

                </span>


                <div class="card-actions">

                    <button
                        class="secondary-button view-button">

                        View Details

                    </button>


                    ${
                        internship.apply_link

                        ? `

                            <a
                                class="primary-button"
                                href="${escapeHTML(
                                    internship.apply_link
                                )}"
                                target="_blank"
                                rel="noopener noreferrer">

                                Apply

                            </a>

                        `

                        : `

                            <button
                                class="primary-button"
                                disabled>

                                Apply

                            </button>

                        `
                    }

                </div>

            </div>

        `;


        /*
         * View Details.
         */

        const viewButton =
            card.querySelector(
                ".view-button"
            );


        viewButton.addEventListener(
            "click",
            () => openInternshipDetails(internship)
        );


        cards.appendChild(card);

    });
}


/* =====================================================
   FILTER
===================================================== */

function filterInternships() {

    const query =
        search.value
            .trim()
            .toLowerCase();


    const selectedCompany =
        companyFilter.value;


    const selectedLocation =
        locationFilter.value;


    filteredInternships =
        internships.filter(internship => {

            const title =
                internship.job_title || "";


            const company =
                internship.company_name || "";


            const location =
                internship.location || "";


            const description =
                cleanDescription(
                    internship.description
                );


            const searchableText = `

                ${title}

                ${company}

                ${location}

                ${description}

            `.toLowerCase();


            const matchesSearch =
                !query ||
                searchableText.includes(query);


            const matchesCompany =
                !selectedCompany ||
                company === selectedCompany;


            const matchesLocation =
                !selectedLocation ||
                location === selectedLocation;


            return (
                matchesSearch &&
                matchesCompany &&
                matchesLocation
            );

        });


    displayInternships(
        filteredInternships
    );
}


/* =====================================================
   CLEAR FILTERS
===================================================== */

function clearFilters() {

    search.value = "";

    companyFilter.value = "";

    locationFilter.value = "";

    filterInternships();
}


/* =====================================================
   DETAILS MODAL
===================================================== */

function openInternshipDetails(internship) {

    const existingModal =
        document.querySelector(
            ".internship-modal"
        );


    if (existingModal) {
        existingModal.remove();
    }


    const companyName =
        internship.company_name ||
        "Unknown Company";


    const jobTitle =
        internship.job_title ||
        "Untitled Internship";


    const location =
        internship.location ||
        "Location not specified";


    const source =
        internship.source ||
        "Unknown";


    const description =
        cleanDescription(
            internship.description
        ) ||
        "No description available.";


    const posted =
        formatDate(
            internship.posted_at
        );


    const logo =
        getCompanyLogo(
            companyName
        );


    const modal =
        document.createElement("div");


    modal.className =
        "internship-modal";


    modal.innerHTML = `

        <div class="modal-overlay"></div>


        <div
            class="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle">


            <button
                class="modal-close"
                id="closeModal"
                aria-label="Close">

                ×

            </button>


            <div class="modal-header">


                <div class="modal-company-logo">

                    ${
                        logo

                        ? `

                            <img
                                src="${escapeHTML(logo)}"
                                alt="${escapeHTML(companyName)}">

                        `

                        : `

                            <div class="fallback-logo">

                                ${escapeHTML(
                                    getCompanyInitial(
                                        companyName
                                    )
                                )}

                            </div>

                        `
                    }

                </div>


                <div class="modal-title-area">


                    <span
                        class="source source-${getSourceClass(source)}">

                        ${escapeHTML(
                            capitalize(source)
                        )}

                    </span>


                    <h2 id="modalTitle">

                        ${escapeHTML(jobTitle)}

                    </h2>


                    <p>

                        ${escapeHTML(companyName)}

                    </p>

                </div>

            </div>


            <div class="modal-meta">


                <span>

                    ⌖ ${escapeHTML(location)}

                </span>


                <span>

                    ◷ ${escapeHTML(posted)}

                </span>

            </div>


            <div class="modal-description">


                <h3>
                    About this internship
                </h3>


                <p>

                    ${escapeHTML(description)}

                </p>

            </div>


            <div class="modal-actions">


                ${
                    internship.hosted_url

                    ? `

                        <a
                            class="secondary-button"
                            href="${escapeHTML(
                                internship.hosted_url
                            )}"
                            target="_blank"
                            rel="noopener noreferrer">

                            View Job Page

                        </a>

                    `

                    : ""
                }


                ${
                    internship.apply_link

                    ? `

                        <a
                            class="primary-button"
                            href="${escapeHTML(
                                internship.apply_link
                            )}"
                            target="_blank"
                            rel="noopener noreferrer">

                            Apply Now

                        </a>

                    `

                    : ""
                }

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    document
        .querySelector("#closeModal")
        .addEventListener(
            "click",
            closeInternshipModal
        );


    document
        .querySelector(".modal-overlay")
        .addEventListener(
            "click",
            closeInternshipModal
        );


    document.addEventListener(
        "keydown",
        handleModalEscape
    );
}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeInternshipModal() {

    const modal =
        document.querySelector(
            ".internship-modal"
        );


    if (modal) {
        modal.remove();
    }


    document.removeEventListener(
        "keydown",
        handleModalEscape
    );
}


function handleModalEscape(event) {

    if (event.key === "Escape") {

        closeInternshipModal();

    }
}


/* =====================================================
   EVENTS
===================================================== */

if (search) {

    search.addEventListener(
        "input",
        filterInternships
    );

}


if (companyFilter) {

    companyFilter.addEventListener(
        "change",
        filterInternships
    );

}


if (locationFilter) {

    locationFilter.addEventListener(
        "change",
        filterInternships
    );

}


if (searchButton) {

    searchButton.addEventListener(
        "click",
        filterInternships
    );

}


if (clearButton) {

    clearButton.addEventListener(
        "click",
        clearFilters
    );

}


/* =====================================================
   MOBILE MENU
===================================================== */

if (menuButton && nav) {

    menuButton.addEventListener(
        "click",
        () => {

            nav.classList.toggle("open");

        }
    );

}


/* =====================================================
   START
===================================================== */

fetchInternships();